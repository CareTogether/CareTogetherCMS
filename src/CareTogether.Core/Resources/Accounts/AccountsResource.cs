using Azure.Storage.Blobs;
using CareTogether.Resources.Policies;
using CareTogether.Utilities.EventLog;
using CareTogether.Utilities.ObjectStore;
using System;
using System.Collections.Concurrent;
using System.Collections.Immutable;
using System.Linq;
using System.Threading.Tasks;

namespace CareTogether.Resources.Accounts
{
    public sealed class AccountsResource : IAccountsResource
    {
        private const int GLOBAL_SCOPE_ID = 0; // Currently, there is only one globally-scoped accounts model.
        private readonly IEventLog<AccountEvent> accountsEventLog;
        private readonly BlobServiceClient blobServiceClient;
        private readonly IObjectStore<OrganizationConfiguration> organizationConfigurationStore;
        private readonly ConcurrentLockingStore<int, AccountsModel> globalScopeAccountsModel;
        private readonly IObjectStore<UserTenantAccessSummary> configurationStore;


        public AccountsResource(IObjectStore<UserTenantAccessSummary> configurationStore,
            IEventLog<AccountEvent> accountsEventLog,
            BlobServiceClient blobServiceClient, IObjectStore<OrganizationConfiguration> organizationConfigurationStore)
        {
            this.configurationStore = configurationStore;
            this.accountsEventLog = accountsEventLog;
            this.blobServiceClient = blobServiceClient;
            this.organizationConfigurationStore = organizationConfigurationStore;
            globalScopeAccountsModel = new ConcurrentLockingStore<int, AccountsModel>(async key =>
            {
                await MigrateConfigurationStoreToEventLogAsync();
                return await AccountsModel.InitializeAsync(accountsEventLog.GetAllEventsAsync(Guid.Empty, Guid.Empty));
            });
        }


        public async Task<Account> GetUserAccountAsync(Guid userId)
        {
            using (var lockedModel = await globalScopeAccountsModel.ReadLockItemAsync(GLOBAL_SCOPE_ID))
            {
                var result = lockedModel.Value.GetAccount(userId);
                return result;
            }
        }

        public async Task<Account?> GetPersonUserAccountAsync(Guid organizationId, Guid locationId, Guid personId)
        {
            using (var lockedModel = await globalScopeAccountsModel.ReadLockItemAsync(GLOBAL_SCOPE_ID))
            {
                var result = lockedModel.Value.FindAccounts(account =>
                    account.Organization.OrganizationId == organizationId &&
                    account.Organization.Locations.Any(loc =>
                        loc.LocationId == locationId && loc.PersonId == personId));
                
                return result.SingleOrDefault();
            }
        }

        public async Task<Account> ExecuteAccountCommandAsync(AccountCommand command, Guid userId)
        {
            using (var lockedModel = await globalScopeAccountsModel.WriteLockItemAsync(GLOBAL_SCOPE_ID))
            {
                var result = lockedModel.Value.ExecuteAccountCommand(command, userId, DateTime.UtcNow);

                await accountsEventLog.AppendEventAsync(Guid.Empty, Guid.Empty, result.Event, result.SequenceNumber);
                result.OnCommit();
                return result.Account;
            }
        }


        private async Task MigrateConfigurationStoreToEventLogAsync()
        {
            DateTime migrationTimestamp = DateTime.UtcNow;
            Guid migrationUserId = SystemConstants.SystemUserId;
            var synthesizedEvents = new ConcurrentQueue<AccountEvent>();

            var organizationIds = blobServiceClient.GetBlobContainersAsync()
                .Select(container => Guid.TryParse(container.Name, out var orgId) ? orgId : Guid.Empty)
                .Where(orgId => orgId != Guid.Empty);

            var organizationUserAccess = new ConcurrentDictionary<Guid, (Guid orgId, UserAccessConfiguration access)>();
            await Parallel.ForEachAsync(organizationIds, async (organizationId, _) =>
            {
                var orgConfig = await organizationConfigurationStore.GetAsync(organizationId, Guid.Empty, "config");
                foreach (var userAccess in orgConfig.Users)
                    organizationUserAccess.TryAdd(userAccess.Key, (organizationId, userAccess.Value));
            });

            var migratedAccountIds = await accountsEventLog.GetAllEventsAsync(Guid.Empty, Guid.Empty)
                .Where(e => e.DomainEvent.Command is InitializeUserAccount)
                .ToDictionaryAsync(e => e.DomainEvent.Command.UserId);

            var oldAccountIds = configurationStore.ListAsync(Guid.Empty, Guid.Empty)
                .Select(oldAccountId => Guid.Parse(oldAccountId))
                .Where(oldAccountId => !migratedAccountIds.ContainsKey(oldAccountId));

            await Parallel.ForEachAsync(oldAccountIds, async (oldAccountId, _) =>
            {
                var oldAccount = await configurationStore.GetAsync(Guid.Empty, Guid.Empty, oldAccountId.ToString());

                var hasOldAccess = organizationUserAccess.TryGetValue(oldAccountId, out var oldAccess);

                if (!hasOldAccess)
                    return;

                var initializeAccountEvent = new AccountEvent(migrationUserId, migrationTimestamp,
                    new InitializeUserAccount(oldAccountId, new UserOrganizationAccess(
                        OrganizationId: oldAccess.orgId,
                        Locations: oldAccount.LocationIds
                            .SelectMany(locationId =>
                            {
                                var oldLocationAccess = oldAccess.access.LocationRoles
                                    .Where(lr => lr.LocationId == locationId)
                                    .FirstOrDefault();
                                return (oldLocationAccess != null)
                                    ? new UserLocationAccess[]
                                        { new(locationId, oldAccess.access.PersonId, oldLocationAccess.RoleNames) }
                                    : Array.Empty<UserLocationAccess>();
                            })
                            .ToImmutableList())));

                synthesizedEvents.Enqueue(initializeAccountEvent);
            });

            for (var i = 0; synthesizedEvents.TryDequeue(out var domainEvent); i++)
                await accountsEventLog.AppendEventAsync(Guid.Empty, Guid.Empty, domainEvent, i);
        }
    }
}

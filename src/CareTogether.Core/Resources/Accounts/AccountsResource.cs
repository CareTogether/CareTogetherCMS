using Azure.Storage.Blobs;
using CareTogether.Resources.Policies;
using CareTogether.Utilities.EventLog;
using CareTogether.Utilities.ObjectStore;
using System;
using System.Collections.Concurrent;
using System.Collections.Immutable;
using System.Linq;
using System.Security.Cryptography;
using System.Threading.Tasks;

namespace CareTogether.Resources.Accounts
{
    public sealed class AccountsResource : IAccountsResource
    {
        private const int GLOBAL_SCOPE_ID = 0; // There is only one globally-scoped accounts model.
        private readonly IEventLog<AccountEvent> accountsEventLog;
        private readonly IEventLog<PersonAccessEvent> personAccessEventLog;
        private readonly BlobServiceClient blobServiceClient;
        private readonly IObjectStore<OrganizationConfiguration> organizationConfigurationStore;
        private readonly ConcurrentLockingStore<int, AccountsModel> globalScopeAccountsModel;
        private readonly IObjectStore<UserTenantAccessSummary> configurationStore;
        private readonly ConcurrentLockingStore<(Guid organizationId, Guid locationId), PersonAccessModel> tenantModels;
        private readonly RandomNumberGenerator randomNumberGenerator;
        private readonly string[] tombstonedOrganizations;
        private readonly Task migration;


        public AccountsResource(IObjectStore<UserTenantAccessSummary> configurationStore,
            IEventLog<AccountEvent> accountsEventLog, IEventLog<PersonAccessEvent> personAccessEventLog,
            BlobServiceClient blobServiceClient, IObjectStore<OrganizationConfiguration> organizationConfigurationStore,
            string[] tombstonedOrganizations)
        {
            this.configurationStore = configurationStore;
            this.accountsEventLog = accountsEventLog;
            this.personAccessEventLog = personAccessEventLog;
            this.blobServiceClient = blobServiceClient;
            this.organizationConfigurationStore = organizationConfigurationStore;
            this.tombstonedOrganizations = tombstonedOrganizations;

            // This object is a singleton, so the migration will run exactly once at each application launch.
            migration = Task.Run(MigrateConfigurationStoreToEventLogsAsync);

            globalScopeAccountsModel = new ConcurrentLockingStore<int, AccountsModel>(async key =>
            {
                await migration;
                return await AccountsModel.InitializeAsync(accountsEventLog.GetAllEventsAsync(Guid.Empty, Guid.Empty));
            });
            tenantModels = new ConcurrentLockingStore<(Guid organizationId, Guid locationId), PersonAccessModel>(async key =>
            {
                await migration;
                return await PersonAccessModel.InitializeAsync(personAccessEventLog.GetAllEventsAsync(key.organizationId, key.locationId));
            });
            randomNumberGenerator = RandomNumberGenerator.Create();
        }


        public async Task<Account?> TryGetUserAccountAsync(Guid userId)
        {
            //WARNING: The read/write logic in this service needs to be designed carefully to avoid deadlocks.

            // First, look up the global account entry to determine which person access records to retrieve.
            // If the user has not been linked to any person IDs, there will not be any records for them so return null.
            AccountEntry? accountEntry;
            using (var lockedModel = await globalScopeAccountsModel.ReadLockItemAsync(GLOBAL_SCOPE_ID))
            {
                accountEntry = lockedModel.Value.TryGetAccount(userId);
            }

            if (accountEntry == null)
                return null;

            // Then, retrieve and merge all the person access records that are linked to this user account.
            var account = await RenderAccountAsync(accountEntry);
            return account;
        }

        public async Task<Account?> TryGetPersonUserAccountAsync(Guid organizationId, Guid locationId, Guid personId)
        {
            //WARNING: The read/write logic in this service needs to be designed carefully to avoid deadlocks.

            AccountEntry? accountEntry;
            using (var lockedModel = await globalScopeAccountsModel.ReadLockItemAsync(GLOBAL_SCOPE_ID))
            {
                var result = lockedModel.Value.FindAccounts(account =>
                    account.PersonLinks.Any(link => link.OrganizationId == organizationId &&
                        link.LocationId == locationId &&
                        link.PersonId == personId));
                
                accountEntry = result.SingleOrDefault();
            }

            var account = accountEntry == null ? null : await RenderAccountAsync(accountEntry);
            return account;
        }

        public async Task<AccountEntry> ExecuteAccountCommandAsync(AccountCommand command, Guid userId)
        {
            //WARNING: The read/write logic in this service needs to be designed carefully to avoid deadlocks.
            
            using (var lockedModel = await globalScopeAccountsModel.WriteLockItemAsync(GLOBAL_SCOPE_ID))
            {
                var result = lockedModel.Value.ExecuteAccountCommand(command, userId, DateTime.UtcNow);

                await accountsEventLog.AppendEventAsync(Guid.Empty, Guid.Empty, result.Event, result.SequenceNumber);
                result.OnCommit();
                return result.Account;
            }
        }

        public async Task<PersonAccessEntry> ExecutePersonAccessCommandAsync(Guid organizationId, Guid locationId,
            PersonAccessCommand command, Guid userId)
        {
            //WARNING: The read/write logic in this service needs to be designed carefully to avoid deadlocks.

            using (var lockedModel = await tenantModels.WriteLockItemAsync((organizationId, locationId)))
            {
                var result = lockedModel.Value.ExecuteAccessCommand(command, userId, DateTime.UtcNow);

                await personAccessEventLog.AppendEventAsync(organizationId, locationId, result.Event, result.SequenceNumber);
                result.OnCommit();
                return result.Access;
            }
        }

        public async Task<byte[]> GenerateUserInviteNonceAsync(Guid organizationId, Guid locationId, Guid personId,
            Guid userId)
        {
            //WARNING: The read/write logic in this service needs to be designed carefully to avoid deadlocks.

            // A cryptographically random sequence of 128 bits is sufficiently secure.
            // We can avoid padding during base64 encoding by using 144 bits instead.
            var nonce = new byte[144 / 8];
            randomNumberGenerator.GetBytes(nonce);

            using (var lockedModel = await tenantModels.WriteLockItemAsync((organizationId, locationId)))
            {
                var result = lockedModel.Value.ExecuteAccessCommand(
                    new GenerateUserInviteNonce(personId, nonce), userId, DateTime.UtcNow);

                await personAccessEventLog.AppendEventAsync(organizationId, locationId, result.Event, result.SequenceNumber);
                result.OnCommit();

                return nonce;
            }
        }
        
        public async Task<AccountLocationAccess?> TryLookupUserInviteNoncePersonIdAsync(
            Guid organizationId, Guid locationId, byte[] nonce)
        {
            //WARNING: The read/write logic in this service needs to be designed carefully to avoid deadlocks.

            using (var lockedTenantModel = await tenantModels.ReadLockItemAsync((organizationId, locationId)))
            {
                var matchingEntry = lockedTenantModel.Value
                    .FindAccess(entry => entry.UserInviteNonce != null &&
                        Enumerable.SequenceEqual(entry.UserInviteNonce, nonce))
                    .SingleOrDefault();
                
                return matchingEntry == null
                    ? null
                    : new AccountLocationAccess(locationId, matchingEntry.PersonId, matchingEntry.Roles);
            }
        }

        public async Task<Account?> TryRedeemUserInviteNonceAsync(Guid organizationId, Guid locationId, Guid userId,
            byte[] nonce)
        {
            //WARNING: The read/write logic in this service needs to be designed carefully to avoid deadlocks.

            // First, try to find the person ID that matches the nonce, and mark the invite as redeemed.
            Guid personId;
            using (var lockedTenantModel = await tenantModels.WriteLockItemAsync((organizationId, locationId)))
            {
                var matchingEntry = lockedTenantModel.Value
                    .FindAccess(entry => entry.UserInviteNonce != null &&
                        Enumerable.SequenceEqual(entry.UserInviteNonce, nonce))
                    .SingleOrDefault();
                
                if (matchingEntry == null)
                    return null;
                
                personId = matchingEntry.PersonId;
                
                var result = lockedTenantModel.Value.ExecuteAccessCommand(
                    new RedeemUserInviteNonce(personId, nonce), userId, DateTime.UtcNow);
                
                await personAccessEventLog.AppendEventAsync(organizationId, locationId, result.Event, result.SequenceNumber);
                result.OnCommit();
            }

            // Next, link the person ID to the user ID.
            AccountEntry accountEntry;
            using (var lockedGlobalModel = await globalScopeAccountsModel.WriteLockItemAsync(GLOBAL_SCOPE_ID))
            {
                var result = lockedGlobalModel.Value.ExecuteAccountCommand(
                    new LinkPersonToAcccount(userId, organizationId, locationId, personId),
                    userId, DateTime.UtcNow);

                accountEntry = result.Account;
                
                await accountsEventLog.AppendEventAsync(Guid.Empty, Guid.Empty, result.Event, result.SequenceNumber);
                result.OnCommit();
            }

            // Finally, return a complete view of the user's current account & person links.
            var account = await RenderAccountAsync(accountEntry);
            return account;
        }


        private async Task<Account> RenderAccountAsync(AccountEntry accountEntry)
        {
            var personAccessResults = (await Task.WhenAll(
                accountEntry.PersonLinks.Select(async link =>
                {
                    using (var lockedModel = await tenantModels.ReadLockItemAsync((link.OrganizationId, link.LocationId)))
                    {
                        return (link.OrganizationId, link.LocationId, lockedModel.Value.GetAccess(link.PersonId));
                    }
                }))).ToDictionary(
                    result => (result.OrganizationId, result.LocationId),
                    result => result.Item3);

            return new Account(accountEntry.UserId, accountEntry.PersonLinks
                .GroupBy(link => link.OrganizationId)
                .Select(orgLinks => new AccountOrganizationAccess(orgLinks.Key, orgLinks.Select(link =>
                    new AccountLocationAccess(link.LocationId, link.PersonId,
                        personAccessResults[(link.OrganizationId, link.LocationId)].Roles)).ToImmutableList()))
                .ToImmutableList());
        }

        private async Task MigrateConfigurationStoreToEventLogsAsync()
        {
            DateTime migrationTimestamp = DateTime.UtcNow;
            Guid migrationUserId = SystemConstants.SystemUserId;
            var synthesizedAccountEvents = new ConcurrentQueue<AccountEvent>();
            var synthesizedPersonAccessEvents = new ConcurrentQueue<(Guid organizationId, Guid locationId, PersonAccessEvent)>();

            var organizationIds = await blobServiceClient.GetBlobContainersAsync()
                .Where(container => !tombstonedOrganizations.Contains(container.Name))
                .Select(container => Guid.TryParse(container.Name, out var orgId) ? orgId : Guid.Empty)
                .Where(orgId => orgId != Guid.Empty)
                .ToListAsync();

            var organizationUserAccess = new ConcurrentDictionary<Guid, (Guid orgId, UserAccessConfiguration access)>();
            var personRolesDefined = new ConcurrentBag<(Guid orgId, Guid locId, Guid personId)>();
            await Parallel.ForEachAsync(organizationIds, async (organizationId, _) =>
            {
                var orgConfig = await organizationConfigurationStore.GetAsync(organizationId, Guid.Empty, "config");
                foreach (var userAccess in orgConfig.Users)
                    organizationUserAccess.TryAdd(userAccess.Key, (organizationId, userAccess.Value));
                
                foreach (var location in orgConfig.Locations)
                {
                    var migratedPersonRoles = await personAccessEventLog.GetAllEventsAsync(organizationId, location.Id)
                        .Where(e => e.DomainEvent.Command is ChangePersonRoles)
                        .ToListAsync();
                    foreach (var roleChange in migratedPersonRoles)
                        personRolesDefined.Add(
                            (orgId: organizationId, locId: location.Id, personId: roleChange.DomainEvent.Command.PersonId));
                }
            });

            var migratedPersonAccountLinks = await accountsEventLog.GetAllEventsAsync(Guid.Empty, Guid.Empty)
                .Where(e => e.DomainEvent.Command is LinkPersonToAcccount)
                .ToListAsync();
            var migratedPersonAccountLinksGrouped = migratedPersonAccountLinks
                .GroupBy(e => e.DomainEvent.Command.UserId)
                .ToDictionary(g => g.Key);

            //HACK: This is simplistic, making the assumption that all person account links will be written atomically,
            //      but it's okay for a one-time migration.
            var userIdsWithoutMigratedPersonAccountLinks = await configurationStore.ListAsync(Guid.Empty, Guid.Empty)
                .Select(oldAccountId => Guid.Parse(oldAccountId))
                .Where(oldAccountId => !migratedPersonAccountLinksGrouped.ContainsKey(oldAccountId))
                .ToListAsync();
            
            var unmigratedPersonRoles = organizationUserAccess.Values
                .SelectMany(oua => oua.access.LocationRoles
                    .Where(lr => !personRolesDefined.Contains((oua.orgId, lr.LocationId, lr.PersonId)))
                    .Select(lr => (orgId: oua.orgId, locId: lr.LocationId, personId: lr.PersonId, roles: lr.RoleNames)))
                .ToImmutableList();

            await Parallel.ForEachAsync(userIdsWithoutMigratedPersonAccountLinks, async (oldAccountId, _) =>
            {
                var oldAccount = await configurationStore.GetAsync(Guid.Empty, Guid.Empty, oldAccountId.ToString());

                var hasOldAccess = organizationUserAccess.TryGetValue(oldAccountId, out var oldAccess);

                if (!hasOldAccess)
                    return;

                foreach (var oldLocationAccess in oldAccess.access.LocationRoles)
                {
                    var linkPersonToAccountEvent = new AccountEvent(migrationUserId, migrationTimestamp,
                        new LinkPersonToAcccount(oldAccountId, oldAccess.orgId, oldLocationAccess.LocationId,
                            oldLocationAccess.PersonId));
                    synthesizedAccountEvents.Enqueue(linkPersonToAccountEvent);
                }
            });

            foreach (var unmigrated in unmigratedPersonRoles)
            {
                var changePersonRolesEvent = new PersonAccessEvent(
                    migrationUserId, migrationTimestamp, new ChangePersonRoles(
                        unmigrated.personId, unmigrated.roles));
                synthesizedPersonAccessEvents.Enqueue(
                    (organizationId: unmigrated.orgId, locationId: unmigrated.locId, changePersonRolesEvent));
            }

            for (var i = 0; synthesizedAccountEvents.TryDequeue(out var domainEvent); i++)
                await accountsEventLog.AppendEventAsync(Guid.Empty, Guid.Empty, domainEvent, i);

            for (var i = 0; synthesizedPersonAccessEvents.TryDequeue(out var domainEvent); i++)
                await personAccessEventLog.AppendEventAsync(
                    domainEvent.organizationId, domainEvent.locationId, domainEvent.Item3, i);
        }
    }
}

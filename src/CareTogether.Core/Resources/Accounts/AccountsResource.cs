using System;
using System.Collections.Immutable;
using System.Linq;
using System.Security.Cryptography;
using System.Threading.Tasks;
using CareTogether.Utilities.EventLog;

namespace CareTogether.Resources.Accounts
{
    public sealed class AccountsResource : IAccountsResource
    {
        private const int GLOBAL_SCOPE_ID = 0; // There is only one globally-scoped accounts model.
        private readonly IEventLog<AccountEvent> accountsEventLog;
        private readonly IEventLog<PersonAccessEvent> personAccessEventLog;
        private readonly ConcurrentLockingStore<int, AccountsModel> globalScopeAccountsModel;
        private readonly ConcurrentLockingStore<
            (Guid organizationId, Guid locationId),
            PersonAccessModel
        > tenantModels;
        private readonly RandomNumberGenerator randomNumberGenerator;

        public AccountsResource(
            IEventLog<AccountEvent> accountsEventLog,
            IEventLog<PersonAccessEvent> personAccessEventLog
        )
        {
            this.accountsEventLog = accountsEventLog;
            this.personAccessEventLog = personAccessEventLog;

            globalScopeAccountsModel = new ConcurrentLockingStore<int, AccountsModel>(async key =>
            {
                return await AccountsModel.InitializeAsync(
                    accountsEventLog.GetAllEventsAsync(Guid.Empty, Guid.Empty)
                );
            });
            tenantModels = new ConcurrentLockingStore<
                (Guid organizationId, Guid locationId),
                PersonAccessModel
            >(async key =>
            {
                return await PersonAccessModel.InitializeAsync(
                    personAccessEventLog.GetAllEventsAsync(key.organizationId, key.locationId)
                );
            });
            randomNumberGenerator = RandomNumberGenerator.Create();
        }

        public async Task<Guid[]> GetValidOrganizationsAsync()
        {
            //WARNING: The read/write logic in this service needs to be designed carefully to avoid deadlocks.

            Guid[] organizationIds;
            using (
                var lockedModel = await globalScopeAccountsModel.ReadLockItemAsync(GLOBAL_SCOPE_ID)
            )
            {
                organizationIds = lockedModel.Value.GetUniqueOrganizationIds();
            }

            return organizationIds;
        }

        public async Task<Account?> TryGetUserAccountAsync(Guid userId)
        {
            //WARNING: The read/write logic in this service needs to be designed carefully to avoid deadlocks.

            // First, look up the global account entry to determine which person access records to retrieve.
            // If the user has not been linked to any person IDs, there will not be any records for them so return null.
            AccountEntry? accountEntry;
            using (
                var lockedModel = await globalScopeAccountsModel.ReadLockItemAsync(GLOBAL_SCOPE_ID)
            )
            {
                accountEntry = lockedModel.Value.TryGetAccount(userId);
            }

            if (accountEntry == null)
                return null;

            // Then, retrieve and merge all the person access records that are linked to this user account.
            var account = await RenderAccountAsync(accountEntry);
            return account;
        }

        public async Task<Account?> TryGetPersonUserAccountAsync(
            Guid organizationId,
            Guid locationId,
            Guid personId
        )
        {
            //WARNING: The read/write logic in this service needs to be designed carefully to avoid deadlocks.

            AccountEntry? accountEntry;
            using (
                var lockedModel = await globalScopeAccountsModel.ReadLockItemAsync(GLOBAL_SCOPE_ID)
            )
            {
                var result = lockedModel.Value.FindAccounts(account =>
                    account.PersonLinks.Any(link =>
                        link.OrganizationId == organizationId
                        && link.LocationId == locationId
                        && link.PersonId == personId
                    )
                );

                accountEntry = result.SingleOrDefault();
            }

            var account = accountEntry == null ? null : await RenderAccountAsync(accountEntry);
            return account;
        }

        public async Task<ImmutableList<string>?> TryGetPersonRolesAsync(
            Guid organizationId,
            Guid locationId,
            Guid personId
        )
        {
            //WARNING: The read/write logic in this service needs to be designed carefully to avoid deadlocks.

            using (
                var lockedModel = await tenantModels.ReadLockItemAsync((organizationId, locationId))
            )
            {
                var result = lockedModel.Value.TryGetAccess(personId);
                return result?.Roles;
            }
        }

        public async Task<AccountEntry> ExecuteAccountCommandAsync(
            AccountCommand command,
            Guid userId
        )
        {
            //WARNING: The read/write logic in this service needs to be designed carefully to avoid deadlocks.

            using (
                var lockedModel = await globalScopeAccountsModel.WriteLockItemAsync(GLOBAL_SCOPE_ID)
            )
            {
                var result = lockedModel.Value.ExecuteAccountCommand(
                    command,
                    userId,
                    DateTime.UtcNow
                );

                await accountsEventLog.AppendEventAsync(
                    Guid.Empty,
                    Guid.Empty,
                    result.Event,
                    result.SequenceNumber
                );
                result.OnCommit();
                return result.Account;
            }
        }

        public async Task<PersonAccessEntry> ExecutePersonAccessCommandAsync(
            Guid organizationId,
            Guid locationId,
            PersonAccessCommand command,
            Guid userId
        )
        {
            //WARNING: The read/write logic in this service needs to be designed carefully to avoid deadlocks.

            using (
                var lockedModel = await tenantModels.WriteLockItemAsync(
                    (organizationId, locationId)
                )
            )
            {
                var result = lockedModel.Value.ExecuteAccessCommand(
                    command,
                    userId,
                    DateTime.UtcNow
                );

                await personAccessEventLog.AppendEventAsync(
                    organizationId,
                    locationId,
                    result.Event,
                    result.SequenceNumber
                );
                result.OnCommit();
                return result.Access;
            }
        }

        public async Task<byte[]> GenerateUserInviteNonceAsync(
            Guid organizationId,
            Guid locationId,
            Guid personId,
            Guid userId
        )
        {
            //WARNING: The read/write logic in this service needs to be designed carefully to avoid deadlocks.

            // A cryptographically random sequence of 128 bits is sufficiently secure.
            // We can avoid padding during base64 encoding by using 144 bits instead.
            var nonce = new byte[144 / 8];
            randomNumberGenerator.GetBytes(nonce);

            using (
                var lockedModel = await tenantModels.WriteLockItemAsync(
                    (organizationId, locationId)
                )
            )
            {
                var result = lockedModel.Value.ExecuteAccessCommand(
                    new GenerateUserInviteNonce(personId, nonce),
                    userId,
                    DateTime.UtcNow
                );

                await personAccessEventLog.AppendEventAsync(
                    organizationId,
                    locationId,
                    result.Event,
                    result.SequenceNumber
                );
                result.OnCommit();

                return nonce;
            }
        }

        public async Task<AccountLocationAccess?> TryLookupUserInviteNoncePersonIdAsync(
            Guid organizationId,
            Guid locationId,
            byte[] nonce
        )
        {
            //WARNING: The read/write logic in this service needs to be designed carefully to avoid deadlocks.

            using (
                var lockedTenantModel = await tenantModels.ReadLockItemAsync(
                    (organizationId, locationId)
                )
            )
            {
                var matchingEntry = lockedTenantModel
                    .Value.FindAccess(entry =>
                        entry.UserInviteNonce != null
                        && Enumerable.SequenceEqual(entry.UserInviteNonce, nonce)
                    )
                    .SingleOrDefault();

                return matchingEntry == null
                    ? null
                    : new AccountLocationAccess(
                        locationId,
                        matchingEntry.PersonId,
                        matchingEntry.Roles
                    );
            }
        }

        public async Task<Account?> TryRedeemUserInviteNonceAsync(
            Guid organizationId,
            Guid locationId,
            Guid userId,
            byte[] nonce
        )
        {
            //WARNING: The read/write logic in this service needs to be designed carefully to avoid deadlocks.

            // First, try to find the person ID that matches the nonce, and mark the invite as redeemed.
            Guid personId;
            using (
                var lockedTenantModel = await tenantModels.WriteLockItemAsync(
                    (organizationId, locationId)
                )
            )
            {
                var matchingEntry = lockedTenantModel
                    .Value.FindAccess(entry =>
                        entry.UserInviteNonce != null
                        && Enumerable.SequenceEqual(entry.UserInviteNonce, nonce)
                    )
                    .SingleOrDefault();

                if (matchingEntry == null)
                    return null;

                personId = matchingEntry.PersonId;

                var result = lockedTenantModel.Value.ExecuteAccessCommand(
                    new RedeemUserInviteNonce(personId, nonce),
                    userId,
                    DateTime.UtcNow
                );

                await personAccessEventLog.AppendEventAsync(
                    organizationId,
                    locationId,
                    result.Event,
                    result.SequenceNumber
                );
                result.OnCommit();
            }

            // Next, link the person ID to the user ID.
            AccountEntry accountEntry;
            using (
                var lockedGlobalModel = await globalScopeAccountsModel.WriteLockItemAsync(
                    GLOBAL_SCOPE_ID
                )
            )
            {
                var result = lockedGlobalModel.Value.ExecuteAccountCommand(
                    new LinkPersonToAcccount(userId, organizationId, locationId, personId),
                    userId,
                    DateTime.UtcNow
                );

                accountEntry = result.Account;

                await accountsEventLog.AppendEventAsync(
                    Guid.Empty,
                    Guid.Empty,
                    result.Event,
                    result.SequenceNumber
                );
                result.OnCommit();
            }

            // Finally, return a complete view of the user's current account & person links.
            var account = await RenderAccountAsync(accountEntry);
            return account;
        }

        private async Task<Account> RenderAccountAsync(AccountEntry accountEntry)
        {
            var personAccessResults = (
                await Task.WhenAll(
                    accountEntry.PersonLinks.Select(async link =>
                    {
                        using (
                            var lockedModel = await tenantModels.ReadLockItemAsync(
                                (link.OrganizationId, link.LocationId)
                            )
                        )
                        {
                            var access = lockedModel.Value.TryGetAccess(link.PersonId);
                            return (link.OrganizationId, link.LocationId, access);
                        }
                    })
                )
            ).ToDictionary(
                result => (result.OrganizationId, result.LocationId),
                result => result.Item3
            );

            return new Account(
                accountEntry.UserId,
                accountEntry
                    .PersonLinks.GroupBy(link => link.OrganizationId)
                    .Select(orgLinks => new AccountOrganizationAccess(
                        orgLinks.Key,
                        orgLinks
                            .Select(link => new AccountLocationAccess(
                                link.LocationId,
                                link.PersonId,
                                personAccessResults[(link.OrganizationId, link.LocationId)]?.Roles ?? []
                            ))
                            .ToImmutableList()
                    ))
                    .ToImmutableList()
            );
        }
    }
}

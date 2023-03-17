using System;
using System.Collections.Generic;
using System.Collections.Immutable;
using System.Linq;
using System.Threading.Tasks;

namespace CareTogether.Resources.Accounts
{
    public sealed record AccountEvent(Guid UserId, DateTime TimestampUtc,
        AccountCommand Command) : DomainEvent(UserId, TimestampUtc);

    public sealed class AccountsModel
    {
        private ImmutableDictionary<Guid, Account> accounts =
            ImmutableDictionary<Guid, Account>.Empty;


        public long LastKnownSequenceNumber { get; private set; } = -1;


        public static async Task<AccountsModel> InitializeAsync(
            IAsyncEnumerable<(AccountEvent DomainEvent, long SequenceNumber)> eventLog)
        {
            var model = new AccountsModel();

            await foreach (var (domainEvent, sequenceNumber) in eventLog)
                model.ReplayEvent(domainEvent, sequenceNumber);

            return model;
        }


        public (AccountEvent Event, long SequenceNumber, Account Account, Action OnCommit)
            ExecuteAccountCommand(AccountCommand command, Guid userId, DateTime timestampUtc)
        {
            Account? account;
            if (command is CreateUserAccount create)
                account = new Account(create.UserId, create.InitialAccess);
            else
            {
                if (!accounts.TryGetValue(command.UserId, out account))
                    throw new KeyNotFoundException("A user account with the specified ID does not exist.");

                account = command switch
                {
                    ChangeUserLocationRoles c => account with
                    {
                        Organization = account.Organization with
                        {
                            Locations = account.Organization.Locations
                                .Select(ula =>
                                    ula.LocationId == c.LocationId
                                    ? ula with { Roles = c.Roles }
                                    : ula)
                                .ToImmutableList()
                        }
                    },
                    _ => throw new NotImplementedException(
                        $"The command type '{command.GetType().FullName}' has not been implemented.")
                };
            }

            return (
                Event: new AccountEvent(userId, timestampUtc, command),
                SequenceNumber: LastKnownSequenceNumber + 1,
                Account: account,
                OnCommit: () => { LastKnownSequenceNumber++; accounts = accounts.SetItem(account.Id, account); }
            );
        }

        public ImmutableList<Account> FindAccounts(Func<Account, bool> predicate) =>
            accounts.Values
                .Where(predicate)
                .ToImmutableList();

        public Account GetAccount(Guid userId) => accounts[userId];


        private void ReplayEvent(AccountEvent domainEvent, long sequenceNumber)
        {
            var (_, _, _, onCommit) = ExecuteAccountCommand(domainEvent.Command,
                    domainEvent.UserId, domainEvent.TimestampUtc);
            onCommit();
            LastKnownSequenceNumber = sequenceNumber;
        }
    }
}

using System;
using System.Collections.Generic;
using System.Collections.Immutable;
using System.Linq;
using System.Threading.Tasks;

namespace CareTogether.Resources.Accounts
{
    public sealed record AccountEvent(Guid UserId, DateTime TimestampUtc, AccountCommand Command)
        : DomainEvent(UserId, TimestampUtc);

    public sealed record AccountEntry(
        Guid UserId,
        ImmutableHashSet<(Guid OrganizationId, Guid LocationId, Guid PersonId)> PersonLinks
    );

    public sealed class AccountsModel
    {
        ImmutableDictionary<Guid, AccountEntry> _Accounts = ImmutableDictionary<Guid, AccountEntry>.Empty;

        public long LastKnownSequenceNumber { get; private set; } = -1;

        public static async Task<AccountsModel> InitializeAsync(
            IAsyncEnumerable<(AccountEvent DomainEvent, long SequenceNumber)> eventLog
        )
        {
            AccountsModel model = new();

            await foreach ((AccountEvent domainEvent, long sequenceNumber) in eventLog)
            {
                model.ReplayEvent(domainEvent, sequenceNumber);
            }

            return model;
        }

        public (AccountEvent Event, long SequenceNumber, AccountEntry Account, Action OnCommit) ExecuteAccountCommand(
            AccountCommand command,
            Guid userId,
            DateTime timestampUtc
        )
        {
            if (command is not LinkPersonToAcccount link)
            {
                throw new NotImplementedException(
                    $"The command type '{command.GetType().FullName}' has not been implemented."
                );
            }

            AccountEntry? account;
            if (!_Accounts.TryGetValue(command.UserId, out account))
            {
                account = new AccountEntry(command.UserId, ImmutableHashSet<(Guid, Guid, Guid)>.Empty);
            }

            account = account with
            {
                PersonLinks = account.PersonLinks.Add((link.OrganizationId, link.LocationId, link.PersonId)),
            };

            return (
                Event: new AccountEvent(userId, timestampUtc, command),
                SequenceNumber: LastKnownSequenceNumber + 1,
                Account: account,
                OnCommit: () =>
                {
                    LastKnownSequenceNumber++;
                    _Accounts = _Accounts.SetItem(account.UserId, account);
                }
            );
        }

        public ImmutableList<AccountEntry> FindAccounts(Func<AccountEntry, bool> predicate)
        {
            return _Accounts.Values.Where(predicate).ToImmutableList();
        }

        public AccountEntry? TryGetAccount(Guid userId)
        {
            return _Accounts.GetValueOrDefault(userId);
        }

        void ReplayEvent(AccountEvent domainEvent, long sequenceNumber)
        {
            (AccountEvent _, long _, AccountEntry _, Action onCommit) = ExecuteAccountCommand(
                domainEvent.Command,
                domainEvent.UserId,
                domainEvent.TimestampUtc
            );
            onCommit();
            LastKnownSequenceNumber = sequenceNumber;
        }
    }
}

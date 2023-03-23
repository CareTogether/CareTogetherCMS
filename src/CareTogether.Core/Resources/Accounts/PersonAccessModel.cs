using JsonPolymorph;
using System;
using System.Collections.Generic;
using System.Collections.Immutable;
using System.Linq;
using System.Threading.Tasks;

namespace CareTogether.Resources.Accounts
{
    [JsonHierarchyBase]
    public abstract partial record PersonAccessEvent(Guid UserId, DateTime TimestampUtc,
        Guid PersonId) : DomainEvent(UserId, TimestampUtc);
    public sealed record PersonAccessCommandExecuted(Guid UserId, DateTime TimestampUtc,
        PersonAccessCommand Command) : PersonAccessEvent(UserId, TimestampUtc, Command.PersonId);
    public sealed record UserInviteNonceCreated(Guid UserId, DateTime TimestampUtc,
        Guid PersonId, byte[] Nonce) : PersonAccessEvent(UserId, TimestampUtc, PersonId);
    public sealed record UserInviteNonceRedeemed(Guid UserId, DateTime TimestampUtc,
        Guid PersonId, byte[] Nonce) : PersonAccessEvent(UserId, TimestampUtc, PersonId);

    public sealed record PersonAccessEntry(Guid PersonId, ImmutableList<string> Roles);

    public sealed class PersonAccessModel
    {
        private ImmutableDictionary<Guid, PersonAccessEntry> entries =
            ImmutableDictionary<Guid, PersonAccessEntry>.Empty;


        public long LastKnownSequenceNumber { get; private set; } = -1;


        public static async Task<PersonAccessModel> InitializeAsync(
            IAsyncEnumerable<(PersonAccessEvent DomainEvent, long SequenceNumber)> eventLog)
        {
            var model = new PersonAccessModel();

            await foreach (var (domainEvent, sequenceNumber) in eventLog)
                model.ReplayEvent(domainEvent, sequenceNumber);

            return model;
        }


        public (PersonAccessEvent Event, long SequenceNumber, PersonAccessEntry Access, Action OnCommit)
            ExecuteAccessCommand(PersonAccessCommand command, Guid userId, DateTime timestampUtc)
        {
            if (command is not ChangePersonRoles change)
                throw new NotImplementedException(
                    $"The command type '{command.GetType().FullName}' has not been implemented.");

            var entry = new PersonAccessEntry(change.PersonId, change.Roles);

            return (
                Event: new PersonAccessCommandExecuted(userId, timestampUtc, command),
                SequenceNumber: LastKnownSequenceNumber + 1,
                Access: entry,
                OnCommit: () => { LastKnownSequenceNumber++; entries = entries.SetItem(entry.PersonId, entry); }
            );
        }

        public ImmutableList<PersonAccessEntry> FindAccess(Func<PersonAccessEntry, bool> predicate) =>
            entries.Values
                .Where(predicate)
                .ToImmutableList();

        public PersonAccessEntry GetAccess(Guid personId) => entries[personId];


        private void ReplayEvent(PersonAccessEvent domainEvent, long sequenceNumber)
        {
            if (domainEvent is PersonAccessCommandExecuted personAccessCommandExecuted)
            {
                var (_, _, _, onCommit) = ExecuteAccessCommand(personAccessCommandExecuted.Command,
                    personAccessCommandExecuted.UserId, personAccessCommandExecuted.TimestampUtc);
                onCommit();
            }
            else if (domainEvent is UserInviteNonceCreated userInviteNonceCreated)
            {
                //TODO: Implement!
                throw new NotImplementedException();
            }
            else if (domainEvent is UserInviteNonceRedeemed userInviteNonceRedeemed)
            {
                //TODO: Implement!
                throw new NotImplementedException();
            }
            else
                throw new NotImplementedException(
                $"The event type '{domainEvent.GetType().FullName}' has not been implemented.");

            LastKnownSequenceNumber = sequenceNumber;
        }
    }
}

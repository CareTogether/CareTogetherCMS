using System;
using System.Collections.Generic;
using System.Collections.Immutable;
using System.Linq;
using System.Threading.Tasks;
using CareTogether.Resources.Policies;
using JsonPolymorph;

namespace CareTogether.Resources.Accounts
{
    public sealed record PersonAccessEvent(Guid UserId, DateTime TimestampUtc, PersonAccessCommand Command)
        : DomainEvent(UserId, TimestampUtc);

    public sealed record PersonAccessEntry(
        Guid PersonId,
        ImmutableList<string> Roles,
        byte[]? UserInviteNonce,
        DateTime? UserInviteNonceExpiration
    );

    public sealed class PersonAccessModel
    {
        private static TimeSpan UserInviteNonceValidity = TimeSpan.FromDays(7);

        private ImmutableDictionary<Guid, PersonAccessEntry> entries = ImmutableDictionary<
            Guid,
            PersonAccessEntry
        >.Empty;

        public long LastKnownSequenceNumber { get; private set; } = -1;

        public static async Task<PersonAccessModel> InitializeAsync(
            IAsyncEnumerable<(PersonAccessEvent DomainEvent, long SequenceNumber)> eventLog
        )
        {
            var model = new PersonAccessModel();

            await foreach (var (domainEvent, sequenceNumber) in eventLog)
                model.ReplayEvent(domainEvent, sequenceNumber);

            return model;
        }

        public (
            PersonAccessEvent Event,
            long SequenceNumber,
            PersonAccessEntry Access,
            Action OnCommit
        ) ExecuteAccessCommand(PersonAccessCommand command, Guid userId, DateTime timestampUtc)
        {
            if (!entries.TryGetValue(command.PersonId, out var entry))
                entry = new PersonAccessEntry(command.PersonId, ImmutableList<string>.Empty, null, null);

            entry = command switch
            {
                ChangePersonRoles c =>
                // Ensure that each location has at least one OrganizationAdministrator at all times.
                (
                    c.Roles.Contains(SystemConstants.ORGANIZATION_ADMINISTRATOR)
                    || entries.Any(entry =>
                        entry.Key != command.PersonId
                        && entry.Value.Roles.Any(role => role == SystemConstants.ORGANIZATION_ADMINISTRATOR)
                    )
                )
                    ? entry with
                    {
                        Roles = c.Roles,
                    }
                    : throw new InvalidOperationException(
                        "Each location must have at least one OrganizationAdministrator at all times."
                    ),
                GenerateUserInviteNonce c => entry with
                {
                    UserInviteNonce = c.Nonce,
                    UserInviteNonceExpiration = timestampUtc.Add(UserInviteNonceValidity),
                },
                RedeemUserInviteNonce c => entry with { UserInviteNonce = null, UserInviteNonceExpiration = null },
                _ => throw new NotImplementedException(
                    $"The command type '{command.GetType().FullName}' has not been implemented."
                ),
            };

            return (
                Event: new PersonAccessEvent(userId, timestampUtc, command),
                SequenceNumber: LastKnownSequenceNumber + 1,
                Access: entry,
                OnCommit: () =>
                {
                    LastKnownSequenceNumber++;
                    entries = entries.SetItem(entry.PersonId, entry);
                }
            );
        }

        public ImmutableList<PersonAccessEntry> FindAccess(Func<PersonAccessEntry, bool> predicate) =>
            entries.Values.Where(predicate).ToImmutableList();

        public PersonAccessEntry? TryGetAccess(Guid personId) =>
            entries.TryGetValue(personId, out var entry) ? entry : null;

        private void ReplayEvent(PersonAccessEvent domainEvent, long sequenceNumber)
        {
            if (domainEvent is PersonAccessEvent personAccessEvent)
            {
                var (_, _, _, onCommit) = ExecuteAccessCommand(
                    personAccessEvent.Command,
                    personAccessEvent.UserId,
                    personAccessEvent.TimestampUtc
                );
                onCommit();
            }
            else
                throw new NotImplementedException(
                    $"The event type '{domainEvent.GetType().FullName}' has not been implemented."
                );

            LastKnownSequenceNumber = sequenceNumber;
        }
    }
}

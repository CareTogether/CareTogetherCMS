using System;
using System.Collections.Generic;
using System.Collections.Immutable;
using System.Linq;
using System.Threading.Tasks;

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
        static readonly TimeSpan _UserInviteNonceValidity = TimeSpan.FromDays(7);

        ImmutableDictionary<Guid, PersonAccessEntry> _Entries = ImmutableDictionary<Guid, PersonAccessEntry>.Empty;

        public long LastKnownSequenceNumber { get; private set; } = -1;

        public static async Task<PersonAccessModel> InitializeAsync(
            IAsyncEnumerable<(PersonAccessEvent DomainEvent, long SequenceNumber)> eventLog
        )
        {
            PersonAccessModel model = new();

            await foreach ((PersonAccessEvent domainEvent, long sequenceNumber) in eventLog)
            {
                model.ReplayEvent(domainEvent, sequenceNumber);
            }

            return model;
        }

        public (
            PersonAccessEvent Event,
            long SequenceNumber,
            PersonAccessEntry Access,
            Action OnCommit
        ) ExecuteAccessCommand(PersonAccessCommand command, Guid userId, DateTime timestampUtc)
        {
            if (!_Entries.TryGetValue(command.PersonId, out PersonAccessEntry? entry))
            {
                entry = new PersonAccessEntry(command.PersonId, ImmutableList<string>.Empty, null, null);
            }

            entry = command switch
            {
                ChangePersonRoles c =>
                // Ensure that each location has at least one OrganizationAdministrator at all times.
                c.Roles.Contains(SystemConstants.ORGANIZATION_ADMINISTRATOR)
                || _Entries.Any(entry =>
                    entry.Key != command.PersonId
                    && entry.Value.Roles.Any(role => role == SystemConstants.ORGANIZATION_ADMINISTRATOR)
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
                    UserInviteNonceExpiration = timestampUtc.Add(_UserInviteNonceValidity),
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
                    _Entries = _Entries.SetItem(entry.PersonId, entry);
                }
            );
        }

        public ImmutableList<PersonAccessEntry> FindAccess(Func<PersonAccessEntry, bool> predicate)
        {
            return _Entries.Values.Where(predicate).ToImmutableList();
        }

        public PersonAccessEntry? TryGetAccess(Guid personId)
        {
            return _Entries.TryGetValue(personId, out PersonAccessEntry? entry) ? entry : null;
        }

        void ReplayEvent(PersonAccessEvent domainEvent, long sequenceNumber)
        {
            if (domainEvent is PersonAccessEvent personAccessEvent)
            {
                (PersonAccessEvent _, long _, PersonAccessEntry _, Action onCommit) = ExecuteAccessCommand(
                    personAccessEvent.Command,
                    personAccessEvent.UserId,
                    personAccessEvent.TimestampUtc
                );
                onCommit();
            }
            else
            {
                throw new NotImplementedException(
                    $"The event type '{domainEvent.GetType().FullName}' has not been implemented."
                );
            }

            LastKnownSequenceNumber = sequenceNumber;
        }
    }
}

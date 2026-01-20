using System;
using System.Linq;
using System.Threading.Tasks;
using CareTogether.Utilities.EventLog;
using System.Collections.Generic;
using System.Collections.Immutable;

namespace CareTogether.Resources.V1Referrals
{
    public sealed class V1ReferralsResource : IV1ReferralsResource
    {
        private readonly IEventLog<V1ReferralEvent> eventLog;

        public V1ReferralsResource(IEventLog<V1ReferralEvent> eventLog)
        {
            this.eventLog = eventLog;
        }

        public async Task ExecuteV1ReferralCommandAsync(
            Guid organizationId,
            Guid locationId,
            V1ReferralCommand command,
            Guid actorUserId
        )
        {
            var (events, lastSequence) = await LoadReferralEventsAsync(
                organizationId,
                locationId,
                command.ReferralId
            );

            var referral = events.Any()
                ? V1Referral.Rehydrate(events)
                : null;

            var newEvent = command switch
            {
                CreateV1Referral c =>
                    HandleCreate(c, referral, actorUserId),

                UpdateV1ReferralFamily c =>
                    HandleUpdateFamily(c, referral, actorUserId),

                UpdateV1ReferralDetails c =>
                    HandleUpdateDetails(c, referral, actorUserId),

                    AcceptV1Referral c =>
    HandleAccept(c, referral, actorUserId),


                CloseV1Referral c =>
                    HandleClose(c, referral, actorUserId),

                ReopenV1Referral c =>
                    HandleReopen(c, referral, actorUserId),

                UpdateCustomV1ReferralField c =>
                    HandleUpdateCustomField(c, referral, actorUserId),

                _ => throw new InvalidOperationException("Unknown referral command")
            };

            await eventLog.AppendEventAsync(
                organizationId,
                locationId,
                newEvent,
                lastSequence
            );
        }

        public async Task<V1Referral?> GetOpenReferralForFamilyAsync(
            Guid organizationId,
            Guid locationId,
            Guid familyId
        )
        {
            var eventsByReferral = new Dictionary<Guid, List<V1ReferralEvent>>();

            await foreach (var (domainEvent, _) in eventLog.GetAllEventsAsync(
                organizationId,
                locationId
            ))
            {
                if (!eventsByReferral.TryGetValue(domainEvent.ReferralId, out var list))
                {
                    list = new List<V1ReferralEvent>();
                    eventsByReferral[domainEvent.ReferralId] = list;
                }

                list.Add(domainEvent);
            }

            return eventsByReferral.Values
                .Select(V1Referral.Rehydrate)
                .FirstOrDefault(r =>
                    r.Status == V1ReferralStatus.Open &&
                    r.FamilyId == familyId
                );
        }


        private static V1ReferralEvent HandleCreate(
            CreateV1Referral command,
            V1Referral? existing,
            Guid actorUserId
        )
        {
            if (existing != null)
                throw new InvalidOperationException("Referral already exists.");

            return new V1ReferralCreated(
                command.ReferralId,
                command.FamilyId,
                command.CreatedAtUtc,
                command.Title,
                command.Comment,
                actorUserId
            );
        }

        private static V1ReferralEvent HandleUpdateFamily(
            UpdateV1ReferralFamily command,
            V1Referral? referral,
            Guid actorUserId
        )
        {
            EnsureExists(referral);
            EnsureOpen(referral!);

            return new V1ReferralFamilyUpdated(
                command.ReferralId,
                command.FamilyId,
                DateTime.UtcNow,
                actorUserId
            );
        }

        private static V1ReferralEvent HandleUpdateDetails(
            UpdateV1ReferralDetails command,
            V1Referral? referral,
            Guid actorUserId
        )
        {
            EnsureExists(referral);
            EnsureOpen(referral!);

            return new V1ReferralDetailsUpdated(
                command.ReferralId,
                command.FamilyId,
                command.Title,
                command.Comment,
                command.CreatedAtUtc,
                DateTime.UtcNow,
                actorUserId
            );
        }

        private static V1ReferralEvent HandleAccept(
    AcceptV1Referral command,
    V1Referral? referral,
    Guid actorUserId
)
{
    EnsureExists(referral);
    EnsureOpen(referral!);

    return new V1ReferralAccepted(
        command.ReferralId,
        command.AcceptedAtUtc,
        actorUserId
    );
}


        private static V1ReferralEvent HandleClose(
            CloseV1Referral command,
            V1Referral? referral,
            Guid actorUserId
        )
        {
            EnsureExists(referral);
            EnsureOpen(referral!);

            return new V1ReferralClosed(
                command.ReferralId,
                command.ClosedAtUtc,
                command.CloseReason,
                actorUserId
            );
        }

        private static V1ReferralEvent HandleReopen(
            ReopenV1Referral command,
            V1Referral? referral,
            Guid actorUserId
        )
        {
            EnsureExists(referral);

            if (referral!.Status != V1ReferralStatus.Closed)
                throw new InvalidOperationException("Only closed referrals can be reopened.");

            return new V1ReferralReopened(
                command.ReferralId,
                command.ReopenedAtUtc,
                actorUserId
            );
        }

        private static V1ReferralEvent HandleUpdateCustomField(
            UpdateCustomV1ReferralField command,
            V1Referral? referral,
            Guid actorUserId
        )
        {
            EnsureExists(referral);
            EnsureOpen(referral!);

            return new V1ReferralCustomFieldUpdated(
                command.ReferralId,
                command.CompletedCustomFieldId,
                command.CustomFieldName,
                command.CustomFieldType,
                command.Value,
                DateTime.UtcNow,
                actorUserId
            );
        }

        public async Task<V1Referral?> GetReferralAsync(
            Guid organizationId,
            Guid locationId,
            Guid referralId
        )
        {
            var (events, _) = await LoadReferralEventsAsync(
                organizationId,
                locationId,
                referralId
            );

            return events.Any()
                ? V1Referral.Rehydrate(events)
                : null;
        }

        public async Task<ImmutableList<V1Referral>> ListReferralsAsync(
            Guid organizationId,
            Guid locationId
        )
        {
            var eventsByReferral = new Dictionary<Guid, List<V1ReferralEvent>>();

            await foreach (var (domainEvent, _) in eventLog.GetAllEventsAsync(
                organizationId,
                locationId
            ))
            {
                if (!eventsByReferral.TryGetValue(domainEvent.ReferralId, out var list))
                {
                    list = new List<V1ReferralEvent>();
                    eventsByReferral[domainEvent.ReferralId] = list;
                }

                list.Add(domainEvent);
            }

            return eventsByReferral.Values
                .Select(V1Referral.Rehydrate)
                .ToImmutableList();
        }

        private async Task<(List<V1ReferralEvent> Events, long LastSequence)>
            LoadReferralEventsAsync(
                Guid organizationId,
                Guid locationId,
                Guid referralId
            )
        {
            var events = new List<V1ReferralEvent>();
            long lastSequence = -1;

            await foreach (var (domainEvent, sequence) in eventLog.GetAllEventsAsync(
                organizationId,
                locationId
            ))
            {
                if (domainEvent.ReferralId == referralId)
                {
                    events.Add(domainEvent);
                    lastSequence = sequence;
                }
            }

            return (events, lastSequence);
        }

        private static void EnsureExists(V1Referral? referral)
        {
            if (referral == null)
                throw new InvalidOperationException("Referral does not exist.");
        }

        private static void EnsureOpen(V1Referral referral)
        {
            if (referral.Status != V1ReferralStatus.Open)
                throw new InvalidOperationException("Referral is not open.");
        }
    }
}

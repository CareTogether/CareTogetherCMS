using System;
using System.Collections.Generic;
using System.Collections.Immutable;
using System.Linq;
using System.Threading.Tasks;
using CareTogether.Utilities.EventLog;

namespace CareTogether.Resources.V1Referrals
{
    public sealed class V1ReferralsResource : IV1ReferralsResource
    {
        private readonly IEventLog<V1ReferralEvent> eventLog;

        public V1ReferralsResource(
            IEventLog<V1ReferralEvent> eventLog
        )
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

            _ = V1Referral.ApplyCommand(referral, command);

            var domainEvent = new V1ReferralCommandExecuted(
                command.ReferralId,
                command,
                DateTime.UtcNow,
                actorUserId
            );

            await eventLog.AppendEventAsync(
                organizationId,
                locationId,
                domainEvent,
                lastSequence
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
    }
}

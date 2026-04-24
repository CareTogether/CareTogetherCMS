using System;
using System.Collections.Generic;
using System.Collections.Immutable;
using System.Linq;
using System.Threading.Tasks;

namespace CareTogether.Resources.V1Referrals
{
    public sealed class V1ReferralModel
    {
        private ImmutableDictionary<Guid, V1Referral> referrals = ImmutableDictionary<
            Guid,
            V1Referral
        >.Empty;

        public long LastKnownSequenceNumber { get; private set; } = -1;

        public static async Task<V1ReferralModel> InitializeAsync(
            IAsyncEnumerable<(V1ReferralEvent DomainEvent, long SequenceNumber)> eventLog
        )
        {
            var model = new V1ReferralModel();

            await foreach (var (domainEvent, sequenceNumber) in eventLog)
                model.ReplayEvent(domainEvent, sequenceNumber);

            return model;
        }

        public (
            V1ReferralCommandExecuted Event,
            long SequenceNumber,
            V1Referral Referral,
            Action OnCommit
        ) ExecuteReferralCommand(
            V1ReferralCommand command,
            Guid actorUserId,
            DateTime occurredAtUtc
        )
        {
            referrals.TryGetValue(command.ReferralId, out var referral);
            var updatedReferral = V1Referral.ApplyCommand(referral, command);

            return (
                Event: new V1ReferralCommandExecuted(
                    command.ReferralId,
                    command,
                    occurredAtUtc,
                    actorUserId
                ),
                SequenceNumber: LastKnownSequenceNumber + 1,
                Referral: updatedReferral,
                OnCommit: () =>
                {
                    LastKnownSequenceNumber++;
                    referrals = referrals.SetItem(updatedReferral.ReferralId, updatedReferral);
                }
            );
        }

        public V1Referral? GetReferral(Guid referralId) =>
            referrals.TryGetValue(referralId, out var referral) ? referral : null;

        public ImmutableList<V1Referral> FindReferrals(Func<V1Referral, bool> predicate) =>
            referrals.Values.Where(predicate).ToImmutableList();

        private void ReplayEvent(V1ReferralEvent domainEvent, long sequenceNumber)
        {
            if (domainEvent is V1ReferralCommandExecuted executed)
            {
                referrals.TryGetValue(executed.ReferralId, out var referral);
                var updatedReferral = V1Referral.ApplyCommand(referral, executed.Command);
                referrals = referrals.SetItem(updatedReferral.ReferralId, updatedReferral);
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

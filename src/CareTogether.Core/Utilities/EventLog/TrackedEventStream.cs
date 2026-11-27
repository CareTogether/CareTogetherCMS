using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Collections.Immutable;
using System.Threading.Tasks;

namespace CareTogether.Utilities.EventLog
{
    internal sealed record EventStreamSnapshot(
        EventLogPosition Position,
        ImmutableDictionary<Guid, long> SubjectRevisions
    );

    internal sealed class TrackedEventStream<T>
    {
        private readonly IEventLog<T> eventLog;
        private readonly Func<T, Guid?> subjectOf;
        private readonly ConcurrentDictionary<
            (Guid OrganizationId, Guid LocationId),
            EventStreamSnapshot
        > snapshots = new();

        internal TrackedEventStream(IEventLog<T> eventLog, Func<T, Guid?> subjectOf)
        {
            this.eventLog = eventLog;
            this.subjectOf = subjectOf;
        }

        internal async IAsyncEnumerable<(T DomainEvent, long SequenceNumber)> ReplayAsync(
            Guid organizationId,
            Guid locationId
        )
        {
            if (eventLog is not AppendBlobEventLog<T> blobLog)
            {
                await foreach (
                    var replayed in eventLog.GetAllEventsAsync(organizationId, locationId)
                )
                    yield return replayed;
                yield break;
            }

            EventLogPosition? position = null;
            var revisions = ImmutableDictionary<Guid, long>.Empty;
            await foreach (
                var (domainEvent, sequenceNumber) in blobLog.GetAllEventsAsync(
                    organizationId,
                    locationId,
                    replayed => position = replayed
                )
            )
            {
                if (subjectOf(domainEvent) is Guid subject)
                    revisions = revisions.SetItem(subject, sequenceNumber);
                yield return (domainEvent, sequenceNumber);
            }
            if (position is not null)
                snapshots[(organizationId, locationId)] = new(position, revisions);
        }

        internal async Task CommitAsync(
            Guid organizationId,
            Guid locationId,
            T domainEvent,
            long sequenceNumber,
            Action onCommit
        )
        {
            if (eventLog is not AppendBlobEventLog<T> blobLog)
            {
                await eventLog.AppendEventAsync(
                    organizationId,
                    locationId,
                    domainEvent,
                    sequenceNumber
                );
                onCommit();
                return;
            }

            snapshots.TryRemove((organizationId, locationId), out var known);
            var position = await blobLog.AppendEventAsync(
                organizationId,
                locationId,
                domainEvent,
                sequenceNumber,
                known?.Position
            );
            onCommit();
            if (known is null || position is null)
                return;
            snapshots[(organizationId, locationId)] = new(
                position,
                subjectOf(domainEvent) is Guid subject
                    ? known.SubjectRevisions.SetItem(subject, position.EventCount)
                    : known.SubjectRevisions
            );
        }

        internal EventStreamSnapshot? Current(Guid organizationId, Guid locationId) =>
            snapshots.TryGetValue((organizationId, locationId), out var snapshot) ? snapshot : null;

        internal async Task<bool> IsCurrentAsync(
            Guid organizationId,
            Guid locationId,
            EventStreamSnapshot captured
        ) =>
            eventLog is AppendBlobEventLog<T> blobLog
            && ReferenceEquals(Current(organizationId, locationId), captured)
            && await blobLog.IsCurrentAsync(organizationId, locationId, captured.Position);
    }
}

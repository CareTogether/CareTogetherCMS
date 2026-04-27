using System;
using System.Collections.Generic;
using System.Collections.Immutable;
using System.Linq;
using System.Threading.Tasks;
using CareTogether.Resources.V1ReferralNotes;
using JsonPolymorph;

namespace CareTogether.Resources.V1Referrals
{
    [JsonHierarchyBase]
    public abstract partial record V1ReferralEvent(Guid UserId, DateTime TimestampUtc)
        : DomainEvent(UserId, TimestampUtc);

    public sealed record V1ReferralCommandExecuted(
        Guid UserId,
        DateTime TimestampUtc,
        V1ReferralCommand Command
    ) : V1ReferralEvent(UserId, TimestampUtc);

    public sealed record V1ReferralOpened(
        Guid UserId,
        DateTime AuditTimestampUtc,
        DateTime OpenedAtUtc
    ) : Activity(UserId, AuditTimestampUtc, OpenedAtUtc, null, null);

    public sealed record V1ReferralAccepted(
        Guid UserId,
        DateTime AuditTimestampUtc,
        DateTime AcceptedAtUtc
    ) : Activity(UserId, AuditTimestampUtc, AcceptedAtUtc, null, null);

    public sealed record V1ReferralClosed(
        Guid UserId,
        DateTime AuditTimestampUtc,
        DateTime ClosedAtUtc,
        string CloseReason
    ) : Activity(UserId, AuditTimestampUtc, ClosedAtUtc, null, null);

    public sealed record V1ReferralRequirementCompleted(
        Guid UserId,
        DateTime AuditTimestampUtc,
        string RequirementName,
        DateTime CompletedAtUtc,
        Guid? UploadedDocumentId,
        Guid? NoteId
    ) : Activity(UserId, AuditTimestampUtc, CompletedAtUtc, UploadedDocumentId, NoteId);

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
            var (referralToUpsert, activity) = ExecuteCommand(command, actorUserId, occurredAtUtc);
            var updatedReferral = AddActivity(referralToUpsert, activity);

            return (
                Event: new V1ReferralCommandExecuted(actorUserId, occurredAtUtc, command),
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

        private (V1Referral Referral, Activity? Activity) ExecuteCommand(
            V1ReferralCommand command,
            Guid actorUserId,
            DateTime occurredAtUtc
        )
        {
            referrals.TryGetValue(command.ReferralId, out var referral);

            return command switch
            {
                CreateV1Referral c => referral == null
                    ? (
                        new V1Referral(
                            c.ReferralId,
                            c.FamilyId,
                            c.CreatedAtUtc,
                            c.Title,
                            V1ReferralStatus.Open,
                            c.Comment,
                            AcceptedAtUtc: null,
                            ClosedAtUtc: null,
                            CloseReason: null,
                            CompletedCustomFields: ImmutableDictionary<
                                string,
                                CompletedCustomFieldInfo
                            >.Empty,
                            CompletedRequirements: ImmutableList<CompletedRequirementInfo>.Empty,
                            ExemptedRequirements: ImmutableList<ExemptedRequirementInfo>.Empty,
                            UploadedDocuments: ImmutableList<UploadedDocumentInfo>.Empty,
                            DeletedDocuments: ImmutableList<Guid>.Empty,
                            History: ImmutableList<Activity>.Empty,
                            Notes: ImmutableList<V1ReferralNoteEntry>.Empty
                        ),
                        new V1ReferralOpened(actorUserId, occurredAtUtc, c.CreatedAtUtc)
                    )
                    : throw new InvalidOperationException("Referral already exists."),
                UpdateV1ReferralFamily c => (
                    EnsureExists(referral) with
                    {
                        FamilyId = c.FamilyId,
                    },
                    null
                ),
                UpdateV1ReferralDetails c => (
                    EnsureNotClosed(referral) with
                    {
                        Title = c.Title,
                        Comment = c.Comment,
                        CreatedAtUtc = c.CreatedAtUtc,
                    },
                    null
                ),
                AcceptV1Referral c => (
                    EnsureOpen(referral) with
                    {
                        Status = V1ReferralStatus.Accepted,
                        AcceptedAtUtc = c.AcceptedAtUtc,
                    },
                    new V1ReferralAccepted(actorUserId, occurredAtUtc, c.AcceptedAtUtc)
                ),
                CloseV1Referral c => (
                    EnsureOpen(referral) with
                    {
                        Status = V1ReferralStatus.Closed,
                        ClosedAtUtc = c.ClosedAtUtc,
                        CloseReason = c.CloseReason,
                    },
                    new V1ReferralClosed(actorUserId, occurredAtUtc, c.ClosedAtUtc, c.CloseReason)
                ),
                ReopenV1Referral => (
                    EnsureExists(referral) with
                    {
                        Status = V1ReferralStatus.Open,
                        AcceptedAtUtc = null,
                        ClosedAtUtc = null,
                        CloseReason = null,
                    },
                    null
                ),
                UpdateCustomV1ReferralField c => (
                    EnsureNotClosed(referral) with
                    {
                        CompletedCustomFields = EnsureExists(referral)
                            .CompletedCustomFields.SetItem(
                                c.CustomFieldName,
                                new CompletedCustomFieldInfo(
                                    actorUserId,
                                    occurredAtUtc,
                                    c.CompletedCustomFieldId,
                                    c.CustomFieldName,
                                    c.CustomFieldType,
                                    c.Value
                                )
                            ),
                    },
                    null
                ),
                CompleteReferralRequirement c => (
                    EnsureNotClosed(referral) with
                    {
                        CompletedRequirements = EnsureExists(referral)
                            .CompletedRequirements.Add(
                                new CompletedRequirementInfo(
                                    actorUserId,
                                    occurredAtUtc,
                                    c.CompletedRequirementId,
                                    c.RequirementName,
                                    c.CompletedAtUtc,
                                    ExpiresAtUtc: null,
                                    c.UploadedDocumentId,
                                    c.NoteId
                                )
                            ),
                    },
                    new V1ReferralRequirementCompleted(
                        actorUserId,
                        occurredAtUtc,
                        c.RequirementName,
                        c.CompletedAtUtc,
                        c.UploadedDocumentId,
                        c.NoteId
                    )
                ),
                MarkReferralRequirementIncomplete c => (
                    EnsureNotClosed(referral) with
                    {
                        CompletedRequirements = EnsureExists(referral)
                            .CompletedRequirements.RemoveAll(requirement =>
                                requirement.RequirementName == c.RequirementName
                                && requirement.CompletedRequirementId == c.CompletedRequirementId
                            ),
                    },
                    null
                ),
                ExemptReferralRequirement c => (
                    EnsureNotClosed(referral) with
                    {
                        ExemptedRequirements = EnsureExists(referral)
                            .ExemptedRequirements.Add(
                                new ExemptedRequirementInfo(
                                    actorUserId,
                                    occurredAtUtc,
                                    c.RequirementName,
                                    DueDate: null,
                                    c.AdditionalComments,
                                    c.ExemptionExpiresAtUtc
                                )
                            ),
                    },
                    null
                ),
                UnexemptReferralRequirement c => (
                    EnsureNotClosed(referral) with
                    {
                        ExemptedRequirements = EnsureExists(referral)
                            .ExemptedRequirements.RemoveAll(requirement =>
                                requirement.RequirementName == c.RequirementName
                            ),
                    },
                    null
                ),
                UploadV1ReferralDocument c => (
                    EnsureNotClosed(referral) with
                    {
                        UploadedDocuments = EnsureExists(referral)
                            .UploadedDocuments.Add(
                                new UploadedDocumentInfo(
                                    actorUserId,
                                    occurredAtUtc,
                                    c.UploadedDocumentId,
                                    c.UploadedFileName
                                )
                            ),
                    },
                    null
                ),
                DeleteUploadedV1ReferralDocument c => (
                    EnsureNotClosed(referral) with
                    {
                        UploadedDocuments = EnsureExists(referral)
                            .UploadedDocuments.RemoveAll(document =>
                                document.UploadedDocumentId == c.UploadedDocumentId
                            ),
                        DeletedDocuments = EnsureExists(referral)
                            .DeletedDocuments.Add(c.UploadedDocumentId),
                    },
                    null
                ),
                _ => throw new NotImplementedException(
                    $"The command type '{command.GetType().FullName}' has not been implemented."
                ),
            };
        }

        private static V1Referral AddActivity(V1Referral referral, Activity? activity) =>
            activity == null
                ? referral
                : referral with
                {
                    History = referral.History.Add(activity),
                };

        private static V1Referral EnsureExists(V1Referral? referral)
        {
            if (referral == null)
                throw new InvalidOperationException("Referral does not exist.");

            return referral;
        }

        private static V1Referral EnsureOpen(V1Referral? referral)
        {
            var existingReferral = EnsureExists(referral);
            if (existingReferral.Status != V1ReferralStatus.Open)
                throw new InvalidOperationException("Referral is not open.");

            return existingReferral;
        }

        private static V1Referral EnsureNotClosed(V1Referral? referral)
        {
            var existingReferral = EnsureExists(referral);
            if (existingReferral.Status == V1ReferralStatus.Closed)
                throw new InvalidOperationException("Closed referrals cannot be edited.");

            return existingReferral;
        }

        private void ReplayEvent(V1ReferralEvent domainEvent, long sequenceNumber)
        {
            if (domainEvent is V1ReferralCommandExecuted executed)
            {
                var (_, _, _, onCommit) = ExecuteReferralCommand(
                    executed.Command,
                    executed.UserId,
                    executed.TimestampUtc
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

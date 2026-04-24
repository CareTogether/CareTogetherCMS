using System;
using System.Collections.Generic;
using System.Collections.Immutable;
using System.Linq;
using CareTogether.Resources.Directory;
using CareTogether.Resources.Policies;
using CareTogether.Resources.V1Cases;

namespace CareTogether.Resources.V1Referrals
{
    public sealed record V1Referral(
        Guid ReferralId,
        Guid? FamilyId,
        DateTime CreatedAtUtc,
        string Title,
        V1ReferralStatus Status,
        string? Comment,
        DateTime? AcceptedAtUtc,
        DateTime? ClosedAtUtc,
        string? CloseReason,
        ImmutableDictionary<string, CompletedCustomFieldInfo> CompletedCustomFields,
        ImmutableList<CompletedRequirementInfo> CompletedRequirements,
        ImmutableList<ExemptedRequirementInfo> ExemptedRequirements,
        ImmutableList<UploadedDocumentInfo> UploadedDocuments,
        ImmutableList<Guid> DeletedDocuments,
        ImmutableList<V1ReferralNoteEntry> Notes
    )
    {
        public ImmutableList<RequirementDefinition> MissingIntakeRequirements { get; init; } =
            ImmutableList<RequirementDefinition>.Empty;

        public static V1Referral Rehydrate(IEnumerable<V1ReferralEvent> events)
        {
            V1Referral? referral = null;

            foreach (var e in events.OrderBy(e => e.OccurredAtUtc))
            {
                if (e is not V1ReferralCommandExecuted executed)
                    continue;

                referral = ApplyCommand(referral, executed.Command);
            }

            if (referral == null)
                throw new InvalidOperationException(
                    "This referral is missing its creation command."
                );

            return referral;
        }

        public static V1Referral ApplyCommand(V1Referral? referral, V1ReferralCommand command)
        {
            return command switch
            {
                CreateV1Referral c => referral == null
                    ? new V1Referral(
                        c.ReferralId,
                        c.FamilyId,
                        c.CreatedAtUtc,
                        c.Title,
                        V1ReferralStatus.Open,
                        c.Comment,
                        null,
                        null,
                        null,
                        ImmutableDictionary<string, CompletedCustomFieldInfo>.Empty,
                        ImmutableList<CompletedRequirementInfo>.Empty,
                        ImmutableList<ExemptedRequirementInfo>.Empty,
                        ImmutableList<UploadedDocumentInfo>.Empty,
                        ImmutableList<Guid>.Empty,
                        ImmutableList<V1ReferralNoteEntry>.Empty
                    )
                    : throw new InvalidOperationException("Referral already exists."),

                UpdateV1ReferralFamily c => EnsureExists(referral) with { FamilyId = c.FamilyId },

                UpdateV1ReferralDetails c => EnsureNotClosed(referral!) with
                {
                    Title = c.Title,
                    Comment = c.Comment,
                    CreatedAtUtc = c.CreatedAtUtc,
                },

                AcceptV1Referral c => EnsureOpen(referral!) with
                {
                    Status = V1ReferralStatus.Accepted,
                    AcceptedAtUtc = c.AcceptedAtUtc,
                },
                CloseV1Referral c => EnsureOpen(referral!) with
                {
                    Status = V1ReferralStatus.Closed,
                    ClosedAtUtc = c.ClosedAtUtc,
                    CloseReason = c.CloseReason,
                },
                ReopenV1Referral => EnsureExists(referral!) with
                {
                    Status = V1ReferralStatus.Open,
                    AcceptedAtUtc = null,
                    ClosedAtUtc = null,
                    CloseReason = null,
                },

                UpdateCustomV1ReferralField c => EnsureNotClosed(referral!) with
                {
                    CompletedCustomFields = referral!.CompletedCustomFields.SetItem(
                        c.CustomFieldName,
                        new CompletedCustomFieldInfo(
                            Guid.Empty,
                            DateTime.UtcNow,
                            c.CompletedCustomFieldId,
                            c.CustomFieldName,
                            c.CustomFieldType,
                            c.Value
                        )
                    ),
                },

                CompleteReferralRequirement c => EnsureNotClosed(referral!) with
                {
                    CompletedRequirements = referral!.CompletedRequirements.Add(
                        new CompletedRequirementInfo(
                            Guid.Empty,
                            DateTime.UtcNow,
                            c.CompletedRequirementId,
                            c.RequirementName,
                            c.CompletedAtUtc,
                            null,
                            c.UploadedDocumentId,
                            c.NoteId
                        )
                    ),
                },

                MarkReferralRequirementIncomplete c => EnsureNotClosed(referral!) with
                {
                    CompletedRequirements = referral!
                        .CompletedRequirements.Where(r =>
                            r.CompletedRequirementId != c.CompletedRequirementId
                        )
                        .ToImmutableList(),
                },

                ExemptReferralRequirement c => EnsureNotClosed(referral!) with
                {
                    ExemptedRequirements = referral!.ExemptedRequirements.Add(
                        new ExemptedRequirementInfo(
                            Guid.Empty,
                            DateTime.UtcNow,
                            c.RequirementName,
                            null,
                            c.AdditionalComments,
                            c.ExemptionExpiresAtUtc
                        )
                    ),
                },

                UnexemptReferralRequirement c => EnsureNotClosed(referral!) with
                {
                    ExemptedRequirements = referral!
                        .ExemptedRequirements.Where(r => r.RequirementName != c.RequirementName)
                        .ToImmutableList(),
                },

                UploadV1ReferralDocument c => EnsureNotClosed(referral!) with
                {
                    UploadedDocuments = referral!.UploadedDocuments.Add(
                        new UploadedDocumentInfo(
                            Guid.Empty,
                            DateTime.UtcNow,
                            c.UploadedDocumentId,
                            c.UploadedFileName
                        )
                    ),
                },

                DeleteUploadedV1ReferralDocument c => EnsureNotClosed(referral!) with
                {
                    UploadedDocuments = referral!.UploadedDocuments.RemoveAll(d =>
                        d.UploadedDocumentId == c.UploadedDocumentId
                    ),
                    DeletedDocuments = referral!.DeletedDocuments.Add(c.UploadedDocumentId),
                },

                _ => throw new InvalidOperationException(
                    $"Unsupported referral command: {command.GetType().Name}"
                ),
            };
        }

        private static V1Referral EnsureExists(V1Referral? referral)
        {
            if (referral == null)
                throw new InvalidOperationException("Referral does not exist.");

            return referral;
        }

        private static V1Referral EnsureOpen(V1Referral referral)
        {
            if (referral.Status != V1ReferralStatus.Open)
                throw new InvalidOperationException("Referral is not open.");

            return referral;
        }

        private static V1Referral EnsureNotClosed(V1Referral referral)
        {
            if (referral.Status == V1ReferralStatus.Closed)
                throw new InvalidOperationException("Closed referrals cannot be edited.");

            return referral;
        }
    }
}

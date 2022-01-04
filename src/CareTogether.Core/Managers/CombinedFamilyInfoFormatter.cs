using CareTogether.Engines;
using CareTogether.Resources;
using System;
using Nito.AsyncEx;
using System.Collections.Immutable;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;

namespace CareTogether.Managers
{
    public class CombinedFamilyInfoFormatter
    {
        private readonly IPolicyEvaluationEngine policyEvaluationEngine;
        private readonly IAuthorizationEngine authorizationEngine;
        private readonly IApprovalsResource approvalsResource;
        private readonly IReferralsResource referralsResource;
        private readonly IDirectoryResource directoryResource;
        private readonly INotesResource notesResource;


        public CombinedFamilyInfoFormatter(IPolicyEvaluationEngine policyEvaluationEngine, IAuthorizationEngine authorizationEngine,
            IApprovalsResource approvalsResource, IReferralsResource referralsResource, IDirectoryResource directoryResource,
            INotesResource notesResource)
        {
            this.policyEvaluationEngine = policyEvaluationEngine;
            this.authorizationEngine = authorizationEngine;
            this.approvalsResource = approvalsResource;
            this.referralsResource = referralsResource;
            this.directoryResource = directoryResource;
            this.notesResource = notesResource;
        }


        public async Task<CombinedFamilyInfo> RenderCombinedFamilyInfoAsync(Guid organizationId, Guid locationId, Guid familyId,
            ClaimsPrincipal user)
        {
            var family = await directoryResource.FindFamilyAsync(organizationId, locationId, familyId);
            var disclosedFamily = await authorizationEngine.DiscloseFamilyAsync(user, family);

            var partneringFamilyInfo = await RenderPartneringFamilyInfoAsync(organizationId, locationId, family, user);

            var (volunteerFamilyInfo, uploadedApprovalDocuments) = await RenderVolunteerFamilyInfoAsync(organizationId, locationId, family, user);

            var notes = await notesResource.ListFamilyNotesAsync(organizationId, locationId, familyId);
            var disclosedNotes = (await notes
                .Select(note => new Note(note.Id, note.AuthorId, TimestampUtc: note.Status == NoteStatus.Approved
                    ? note.ApprovedTimestampUtc!.Value
                    : note.LastEditTimestampUtc, note.Contents, note.Status))
                .Select(async note =>
                    (note, canDisclose: await authorizationEngine.DiscloseNoteAsync(user, familyId, note)))
                .WhenAll())
                .Where(result => result.canDisclose)
                .Select(result => result.note)
                .ToImmutableList();

            // COMPATIBILITY: This step is required to merge previously separated document upload info lists.
            // The previous design had approval and partnering document upload lists stored separately in their respective resource services,
            // but based on system use cases it makes more sense to standardize on storing these document upload lists centrally in the
            // directory service. Since the referral resource service's side of document upload list functionality was never implemented,
            // the go-forward implementation uses only the directory resource service and then merges in prior data from the approvals
            // resource service. At some point a data migration could be run to convert the approvals events to directory events,
            // at which point this compatibility step can then be removed.
            var allUploadedDocuments = uploadedApprovalDocuments
                .Concat(disclosedFamily.UploadedDocuments)
                .Where(udi => !family.DeletedDocuments.Contains(udi.UploadedDocumentId))
                .ToImmutableList();

            return new CombinedFamilyInfo(disclosedFamily, partneringFamilyInfo, volunteerFamilyInfo, disclosedNotes,
                allUploadedDocuments);
        }


        private async Task<PartneringFamilyInfo?> RenderPartneringFamilyInfoAsync(Guid organizationId, Guid locationId,
            Family family, ClaimsPrincipal user)
        {
            var referrals = await (await referralsResource.ListReferralsAsync(organizationId, locationId))
                .Where(r => r.FamilyId == family.Id)
                .Select(r => ToReferralAsync(r))
                .WhenAll();

            if (referrals.Length == 0)
                return null;

            var openReferral = referrals.SingleOrDefault(r => r.CloseReason == null);
            var closedReferrals = referrals.Where(r => r.CloseReason != null).ToImmutableList();

            return new PartneringFamilyInfo(openReferral, closedReferrals);

            async Task<Referral> ToReferralAsync(ReferralEntry entry)
            {
                var referralStatus = await policyEvaluationEngine.CalculateReferralStatusAsync(organizationId, locationId, family, entry);

                return new(entry.Id, entry.OpenedAtUtc, entry.ClosedAtUtc, entry.CloseReason,
                    entry.CompletedRequirements, entry.ExemptedRequirements, referralStatus.MissingIntakeRequirements,
                    entry.Arrangements
                        .Select(a => ToArrangement(a.Value, referralStatus.IndividualArrangements[a.Key]))
                        .ToImmutableList());
            }

            static Arrangement ToArrangement(ArrangementEntry entry, ArrangementStatus status) =>
                new(entry.Id, entry.ArrangementType, entry.PartneringFamilyPersonId, status.Phase,
                    entry.RequestedAtUtc, entry.StartedAtUtc, entry.EndedAtUtc,
                    entry.CompletedRequirements, entry.ExemptedRequirements,
                    status.MissingRequirements,
                    entry.IndividualVolunteerAssignments, entry.FamilyVolunteerAssignments,
                    entry.ChildrenLocationHistory);
        }

        private async Task<(VolunteerFamilyInfo?, ImmutableList<UploadedDocumentInfo>)> RenderVolunteerFamilyInfoAsync(Guid organizationId, Guid locationId,
            Family family, ClaimsPrincipal user)
        {
            var entry = await approvalsResource.TryGetVolunteerFamilyAsync(organizationId, locationId, family.Id);

            if (entry == null)
                return (null, ImmutableList<UploadedDocumentInfo>.Empty);

            var completedIndividualRequirements = entry.IndividualEntries.ToImmutableDictionary(
                x => x.Key,
                x => x.Value.CompletedRequirements);
            var exemptedIndividualRequirements = entry.IndividualEntries.ToImmutableDictionary(
                x => x.Key,
                x => x.Value.ExemptedRequirements);
            var removedIndividualRoles = entry.IndividualEntries.ToImmutableDictionary(
                x => x.Key,
                x => x.Value.RemovedRoles);

            var volunteerFamilyApprovalStatus = await policyEvaluationEngine.CalculateVolunteerFamilyApprovalStatusAsync(
                organizationId, locationId, family, entry.CompletedRequirements, entry.ExemptedRequirements, entry.RemovedRoles,
                completedIndividualRequirements, exemptedIndividualRequirements, removedIndividualRoles);

            var volunteerFamilyInfo = new VolunteerFamilyInfo(
                entry.CompletedRequirements, entry.ExemptedRequirements, entry.RemovedRoles,
                volunteerFamilyApprovalStatus.MissingFamilyRequirements,
                volunteerFamilyApprovalStatus.AvailableFamilyApplications,
                volunteerFamilyApprovalStatus.FamilyRoleApprovals,
                volunteerFamilyApprovalStatus.IndividualVolunteers.ToImmutableDictionary(
                    x => x.Key,
                    x =>
                    {
                        var hasEntry = entry.IndividualEntries.TryGetValue(x.Key, out var individualEntry);
                        return new VolunteerInfo(
                            individualEntry?.CompletedRequirements ?? ImmutableList<CompletedRequirementInfo>.Empty,
                            individualEntry?.ExemptedRequirements ?? ImmutableList<ExemptedRequirementInfo>.Empty,
                            individualEntry?.RemovedRoles ?? ImmutableList<RemovedRole>.Empty,
                            x.Value.MissingIndividualRequirements,
                            x.Value.AvailableIndividualApplications,
                            x.Value.IndividualRoleApprovals);
                    }));

            var disclosedVolunteerFamilyInfo = await authorizationEngine.DiscloseVolunteerFamilyInfoAsync(user, volunteerFamilyInfo);
            return (disclosedVolunteerFamilyInfo, entry.UploadedDocuments);
        }
    }
}

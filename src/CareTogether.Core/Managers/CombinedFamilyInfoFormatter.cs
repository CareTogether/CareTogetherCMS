using CareTogether.Engines.Authorization;
using CareTogether.Engines.PolicyEvaluation;
using CareTogether.Resources;
using CareTogether.Resources.Approvals;
using CareTogether.Resources.Directory;
using CareTogether.Resources.Notes;
using CareTogether.Resources.Policies;
using CareTogether.Resources.Referrals;
using Nito.AsyncEx;
using System;
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
        private readonly IPoliciesResource policiesResource;


        public CombinedFamilyInfoFormatter(IPolicyEvaluationEngine policyEvaluationEngine, IAuthorizationEngine authorizationEngine,
            IApprovalsResource approvalsResource, IReferralsResource referralsResource, IDirectoryResource directoryResource,
            INotesResource notesResource, IPoliciesResource policiesResource)
        {
            this.policyEvaluationEngine = policyEvaluationEngine;
            this.authorizationEngine = authorizationEngine;
            this.approvalsResource = approvalsResource;
            this.referralsResource = referralsResource;
            this.directoryResource = directoryResource;
            this.notesResource = notesResource;
            this.policiesResource = policiesResource;
        }


        public async Task<CombinedFamilyInfo> RenderCombinedFamilyInfoAsync(Guid organizationId, Guid locationId,
            Guid familyId, ClaimsPrincipal user)
        {
            var locationPolicy = await policiesResource.GetCurrentPolicy(organizationId, locationId);

            var family = await directoryResource.FindFamilyAsync(organizationId, locationId, familyId);
            if (family == null)
                throw new InvalidOperationException("The specified family ID was not found.");

            var missingCustomFamilyFields = locationPolicy.CustomFamilyFields
                .Where(customField => !family.CompletedCustomFields.Any(completed => completed.CustomFieldName == customField.Name))
                .Select(customField => customField.Name)
                .ToImmutableList();

            var partneringFamilyInfo = await RenderPartneringFamilyInfoAsync(organizationId, locationId, family, user);

            var (volunteerFamilyInfo, uploadedApprovalDocuments) = await RenderVolunteerFamilyInfoAsync(
                organizationId, locationId, locationPolicy, family, user);

            var notes = await notesResource.ListFamilyNotesAsync(organizationId, locationId, familyId);
            var renderedNotes = notes
                .Select(note => new Note(note.Id, note.AuthorId, TimestampUtc: note.Status == NoteStatus.Approved
                    ? note.ApprovedTimestampUtc!.Value
                    : note.LastEditTimestampUtc, note.Contents, note.Status))
                .ToImmutableList();

            // COMPATIBILITY: This step is required to merge previously separated document upload info lists.
            // The previous design had approval and partnering document upload lists stored separately in their respective resource services,
            // but based on system use cases it makes more sense to standardize on storing these document upload lists centrally in the
            // directory service. Since the referral resource service's side of document upload list functionality was never implemented,
            // the go-forward implementation uses only the directory resource service and then merges in prior data from the approvals
            // resource service. At some point a data migration could be run to convert the approvals events to directory events,
            // at which point this compatibility step can then be removed.
            var allUploadedDocuments = uploadedApprovalDocuments
                .Concat(family.UploadedDocuments)
                .Where(udi => !family.DeletedDocuments.Contains(udi.UploadedDocumentId))
                .ToImmutableList();

            var renderedFamily = new CombinedFamilyInfo(family, partneringFamilyInfo, volunteerFamilyInfo, renderedNotes,
                allUploadedDocuments, missingCustomFamilyFields, ImmutableList<Permission>.Empty);

            var disclosedFamily = await authorizationEngine.DiscloseFamilyAsync(user, organizationId, locationId, renderedFamily);
            return disclosedFamily;
        }


        private async Task<PartneringFamilyInfo?> RenderPartneringFamilyInfoAsync(Guid organizationId, Guid locationId,
            Family family, ClaimsPrincipal user)
        {
            var referralEntries = (await referralsResource.ListReferralsAsync(organizationId, locationId))
                .Where(r => r.FamilyId == family.Id)
                .ToImmutableList();

            if (referralEntries.Count == 0)
                return null;

            var referrals = await referralEntries
                .Select(r => ToReferralAsync(r))
                .WhenAll();

            var openReferral = referrals.SingleOrDefault(r => r.CloseReason == null);
            var closedReferrals = referrals.Where(r => r.CloseReason != null).ToImmutableList();

            var partneringFamilyInfo = new PartneringFamilyInfo(openReferral, closedReferrals,
                referralEntries.SelectMany(entry => entry.History).ToImmutableList());

            return partneringFamilyInfo;

            async Task<Referral> ToReferralAsync(ReferralEntry entry)
            {
                var referralStatus = await policyEvaluationEngine.CalculateReferralStatusAsync(organizationId, locationId, family, entry);

                return new(entry.Id, entry.OpenedAtUtc, entry.ClosedAtUtc, entry.CloseReason,
                    entry.CompletedRequirements, entry.ExemptedRequirements, referralStatus.MissingIntakeRequirements,
                    entry.CompletedCustomFields.Values.ToImmutableList(), referralStatus.MissingCustomFields,
                    entry.Arrangements
                        .Where(a => a.Value.Active)
                        .Select(a => ToArrangement(a.Value, referralStatus.IndividualArrangements[a.Key]))
                        .ToImmutableList(),
                    entry.Comments);
            }

            static Arrangement ToArrangement(ArrangementEntry entry, ArrangementStatus status) =>
                new(entry.Id, entry.ArrangementType, entry.PartneringFamilyPersonId, status.Phase,
                    entry.RequestedAtUtc, entry.StartedAtUtc, entry.EndedAtUtc, entry.CancelledAtUtc,
                    entry.PlannedStartUtc, entry.PlannedEndUtc,
                    entry.CompletedRequirements, entry.ExemptedRequirements,
                    status.MissingRequirements,
                    entry.IndividualVolunteerAssignments, entry.FamilyVolunteerAssignments,
                    entry.ChildLocationHistory, entry.ChildLocationPlan,
                    entry.Comments);
        }

        private async Task<(VolunteerFamilyInfo?, ImmutableList<UploadedDocumentInfo>)> RenderVolunteerFamilyInfoAsync(
            Guid organizationId, Guid locationId, EffectiveLocationPolicy locationPolicy,
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

            // Apply default action expiration policies to completed requirements before running approval calculations.
            var applyValidity = (CompletedRequirementInfo completed) =>
                ApplyValidityPolicyToCompletedRequirement(locationPolicy, completed);
            var completedFamilyRequirementsWithExpiration = entry.CompletedRequirements
                .Select(applyValidity).ToImmutableList();
            var completedIndividualRequirementsWithExpiration = completedIndividualRequirements
                .ToImmutableDictionary(entry => entry.Key, entry => entry.Value
                    .Select(applyValidity).ToImmutableList());

            var volunteerFamilyApprovalStatus = await policyEvaluationEngine.CalculateVolunteerFamilyApprovalStatusAsync(
                organizationId, locationId, family, completedFamilyRequirementsWithExpiration, entry.ExemptedRequirements, entry.RemovedRoles,
                completedIndividualRequirementsWithExpiration, exemptedIndividualRequirements, removedIndividualRoles);

            var volunteerFamilyInfo = new VolunteerFamilyInfo(
                completedFamilyRequirementsWithExpiration, entry.ExemptedRequirements, entry.RemovedRoles,
                volunteerFamilyApprovalStatus.MissingFamilyRequirements,
                volunteerFamilyApprovalStatus.AvailableFamilyApplications,
                volunteerFamilyApprovalStatus.FamilyRoleApprovals,
                volunteerFamilyApprovalStatus.IndividualVolunteers.ToImmutableDictionary(
                    x => x.Key,
                    x =>
                    {
                        entry.IndividualEntries.TryGetValue(x.Key, out var individualEntry);
                        completedIndividualRequirementsWithExpiration.TryGetValue(x.Key, out var completedRequirements);
                        return new VolunteerInfo(
                            completedRequirements ?? ImmutableList<CompletedRequirementInfo>.Empty,
                            individualEntry?.ExemptedRequirements ?? ImmutableList<ExemptedRequirementInfo>.Empty,
                            individualEntry?.RemovedRoles ?? ImmutableList<RemovedRole>.Empty,
                            x.Value.MissingIndividualRequirements,
                            x.Value.AvailableIndividualApplications,
                            x.Value.IndividualRoleApprovals);
                    }),
                entry.History);

            return (volunteerFamilyInfo, entry.UploadedDocuments);
        }

        internal static CompletedRequirementInfo ApplyValidityPolicyToCompletedRequirement(
            EffectiveLocationPolicy policy, CompletedRequirementInfo completed)
        {
            return policy.ActionDefinitions.TryGetValue(completed.RequirementName, out var actionDefinition)
                ? completed with
                {
                    ExpiresAtUtc = actionDefinition.Validity.HasValue ? completed.CompletedAtUtc + actionDefinition.Validity : null
                }
                : completed;
        }
    }
}

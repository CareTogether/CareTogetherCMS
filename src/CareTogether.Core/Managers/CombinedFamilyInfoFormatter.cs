using System;
using System.Collections.Immutable;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using CareTogether.Engines.Authorization;
using CareTogether.Engines.PolicyEvaluation;
using CareTogether.Resources;
using CareTogether.Resources.Accounts;
using CareTogether.Resources.Approvals;
using CareTogether.Resources.Directory;
using CareTogether.Resources.Notes;
using CareTogether.Resources.Policies;
using CareTogether.Resources.Referrals;
using Nito.AsyncEx;
using ArrangementEntry = CareTogether.Resources.Referrals.ArrangementEntry;
using CompletedRequirementInfo = CareTogether.Resources.CompletedRequirementInfo;
using ExemptedRequirementInfo = CareTogether.Resources.ExemptedRequirementInfo;
using ReferralEntry = CareTogether.Resources.Referrals.ReferralEntry;

namespace CareTogether.Managers
{
    public class CombinedFamilyInfoFormatter
    {
        readonly IAccountsResource _AccountsResource;
        readonly IApprovalsResource _ApprovalsResource;
        readonly IAuthorizationEngine _AuthorizationEngine;
        readonly IDirectoryResource _DirectoryResource;
        readonly INotesResource _NotesResource;
        readonly IPoliciesResource _PoliciesResource;
        readonly IPolicyEvaluationEngine _PolicyEvaluationEngine;
        readonly IReferralsResource _ReferralsResource;

        public CombinedFamilyInfoFormatter(
            IPolicyEvaluationEngine policyEvaluationEngine,
            IAuthorizationEngine authorizationEngine,
            IApprovalsResource approvalsResource,
            IReferralsResource referralsResource,
            IDirectoryResource directoryResource,
            INotesResource notesResource,
            IPoliciesResource policiesResource,
            IAccountsResource accountsResource
        )
        {
            _PolicyEvaluationEngine = policyEvaluationEngine;
            _AuthorizationEngine = authorizationEngine;
            _ApprovalsResource = approvalsResource;
            _ReferralsResource = referralsResource;
            _DirectoryResource = directoryResource;
            _NotesResource = notesResource;
            _PoliciesResource = policiesResource;
            _AccountsResource = accountsResource;
        }

        public async Task<CombinedFamilyInfo?> RenderCombinedFamilyInfoAsync(
            Guid organizationId,
            Guid locationId,
            Guid familyId,
            ClaimsPrincipal user
        )
        {
            EffectiveLocationPolicy locationPolicy = await _PoliciesResource.GetCurrentPolicy(
                organizationId,
                locationId
            );

            Family? family = await _DirectoryResource.FindFamilyAsync(organizationId, locationId, familyId);
            if (family == null)
            {
                throw new InvalidOperationException("The specified family ID was not found.");
            }

            // Exclude soft-deleted families and individuals (i.e., those marked as 'inactive').
            // Note that this is different from the 'inactive' role removal reason.
            // A potential 'undelete' feature could be implemented that involves checking for a
            // special "View Deleted" permission to bypass this step.
            if (!family.Active)
            {
                return null;
            }

            family = family with
            {
                Adults = family.Adults.Where(adult => adult.Item1.Active).ToImmutableList(),
                Children = family.Children.Where(child => child.Active).ToImmutableList(),
            };

            ImmutableList<string> missingCustomFamilyFields = locationPolicy
                .CustomFamilyFields.Where(customField =>
                    !family.CompletedCustomFields.Any(completed => completed.CustomFieldName == customField.Name)
                )
                .Select(customField => customField.Name)
                .ToImmutableList();

            PartneringFamilyInfo? partneringFamilyInfo = await RenderPartneringFamilyInfoAsync(
                organizationId,
                locationId,
                family
            );

            (VolunteerFamilyInfo volunteerFamilyInfo, ImmutableList<UploadedDocumentInfo> uploadedApprovalDocuments) =
                await RenderVolunteerFamilyInfoAsync(organizationId, locationId, locationPolicy, family);

            ImmutableList<NoteEntry> notes = await _NotesResource.ListFamilyNotesAsync(
                organizationId,
                locationId,
                familyId
            );
            ImmutableList<Note> renderedNotes = notes
                .Select(note => new Note(
                    note.Id,
                    note.AuthorId,
                    note.Status == NoteStatus.Approved ? note.ApprovedTimestampUtc!.Value : note.LastEditTimestampUtc,
                    note.Contents,
                    note.Status,
                    note.BackdatedTimestampUtc
                ))
                .ToImmutableList();

            // COMPATIBILITY: This step is required to merge previously separated document upload info lists.
            // The previous design had approval and partnering document upload lists stored separately in their respective resource services,
            // but based on system use cases it makes more sense to standardize on storing these document upload lists centrally in the
            // directory service. Since the referral resource service's side of document upload list functionality was never implemented,
            // the go-forward implementation uses only the directory resource service and then merges in prior data from the approvals
            // resource service. At some point a data migration could be run to convert the approvals events to directory events,
            // at which point this compatibility step can then be removed.
            ImmutableList<UploadedDocumentInfo> allUploadedDocuments = uploadedApprovalDocuments
                .Concat(family.UploadedDocuments)
                .Where(udi => !family.DeletedDocuments.Contains(udi.UploadedDocumentId))
                .ToImmutableList();

            ImmutableList<UserInfo> users = (
                await Task.WhenAll(
                    family.Adults.Select(async adult =>
                    {
                        Account? account = await _AccountsResource.TryGetPersonUserAccountAsync(
                            organizationId,
                            locationId,
                            adult.Item1.Id
                        );
                        ImmutableList<string>? personAccess = await _AccountsResource.TryGetPersonRolesAsync(
                            organizationId,
                            locationId,
                            adult.Item1.Id
                        );

                        return account == null
                            ? personAccess == null
                                ? null
                                : new UserInfo(null, adult.Item1.Id, personAccess ?? ImmutableList<string>.Empty)
                            : new UserInfo(
                                account.UserId,
                                adult.Item1.Id,
                                account
                                    .Organizations.Single(org => org.OrganizationId == organizationId)
                                    .Locations.Single(l => l.LocationId == locationId)
                                    .Roles
                            );
                    })
                )
            ).Where(user => user != null).Cast<UserInfo>().ToImmutableList();

            CombinedFamilyInfo renderedFamily =
                new(
                    family,
                    users,
                    partneringFamilyInfo,
                    volunteerFamilyInfo,
                    renderedNotes,
                    allUploadedDocuments,
                    missingCustomFamilyFields,
                    ImmutableList<Permission>.Empty
                );

            CombinedFamilyInfo disclosedFamily = await _AuthorizationEngine.DiscloseFamilyAsync(
                user,
                organizationId,
                locationId,
                renderedFamily
            );
            return disclosedFamily;
        }

        async Task<PartneringFamilyInfo?> RenderPartneringFamilyInfoAsync(
            Guid organizationId,
            Guid locationId,
            Family family
        )
        {
            ImmutableList<ReferralEntry> referralEntries = (
                await _ReferralsResource.ListReferralsAsync(organizationId, locationId)
            )
                .Where(r => r.FamilyId == family.Id)
                .ToImmutableList();

            if (referralEntries.Count == 0)
            {
                return null;
            }

            Referral[] referrals = await referralEntries.Select(r => ToReferralAsync(r)).WhenAll();

            Referral? openReferral = referrals.FirstOrDefault(r => r.CloseReason == null);
            ImmutableList<Referral> closedReferrals = referrals.Where(r => r.Id != openReferral?.Id).ToImmutableList();

            PartneringFamilyInfo partneringFamilyInfo =
                new(
                    openReferral,
                    closedReferrals,
                    referralEntries.SelectMany(entry => entry.History).ToImmutableList()
                );

            return partneringFamilyInfo;

            async Task<Referral> ToReferralAsync(ReferralEntry entry)
            {
                ReferralStatus referralStatus = await _PolicyEvaluationEngine.CalculateReferralStatusAsync(
                    organizationId,
                    locationId,
                    family,
                    entry
                );

                return new Referral(
                    entry.Id,
                    entry.OpenedAtUtc,
                    entry.ClosedAtUtc,
                    entry.CloseReason,
                    entry.CompletedRequirements,
                    entry.ExemptedRequirements,
                    referralStatus.MissingIntakeRequirements,
                    entry.CompletedCustomFields.Values.ToImmutableList(),
                    referralStatus.MissingCustomFields,
                    entry
                        .Arrangements.Where(a => a.Value.Active)
                        .Select(a => ToArrangement(a.Value, referralStatus.IndividualArrangements[a.Key]))
                        .ToImmutableList(),
                    entry.Comments
                );
            }

            static Arrangement ToArrangement(ArrangementEntry entry, ArrangementStatus status)
            {
                return new Arrangement(
                    entry.Id,
                    entry.ArrangementType,
                    entry.PartneringFamilyPersonId,
                    status.Phase,
                    entry.RequestedAtUtc,
                    entry.StartedAtUtc,
                    entry.EndedAtUtc,
                    entry.CancelledAtUtc,
                    entry.PlannedStartUtc,
                    entry.PlannedEndUtc,
                    entry.CompletedRequirements,
                    entry.ExemptedRequirements,
                    status.MissingRequirements,
                    entry.IndividualVolunteerAssignments,
                    entry.FamilyVolunteerAssignments,
                    entry.ChildLocationHistory,
                    entry.ChildLocationPlan,
                    entry.Comments,
                    entry.Reason
                );
            }
        }

        async Task<(VolunteerFamilyInfo?, ImmutableList<UploadedDocumentInfo>)> RenderVolunteerFamilyInfoAsync(
            Guid organizationId,
            Guid locationId,
            EffectiveLocationPolicy locationPolicy,
            Family family
        )
        {
            VolunteerFamilyEntry? entry = await _ApprovalsResource.TryGetVolunteerFamilyAsync(
                organizationId,
                locationId,
                family.Id
            );

            if (entry == null)
            {
                return (null, ImmutableList<UploadedDocumentInfo>.Empty);
            }

            ImmutableDictionary<Guid, ImmutableList<CompletedRequirementInfo>> completedIndividualRequirements =
                entry.IndividualEntries.ToImmutableDictionary(x => x.Key, x => x.Value.CompletedRequirements);
            ImmutableDictionary<Guid, ImmutableList<ExemptedRequirementInfo>> exemptedIndividualRequirements =
                entry.IndividualEntries.ToImmutableDictionary(x => x.Key, x => x.Value.ExemptedRequirements);
            ImmutableDictionary<Guid, ImmutableList<RoleRemoval>> removedIndividualRoles =
                entry.IndividualEntries.ToImmutableDictionary(x => x.Key, x => x.Value.RoleRemovals);

            // Apply default action expiration policies to completed requirements before running approval calculations.
            Func<CompletedRequirementInfo, CompletedRequirementInfo> applyValidity = completed =>
                ApplyValidityPolicyToCompletedRequirement(locationPolicy, completed);
            ImmutableList<CompletedRequirementInfo> completedFamilyRequirementsWithExpiration = entry
                .CompletedRequirements.Select(applyValidity)
                .ToImmutableList();
            ImmutableDictionary<
                Guid,
                ImmutableList<CompletedRequirementInfo>
            > completedIndividualRequirementsWithExpiration = completedIndividualRequirements.ToImmutableDictionary(
                entry => entry.Key,
                entry => entry.Value.Select(applyValidity).ToImmutableList()
            );

            FamilyApprovalStatus combinedFamilyApprovals =
                await _PolicyEvaluationEngine.CalculateCombinedFamilyApprovalsAsync(
                    organizationId,
                    locationId,
                    family,
                    completedFamilyRequirementsWithExpiration,
                    entry.ExemptedRequirements,
                    entry.RoleRemovals,
                    completedIndividualRequirementsWithExpiration,
                    exemptedIndividualRequirements,
                    removedIndividualRoles
                );

            VolunteerFamilyInfo volunteerFamilyInfo =
                new(
                    combinedFamilyApprovals.FamilyRoleApprovals,
                    completedFamilyRequirementsWithExpiration,
                    entry.ExemptedRequirements,
                    combinedFamilyApprovals.CurrentAvailableFamilyApplications,
                    combinedFamilyApprovals.CurrentMissingFamilyRequirements,
                    entry.RoleRemovals,
                    combinedFamilyApprovals.IndividualApprovals.ToImmutableDictionary(
                        x => x.Key,
                        x =>
                        {
                            entry.IndividualEntries.TryGetValue(x.Key, out VolunteerEntry? individualEntry);
                            completedIndividualRequirementsWithExpiration.TryGetValue(
                                x.Key,
                                out ImmutableList<CompletedRequirementInfo>? completedRequirements
                            );
                            return new VolunteerInfo(
                                x.Value.ApprovalStatusByRole,
                                completedRequirements ?? ImmutableList<CompletedRequirementInfo>.Empty,
                                individualEntry?.ExemptedRequirements ?? ImmutableList<ExemptedRequirementInfo>.Empty,
                                combinedFamilyApprovals
                                    .CurrentAvailableIndividualApplications.Where(y => y.PersonId == x.Key)
                                    .Select(y => y.ActionName)
                                    .ToImmutableList(),
                                combinedFamilyApprovals
                                    .CurrentMissingIndividualRequirements.Where(y => y.PersonId == x.Key)
                                    .Select(y => (y.ActionName, y.Version))
                                    .ToImmutableList(),
                                individualEntry?.RoleRemovals ?? ImmutableList<RoleRemoval>.Empty
                            );
                        }
                    ),
                    entry.History
                );

            return (volunteerFamilyInfo, entry.UploadedDocuments);
        }

        internal static CompletedRequirementInfo ApplyValidityPolicyToCompletedRequirement(
            EffectiveLocationPolicy policy,
            CompletedRequirementInfo completed
        )
        {
            return policy.ActionDefinitions.TryGetValue(
                completed.RequirementName,
                out ActionRequirement? actionDefinition
            )
                ? completed with
                {
                    ExpiresAtUtc = actionDefinition.Validity.HasValue
                        ? completed.CompletedAtUtc + actionDefinition.Validity
                        : null,
                }
                : completed;
        }
    }
}

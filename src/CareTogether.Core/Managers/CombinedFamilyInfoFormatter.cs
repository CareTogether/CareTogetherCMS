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
        private readonly IAccountsResource accountsResource;

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
            this.policyEvaluationEngine = policyEvaluationEngine;
            this.authorizationEngine = authorizationEngine;
            this.approvalsResource = approvalsResource;
            this.referralsResource = referralsResource;
            this.directoryResource = directoryResource;
            this.notesResource = notesResource;
            this.policiesResource = policiesResource;
            this.accountsResource = accountsResource;
        }

        public async Task<CombinedFamilyInfo?> RenderCombinedFamilyInfoAsync(
            Guid organizationId,
            Guid locationId,
            Guid familyId,
            ClaimsPrincipal user
        )
        {
            var locationPolicy = await policiesResource.GetCurrentPolicy(
                organizationId,
                locationId
            );

            var family = await directoryResource.FindFamilyAsync(
                organizationId,
                locationId,
                familyId
            );
            if (family == null)
                throw new InvalidOperationException("The specified family ID was not found.");

            // Exclude soft-deleted families and individuals (i.e., those marked as 'inactive').
            // Note that this is different from the 'inactive' role removal reason.
            // A potential 'undelete' feature could be implemented that involves checking for a
            // special "View Deleted" permission to bypass this step.
            if (!family.Active)
                return null;
            family = family with
            {
                Adults = family.Adults.Where(adult => adult.Item1.Active).ToImmutableList(),
                Children = family.Children.Where(child => child.Active).ToImmutableList(),
            };

            var missingCustomFamilyFields = locationPolicy
                .CustomFamilyFields.Where(customField =>
                    !family.CompletedCustomFields.Any(completed =>
                        completed.CustomFieldName == customField.Name
                    )
                )
                .Select(customField => customField.Name)
                .ToImmutableList();

            var partneringFamilyInfo = await RenderPartneringFamilyInfoAsync(
                organizationId,
                locationId,
                family
            );

            var (volunteerFamilyInfo, uploadedApprovalDocuments) =
                await RenderVolunteerFamilyInfoAsync(
                    organizationId,
                    locationId,
                    locationPolicy,
                    family
                );

            var notes = await notesResource.ListFamilyNotesAsync(
                organizationId,
                locationId,
                familyId
            );
            var renderedNotes = notes
                .Select(note => new Note(
                    note.Id,
                    note.AuthorId,
                    TimestampUtc: note.Status == NoteStatus.Approved
                        ? note.ApprovedTimestampUtc!.Value
                        : note.LastEditTimestampUtc,
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
            var allUploadedDocuments = uploadedApprovalDocuments
                .Concat(family.UploadedDocuments)
                .Where(udi => !family.DeletedDocuments.Contains(udi.UploadedDocumentId))
                .ToImmutableList();

            var users = (
                await Task.WhenAll(
                    family.Adults.Select(async adult =>
                    {
                        var account = await accountsResource.TryGetPersonUserAccountAsync(
                            organizationId,
                            locationId,
                            adult.Item1.Id
                        );
                        var personAccess = await accountsResource.TryGetPersonRolesAsync(
                            organizationId,
                            locationId,
                            adult.Item1.Id
                        );

                        return (account == null)
                            ? personAccess == null
                                ? null
                                : new UserInfo(
                                    null,
                                    adult.Item1.Id,
                                    personAccess ?? ImmutableList<string>.Empty
                                )
                            : new UserInfo(
                                account.UserId,
                                adult.Item1.Id,
                                account
                                    .Organizations.Single(org =>
                                        org.OrganizationId == organizationId
                                    )
                                    .Locations.Single(l => l.LocationId == locationId)
                                    .Roles
                            );
                    })
                )
            ).Where(user => user != null).Cast<UserInfo>().ToImmutableList();

            var renderedFamily = new CombinedFamilyInfo(
                family,
                users,
                partneringFamilyInfo,
                volunteerFamilyInfo,
                renderedNotes,
                allUploadedDocuments,
                missingCustomFamilyFields,
                ImmutableList<Permission>.Empty
            );

            var disclosedFamily = await authorizationEngine.DiscloseFamilyAsync(
                user,
                organizationId,
                locationId,
                renderedFamily
            );
            return disclosedFamily;
        }

        private async Task<PartneringFamilyInfo?> RenderPartneringFamilyInfoAsync(
            Guid organizationId,
            Guid locationId,
            Family family
        )
        {
            var referralEntries = (
                await referralsResource.ListReferralsAsync(organizationId, locationId)
            )
                .Where(r => r.FamilyId == family.Id)
                .ToImmutableList();

            if (referralEntries.Count == 0)
                return null;

            var referrals = await referralEntries.Select(r => ToReferralAsync(r)).WhenAll();

            var openReferral = referrals.FirstOrDefault(r => r.CloseReason == null);
            var closedReferrals = referrals.Where(r => r.Id != openReferral?.Id).ToImmutableList();

            var partneringFamilyInfo = new PartneringFamilyInfo(
                openReferral,
                closedReferrals,
                referralEntries.SelectMany(entry => entry.History).ToImmutableList()
            );

            return partneringFamilyInfo;

            async Task<Referral> ToReferralAsync(Resources.Referrals.ReferralEntry entry)
            {
                var referralStatus = await policyEvaluationEngine.CalculateReferralStatusAsync(
                    organizationId,
                    locationId,
                    family,
                    entry
                );

                return new(
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
                        .Select(a =>
                            ToArrangement(a.Value, referralStatus.IndividualArrangements[a.Key])
                        )
                        .ToImmutableList(),
                    entry.Comments
                );
            }

            static Arrangement ToArrangement(
                Resources.Referrals.ArrangementEntry entry,
                ArrangementStatus status
            ) =>
                new(
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

        private async Task<(
            VolunteerFamilyInfo?,
            ImmutableList<UploadedDocumentInfo>
        )> RenderVolunteerFamilyInfoAsync(
            Guid organizationId,
            Guid locationId,
            EffectiveLocationPolicy locationPolicy,
            Family family
        )
        {
            var entry = await approvalsResource.TryGetVolunteerFamilyAsync(
                organizationId,
                locationId,
                family.Id
            );

            if (entry == null)
                return (null, ImmutableList<UploadedDocumentInfo>.Empty);

            var completedIndividualRequirements = entry.IndividualEntries.ToImmutableDictionary(
                x => x.Key,
                x => x.Value.CompletedRequirements
            );
            var exemptedIndividualRequirements = entry.IndividualEntries.ToImmutableDictionary(
                x => x.Key,
                x => x.Value.ExemptedRequirements
            );
            var removedIndividualRoles = entry.IndividualEntries.ToImmutableDictionary(
                x => x.Key,
                x => x.Value.RoleRemovals
            );

            // Apply default action expiration policies to completed requirements before running approval calculations.
            var applyValidity = (Resources.CompletedRequirementInfo completed) =>
                ApplyValidityPolicyToCompletedRequirement(locationPolicy, completed);
            var completedFamilyRequirementsWithExpiration = entry
                .CompletedRequirements.Select(applyValidity)
                .ToImmutableList();
            var completedIndividualRequirementsWithExpiration =
                completedIndividualRequirements.ToImmutableDictionary(
                    entry => entry.Key,
                    entry => entry.Value.Select(applyValidity).ToImmutableList()
                );

            var combinedFamilyApprovals =
                await policyEvaluationEngine.CalculateCombinedFamilyApprovalsAsync(
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

            var referralEntries = (
                await referralsResource.ListReferralsAsync(organizationId, locationId)
            ).ToImmutableList();

            var assignments = referralEntries
                .SelectMany(entry => entry.Arrangements)
                .Where(arrangementEntry =>
                {
                    var hasFamilyAssignments =
                        arrangementEntry.Value.FamilyVolunteerAssignments.Exists(assignment =>
                            assignment.FamilyId == family.Id
                        );
                    var hasIndividualAssignments =
                        arrangementEntry.Value.IndividualVolunteerAssignments.Exists(assignment =>
                            assignment.FamilyId == family.Id
                        );
                    return hasFamilyAssignments || hasIndividualAssignments;
                })
                .Select(arrangementEntry => arrangementEntry.Value)
                .ToImmutableList();

            var volunteerFamilyInfo = new VolunteerFamilyInfo(
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
                        entry.IndividualEntries.TryGetValue(x.Key, out var individualEntry);
                        completedIndividualRequirementsWithExpiration.TryGetValue(
                            x.Key,
                            out var completedRequirements
                        );
                        return new VolunteerInfo(
                            x.Value.ApprovalStatusByRole,
                            completedRequirements
                                ?? ImmutableList<Resources.CompletedRequirementInfo>.Empty,
                            individualEntry?.ExemptedRequirements
                                ?? ImmutableList<Resources.ExemptedRequirementInfo>.Empty,
                            combinedFamilyApprovals
                                .CurrentAvailableIndividualApplications.Where(y =>
                                    y.PersonId == x.Key
                                )
                                .Select(y => y.ActionName)
                                .ToImmutableList(),
                            combinedFamilyApprovals
                                .CurrentMissingIndividualRequirements.Where(y =>
                                    y.PersonId == x.Key
                                )
                                .Select(y => (y.ActionName, y.Version))
                                .ToImmutableList(),
                            individualEntry?.RoleRemovals ?? ImmutableList<RoleRemoval>.Empty
                        );
                    }
                ),
                entry.History,
                assignments
            );

            return (volunteerFamilyInfo, entry.UploadedDocuments);
        }

        internal static Resources.CompletedRequirementInfo ApplyValidityPolicyToCompletedRequirement(
            EffectiveLocationPolicy policy,
            Resources.CompletedRequirementInfo completed
        )
        {
            return policy.ActionDefinitions.TryGetValue(
                completed.RequirementName,
                out var actionDefinition
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

using System;
using System.Collections.Generic;
using System.Collections.Immutable;
using System.Linq;
using System.Threading.Tasks;
using CareTogether.Resources.Approvals;
using CareTogether.Resources.Directory;
using CareTogether.Resources.Policies;
using CareTogether.Resources.Referrals;
using CareTogether.Utilities.Dates;

namespace CareTogether.Engines.PolicyEvaluation
{
    public sealed class PolicyEvaluationEngine : IPolicyEvaluationEngine
    {
        readonly IPoliciesResource _PoliciesResource;

        public PolicyEvaluationEngine(IPoliciesResource policiesResource)
        {
            _PoliciesResource = policiesResource;
        }

        public async Task<FamilyApprovalStatus> CalculateCombinedFamilyApprovalsAsync(
            Guid organizationId,
            Guid locationId,
            Family family,
            ImmutableList<Resources.CompletedRequirementInfo> completedFamilyRequirements,
            ImmutableList<Resources.ExemptedRequirementInfo> exemptedFamilyRequirements,
            ImmutableList<RoleRemoval> familyRoleRemovals,
            ImmutableDictionary<
                Guid,
                ImmutableList<Resources.CompletedRequirementInfo>
            > completedIndividualRequirements,
            ImmutableDictionary<Guid, ImmutableList<Resources.ExemptedRequirementInfo>> exemptedIndividualRequirements,
            ImmutableDictionary<Guid, ImmutableList<RoleRemoval>> individualRoleRemovals
        )
        {
            EffectiveLocationPolicy policy = await _PoliciesResource.GetCurrentPolicy(organizationId, locationId);

            return ApprovalCalculations.CalculateCombinedFamilyApprovals(
                policy.VolunteerPolicy,
                family,
                completedFamilyRequirements,
                exemptedFamilyRequirements,
                familyRoleRemovals,
                completedIndividualRequirements,
                exemptedIndividualRequirements,
                individualRoleRemovals
            );
        }

        public async Task<ReferralStatus> CalculateReferralStatusAsync(
            Guid organizationId,
            Guid locationId,
            Family family,
            Resources.Referrals.ReferralEntry referralEntry
        )
        {
            EffectiveLocationPolicy policy = await _PoliciesResource.GetCurrentPolicy(organizationId, locationId);
            OrganizationConfiguration config = await _PoliciesResource.GetConfigurationAsync(organizationId);

            LocationConfiguration? location = config.Locations.Find(item => item.Id == locationId);
            TimeZoneInfo locationTimeZone =
                location?.TimeZone ?? TimeZoneInfo.FindSystemTimeZoneById("America/New_York");

            ReferralEntry referralEntryForCalculation = ToReferralEntryForCalculation(referralEntry, locationTimeZone);

            ReferralStatus referralStatus = ReferralCalculations.CalculateReferralStatus(
                policy.ReferralPolicy,
                referralEntryForCalculation,
                Dates.ToDateOnlyInLocationTimeZone(DateTime.UtcNow, locationTimeZone)
            );

            return referralStatus;
        }

        internal CompletedRequirementInfo ToCompletedRequirementsForCalculation(
            Resources.CompletedRequirementInfo entry,
            TimeZoneInfo locationTimeZone
        )
        {
            return new CompletedRequirementInfo(
                entry.RequirementName,
                Dates.ToDateOnlyInLocationTimeZone(entry.CompletedAtUtc, locationTimeZone),
                Dates.ToDateOnlyInLocationTimeZone(entry.ExpiresAtUtc, locationTimeZone)
            );
        }

        internal ExemptedRequirementInfo ToExemptedRequirementInfoForCalculation(
            Resources.ExemptedRequirementInfo entry,
            TimeZoneInfo locationTimeZone
        )
        {
            return new ExemptedRequirementInfo(
                entry.RequirementName,
                Dates.ToDateOnlyInLocationTimeZone(entry.DueDate, locationTimeZone),
                Dates.ToDateOnlyInLocationTimeZone(entry.ExemptionExpiresAtUtc, locationTimeZone)
            );
        }

        internal ChildLocation ToChildLocation(ChildLocationHistoryEntry entry, TimeZoneInfo locationTimeZone)
        {
            return new ChildLocation(
                entry.ChildLocationFamilyId,
                DateOnly.FromDateTime(Dates.ToLocationTimeZone(entry.TimestampUtc, locationTimeZone)),
                entry.Plan == ChildLocationPlan.WithParent
            );
        }

        internal IndividualVolunteerAssignment ToIndividualVolunteerAssignmentForCalculation(
            Resources.Referrals.IndividualVolunteerAssignment entry,
            TimeZoneInfo locationTimeZone
        )
        {
            ImmutableList<CompletedRequirementInfo> completedRequirements = entry
                .CompletedRequirements.Select(item => ToCompletedRequirementsForCalculation(item, locationTimeZone))
                .ToImmutableList();

            ImmutableList<ExemptedRequirementInfo> exemptedRequirements = entry
                .ExemptedRequirements.Select(item => ToExemptedRequirementInfoForCalculation(item, locationTimeZone))
                .ToImmutableList();

            return new IndividualVolunteerAssignment(
                entry.FamilyId,
                entry.PersonId,
                entry.ArrangementFunction,
                entry.ArrangementFunctionVariant,
                completedRequirements,
                exemptedRequirements
            );
        }

        internal FamilyVolunteerAssignment ToFamilyVolunteerAssignmentForCalculation(
            Resources.Referrals.FamilyVolunteerAssignment entry,
            TimeZoneInfo locationTimeZone
        )
        {
            ImmutableList<CompletedRequirementInfo> completedRequirements = entry
                .CompletedRequirements.Select(item => ToCompletedRequirementsForCalculation(item, locationTimeZone))
                .ToImmutableList();

            ImmutableList<ExemptedRequirementInfo> exemptedRequirements = entry
                .ExemptedRequirements.Select(item => ToExemptedRequirementInfoForCalculation(item, locationTimeZone))
                .ToImmutableList();

            return new FamilyVolunteerAssignment(
                entry.FamilyId,
                entry.ArrangementFunction,
                entry.ArrangementFunctionVariant,
                completedRequirements,
                exemptedRequirements
            );
        }

        internal ArrangementEntry ToArrangementEntryForCalculation(
            Resources.Referrals.ArrangementEntry entry,
            TimeZoneInfo locationTimeZone
        )
        {
            ImmutableList<CompletedRequirementInfo> completedRequirements = entry
                .CompletedRequirements.Select(item => ToCompletedRequirementsForCalculation(item, locationTimeZone))
                .ToImmutableList();

            ImmutableList<ExemptedRequirementInfo> exemptedRequirements = entry
                .ExemptedRequirements.Select(item => ToExemptedRequirementInfoForCalculation(item, locationTimeZone))
                .ToImmutableList();

            ImmutableSortedSet<ChildLocation> childLocationHistory = entry
                .ChildLocationHistory.Select(item => ToChildLocation(item, locationTimeZone))
                .ToImmutableList();

            ImmutableList<IndividualVolunteerAssignment> individualVolunteerAssignments = entry
                .IndividualVolunteerAssignments.Select(item =>
                    ToIndividualVolunteerAssignmentForCalculation(item, locationTimeZone)
                )
                .ToImmutableList();

            ImmutableList<FamilyVolunteerAssignment> familyVolunteerAssignments = entry
                .FamilyVolunteerAssignments.Select(item =>
                    ToFamilyVolunteerAssignmentForCalculation(item, locationTimeZone)
                )
                .ToImmutableList();

            return new ArrangementEntry(
                entry.ArrangementType,
                Dates.ToDateOnlyInLocationTimeZone(entry.StartedAtUtc, locationTimeZone),
                Dates.ToDateOnlyInLocationTimeZone(entry.EndedAtUtc, locationTimeZone),
                Dates.ToDateOnlyInLocationTimeZone(entry.CancelledAtUtc, locationTimeZone),
                entry.PartneringFamilyPersonId,
                completedRequirements,
                exemptedRequirements,
                individualVolunteerAssignments,
                familyVolunteerAssignments,
                childLocationHistory
            );
        }

        internal ReferralEntry ToReferralEntryForCalculation(
            Resources.Referrals.ReferralEntry entry,
            TimeZoneInfo locationTimeZone
        )
        {
            ImmutableList<CompletedRequirementInfo> completedRequirements = entry
                .CompletedRequirements.Select(item => ToCompletedRequirementsForCalculation(item, locationTimeZone))
                .ToImmutableList();

            ImmutableList<ExemptedRequirementInfo> exemptedRequirements = entry
                .ExemptedRequirements.Select(item => ToExemptedRequirementInfoForCalculation(item, locationTimeZone))
                .ToImmutableList();

            ImmutableDictionary<Guid, ArrangementEntry> arrangements = entry
                .Arrangements.Select(item => new KeyValuePair<Guid, ArrangementEntry>(
                    item.Key,
                    ToArrangementEntryForCalculation(item.Value, locationTimeZone)
                ))
                .ToImmutableDictionary();

            return new ReferralEntry(
                completedRequirements,
                exemptedRequirements,
                entry.CompletedCustomFields,
                arrangements
            );
        }
    }
}

using System;
using System.Collections.Generic;
using System.Collections.Immutable;
using System.Linq;
using System.Threading.Tasks;
using CareTogether.Resources;
using CareTogether.Resources.Approvals;
using CareTogether.Resources.Directory;
using CareTogether.Resources.Policies;
using CareTogether.Resources.V1Cases;
using CareTogether.Utilities.Dates;

namespace CareTogether.Engines.PolicyEvaluation
{
    public sealed class PolicyEvaluationEngine : IPolicyEvaluationEngine
    {
        private readonly IPoliciesResource policiesResource;

        public PolicyEvaluationEngine(IPoliciesResource policiesResource)
        {
            this.policiesResource = policiesResource;
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
            ImmutableDictionary<
                Guid,
                ImmutableList<Resources.ExemptedRequirementInfo>
            > exemptedIndividualRequirements,
            ImmutableDictionary<Guid, ImmutableList<RoleRemoval>> individualRoleRemovals
        )
        {
            var policy = await policiesResource.GetCurrentPolicy(organizationId, locationId);

            return ApprovalCalculations.CalculateCombinedFamilyApprovals(
                policy,
                family,
                completedFamilyRequirements,
                exemptedFamilyRequirements,
                familyRoleRemovals,
                completedIndividualRequirements,
                exemptedIndividualRequirements,
                individualRoleRemovals
            );
        }

        internal CompletedRequirementInfo ToCompletedRequirementsForCalculation(
            Resources.CompletedRequirementInfo entry,
            TimeZoneInfo locationTimeZone
        )
        {
            return new(
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
            return new(
                entry.RequirementName,
                Dates.ToDateOnlyInLocationTimeZone(entry.DueDate, locationTimeZone),
                Dates.ToDateOnlyInLocationTimeZone(entry.ExemptionExpiresAtUtc, locationTimeZone)
            );
        }

        internal ChildLocation ToChildLocation(
            ChildLocationHistoryEntry entry,
            TimeZoneInfo locationTimeZone
        )
        {
            return new(
                entry.ChildLocationFamilyId,
                DateOnly.FromDateTime(
                    Dates.ToLocationTimeZone(entry.TimestampUtc, locationTimeZone)
                ),
                Paused: entry.Plan == ChildLocationPlan.WithParent
            );
        }

        internal IndividualVolunteerAssignment ToIndividualVolunteerAssignmentForCalculation(
            Resources.V1Cases.IndividualVolunteerAssignment entry,
            TimeZoneInfo locationTimeZone
        )
        {
            var completedRequirements = entry
                .CompletedRequirements.Select(item =>
                    ToCompletedRequirementsForCalculation(item, locationTimeZone)
                )
                .ToImmutableList();

            var exemptedRequirements = entry
                .ExemptedRequirements.Select(item =>
                    ToExemptedRequirementInfoForCalculation(item, locationTimeZone)
                )
                .ToImmutableList();

            return new(
                entry.FamilyId,
                entry.PersonId,
                entry.ArrangementFunction,
                entry.ArrangementFunctionVariant,
                completedRequirements,
                exemptedRequirements
            );
        }

        internal FamilyVolunteerAssignment ToFamilyVolunteerAssignmentForCalculation(
            Resources.V1Cases.FamilyVolunteerAssignment entry,
            TimeZoneInfo locationTimeZone
        )
        {
            var completedRequirements = entry
                .CompletedRequirements.Select(item =>
                    ToCompletedRequirementsForCalculation(item, locationTimeZone)
                )
                .ToImmutableList();

            var exemptedRequirements = entry
                .ExemptedRequirements.Select(item =>
                    ToExemptedRequirementInfoForCalculation(item, locationTimeZone)
                )
                .ToImmutableList();

            return new(
                entry.FamilyId,
                entry.ArrangementFunction,
                entry.ArrangementFunctionVariant,
                completedRequirements,
                exemptedRequirements
            );
        }

        internal ArrangementEntry ToArrangementEntryForCalculation(
            Resources.V1Cases.ArrangementEntry entry,
            TimeZoneInfo locationTimeZone
        )
        {
            var completedRequirements = entry
                .CompletedRequirements.Select(item =>
                    ToCompletedRequirementsForCalculation(item, locationTimeZone)
                )
                .ToImmutableList();

            var exemptedRequirements = entry
                .ExemptedRequirements.Select(item =>
                    ToExemptedRequirementInfoForCalculation(item, locationTimeZone)
                )
                .ToImmutableList();

            var ChildLocationHistory = entry
                .ChildLocationHistory.Select(item => ToChildLocation(item, locationTimeZone))
                .ToImmutableList();

            var individualVolunteerAssignments = entry
                .IndividualVolunteerAssignments.Select(item =>
                    ToIndividualVolunteerAssignmentForCalculation(item, locationTimeZone)
                )
                .ToImmutableList();

            var familyVolunteerAssignments = entry
                .FamilyVolunteerAssignments.Select(item =>
                    ToFamilyVolunteerAssignmentForCalculation(item, locationTimeZone)
                )
                .ToImmutableList();

            return new(
                entry.ArrangementType,
                Dates.ToDateOnlyInLocationTimeZone(entry.StartedAtUtc, locationTimeZone),
                Dates.ToDateOnlyInLocationTimeZone(entry.EndedAtUtc, locationTimeZone),
                Dates.ToDateOnlyInLocationTimeZone(entry.CancelledAtUtc, locationTimeZone),
                entry.PartneringFamilyPersonId,
                completedRequirements,
                exemptedRequirements,
                individualVolunteerAssignments,
                familyVolunteerAssignments,
                ChildLocationHistory
            );
        }

        internal V1CaseEntry ToV1CaseEntryForCalculation(
            Resources.V1Cases.V1CaseEntry entry,
            TimeZoneInfo locationTimeZone
        )
        {
            var completedRequirements = entry
                .CompletedRequirements.Select(item =>
                    ToCompletedRequirementsForCalculation(item, locationTimeZone)
                )
                .ToImmutableList();

            var exemptedRequirements = entry
                .ExemptedRequirements.Select(item =>
                    ToExemptedRequirementInfoForCalculation(item, locationTimeZone)
                )
                .ToImmutableList();

            var arrangements = entry
                .Arrangements.Select(item => new KeyValuePair<Guid, ArrangementEntry>(
                    item.Key,
                    ToArrangementEntryForCalculation(item.Value, locationTimeZone)
                ))
                .ToImmutableDictionary();

            return new V1CaseEntry(
                completedRequirements,
                exemptedRequirements,
                entry.CompletedCustomFields,
                arrangements
            );
        }

        public async Task<V1CaseStatus> CalculateV1CaseStatusAsync(
            Guid organizationId,
            Guid locationId,
            Family family,
            Resources.V1Cases.V1CaseEntry v1CaseEntry
        )
        {
            var policy = await policiesResource.GetCurrentPolicy(organizationId, locationId);
            var config = await policiesResource.GetConfigurationAsync(organizationId);

            var location = config.Locations.Find(item => item.Id == locationId);
            TimeZoneInfo locationTimeZone =
                location?.timeZone ?? TimeZoneInfo.FindSystemTimeZoneById("America/New_York");

            var v1CaseEntryForCalculation = ToV1CaseEntryForCalculation(
                v1CaseEntry,
                locationTimeZone
            );

            var v1CaseStatus = V1CaseCalculations.CalculateV1CaseStatus(
                policy,
                policy.ReferralPolicy,
                v1CaseEntryForCalculation,
                Dates.ToDateOnlyInLocationTimeZone(DateTime.UtcNow, locationTimeZone)
            );

            return v1CaseStatus;
        }
    }
}

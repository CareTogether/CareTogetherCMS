using System;
using System.Collections.Generic;
using System.Collections.Immutable;
using System.Linq;
using System.Threading.Tasks;
using CareTogether.Resources;
using CareTogether.Resources.Approvals;
using CareTogether.Resources.Directory;
using CareTogether.Resources.Policies;
using CareTogether.Resources.Referrals;

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
            ImmutableList<CompletedRequirementInfo> completedFamilyRequirements,
            ImmutableList<ExemptedRequirementInfo> exemptedFamilyRequirements,
            ImmutableList<RoleRemoval> familyRoleRemovals,
            ImmutableDictionary<Guid, ImmutableList<CompletedRequirementInfo>> completedIndividualRequirements,
            ImmutableDictionary<Guid, ImmutableList<ExemptedRequirementInfo>> exemptedIndividualRequirements,
            ImmutableDictionary<Guid, ImmutableList<RoleRemoval>> individualRoleRemovals
        )
        {
            var policy = await policiesResource.GetCurrentPolicy(organizationId, locationId);

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

        internal DateTime ToLocationTimeZone(DateTime dateTime, TimeZoneInfo locationTimeZone)
        {
            return TimeZoneInfo.ConvertTimeFromUtc(dateTime, locationTimeZone);
        }

        internal DateTime? ToLocationTimeZone(DateTime? dateTime, TimeZoneInfo locationTimeZone)
        {
            if (!dateTime.HasValue)
            {
                return null;
            }

            return TimeZoneInfo.ConvertTimeFromUtc(dateTime.Value, locationTimeZone);
        }

        internal DateOnly ToDateOnlyInLocationTimeZone(DateTime dateTime, TimeZoneInfo locationTimeZone)
        {
            return DateOnly.FromDateTime(ToLocationTimeZone(dateTime, locationTimeZone));
        }

        internal DateOnly? ToDateOnlyInLocationTimeZone(DateTime? dateTime, TimeZoneInfo locationTimeZone)
        {
            if (!dateTime.HasValue)
            {
                return null;
            }

            return DateOnly.FromDateTime(ToLocationTimeZone(dateTime.Value, locationTimeZone));
        }

        internal CompletedRequirementInfoForCalculation ToCompletedRequirementsForCalculation(
            CompletedRequirementInfo entry,
            TimeZoneInfo locationTimeZone
        )
        {
            return new(
                entry.RequirementName,
                ToDateOnlyInLocationTimeZone(entry.CompletedAtUtc, locationTimeZone),
                ToDateOnlyInLocationTimeZone(entry.ExpiresAtUtc, locationTimeZone)
            );
        }

        internal ExemptedRequirementInfoForCalculation ToExemptedRequirementInfoForCalculation(
            ExemptedRequirementInfo entry,
            TimeZoneInfo locationTimeZone
        )
        {
            return new(
                entry.RequirementName,
                ToDateOnlyInLocationTimeZone(entry.DueDate, locationTimeZone),
                ToDateOnlyInLocationTimeZone(entry.ExemptionExpiresAtUtc, locationTimeZone)
            );
        }

        internal ChildLocation ToChildLocation(ChildLocationHistoryEntry entry, TimeZoneInfo locationTimeZone)
        {
            return new(
                entry.ChildLocationFamilyId,
                DateOnly.FromDateTime(ToLocationTimeZone(entry.TimestampUtc, locationTimeZone)),
                Paused: entry.Plan == ChildLocationPlan.WithParent
            );
        }

        internal IndividualVolunteerAssignmentForCalculation ToIndividualVolunteerAssignmentForCalculation(
            IndividualVolunteerAssignment entry,
            TimeZoneInfo locationTimeZone
        )
        {
            var completedRequirements = entry
                .CompletedRequirements.Select(item => ToCompletedRequirementsForCalculation(item, locationTimeZone))
                .ToImmutableList();

            var exemptedRequirements = entry
                .ExemptedRequirements.Select(item => ToExemptedRequirementInfoForCalculation(item, locationTimeZone))
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

        internal FamilyVolunteerAssignmentForCalculation ToFamilyVolunteerAssignmentForCalculation(
            FamilyVolunteerAssignment entry,
            TimeZoneInfo locationTimeZone
        )
        {
            var completedRequirements = entry
                .CompletedRequirements.Select(item => ToCompletedRequirementsForCalculation(item, locationTimeZone))
                .ToImmutableList();

            var exemptedRequirements = entry
                .ExemptedRequirements.Select(item => ToExemptedRequirementInfoForCalculation(item, locationTimeZone))
                .ToImmutableList();

            return new(
                entry.FamilyId,
                entry.ArrangementFunction,
                entry.ArrangementFunctionVariant,
                completedRequirements,
                exemptedRequirements
            );
        }

        internal ArrangementEntryForCalculation ToArrangementEntryForCalculation(
            ArrangementEntry entry,
            TimeZoneInfo locationTimeZone
        )
        {
            var completedRequirements = entry
                .CompletedRequirements.Select(item => ToCompletedRequirementsForCalculation(item, locationTimeZone))
                .ToImmutableList();

            var exemptedRequirements = entry
                .ExemptedRequirements.Select(item => ToExemptedRequirementInfoForCalculation(item, locationTimeZone))
                .ToImmutableList();

            var ChildLocationHistory = entry
                .ChildLocationHistory.Select(item => ToChildLocation(item, locationTimeZone))
                .ToImmutableSortedSet();

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
                ToDateOnlyInLocationTimeZone(entry.StartedAtUtc, locationTimeZone),
                ToDateOnlyInLocationTimeZone(entry.EndedAtUtc, locationTimeZone),
                ToDateOnlyInLocationTimeZone(entry.CancelledAtUtc, locationTimeZone),
                entry.PartneringFamilyPersonId,
                completedRequirements,
                exemptedRequirements,
                individualVolunteerAssignments,
                familyVolunteerAssignments,
                ChildLocationHistory
            );
        }

        internal ReferralEntryForCalculation ToReferralEntryForCalculation(
            ReferralEntry entry,
            TimeZoneInfo locationTimeZone
        )
        {
            var completedRequirements = entry
                .CompletedRequirements.Select(item => ToCompletedRequirementsForCalculation(item, locationTimeZone))
                .ToImmutableList();

            var exemptedRequirements = entry
                .ExemptedRequirements.Select(item => ToExemptedRequirementInfoForCalculation(item, locationTimeZone))
                .ToImmutableList();

            var arrangements = entry
                .Arrangements.Select(item => new KeyValuePair<Guid, ArrangementEntryForCalculation>(
                    item.Key,
                    ToArrangementEntryForCalculation(item.Value, locationTimeZone)
                ))
                .ToImmutableDictionary();

            return new ReferralEntryForCalculation(
                completedRequirements,
                exemptedRequirements,
                entry.CompletedCustomFields,
                arrangements
            );
        }

        public async Task<ReferralStatus> CalculateReferralStatusAsync(
            Guid organizationId,
            Guid locationId,
            Family family,
            ReferralEntry referralEntry
        )
        {
            var policy = await policiesResource.GetCurrentPolicy(organizationId, locationId);
            var config = await policiesResource.GetConfigurationAsync(organizationId);

            var location = config.Locations.Find(item => item.Id == locationId);
            TimeZoneInfo locationTimeZone =
                location?.timeZone ?? TimeZoneInfo.FindSystemTimeZoneById("America/New_York");

            var referralEntryForCalculation = ToReferralEntryForCalculation(referralEntry, locationTimeZone);

            return ReferralCalculations.CalculateReferralStatus(
                policy.ReferralPolicy,
                referralEntryForCalculation,
                DateOnly.FromDateTime(TimeZoneInfo.ConvertTimeFromUtc(DateTime.UtcNow, locationTimeZone))
            );
        }
    }
}

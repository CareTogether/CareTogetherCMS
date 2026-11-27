using System;
using System.Collections.Immutable;
using System.Linq;

namespace CareTogether.Resources.Policies
{
    public static class EffectiveLocationPolicySanitizer
    {
        public static EffectiveLocationPolicy Sanitize(EffectiveLocationPolicy policy)
        {
            var referralPolicy = policy.ReferralPolicy with
            {
                FunctionPolicies = policy
                    .ReferralPolicy.FunctionPolicies?.Select(SanitizeFunctionPolicy)
                    .ToImmutableList(),
                FunctionAssignmentPolicies = policy
                    .ReferralPolicy.FunctionAssignmentPolicies.Select(
                        SanitizeFunctionAssignmentPolicy
                    )
                    .ToImmutableList(),
                ArrangementPolicies = policy
                    .ReferralPolicy.ArrangementPolicies.Select(SanitizeArrangementPolicy)
                    .ToImmutableList(),
            };

            return policy with
            {
                ReferralPolicy = referralPolicy,
                V1ReferralPolicy = policy.V1ReferralPolicy with
                {
                    FunctionAssignmentPolicies = policy
                        .V1ReferralPolicy.FunctionAssignmentPolicies.Select(
                            SanitizeFunctionAssignmentPolicy
                        )
                        .ToImmutableList(),
                },
            };
        }

        private static ArrangementPolicy SanitizeArrangementPolicy(ArrangementPolicy policy) =>
            policy with
            {
                RequiredMonitoringActions_PRE_MIGRATION = MergeMonitoringRules(
                    policy.RequiredMonitoringActions, policy.RequiredMonitoringActionsNew
                ),
                PolicyVersions = policy.PolicyVersions?.Select(version => version with
                {
                    RequiredMonitoringActions_PRE_MIGRATION = MergeMonitoringRules(
                        version.RequiredMonitoringActions, version.RequiredMonitoringActionsNew
                    ),
                    ArrangementFunctions = (version.ArrangementFunctions ?? [])
                        .Select(SanitizeArrangementFunctionMonitoringRules).ToImmutableList(),
                }).ToImmutableList(),
                ArrangementFunctions = policy
                    .ArrangementFunctions.Select(SanitizeArrangementFunctionMonitoringRules).Select(function =>
                        function with
                        {
                            EligiblePeople = RemoveEmptyPeopleOrNull(function.EligiblePeople),
                        }
                    )
                    .ToImmutableList(),
            };

        private static ArrangementFunction SanitizeArrangementFunctionMonitoringRules(
            ArrangementFunction function
        ) =>
            function with
            {
                Variants = (function.Variants ?? []).Select(variant => variant with
                {
                    RequiredMonitoringActions_PRE_MIGRATION = MergeMonitoringRules(
                        variant.RequiredMonitoringActions, variant.RequiredMonitoringActionsNew
                    ),
                }).ToImmutableList(),
            };

        private static ImmutableList<MonitoringRequirement> MergeMonitoringRules(
            ImmutableList<MonitoringRequirementOld> legacy,
            ImmutableList<MonitoringRequirement>? current
        ) =>
            (legacy ?? []).Select(rule => new MonitoringRequirement(
                new RequirementDefinition(rule.ActionName, true), rule.Recurrence
            )).Concat(current ?? []).ToImmutableList();

        private static FunctionPolicy SanitizeFunctionPolicy(FunctionPolicy policy) =>
            policy with { Eligibility = SanitizeFunctionEligibility(policy.Eligibility) };

        private static FunctionAssignmentPolicy SanitizeFunctionAssignmentPolicy(
            FunctionAssignmentPolicy policy
        ) => policy with { Eligibility = SanitizeFunctionAssignmentEligibility(policy.Eligibility) };

        private static FunctionEligibility SanitizeFunctionEligibility(
            FunctionEligibility eligibility
        ) => eligibility with { EligiblePeople = RemoveEmptyPeople(eligibility.EligiblePeople) };

        private static FunctionAssignmentEligibility SanitizeFunctionAssignmentEligibility(
            FunctionAssignmentEligibility eligibility
        ) => eligibility with { EligiblePeople = RemoveEmptyPeople(eligibility.EligiblePeople) };

        private static ImmutableList<Guid> RemoveEmptyPeople(ImmutableList<Guid> people) =>
            people.Where(personId => personId != Guid.Empty).ToImmutableList();

        private static ImmutableList<Guid>? RemoveEmptyPeopleOrNull(ImmutableList<Guid>? people) =>
            people?.Where(personId => personId != Guid.Empty).ToImmutableList();
    }
}

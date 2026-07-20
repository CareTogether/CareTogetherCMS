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
                ArrangementFunctions = policy
                    .ArrangementFunctions.Select(function =>
                        function with
                        {
                            EligiblePeople = RemoveEmptyPeopleOrNull(function.EligiblePeople),
                        }
                    )
                    .ToImmutableList(),
            };

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

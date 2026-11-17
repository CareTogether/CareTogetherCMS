using System.Collections.Generic;
using System.Collections.Immutable;
using System.Linq;

namespace CareTogether.Resources.Policies
{
    /// <summary>
    /// Checks a proposed policy against the arrangement types that existing arrangements use.
    /// Removing (or renaming) an arrangement type that is still in use is an error, because
    /// those arrangements could no longer be evaluated against their policy. Types that are
    /// already missing from the current policy are reported as warnings only, so they do not
    /// block unrelated saves.
    /// </summary>
    public static class ArrangementTypeUsageValidator
    {
        public static readonly PolicyValidationResult NoProblems = new([], []);

        public static bool DefinesAllTypes(
            EffectiveLocationPolicy policy,
            IEnumerable<string> arrangementTypesInUse
        )
        {
            var definedTypes = ArrangementTypes(policy);
            return arrangementTypesInUse.All(definedTypes.Contains);
        }

        public static PolicyValidationResult Validate(
            EffectiveLocationPolicy currentPolicy,
            EffectiveLocationPolicy proposedPolicy,
            IEnumerable<string> arrangementTypesInUse
        )
        {
            var currentTypes = ArrangementTypes(currentPolicy);
            var proposedTypes = ArrangementTypes(proposedPolicy);

            var missingTypeCounts = arrangementTypesInUse
                .Where(type => !proposedTypes.Contains(type))
                .GroupBy(type => type)
                .OrderBy(group => group.Key)
                .Select(group => (Type: group.Key, Count: group.Count()))
                .ToImmutableList();

            var errors = missingTypeCounts
                .Where(item => currentTypes.Contains(item.Type))
                .Select(item =>
                    $"The arrangement type '{item.Type}' cannot be removed or renamed because {ArrangementsUse(item.Count)} it."
                )
                .ToImmutableList();

            var warnings = missingTypeCounts
                .Where(item => !currentTypes.Contains(item.Type))
                .Select(item =>
                    $"{ArrangementsUse(item.Count)} the arrangement type '{item.Type}', which is not in the case policy. Add it back so their requirements are tracked."
                )
                .ToImmutableList();

            return new PolicyValidationResult(errors, warnings);
        }

        public static PolicyValidationResult Merge(
            PolicyValidationResult first,
            PolicyValidationResult second
        ) =>
            new(first.Errors.AddRange(second.Errors), first.Warnings.AddRange(second.Warnings));

        private static ImmutableHashSet<string> ArrangementTypes(EffectiveLocationPolicy policy) =>
            (policy.ReferralPolicy?.ArrangementPolicies ?? ImmutableList<ArrangementPolicy>.Empty)
                .Select(arrangementPolicy => arrangementPolicy.ArrangementType)
                .ToImmutableHashSet();

        private static string ArrangementsUse(int count) =>
            count == 1 ? "1 existing arrangement uses" : $"{count} existing arrangements use";
    }
}

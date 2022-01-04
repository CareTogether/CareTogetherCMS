using CareTogether.Resources;
using System;
using System.Collections.Generic;
using System.Collections.Immutable;
using System.Linq;

namespace CareTogether.Core.Test.ApprovalCalculationTests
{
    internal class Helpers
    {
        public static ImmutableList<CompletedRequirementInfo> Completed(params (string, int)[] completionsWithDates) =>
            completionsWithDates.Select(completion =>
                new CompletedRequirementInfo(Guid.Empty, DateTime.MinValue,
                    Guid.Empty, completion.Item1, new DateTime(2022, 1, completion.Item2), null))
            .ToImmutableList();

        public static ImmutableList<ExemptedRequirementInfo> Exempted(params (string, int?)[] exemptionsWithExpirations) =>
            exemptionsWithExpirations.Select(exemption =>
                new ExemptedRequirementInfo(Guid.Empty, DateTime.MinValue,
                    exemption.Item1, "", exemption.Item2.HasValue ? new DateTime(2022, 1, exemption.Item2.Value) : null))
            .ToImmutableList();

        public static ImmutableList<RemovedRole> Removed(params string[] removedRoles) =>
            removedRoles.Select(removed =>
                new RemovedRole(removed, RoleRemovalReason.OptOut, null))
            .ToImmutableList();

        public static
            ImmutableDictionary<Guid, ImmutableList<CompletedRequirementInfo>>
            CompletedIndividualRequirements(params (Guid, string, int)[] completedIndividualRequirements) =>
            ImmutableDictionary<Guid, ImmutableList<CompletedRequirementInfo>>.Empty.AddRange(
                completedIndividualRequirements
                    .GroupBy(completed => completed.Item1, completed => (completed.Item2, new DateTime(2022, 1, completed.Item3)))
                    .Select(completed => new KeyValuePair<Guid, ImmutableList<CompletedRequirementInfo>>(completed.Key,
                        completed.Select(c => new CompletedRequirementInfo(Guid.Empty, DateTime.MinValue, new Guid(),
                            c.Item1, c.Item2, null))
                        .ToImmutableList())));

        public static
            ImmutableDictionary<Guid, ImmutableList<ExemptedRequirementInfo>>
            ExemptedIndividualRequirements(params (Guid, string, int?)[] exemptedIndividualRequirements) =>
            ImmutableDictionary<Guid, ImmutableList<ExemptedRequirementInfo>>.Empty.AddRange(
                exemptedIndividualRequirements
                    .GroupBy(exempted => exempted.Item1, exempted => exempted)
                    .Select(exempted => new KeyValuePair<Guid, ImmutableList<ExemptedRequirementInfo>>(exempted.Key,
                        exempted.Select(e => new ExemptedRequirementInfo(Guid.Empty, DateTime.MinValue,
                            e.Item2, "", e.Item3.HasValue ? new DateTime(2022, 1, e.Item3.Value) : null))
                            .ToImmutableList())));

        public static
            ImmutableDictionary<Guid, ImmutableList<RemovedRole>>
            RemovedIndividualRoles(params (Guid, string)[] removedIndividualRoles) =>
            ImmutableDictionary<Guid, ImmutableList<RemovedRole>>.Empty.AddRange(
                removedIndividualRoles
                    .GroupBy(removed => removed.Item1, removed => removed.Item2)
                    .Select(removed => new KeyValuePair<Guid, ImmutableList<RemovedRole>>(removed.Key,
                        removed.Select(r => new RemovedRole(r, RoleRemovalReason.OptOut, AdditionalComments: null))
                        .ToImmutableList())));

        public static
            ImmutableList<(Guid Id, ImmutableList<CompletedRequirementInfo> CompletedRequirements, ImmutableList<ExemptedRequirementInfo> ExemptedRequirements)>
            ActiveAdults(params (Guid, ImmutableList<CompletedRequirementInfo>, ImmutableList<ExemptedRequirementInfo>)[] activeAdults) =>
                activeAdults.ToImmutableList();

        public static
            ImmutableList<(string ActionName, RequirementStage Stage, VolunteerFamilyRequirementScope Scope, bool RequirementMetOrExempted, List<Guid> RequirementMissingForIndividuals)>
            FamilyRequirementsMet(params (string, RequirementStage, VolunteerFamilyRequirementScope, bool, List<Guid>)[] requirementsMet) =>
            requirementsMet.ToImmutableList();

        public static
            ImmutableList<(string ActionName, RequirementStage Stage, bool RequirementMetOrExempted)>
            IndividualRequirementsMet(params (string, RequirementStage, bool)[] requirementsMet) =>
            requirementsMet.ToImmutableList();

        public static ImmutableList<VolunteerApprovalRequirement> IndividualApprovalRequirements(params (RequirementStage, string)[] requirements) =>
            requirements.Select(requirement =>
                new VolunteerApprovalRequirement(requirement.Item1, requirement.Item2))
            .ToImmutableList();

        public static ImmutableList<VolunteerFamilyApprovalRequirement> FamilyApprovalRequirements(params (RequirementStage, string, VolunteerFamilyRequirementScope)[] requirements) =>
            requirements.Select(requirement =>
                new VolunteerFamilyApprovalRequirement(requirement.Item1, requirement.Item2, requirement.Item3))
            .ToImmutableList();
    }
}

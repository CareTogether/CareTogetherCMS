using CareTogether.Resources;
using System;
using System.Collections.Immutable;
using System.Linq;

namespace CareTogether.Core.Test.ApprovalCalculationTests
{
    internal class Helpers
    {
        public static VolunteerRolePolicyVersion individualPolicyV1 = new VolunteerRolePolicyVersion("v1", new DateTime(2022, 1, 10),
            ImmutableList<VolunteerApprovalRequirement>.Empty
            .Add(new VolunteerApprovalRequirement(RequirementStage.Application, "Apply"))
            .Add(new VolunteerApprovalRequirement(RequirementStage.Approval, "Background Check v1"))
            .Add(new VolunteerApprovalRequirement(RequirementStage.Approval, "Training"))
            .Add(new VolunteerApprovalRequirement(RequirementStage.Onboarding, "Add to Mailing List"))
            .Add(new VolunteerApprovalRequirement(RequirementStage.Onboarding, "Activate")));

        public static VolunteerRolePolicyVersion individualPolicyV2 = new VolunteerRolePolicyVersion("v2", null,
            ImmutableList<VolunteerApprovalRequirement>.Empty
            .Add(new VolunteerApprovalRequirement(RequirementStage.Application, "Apply"))
            .Add(new VolunteerApprovalRequirement(RequirementStage.Approval, "Background Check v2"))
            .Add(new VolunteerApprovalRequirement(RequirementStage.Approval, "Training"))
            .Add(new VolunteerApprovalRequirement(RequirementStage.Onboarding, "Add to Mailing List"))
            .Add(new VolunteerApprovalRequirement(RequirementStage.Onboarding, "Activate")));


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
    }
}

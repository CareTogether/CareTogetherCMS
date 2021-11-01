using CareTogether.Resources;
using System;
using System.Collections.Immutable;
using System.Threading.Tasks;

namespace CareTogether.Engines
{
    public sealed record VolunteerFamilyApprovalStatus(
        ImmutableDictionary<string, ImmutableList<RoleVersionApproval>> FamilyRoleApprovals,
        ImmutableList<string> MissingFamilyRequirements,
        ImmutableList<string> AvailableFamilyApplications,
        ImmutableDictionary<Guid, VolunteerApprovalStatus> IndividualVolunteers);

    public sealed record VolunteerApprovalStatus(
        ImmutableDictionary<string, ImmutableList<RoleVersionApproval>> IndividualRoleApprovals,
        ImmutableList<string> MissingIndividualRequirements,
        ImmutableList<string> AvailableIndividualApplications);

    public sealed record RoleVersionApproval(string Version, RoleApprovalStatus ApprovalStatus);

    public interface IPolicyEvaluationEngine
    {
        Task<VolunteerFamilyApprovalStatus> CalculateVolunteerFamilyApprovalStatusAsync(
            Guid organizationId, Guid locationId, Family family,
            ImmutableList<CompletedRequirementInfo> completedFamilyRequirements,
            ImmutableDictionary<Guid, ImmutableList<CompletedRequirementInfo>> completedIndividualRequirements);
    }
}

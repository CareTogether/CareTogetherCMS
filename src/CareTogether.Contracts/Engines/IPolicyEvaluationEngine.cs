using CareTogether.Resources;
using System;
using System.Collections.Immutable;
using System.Threading.Tasks;

namespace CareTogether.Engines
{
    public sealed record VolunteerFamilyApprovalStatus(
        ImmutableDictionary<string, ImmutableList<RoleVersionApproval>> FamilyRoleApprovals,
        ImmutableList<RemovedRole> RemovedFamilyRoles,
        ImmutableList<string> MissingFamilyRequirements,
        ImmutableList<string> AvailableFamilyApplications,
        ImmutableDictionary<Guid, VolunteerApprovalStatus> IndividualVolunteers);

    public sealed record VolunteerApprovalStatus(
        ImmutableDictionary<string, ImmutableList<RoleVersionApproval>> IndividualRoleApprovals,
        ImmutableList<RemovedRole> RemovedIndividualRoles,
        ImmutableList<string> MissingIndividualRequirements,
        ImmutableList<string> AvailableIndividualApplications);

    public sealed record RoleVersionApproval(string Version, RoleApprovalStatus ApprovalStatus);

    public enum RoleApprovalStatus { Prospective, Approved, Onboarded };

    public sealed record ReferralStatus(
        ImmutableList<string> MissingIntakeRequirements,
        ImmutableDictionary<Guid, ArrangementStatus> IndividualArrangements);

    public sealed record ArrangementStatus(
        ArrangementPhase Phase,
        ImmutableList<string> MissingRequirements);

    public enum ArrangementPhase { SettingUp, ReadyToStart, Started, Ended };

    public interface IPolicyEvaluationEngine
    {
        //TODO: Merge this with the CombinedFamilyInfoFormatter logic
        Task<VolunteerFamilyApprovalStatus> CalculateVolunteerFamilyApprovalStatusAsync(
            Guid organizationId, Guid locationId, Family family,
            ImmutableList<CompletedRequirementInfo> completedFamilyRequirements,
            ImmutableList<RemovedRole> removedFamilyRoles,
            ImmutableDictionary<Guid, ImmutableList<CompletedRequirementInfo>> completedIndividualRequirements,
            ImmutableDictionary<Guid, ImmutableList<RemovedRole>> removedIndividualRoles);

        Task<ReferralStatus> CalculateReferralStatusAsync(
            Guid organizationId, Guid locationId, Family family,
            ReferralEntry referralEntry);
    }
}

using CareTogether.Resources;
using CareTogether.Resources.Approvals;
using CareTogether.Resources.Directory;
using CareTogether.Resources.Referrals;
using System;
using System.Collections.Immutable;
using System.Threading.Tasks;

namespace CareTogether.Engines.PolicyEvaluation
{
    public sealed record VolunteerFamilyApprovalStatus(
        ImmutableDictionary<string, ImmutableList<RoleVersionApproval>> FamilyRoleApprovals,
        ImmutableDictionary<string, RoleVersionApproval> EffectiveFamilyRoleApprovals,
        ImmutableList<RemovedRole> RemovedFamilyRoles,
        ImmutableList<string> MissingFamilyRequirements,
        ImmutableList<string> AvailableFamilyApplications,
        ImmutableDictionary<Guid, VolunteerApprovalStatus> IndividualVolunteers);

    public sealed record VolunteerApprovalStatus(
        ImmutableDictionary<string, ImmutableList<RoleVersionApproval>> IndividualRoleApprovals,
        ImmutableDictionary<string, RoleVersionApproval> EffectiveIndividualRoleApprovals,
        ImmutableList<RemovedRole> RemovedIndividualRoles,
        ImmutableList<string> MissingIndividualRequirements,
        ImmutableList<string> AvailableIndividualApplications);

    public sealed record ReferralStatus(
        ImmutableList<string> MissingIntakeRequirements,
        ImmutableList<string> MissingCustomFields,
        ImmutableDictionary<Guid, ArrangementStatus> IndividualArrangements);

    public sealed record ArrangementStatus(
        ArrangementPhase Phase,
        ImmutableList<MissingArrangementRequirement> MissingRequirements);

    public sealed record MissingArrangementRequirement(
        string? ArrangementFunction, string? ArrangementFunctionVariant,
        Guid? VolunteerFamilyId, Guid? PersonId,
        string ActionName, DateTime? DueBy, DateTime? PastDueSince);

    public enum ArrangementPhase { SettingUp, ReadyToStart, Started, Ended, Cancelled };

    public interface IPolicyEvaluationEngine
    {
        //TODO: Merge this with the CombinedFamilyInfoFormatter logic
        Task<VolunteerFamilyApprovalStatus> CalculateVolunteerFamilyApprovalStatusAsync(
            Guid organizationId, Guid locationId, Family family,
            ImmutableList<CompletedRequirementInfo> completedFamilyRequirements,
            ImmutableList<ExemptedRequirementInfo> exemptedFamilyRequirements,
            ImmutableList<RemovedRole> removedFamilyRoles,
            ImmutableDictionary<Guid, ImmutableList<CompletedRequirementInfo>> completedIndividualRequirements,
            ImmutableDictionary<Guid, ImmutableList<ExemptedRequirementInfo>> exemptedIndividualRequirements,
            ImmutableDictionary<Guid, ImmutableList<RemovedRole>> removedIndividualRoles);

        Task<ReferralStatus> CalculateReferralStatusAsync(
            Guid organizationId, Guid locationId, Family family,
            ReferralEntry referralEntry);
    }
}

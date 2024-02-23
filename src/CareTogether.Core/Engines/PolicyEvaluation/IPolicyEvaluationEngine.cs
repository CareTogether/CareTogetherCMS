using CareTogether.Resources;
using CareTogether.Resources.Approvals;
using CareTogether.Resources.Directory;
using CareTogether.Resources.Policies;
using CareTogether.Resources.Referrals;
using System;
using System.Collections.Immutable;
using System.Linq;
using System.Text.Json.Serialization;
using System.Threading.Tasks;
using Timelines;

namespace CareTogether.Engines.PolicyEvaluation
{
    public sealed record FamilyApprovalStatus(
        ImmutableDictionary<Guid, IndividualApprovalStatus> IndividualApprovals,
        ImmutableDictionary<string, FamilyRoleApprovalStatus> FamilyRoleApprovals)
    {
        public ImmutableList<string> CurrentMissingFamilyRequirements =>
            FamilyRoleApprovals
                .SelectMany(r => r.Value.CurrentMissingFamilyRequirements)
                .Distinct()
                .ToImmutableList();

        public ImmutableList<string> CurrentAvailableFamilyApplications =>
            FamilyRoleApprovals
                .SelectMany(r => r.Value.CurrentAvailableFamilyApplications)
                .Distinct()
                .ToImmutableList();

        public ImmutableList<(Guid PersonId, string ActionName)> CurrentMissingIndividualRequirements =>
            FamilyRoleApprovals
                .SelectMany(fra => fra.Value.CurrentMissingIndividualRequirements)
                .Concat(IndividualApprovals
                    .SelectMany(ia => ia.Value.CurrentMissingRequirements
                        .Select(r => (PersonId: ia.Key, ActionName: r))))
                .Distinct()
                .ToImmutableList();

        public ImmutableList<(Guid PersonId, string ActionName)> CurrentAvailableIndividualApplications =>
            IndividualApprovals
                .SelectMany(ia => ia.Value.CurrentAvailableApplications
                    .Select(r => (PersonId: ia.Key, ActionName: r)))
                .Distinct()
                .ToImmutableList();
    }

    public sealed record IndividualApprovalStatus(
        ImmutableDictionary<string, IndividualRoleApprovalStatus> ApprovalStatusByRole)
    {
        [JsonIgnore]
        [Newtonsoft.Json.JsonIgnore]
        public ImmutableList<string> CurrentMissingRequirements =>
            ApprovalStatusByRole
                .SelectMany(r => r.Value.CurrentMissingRequirements)
                .Distinct()
                .ToImmutableList();

        [JsonIgnore]
        [Newtonsoft.Json.JsonIgnore]
        public ImmutableList<string> CurrentAvailableApplications =>
            ApprovalStatusByRole
                .SelectMany(r => r.Value.CurrentAvailableApplications)
                .Distinct()
                .ToImmutableList();
    }

    public sealed record IndividualRoleApprovalStatus(
        DateOnlyTimeline<RoleApprovalStatus>? EffectiveRoleApprovalStatus,
        ImmutableList<IndividualRoleVersionApprovalStatus> RoleVersionApprovals)
    {
        public RoleApprovalStatus? CurrentStatus =>
            EffectiveRoleApprovalStatus?.ValueAt(DateTime.UtcNow);

        public ImmutableList<string> CurrentMissingRequirements =>
            RoleVersionApprovals
                // The following filter selects only the "effective" version(s),
                // allowing the 'EffectiveRoleApprovalStatus' calculation to take
                // care of all the tricky decisions like which status takes precedence.
                // If multiple versions contribute to the current status, we can show
                // the requirements from all of them, and this will dynamically update
                // as the requirements for some versions are met.
                .Where(r => r.CurrentStatus == CurrentStatus)
                .SelectMany(r => r.CurrentMissingRequirements)
                .Select(r => r.ActionName)
                .ToImmutableList();

        public ImmutableList<string> CurrentAvailableApplications =>
            RoleVersionApprovals
                .Where(r => r.CurrentStatus == null && CurrentStatus == null)
                .SelectMany(r => r.CurrentAvailableApplications)
                .Select(r => r.ActionName)
                .ToImmutableList();
    }

    public sealed record IndividualRoleVersionApprovalStatus(string Version,
        DateOnlyTimeline<RoleApprovalStatus>? Status,
        ImmutableList<IndividualRoleRequirementCompletionStatus> Requirements)
    {
        [JsonIgnore]
        [Newtonsoft.Json.JsonIgnore]
        public RoleApprovalStatus? CurrentStatus =>
            Status?.ValueAt(DateTime.UtcNow);

        [JsonIgnore]
        [Newtonsoft.Json.JsonIgnore]
        public ImmutableList<IndividualRoleRequirementCompletionStatus> CurrentMissingRequirements =>
            Requirements
                .Where(r =>
                    (r.Stage == RequirementStage.Approval && CurrentStatus == RoleApprovalStatus.Prospective) ||
                    (r.Stage == RequirementStage.Onboarding && CurrentStatus == RoleApprovalStatus.Approved))
                .Where(r => r.WhenMet?.Contains(DateOnly.FromDateTime(DateTime.UtcNow)) != true)
                .ToImmutableList();

        [JsonIgnore]
        [Newtonsoft.Json.JsonIgnore]
        public ImmutableList<IndividualRoleRequirementCompletionStatus> CurrentAvailableApplications =>
            Requirements
                .Where(r => r.Stage == RequirementStage.Application && CurrentStatus == null)
                .Where(r => r.WhenMet?.Contains(DateOnly.FromDateTime(DateTime.UtcNow)) != true)
                .ToImmutableList();
    }

    public sealed record IndividualRoleRequirementCompletionStatus(string ActionName,
        RequirementStage Stage, DateOnlyTimeline? WhenMet);

    public sealed record FamilyRoleApprovalStatus(
        DateOnlyTimeline<RoleApprovalStatus>? EffectiveRoleApprovalStatus,
        ImmutableList<FamilyRoleVersionApprovalStatus> RoleVersionApprovals)
    {
        public RoleApprovalStatus? CurrentStatus =>
            EffectiveRoleApprovalStatus?.ValueAt(DateTime.UtcNow);

        public ImmutableList<string> CurrentMissingFamilyRequirements =>
            RoleVersionApprovals
                // The following filter selects only the "effective" version(s),
                // allowing the 'EffectiveRoleApprovalStatus' calculation to take
                // care of all the tricky decisions like which status takes precedence.
                // If multiple versions contribute to the current status, we can show
                // the requirements from all of them, and this will dynamically update
                // as the requirements for some versions are met.
                .Where(r => r.CurrentStatus == CurrentStatus)
                .SelectMany(r => r.CurrentMissingRequirements)
                .Where(r => r.Scope == VolunteerFamilyRequirementScope.OncePerFamily)
                .Select(r => r.ActionName)
                .ToImmutableList();

        public ImmutableList<string> CurrentAvailableFamilyApplications =>
            RoleVersionApprovals
                .Where(r => r.CurrentStatus == null && CurrentStatus == null)
                .SelectMany(r => r.CurrentAvailableApplications)
                .Where(r => r.Scope == VolunteerFamilyRequirementScope.OncePerFamily)
                .Select(r => r.ActionName)
                .ToImmutableList();

        public ImmutableList<(Guid PersonId, string ActionName)> CurrentMissingIndividualRequirements =>
            RoleVersionApprovals
                .Where(r => r.CurrentStatus == CurrentStatus)
                .SelectMany(r => r.CurrentMissingRequirements)
                .Where(r => r.Scope == VolunteerFamilyRequirementScope.AllAdultsInTheFamily ||
                    r.Scope == VolunteerFamilyRequirementScope.AllParticipatingAdultsInTheFamily)
                .SelectMany(r => r.StatusDetails
                    .Where(sd => !(sd.WhenMet?.Contains(DateOnly.FromDateTime(DateTime.UtcNow)) ?? false))
                    .Select(sd => (sd.PersonId!.Value, r.ActionName)))
                .ToImmutableList();
    }

    public sealed record FamilyRoleVersionApprovalStatus(string Version,
        DateOnlyTimeline<RoleApprovalStatus>? Status,
        ImmutableList<FamilyRoleRequirementCompletionStatus> Requirements)
    {
        [JsonIgnore]
        [Newtonsoft.Json.JsonIgnore]
        public RoleApprovalStatus? CurrentStatus =>
            Status?.ValueAt(DateTime.UtcNow);

        [JsonIgnore]
        [Newtonsoft.Json.JsonIgnore]
        public ImmutableList<FamilyRoleRequirementCompletionStatus> CurrentMissingRequirements =>
            Requirements
                .Where(r =>
                    (r.Stage == RequirementStage.Approval && CurrentStatus == RoleApprovalStatus.Prospective) ||
                    (r.Stage == RequirementStage.Onboarding && CurrentStatus == RoleApprovalStatus.Approved))
                .Where(r => r.WhenMet?.Contains(DateOnly.FromDateTime(DateTime.UtcNow)) != true)
                .ToImmutableList();

        [JsonIgnore]
        [Newtonsoft.Json.JsonIgnore]
        public ImmutableList<FamilyRoleRequirementCompletionStatus> CurrentAvailableApplications =>
            Requirements
                .Where(r => r.Stage == RequirementStage.Application && CurrentStatus == null)
                .Where(r => r.WhenMet?.Contains(DateOnly.FromDateTime(DateTime.UtcNow)) != true)
                .ToImmutableList();
    }

    public sealed record FamilyRoleRequirementCompletionStatus(string ActionName,
        RequirementStage Stage, VolunteerFamilyRequirementScope Scope, DateOnlyTimeline? WhenMet,
        ImmutableList<FamilyRequirementStatusDetail> StatusDetails);

    public sealed record FamilyRequirementStatusDetail(
        Guid? PersonId, DateOnlyTimeline? WhenMet);

    public enum RoleApprovalStatus
    {
        Prospective = 0,
        Expired = 1,
        Approved = 2,
        Onboarded = 3,
        Inactive = 4,
        Denied = 5
    };

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
        Task<FamilyApprovalStatus> CalculateCombinedFamilyApprovalsAsync(
            Guid organizationId, Guid locationId, Family family,
            ImmutableList<CompletedRequirementInfo> completedFamilyRequirements,
            ImmutableList<ExemptedRequirementInfo> exemptedFamilyRequirements,
            ImmutableList<RoleRemoval> familyRoleRemovals,
            ImmutableDictionary<Guid, ImmutableList<CompletedRequirementInfo>> completedIndividualRequirements,
            ImmutableDictionary<Guid, ImmutableList<ExemptedRequirementInfo>> exemptedIndividualRequirements,
            ImmutableDictionary<Guid, ImmutableList<RoleRemoval>> individualRoleRemovals);

        Task<ReferralStatus> CalculateReferralStatusAsync(
            Guid organizationId, Guid locationId, Family family,
            ReferralEntry referralEntry);
    }
}

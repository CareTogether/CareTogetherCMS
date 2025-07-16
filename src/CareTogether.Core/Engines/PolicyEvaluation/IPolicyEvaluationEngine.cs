using System;
using System.Collections.Immutable;
using System.Linq;
using System.Text.Json.Serialization;
using System.Threading.Tasks;
using CareTogether.Resources;
using CareTogether.Resources.Approvals;
using CareTogether.Resources.Directory;
using CareTogether.Resources.Policies;
using CareTogether.Resources.Referrals;
using Timelines;

namespace CareTogether.Engines.PolicyEvaluation
{
    public sealed record FamilyApprovalStatus(
        ImmutableDictionary<Guid, IndividualApprovalStatus> IndividualApprovals,
        ImmutableDictionary<string, FamilyRoleApprovalStatus> FamilyRoleApprovals
    )
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

        public ImmutableList<(
            Guid PersonId,
            string ActionName,
            string? Version
        )> CurrentMissingIndividualRequirements =>
            FamilyRoleApprovals
                .SelectMany(fra => fra.Value.CurrentMissingIndividualRequirements)
                .Concat(
                    IndividualApprovals.SelectMany(ia =>
                        ia.Value.CurrentMissingRequirements.Select(r =>
                            (PersonId: ia.Key, ActionName: r.ActionName, Version: r.Version)
                        )
                    )
                )
                .Distinct()
                .ToImmutableList();

        public ImmutableList<(
            Guid PersonId,
            string ActionName
        )> CurrentAvailableIndividualApplications =>
            IndividualApprovals
                .SelectMany(ia =>
                    ia.Value.CurrentAvailableApplications.Select(r =>
                        (PersonId: ia.Key, ActionName: r)
                    )
                )
                .Distinct()
                .ToImmutableList();
    }

    public sealed record IndividualApprovalStatus(
        ImmutableDictionary<string, IndividualRoleApprovalStatus> ApprovalStatusByRole
    )
    {
        [JsonIgnore]
        [Newtonsoft.Json.JsonIgnore]
        public ImmutableList<(string ActionName, string? Version)> CurrentMissingRequirements =>
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
        ImmutableList<IndividualRoleVersionApprovalStatus> RoleVersionApprovals
    )
    {
        public RoleApprovalStatus? CurrentStatus =>
            EffectiveRoleApprovalStatus?.ValueAt(DateTime.UtcNow);

        public ImmutableList<(string ActionName, string? Version)> CurrentMissingRequirements
        {
            get
            {
                var allMissingVersionsByItem = RoleVersionApprovals
                    .SelectMany(r =>
                        r.CurrentMissingRequirements.Select(cmr => (cmr.ActionName, r.Version))
                    )
                    .ToImmutableList()
                    .GroupBy(r => r.ActionName, r => r.Version)
                    .ToImmutableList();

                var allPolicyVersions = RoleVersionApprovals
                    .Select(r => r.Version)
                    .ToImmutableList();

                // If the item is missing in all versions, return it once without a version annotation.
                // If it is only missing in some versions, return each version-specific result.
                var simplifiedResult = allMissingVersionsByItem
                    .SelectMany(versionsByAction =>
                        allPolicyVersions.All(policyVersion =>
                            versionsByAction.Contains(policyVersion)
                        )
                            ? [(versionsByAction.Key, null)]
                            : versionsByAction.Select(version => (versionsByAction.Key, version))
                    )
                    .ToImmutableList();

                return simplifiedResult;
            }
        }

        public ImmutableList<string> CurrentAvailableApplications =>
            RoleVersionApprovals
                .Where(r => r.CurrentStatus == null && CurrentStatus == null)
                .SelectMany(r => r.CurrentAvailableApplications)
                .Select(r => r.ActionName)
                .ToImmutableList();
    }

    public sealed record IndividualRoleVersionApprovalStatus(
        string Version,
        DateOnlyTimeline<RoleApprovalStatus>? Status,
        ImmutableList<IndividualRoleRequirementCompletionStatus> Requirements
    )
    {
        [JsonIgnore]
        [Newtonsoft.Json.JsonIgnore]
        public RoleApprovalStatus? CurrentStatus => Status?.ValueAt(DateTime.UtcNow);

        [JsonIgnore]
        [Newtonsoft.Json.JsonIgnore]
        public ImmutableList<IndividualRoleRequirementCompletionStatus> CurrentMissingRequirements =>
            Requirements
                .Where(r =>
                    (
                        r.Stage == RequirementStage.Approval
                        && (
                            CurrentStatus == RoleApprovalStatus.Prospective
                            || CurrentStatus == RoleApprovalStatus.Expired
                        )
                    )
                    || (
                        r.Stage == RequirementStage.Onboarding
                        && (
                            CurrentStatus == RoleApprovalStatus.Approved
                            || CurrentStatus == RoleApprovalStatus.Expired
                        )
                    )
                )
                .Where(r => r.WhenMet?.Contains(DateOnly.FromDateTime(DateTime.UtcNow)) != true)
                .ToImmutableList();

        [JsonIgnore]
        [Newtonsoft.Json.JsonIgnore]
        public ImmutableList<IndividualRoleRequirementCompletionStatus> CurrentAvailableApplications =>
            Requirements
                .Where(r =>
                    r.Stage == RequirementStage.Application
                    && (CurrentStatus == null || CurrentStatus == RoleApprovalStatus.Expired)
                )
                .Where(r => r.WhenMet?.Contains(DateOnly.FromDateTime(DateTime.UtcNow)) != true)
                .ToImmutableList();
    }

    public sealed record IndividualRoleRequirementCompletionStatus(
        string ActionName,
        RequirementStage Stage,
        DateOnlyTimeline? WhenMet
    );

    public sealed record FamilyRoleApprovalStatus(
        DateOnlyTimeline<RoleApprovalStatus>? EffectiveRoleApprovalStatus,
        ImmutableList<FamilyRoleVersionApprovalStatus> RoleVersionApprovals
    )
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

        public ImmutableList<(
            Guid PersonId,
            string ActionName,
            string? Version
        )> CurrentMissingIndividualRequirements
        {
            get
            {
                var allVersionMissingItemsByPerson = RoleVersionApprovals
                    .SelectMany(r =>
                        r.CurrentMissingRequirements.Where(cmr =>
                                cmr.Scope == VolunteerFamilyRequirementScope.AllAdultsInTheFamily
                                || cmr.Scope
                                    == VolunteerFamilyRequirementScope.AllParticipatingAdultsInTheFamily
                            )
                            .SelectMany(cmr =>
                                cmr.StatusDetails.Where(sd =>
                                        !(
                                            sd.WhenMet?.Contains(
                                                DateOnly.FromDateTime(DateTime.UtcNow)
                                            ) ?? false
                                        )
                                    )
                                    .Select(sd =>
                                        (PersonId: sd.PersonId!.Value, cmr.ActionName, r.Version)
                                    )
                            )
                    )
                    .ToImmutableList()
                    .GroupBy(r => r.PersonId)
                    .Select(r => new
                    {
                        PersonId = r.Key,
                        Actions = r.GroupBy(a => a.ActionName, a => a.Version).ToImmutableList(),
                    })
                    .ToImmutableList();

                var allPolicyVersions = RoleVersionApprovals
                    .Select(r => r.Version)
                    .ToImmutableList();

                // If the item is missing in all versions for a given person, return it once without a version annotation.
                // If it is only missing in some versions for a given person, return each version-specific result.
                var simplifiedResult = allVersionMissingItemsByPerson
                    .SelectMany(actionsByPerson =>
                        actionsByPerson.Actions.SelectMany(versionsByAction =>
                            allPolicyVersions.All(policyVersion =>
                                versionsByAction.Contains(policyVersion)
                            )
                                ? [(actionsByPerson.PersonId, versionsByAction.Key, null)]
                                : versionsByAction.Select(version =>
                                    (actionsByPerson.PersonId, versionsByAction.Key, version)
                                )
                        )
                    )
                    .ToImmutableList();

                return simplifiedResult;
            }
        }
    }

    public sealed record FamilyRoleVersionApprovalStatus(
        string Version,
        DateOnlyTimeline<RoleApprovalStatus>? Status,
        ImmutableList<FamilyRoleRequirementCompletionStatus> Requirements
    )
    {
        [JsonIgnore]
        [Newtonsoft.Json.JsonIgnore]
        public RoleApprovalStatus? CurrentStatus => Status?.ValueAt(DateTime.UtcNow);

        [JsonIgnore]
        [Newtonsoft.Json.JsonIgnore]
        public ImmutableList<FamilyRoleRequirementCompletionStatus> CurrentMissingRequirements =>
            Requirements
                .Where(r =>
                    (
                        r.Stage == RequirementStage.Approval
                        && (
                            CurrentStatus == RoleApprovalStatus.Prospective
                            || CurrentStatus == RoleApprovalStatus.Expired
                        )
                    )
                    || (
                        r.Stage == RequirementStage.Onboarding
                        && (
                            CurrentStatus == RoleApprovalStatus.Approved
                            || CurrentStatus == RoleApprovalStatus.Expired
                        )
                    )
                )
                .Where(r => r.WhenMet?.Contains(DateOnly.FromDateTime(DateTime.UtcNow)) != true)
                .ToImmutableList();

        [JsonIgnore]
        [Newtonsoft.Json.JsonIgnore]
        public ImmutableList<FamilyRoleRequirementCompletionStatus> CurrentAvailableApplications =>
            Requirements
                .Where(r =>
                    r.Stage == RequirementStage.Application
                    && (CurrentStatus == null || CurrentStatus == RoleApprovalStatus.Expired)
                )
                .Where(r => r.WhenMet?.Contains(DateOnly.FromDateTime(DateTime.UtcNow)) != true)
                .ToImmutableList();
    }

    public sealed record FamilyRoleRequirementCompletionStatus(
        string ActionName,
        RequirementStage Stage,
        VolunteerFamilyRequirementScope Scope,
        DateOnlyTimeline? WhenMet,
        ImmutableList<FamilyRequirementStatusDetail> StatusDetails
    );

    public sealed record FamilyRequirementStatusDetail(Guid? PersonId, DateOnlyTimeline? WhenMet);

    public enum RoleApprovalStatus
    {
        Prospective = 1,
        Expired = 2,
        Approved = 3,
        Onboarded = 4,
        Inactive = 5,
        Denied = 6,
    };


    public sealed record MissingRequirement(string ActionName, bool IsRequired);

    public sealed record ReferralStatus(
        ImmutableList<MissingRequirement> MissingIntakeRequirements,
        ImmutableList<string> MissingCustomFields,
        ImmutableDictionary<Guid, ArrangementStatus> IndividualArrangements
    );

    public sealed record ArrangementStatus(
        ArrangementPhase Phase,
        ImmutableList<MissingArrangementRequirement> MissingRequirements,
        ImmutableList<MissingArrangementRequirement> MissingOptionalRequirements
    );

    public sealed record MissingArrangementRequirement(
        string? ArrangementFunction,
        string? ArrangementFunctionVariant,
        Guid? VolunteerFamilyId,
        Guid? PersonId,
        RequirementDefinition Action,
        DateOnly? DueBy,
        DateOnly? PastDueSince
    );

    public enum ArrangementPhase
    {
        SettingUp,
        ReadyToStart,
        Started,
        Ended,
        Cancelled,
    };

    public interface IPolicyEvaluationEngine
    {
        //TODO: Merge this with the CombinedFamilyInfoFormatter logic
        Task<FamilyApprovalStatus> CalculateCombinedFamilyApprovalsAsync(
            Guid organizationId,
            Guid locationId,
            Family family,
            ImmutableList<Resources.CompletedRequirementInfo> completedFamilyRequirements,
            ImmutableList<Resources.ExemptedRequirementInfo> exemptedFamilyRequirements,
            ImmutableList<RoleRemoval> familyRoleRemovals,
            ImmutableDictionary<
                Guid,
                ImmutableList<Resources.CompletedRequirementInfo>
            > completedIndividualRequirements,
            ImmutableDictionary<
                Guid,
                ImmutableList<Resources.ExemptedRequirementInfo>
            > exemptedIndividualRequirements,
            ImmutableDictionary<Guid, ImmutableList<RoleRemoval>> individualRoleRemovals
        );

        Task<ReferralStatus> CalculateReferralStatusAsync(
            Guid organizationId,
            Guid locationId,
            Family family,
            Resources.Referrals.ReferralEntry referralEntry
        );
    }
}

using System;
using System.Collections.Generic;
using System.Collections.Immutable;
using System.Linq;
using System.Text.Json.Serialization;
using System.Threading.Tasks;
using CareTogether.Resources;
using CareTogether.Resources.Approvals;
using CareTogether.Resources.Directory;
using CareTogether.Resources.Policies;
using CareTogether.Resources.V1Cases;
using Timelines;

namespace CareTogether.Engines.PolicyEvaluation
{
    public sealed record FamilyApprovalStatus(
        ImmutableDictionary<Guid, IndividualApprovalStatus> IndividualApprovals,
        ImmutableDictionary<string, FamilyRoleApprovalStatus> FamilyRoleApprovals
    )
    {
        private record RoleStatusPair(string RoleName, RoleApprovalStatus? Status);

        private ImmutableDictionary<string, RoleApprovalStatus> RoleHighestStatuses =>
            FamilyRoleApprovals
                .Select(kvp => new RoleStatusPair(
                    kvp.Key,
                    PolicyEvaluationHelpers.GetMaxRoleStatus(kvp.Value.RoleVersionApprovals)
                ))
                .Concat(
                    IndividualApprovals.SelectMany(ind =>
                        ind.Value.ApprovalStatusByRole.Select(roleKvp => new RoleStatusPair(
                            roleKvp.Key,
                            PolicyEvaluationHelpers.GetMaxRoleStatus(
                                roleKvp.Value.RoleVersionApprovals
                            )
                        ))
                    )
                )
                .GroupBy(x => x.RoleName)
                .ToImmutableDictionary(
                    g => g.Key,
                    g =>
                        g.Select(x => x.Status ?? default)
                            .Where(s => s != default)
                            .DefaultIfEmpty()
                            .Max()
                );

        public ImmutableList<(
            string ActionName,
            (string Version, string RoleName)[] Versions
        )> CurrentMissingFamilyRequirements =>
            FamilyRoleApprovals
                .SelectMany(r => r.Value.CurrentMissingFamilyRequirements)
                .GroupBy(r => r.ActionName)
                .Select(g => (g.Key, g.SelectMany(x => x.Versions).ToArray()))
                .ToImmutableList();

        public ImmutableList<string> CurrentAvailableFamilyApplications =>
            FamilyRoleApprovals
                .SelectMany(r => r.Value.CurrentAvailableFamilyApplications)
                .Distinct()
                .ToImmutableList();

        public ImmutableList<(
            Guid PersonId,
            string ActionName,
            (string Version, string RoleName)[] Versions
        )> CurrentMissingIndividualRequirements =>
            FamilyRoleApprovals
                .SelectMany(fra => GetMissingRequirementsFromFamilyRole(fra.Key, fra.Value))
                .Concat(
                    IndividualApprovals.SelectMany(ia =>
                        GetMissingRequirementsFromIndividual(ia.Key, ia.Value)
                    )
                )
                .GroupBy(r => (r.PersonId, r.ActionName))
                .Select(g =>
                    (
                        PersonId: g.Key.PersonId,
                        ActionName: g.Key.ActionName,
                        Versions: g.Select(x => x.Version).ToArray()
                    )
                )
                .ToImmutableList();

        private IEnumerable<(
            Guid PersonId,
            string ActionName,
            (string Version, string RoleName) Version
        )> GetMissingRequirementsFromFamilyRole(
            string roleName,
            FamilyRoleApprovalStatus familyRoleStatus
        )
        {
            // Determine the highest status among the versions for this family role.
            // If there is a definitive max status, only consider missing requirements from
            // versions that have that same status; this hides missing requirements from
            // other versions of the same policy regardless of requirement stage.
            var maxVersionStatus = PolicyEvaluationHelpers.GetMaxRoleStatus(
                familyRoleStatus.RoleVersionApprovals
            );

            return familyRoleStatus
                .RoleVersionApprovals.Where(r =>
                    maxVersionStatus == null || r.CurrentStatus == maxVersionStatus
                )
                .SelectMany(r =>
                    r.CurrentMissingRequirements.Where(cmr =>
                            cmr.Scope == VolunteerFamilyRequirementScope.AllAdultsInTheFamily
                            || cmr.Scope
                                == VolunteerFamilyRequirementScope.AllParticipatingAdultsInTheFamily
                        )
                        .SelectMany(cmr =>
                            cmr.StatusDetails.Where(sd =>
                                    sd.WhenMet?.Contains(DateOnly.FromDateTime(DateTime.UtcNow))
                                    != true
                                )
                                .Select(sd =>
                                    (
                                        PersonId: sd.PersonId!.Value,
                                        ActionName: cmr.ActionName,
                                        Version: (r.Version, r.RoleName)
                                    )
                                )
                        )
                );
        }

        private IEnumerable<(
            Guid PersonId,
            string ActionName,
            (string Version, string RoleName) Version
        )> GetMissingRequirementsFromIndividual(
            Guid personId,
            IndividualApprovalStatus individualStatus
        )
        {
            return individualStatus.ApprovalStatusByRole.SelectMany(kv =>
            {
                var roleName = kv.Key;
                // Hide missing requirements from other versions of the same role
                // if there exists a version with a higher/equivalent max status. This
                // is independent of requirement stage.
                var maxVersionStatus = PolicyEvaluationHelpers.GetMaxRoleStatus(
                    kv.Value.RoleVersionApprovals
                );

                return kv
                    .Value.RoleVersionApprovals.Where(r =>
                        maxVersionStatus == null || r.CurrentStatus == maxVersionStatus
                    )
                    .SelectMany(r =>
                        r.CurrentMissingRequirements.Where(cmr =>
                                cmr.WhenMet?.Contains(DateOnly.FromDateTime(DateTime.UtcNow))
                                != true
                            )
                            .Select(cmr =>
                                (
                                    PersonId: personId,
                                    ActionName: cmr.ActionName,
                                    Version: (r.Version, r.RoleName)
                                )
                            )
                    );
            });
        }

        public ImmutableList<(
            Guid PersonId,
            string ActionName
        )> CurrentAvailableIndividualApplications =>
            IndividualApprovals
                .SelectMany(ia =>
                    ia.Value.ApprovalStatusByRole.SelectMany(kv =>
                    {
                        var roleName = kv.Key;

                        var individualHighestStatus = PolicyEvaluationHelpers.GetMaxRoleStatus(
                            kv.Value.RoleVersionApprovals
                        );

                        if (individualHighestStatus >= RoleApprovalStatus.Prospective)
                            return Enumerable.Empty<(Guid, string)>();

                        return kv
                            .Value.RoleVersionApprovals.Where(r =>
                                r.CurrentStatus == null && kv.Value.CurrentStatus == null
                            )
                            .SelectMany(r => r.CurrentAvailableApplications)
                            .Select(a => (ia.Key, a.ActionName));
                    })
                )
                .Distinct()
                .Select(t => (PersonId: t.Item1, ActionName: t.Item2))
                .ToImmutableList();
    }

    public sealed record IndividualApprovalStatus(
        ImmutableDictionary<string, IndividualRoleApprovalStatus> ApprovalStatusByRole
    )
    {
        [JsonIgnore]
        [Newtonsoft.Json.JsonIgnore]
        public ImmutableList<(
            string ActionName,
            (string Version, string RoleName)[] Versions
        )> CurrentMissingRequirements =>
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

        public ImmutableList<(
            string ActionName,
            (string Version, string RoleName)[] Versions
        )> CurrentMissingRequirements
        {
            get
            {
                // Return raw per-version missing requirements (family-level logic will decide hiding)
                var missingRequirements = RoleVersionApprovals
                    .SelectMany(r =>
                        r.CurrentMissingRequirements.Select(cmr =>
                            (cmr.ActionName, (r.Version, r.RoleName))
                        )
                    )
                    .ToImmutableList()
                    .GroupBy(r => r.ActionName)
                    .Select(g => (g.Key, g.Select(x => x.Item2).ToArray()))
                    .ToImmutableList();

                return missingRequirements;
            }
        }

        public ImmutableList<string> CurrentAvailableApplications =>
            // Return raw per-version available applications (family-level logic will decide hiding)
            RoleVersionApprovals
                .Where(r => r.CurrentStatus == null && CurrentStatus == null)
                .SelectMany(r => r.CurrentAvailableApplications)
                .Select(r => r.ActionName)
                .ToImmutableList();
    }

    public sealed record IndividualRoleVersionApprovalStatus(
        string RoleName,
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

        public ImmutableList<(
            string ActionName,
            (string Version, string RoleName)[] Versions
        )> CurrentMissingFamilyRequirements
        {
            get
            {
                // Determine the highest status across role versions. If there is a max
                // status, only consider missing requirements from versions that share
                // that status, which hides missing requirements from other versions
                // of the same policy (independent of requirement stage).
                var maxVersionStatus = PolicyEvaluationHelpers.GetMaxRoleStatus(
                    RoleVersionApprovals
                );

                return RoleVersionApprovals
                    .Where(r => maxVersionStatus == null || r.CurrentStatus == maxVersionStatus)
                    .SelectMany(r =>
                        r.CurrentMissingRequirements.Select(cmr =>
                            (CurrentMissingRequirement: cmr, Version: (r.Version, r.RoleName))
                        )
                    )
                    .Where(r =>
                        r.CurrentMissingRequirement.Scope
                        == VolunteerFamilyRequirementScope.OncePerFamily
                    )
                    .GroupBy(r => r.CurrentMissingRequirement.ActionName)
                    .Select(g => (g.Key, g.Select(x => x.Version).ToArray()))
                    .ToImmutableList();
            }
        }

        public ImmutableList<string> CurrentAvailableFamilyApplications
        {
            get
            {
                var highestStatus =
                    PolicyEvaluationHelpers.GetMaxRoleStatus(RoleVersionApprovals) ?? default;

                return highestStatus >= RoleApprovalStatus.Prospective
                    ? ImmutableList<string>.Empty
                    : RoleVersionApprovals
                        .Where(r => r.CurrentStatus == null && CurrentStatus == null)
                        .SelectMany(r => r.CurrentAvailableApplications)
                        .Where(r => r.Scope == VolunteerFamilyRequirementScope.OncePerFamily)
                        .Select(r => r.ActionName)
                        .ToImmutableList();
            }
        }

        public ImmutableList<(
            Guid PersonId,
            string ActionName,
            (string Version, string RoleName)[] Versions
        )> CurrentMissingIndividualRequirements
        {
            get
            {
                // Extract all missing requirements that apply to individuals, grouped by person and action
                var missingRequirements = RoleVersionApprovals
                    .SelectMany(r =>
                        r.CurrentMissingRequirements.Where(cmr =>
                                cmr.Scope == VolunteerFamilyRequirementScope.AllAdultsInTheFamily
                                || cmr.Scope
                                    == VolunteerFamilyRequirementScope.AllParticipatingAdultsInTheFamily
                            )
                            .SelectMany(cmr =>
                                cmr.StatusDetails.Where(sd =>
                                        sd.WhenMet?.Contains(DateOnly.FromDateTime(DateTime.UtcNow))
                                        != true
                                    )
                                    .Select(sd =>
                                        (
                                            PersonId: sd.PersonId!.Value,
                                            ActionName: cmr.ActionName,
                                            Version: (r.Version, r.RoleName)
                                        )
                                    )
                            )
                    )
                    .GroupBy(item => (item.PersonId, item.ActionName))
                    .Select(group =>
                        (
                            PersonId: group.Key.PersonId,
                            ActionName: group.Key.ActionName,
                            Versions: group.Select(x => x.Version).ToArray()
                        )
                    )
                    .ToImmutableList();

                return missingRequirements;
            }
        }
    }

    public sealed record FamilyRoleVersionApprovalStatus(
        string RoleName,
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

    public sealed record V1CaseStatus(
        ImmutableList<RequirementDefinition> MissingIntakeRequirements,
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

        Task<V1CaseStatus> CalculateV1CaseStatusAsync(
            Guid organizationId,
            Guid locationId,
            Family family,
            Resources.V1Cases.V1CaseEntry v1CaseEntry
        );
    }
}

using CareTogether.Resources;
using CareTogether.Resources.Approvals;
using CareTogether.Resources.Directory;
using CareTogether.Resources.Policies;
using System;
using System.Collections.Generic;
using System.Collections.Immutable;
using System.Linq;

namespace CareTogether.Engines.PolicyEvaluation
{
    internal static class ApprovalCalculations
    {
        public static VolunteerFamilyApprovalStatus CalculateVolunteerFamilyApprovalStatus(
            VolunteerPolicy volunteerPolicy, Family family, DateTime utcNow,
            ImmutableList<CompletedRequirementInfo> completedFamilyRequirements,
            ImmutableList<ExemptedRequirementInfo> exemptedFamilyRequirements,
            ImmutableList<RemovedRole> removedFamilyRoles,
            ImmutableDictionary<Guid, ImmutableList<CompletedRequirementInfo>> completedIndividualRequirements,
            ImmutableDictionary<Guid, ImmutableList<ExemptedRequirementInfo>> exemptedIndividualRequirements,
            ImmutableDictionary<Guid, ImmutableList<RemovedRole>> removedIndividualRoles)
        {
            var individualResults = CalculateCombinedIndividualRoleStatusForFamilyMembers(
                volunteerPolicy.VolunteerRoles, family, utcNow,
                completedIndividualRequirements, exemptedIndividualRequirements, removedIndividualRoles);

            var familyResult = CalculateCombinedFamilyRoleStatusForFamily(
                volunteerPolicy, family, utcNow,
                completedFamilyRequirements, exemptedFamilyRequirements, removedFamilyRoles,
                completedIndividualRequirements, exemptedIndividualRequirements, removedIndividualRoles);
            
            var effectiveFamilyRoleVersionApprovals = familyResult.FamilyRoleVersionApprovals
                .Select(roleApprovals =>
                    (role: roleApprovals.Key,
                    effectiveApproval: CalculateEffectiveRoleVersionApproval(roleApprovals.Value)))
                .Where(roleApproval => roleApproval.effectiveApproval != null)
                .ToImmutableDictionary(roleApproval => roleApproval.role, roleApproval => roleApproval.effectiveApproval!);

            return new VolunteerFamilyApprovalStatus(
                familyResult.FamilyRoleVersionApprovals,
                effectiveFamilyRoleVersionApprovals,
                familyResult.RemovedFamilyRoles,
                familyResult.MissingFamilyRequirements,
                familyResult.AvailableFamilyApplications,
                family.Adults.Select(adultFamilyEntry =>
                {
                    var (person, familyRelationship) = adultFamilyEntry;
                    var individualResult = individualResults.TryGetValue(person.Id, out var result)
                        ? result :
                        (IndividualRoleVersionApprovals: ImmutableDictionary<string, ImmutableList<RoleVersionApproval>>.Empty,
                        RemovedIndividualRoles: ImmutableList<RemovedRole>.Empty,
                        MissingIndividualRequirements: ImmutableList<string>.Empty,
                        AvailableIndividualApplications: ImmutableList<string>.Empty);

                    var mergedMissingIndividualRequirements = individualResult.MissingIndividualRequirements
                        .Concat(familyResult.MissingIndividualRequirementsForFamilyRoles.TryGetValue(person.Id, out var missing)
                            ? missing : ImmutableList<string>.Empty)
                        .Distinct()
                        .ToImmutableList();

                    var effectiveIndividualRoleVersionApprovals = individualResult.IndividualRoleVersionApprovals
                        .Select(roleApprovals =>
                            (role: roleApprovals.Key,
                            effectiveApproval: CalculateEffectiveRoleVersionApproval(roleApprovals.Value)))
                        .Where(roleApproval => roleApproval.effectiveApproval != null)
                        .ToImmutableDictionary(roleApproval => roleApproval.role, roleApproval => roleApproval.effectiveApproval!);

                    return new KeyValuePair<Guid, VolunteerApprovalStatus>(person.Id, new VolunteerApprovalStatus(
                        IndividualRoleApprovals: individualResult.IndividualRoleVersionApprovals,
                        EffectiveIndividualRoleApprovals: effectiveIndividualRoleVersionApprovals,
                        RemovedIndividualRoles: individualResult.RemovedIndividualRoles,
                        MissingIndividualRequirements: mergedMissingIndividualRequirements,
                        AvailableIndividualApplications: individualResult.AvailableIndividualApplications));
                }).ToImmutableDictionary());
        }

        /// <summary>
        /// Given potentially multiple calculated role version approvals (due to having multiple policies or
        /// perhaps multiple ways that the approval was qualified for), select the one that gives the best
        /// (most-approved) status for the overall role, since that will always be the one of interest.
        /// </summary>
        internal static RoleVersionApproval? CalculateEffectiveRoleVersionApproval(ImmutableList<RoleVersionApproval> value)
        {
            if (value.Count == 0)
                return null;

            // Sort the approval status values by the numeric value of the ApprovalStatus enum cases.
            // This means that Onboarded trumps Approved, which trumps Expired, which trumps Prospective.
            // Within each approval level, we want the expiration date that is furthest in the future.
            var bestCurrentApproval = value
                .OrderByDescending(rva => rva.ApprovalStatus)
                .ThenByDescending(rva => rva.ExpiresAt ?? DateTime.MaxValue)
                .First();
            
            return bestCurrentApproval;
        }

        internal static ImmutableDictionary<Guid,
            (ImmutableDictionary<string, ImmutableList<RoleVersionApproval>> IndividualRoleVersionApprovals,
            ImmutableList<RemovedRole> RemovedIndividualRoles,
            ImmutableList<string> MissingIndividualRequirements,
            ImmutableList<string> AvailableIndividualApplications)>
            CalculateCombinedIndividualRoleStatusForFamilyMembers(
            ImmutableDictionary<string, VolunteerRolePolicy> volunteerRoles, Family family, DateTime utcNow,
            ImmutableDictionary<Guid, ImmutableList<CompletedRequirementInfo>> completedIndividualRequirements,
            ImmutableDictionary<Guid, ImmutableList<ExemptedRequirementInfo>> exemptedIndividualRequirements,
            ImmutableDictionary<Guid, ImmutableList<RemovedRole>> removedIndividualRoles)
        {
            var allAdultsVolunteerApprovalStatus = family.Adults.Select(adultFamilyEntry =>
            {
                var (person, familyRelationship) = adultFamilyEntry;

                var completedRequirements = completedIndividualRequirements.GetValueOrEmptyList(person.Id);
                var exemptedRequirements = exemptedIndividualRequirements.GetValueOrEmptyList(person.Id);
                var removedRoles = removedIndividualRoles.GetValueOrEmptyList(person.Id);

                var allIndividualRoleApprovals = volunteerRoles
                    .Where(rolePolicy => !removedRoles.Any(x => x.RoleName == rolePolicy.Key))
                    .Select(rolePolicy => (RoleName: rolePolicy.Key,
                        StatusByVersions: rolePolicy.Value.PolicyVersions.Select(policyVersion =>
                        {
                            var (Status, ExpiresAtUtc, MissingRequirements, AvailableApplications) =
                                CalculateIndividualVolunteerRoleApprovalStatus(
                                    policyVersion, utcNow, completedRequirements, exemptedRequirements);
                            return (PolicyVersion: policyVersion, Status, ExpiresAtUtc, MissingRequirements, AvailableApplications);
                        })
                        .ToImmutableList()))
                    .ToImmutableList();

                var volunteerApprovalStatus = (person.Id, (
                    IndividualRoleVersionApprovals: allIndividualRoleApprovals
                        .Where(x => x.StatusByVersions.Any(y => y.Status.HasValue))
                        .ToImmutableDictionary(
                            x => x.RoleName,
                            x => x.StatusByVersions
                                .Where(y => y.Status.HasValue)
                                .Select(y => new RoleVersionApproval(y.PolicyVersion.Version, y.Status!.Value, y.ExpiresAtUtc))
                                .ToImmutableList()),
                    RemovedIndividualRoles: removedRoles,
                    MissingIndividualRequirements: allIndividualRoleApprovals
                        .SelectMany(x => x.StatusByVersions.SelectMany(y => y.MissingRequirements))
                        .Distinct()
                        .ToImmutableList(),
                    AvailableIndividualApplications: allIndividualRoleApprovals
                        .SelectMany(x => x.StatusByVersions.SelectMany(y => y.AvailableApplications))
                        .Distinct()
                        .ToImmutableList()));

                return volunteerApprovalStatus;
            }).ToImmutableDictionary(x => x.Id, x => x.Item2);
            return allAdultsVolunteerApprovalStatus;
        }

        internal static
            (ImmutableDictionary<string, ImmutableList<RoleVersionApproval>> FamilyRoleVersionApprovals,
            ImmutableList<RemovedRole> RemovedFamilyRoles,
            ImmutableList<string> MissingFamilyRequirements,
            ImmutableList<string> AvailableFamilyApplications,
            ImmutableDictionary<Guid, ImmutableList<string>> MissingIndividualRequirementsForFamilyRoles)
            CalculateCombinedFamilyRoleStatusForFamily(
            VolunteerPolicy volunteerPolicy, Family family, DateTime utcNow,
            ImmutableList<CompletedRequirementInfo> completedFamilyRequirements,
            ImmutableList<ExemptedRequirementInfo> exemptedFamilyRequirements,
            ImmutableList<RemovedRole> removedFamilyRoles,
            ImmutableDictionary<Guid, ImmutableList<CompletedRequirementInfo>> completedIndividualRequirements,
            ImmutableDictionary<Guid, ImmutableList<ExemptedRequirementInfo>> exemptedIndividualRequirements,
            ImmutableDictionary<Guid, ImmutableList<RemovedRole>> removedIndividualRoles)
        {
            var allFamilyRoleApprovals = volunteerPolicy.VolunteerFamilyRoles
                .Where(rolePolicy => !removedFamilyRoles.Any(x => x.RoleName == rolePolicy.Key))
                .Select(rolePolicy => (RoleName: rolePolicy.Key,
                    StatusByVersions: rolePolicy.Value.PolicyVersions.Select(policyVersion =>
                    {
                        var (Status, ExpiresAtUtc, MissingRequirements, AvailableApplications, MissingIndividualRequirements) =
                            CalculateFamilyVolunteerRoleApprovalStatus(
                                rolePolicy.Key, policyVersion, utcNow, family,
                                completedFamilyRequirements, exemptedFamilyRequirements,
                                completedIndividualRequirements, exemptedIndividualRequirements,
                                removedIndividualRoles);
                        return (PolicyVersion: policyVersion, Status, ExpiresAtUtc, MissingRequirements, AvailableApplications, MissingIndividualRequirements);
                    })
                    .ToImmutableList()))
                .ToImmutableList();

            var volunteerFamilyApprovalStatus = (
                FamilyRoleVersionApprovals: allFamilyRoleApprovals
                    .Where(x => x.StatusByVersions.Any(y => y.Status.HasValue))
                    .ToImmutableDictionary(
                        x => x.RoleName,
                        x => x.StatusByVersions
                            .Where(y => y.Status.HasValue)
                            .Select(y => new RoleVersionApproval(y.PolicyVersion.Version, y.Status!.Value, y.ExpiresAtUtc))
                            .ToImmutableList()),
                RemovedFamilyRoles: removedFamilyRoles,
                MissingFamilyRequirements: allFamilyRoleApprovals
                        .SelectMany(x => x.StatusByVersions.SelectMany(y => y.MissingRequirements))
                        .Distinct()
                        .ToImmutableList(),
                AvailableFamilyApplications: allFamilyRoleApprovals
                        .SelectMany(x => x.StatusByVersions.SelectMany(y => y.AvailableApplications))
                        .Distinct()
                        .ToImmutableList(),
                MissingIndividualRequirementsForFamilyRoles: allFamilyRoleApprovals
                        .SelectMany(x => x.StatusByVersions
                            .SelectMany(y => y.MissingIndividualRequirements
                                .SelectMany(z => z.Value
                                    .Select(q => (PersonId: z.Key, MissingRequirement: q)))))
                        .Distinct()
                        .GroupBy(x => x.PersonId)
                        .ToImmutableDictionary(
                            x => x.Key,
                            x => x.Select(y => y.MissingRequirement).ToImmutableList()));

            return volunteerFamilyApprovalStatus;
        }

        internal static
            (RoleApprovalStatus? Status, DateTime? ExpiresAtUtc, ImmutableList<string> MissingRequirements, ImmutableList<string> AvailableApplications)
            CalculateIndividualVolunteerRoleApprovalStatus(
            VolunteerRolePolicyVersion policyVersion, DateTime utcNow,
            ImmutableList<CompletedRequirementInfo> completedRequirements, ImmutableList<ExemptedRequirementInfo> exemptedRequirements)
        {
            var supersededAtUtc = policyVersion.SupersededAtUtc;

            var requirementCompletionStatus = policyVersion.Requirements.Select(requirement =>
                (requirement.ActionName, requirement.Stage, RequirementMetOrExempted:
                    SharedCalculations.RequirementMetOrExempted(requirement.ActionName, supersededAtUtc, utcNow, completedRequirements, exemptedRequirements)))
                .ToImmutableList();

            var simpleRequirementCompletionStatus = requirementCompletionStatus
                .Select(status => (status.ActionName, status.Stage, RequirementMetOrExempted: status.RequirementMetOrExempted.IsMetOrExempted))
                .ToImmutableList();

            var status = CalculateRoleApprovalStatusFromRequirementCompletions(requirementCompletionStatus);
            var missingRequirements = CalculateMissingIndividualRequirementsFromRequirementCompletion(status.Status, simpleRequirementCompletionStatus);
            var availableApplications = CalculateAvailableIndividualApplicationsFromRequirementCompletion(status.Status, simpleRequirementCompletionStatus);

            return (status.Status, status.ExpiresAtUtc, MissingRequirements: missingRequirements, AvailableApplications: availableApplications);
        }

        internal static
            (RoleApprovalStatus? Status, DateTime? ExpiresAtUtc, ImmutableList<string> MissingRequirements, ImmutableList<string> AvailableApplications,
            ImmutableDictionary<Guid, ImmutableList<string>> MissingIndividualRequirements)
            CalculateFamilyVolunteerRoleApprovalStatus
            (string roleName, VolunteerFamilyRolePolicyVersion policyVersion, DateTime utcNow, Family family,
            ImmutableList<CompletedRequirementInfo> completedFamilyRequirements, ImmutableList<ExemptedRequirementInfo> exemptedFamilyRequirements,
            ImmutableDictionary<Guid, ImmutableList<CompletedRequirementInfo>> completedIndividualRequirements,
            ImmutableDictionary<Guid, ImmutableList<ExemptedRequirementInfo>> exemptedIndividualRequirements,
            ImmutableDictionary<Guid, ImmutableList<RemovedRole>> removedIndividualRoles)
        {
            var supersededAtUtc = policyVersion.SupersededAtUtc;

            var activeAdults = family.Adults
                .Where(a => a.Item1.Active)
                .Select(a =>
                {
                    var (person, _) = a;
                    var completedRequirements = completedIndividualRequirements.GetValueOrEmptyList(person.Id);
                    var exemptedRequirements = exemptedIndividualRequirements.GetValueOrEmptyList(person.Id);
                    return (a.Item1.Id, CompletedRequirements: completedRequirements, ExemptedRequirements: exemptedRequirements);
                })
                .ToImmutableList();

            var requirementsMet = policyVersion.Requirements.Select(requirement =>
                (requirement.ActionName, requirement.Stage, requirement.Scope,
                    RequirementMetOrExempted: FamilyRequirementMetOrExempted(roleName, requirement.ActionName, requirement.Scope, supersededAtUtc, utcNow,
                        completedFamilyRequirements, exemptedFamilyRequirements, removedIndividualRoles,
                        activeAdults),
                RequirementMissingForIndividuals: FamilyRequirementMissingForIndividuals(roleName, requirement, supersededAtUtc, utcNow,
                    removedIndividualRoles,
                    activeAdults)))
                .ToImmutableList();

            var simpleRequirementsMet = requirementsMet
                .Select(status => (status.ActionName, status.Stage, status.Scope, RequirementMetOrExempted: status.RequirementMetOrExempted.IsMetOrExempted, status.RequirementMissingForIndividuals))
                .ToImmutableList();

            var status = CalculateRoleApprovalStatusFromRequirementCompletions(
                requirementsMet.Select(x => (x.ActionName, x.Stage, x.RequirementMetOrExempted)).ToImmutableList());
            var missingRequirements = CalculateMissingFamilyRequirementsFromRequirementCompletion(status.Status, simpleRequirementsMet);
            var availableApplications = CalculateAvailableFamilyApplicationsFromRequirementCompletion(status.Status, simpleRequirementsMet);
            var missingIndividualRequirements = CalculateMissingFamilyIndividualRequirementsFromRequirementCompletion(status.Status, simpleRequirementsMet);

            return (status.Status, status.ExpiresAtUtc,
                MissingRequirements: missingRequirements,
                AvailableApplications: availableApplications,
                MissingIndividualRequirements: missingIndividualRequirements);
        }

        internal static (RoleApprovalStatus? Status, DateTime? ExpiresAtUtc) CalculateRoleApprovalStatusFromRequirementCompletions(
            ImmutableList<(string ActionName, RequirementStage Stage, SharedCalculations.RequirementCheckResult RequirementMetOrExempted)> requirementCompletionStatus)
        {
            static (bool IsSatisfied, DateTime? ExpiresAtUtc) Evaluate(
                IEnumerable<(string ActionName, RequirementStage Stage, SharedCalculations.RequirementCheckResult RequirementMetOrExempted)> values)
            {
                if (values.All(value => value.RequirementMetOrExempted.IsMetOrExempted))
                    return (true,
                        values.MinBy(value => value.RequirementMetOrExempted.ExpiresAtUtc ?? DateTime.MaxValue).RequirementMetOrExempted.ExpiresAtUtc);
                else
                    return (false, null);
            }

            var onboarded = Evaluate(requirementCompletionStatus);
            if (onboarded.IsSatisfied)
                return (Status: RoleApprovalStatus.Onboarded, onboarded.ExpiresAtUtc);

            var approved = Evaluate(requirementCompletionStatus
                .Where(x => x.Stage == RequirementStage.Application || x.Stage == RequirementStage.Approval));
            if (approved.IsSatisfied)
                return (Status: RoleApprovalStatus.Approved, approved.ExpiresAtUtc);

            var prospective = Evaluate(requirementCompletionStatus
                .Where(x => x.Stage == RequirementStage.Application));
            if (prospective.IsSatisfied)
                return (Status: RoleApprovalStatus.Prospective, prospective.ExpiresAtUtc);

            return (Status: null, ExpiresAtUtc: null);
        }

        internal static ImmutableList<string> CalculateAvailableIndividualApplicationsFromRequirementCompletion(RoleApprovalStatus? status,
            ImmutableList<(string ActionName, RequirementStage Stage, bool RequirementMetOrExempted)> requirementCompletionStatus) =>
            status switch
            {
                RoleApprovalStatus.Onboarded => ImmutableList<string>.Empty,
                RoleApprovalStatus.Approved => ImmutableList<string>.Empty,
                RoleApprovalStatus.Prospective => ImmutableList<string>.Empty,
                null => requirementCompletionStatus
                    .Where(x => !x.RequirementMetOrExempted && x.Stage == RequirementStage.Application)
                    .Select(x => x.ActionName)
                    .ToImmutableList(),
                _ => throw new NotImplementedException(
                    $"The volunteer role approval status '{status}' has not been implemented.")
            };

        internal static ImmutableList<string> CalculateMissingIndividualRequirementsFromRequirementCompletion(RoleApprovalStatus? status,
            ImmutableList<(string ActionName, RequirementStage Stage, bool RequirementMetOrExempted)> requirementCompletionStatus) =>
            status switch
            {
                RoleApprovalStatus.Onboarded => ImmutableList<string>.Empty,
                RoleApprovalStatus.Approved => requirementCompletionStatus
                        .Where(x => !x.RequirementMetOrExempted && x.Stage == RequirementStage.Onboarding)
                        .Select(x => x.ActionName)
                        .ToImmutableList(),
                RoleApprovalStatus.Prospective => requirementCompletionStatus
                        .Where(x => !x.RequirementMetOrExempted && x.Stage == RequirementStage.Approval)
                        .Select(x => x.ActionName)
                        .ToImmutableList(),
                null => ImmutableList<string>.Empty,
                _ => throw new NotImplementedException(
                    $"The volunteer role approval status '{status}' has not been implemented.")
            };

        internal static ImmutableList<string> CalculateMissingFamilyRequirementsFromRequirementCompletion(RoleApprovalStatus? status,
            ImmutableList<(string ActionName, RequirementStage Stage, VolunteerFamilyRequirementScope Scope, bool RequirementMetOrExempted, List<Guid> RequirementMissingForIndividuals)> requirementsMet)
        {
            return status switch
            {
                RoleApprovalStatus.Onboarded => ImmutableList<string>.Empty,
                RoleApprovalStatus.Approved => requirementsMet
                        .Where(x => !x.RequirementMetOrExempted && x.Stage == RequirementStage.Onboarding
                            && x.Scope == VolunteerFamilyRequirementScope.OncePerFamily)
                        .Select(x => x.ActionName)
                        .ToImmutableList(),
                RoleApprovalStatus.Prospective => requirementsMet
                        .Where(x => !x.RequirementMetOrExempted && x.Stage == RequirementStage.Approval
                            && x.Scope == VolunteerFamilyRequirementScope.OncePerFamily)
                        .Select(x => x.ActionName)
                        .ToImmutableList(),
                null => ImmutableList<string>.Empty,
                _ => throw new NotImplementedException(
                    $"The volunteer role approval status '{status}' has not been implemented.")
            };
        }

        internal static ImmutableList<string> CalculateAvailableFamilyApplicationsFromRequirementCompletion(RoleApprovalStatus? status,
            ImmutableList<(string ActionName, RequirementStage Stage, VolunteerFamilyRequirementScope Scope, bool RequirementMetOrExempted, List<Guid> RequirementMissingForIndividuals)> requirementsMet)
        {
            return status switch
            {
                RoleApprovalStatus.Onboarded => ImmutableList<string>.Empty,
                RoleApprovalStatus.Approved => ImmutableList<string>.Empty,
                RoleApprovalStatus.Prospective => ImmutableList<string>.Empty,
                null => requirementsMet
                        .Where(x => !x.RequirementMetOrExempted && x.Stage == RequirementStage.Application
                            && x.Scope == VolunteerFamilyRequirementScope.OncePerFamily)
                        .Select(x => x.ActionName)
                        .ToImmutableList(),
                _ => throw new NotImplementedException(
                    $"The volunteer role approval status '{status}' has not been implemented.")
            };
        }

        internal static ImmutableDictionary<Guid, ImmutableList<string>> CalculateMissingFamilyIndividualRequirementsFromRequirementCompletion(RoleApprovalStatus? status,
            ImmutableList<(string ActionName, RequirementStage Stage, VolunteerFamilyRequirementScope Scope, bool RequirementMetOrExempted, List<Guid> RequirementMissingForIndividuals)> requirementsMet)
        {
            return status switch
            {
                RoleApprovalStatus.Onboarded => ImmutableDictionary<Guid, ImmutableList<string>>.Empty,
                RoleApprovalStatus.Approved => requirementsMet
                        .Where(x => x.Stage == RequirementStage.Onboarding)
                        .SelectMany(x => x.RequirementMissingForIndividuals.Select(y => (PersonId: y, x.ActionName)))
                        .GroupBy(x => x.PersonId)
                        .ToImmutableDictionary(x => x.Key, x => x.Select(y => y.ActionName).ToImmutableList()),
                RoleApprovalStatus.Prospective => requirementsMet
                        .Where(x => x.Stage == RequirementStage.Approval)
                        .SelectMany(x => x.RequirementMissingForIndividuals.Select(y => (PersonId: y, x.ActionName)))
                        .GroupBy(x => x.PersonId)
                        .ToImmutableDictionary(x => x.Key, x => x.Select(y => y.ActionName).ToImmutableList()),
                null => ImmutableDictionary<Guid, ImmutableList<string>>.Empty,
                _ => throw new NotImplementedException(
                    $"The volunteer role approval status '{status}' has not been implemented.")
            };
        }

        internal static SharedCalculations.RequirementCheckResult FamilyRequirementMetOrExempted(string roleName,
            string requirementActionName, VolunteerFamilyRequirementScope requirementScope,
            DateTime? supersededAtUtc, DateTime utcNow,
            ImmutableList<CompletedRequirementInfo> completedFamilyRequirements,
            ImmutableList<ExemptedRequirementInfo> exemptedFamilyRequirements,
            ImmutableDictionary<Guid, ImmutableList<RemovedRole>> removedIndividualRoles,
            ImmutableList<(Guid Id, ImmutableList<CompletedRequirementInfo> CompletedRequirements,
                ImmutableList<ExemptedRequirementInfo> ExemptedRequirements)> activeAdults)
        {
            if (activeAdults.Count == 0)
                return new SharedCalculations.RequirementCheckResult(false, null);

            static SharedCalculations.RequirementCheckResult Combine(IEnumerable<SharedCalculations.RequirementCheckResult> values)
            {
                if (values.All(value => value.IsMetOrExempted))
                    return new SharedCalculations.RequirementCheckResult(true,
                        values.MinBy(value => value.ExpiresAtUtc ?? DateTime.MinValue)?.ExpiresAtUtc);
                else
                    return new SharedCalculations.RequirementCheckResult(false, null);
            }

            switch (requirementScope)
            {
                case VolunteerFamilyRequirementScope.AllAdultsInTheFamily:
                    {
                        var results = activeAdults
                            .Select(a => SharedCalculations.RequirementMetOrExempted(requirementActionName, supersededAtUtc, utcNow,
                                a.CompletedRequirements, a.ExemptedRequirements));
                        return Combine(results);
                    }
                case VolunteerFamilyRequirementScope.AllParticipatingAdultsInTheFamily:
                    {
                        var results = activeAdults
                            .Where(a => !removedIndividualRoles.TryGetValue(a.Id, out var removedRoles) ||
                                removedRoles.All(x => x.RoleName != roleName))
                            .Select(a =>
                                SharedCalculations.RequirementMetOrExempted(requirementActionName, supersededAtUtc, utcNow,
                                    a.CompletedRequirements, a.ExemptedRequirements));
                        return Combine(results);
                    }
                case VolunteerFamilyRequirementScope.OncePerFamily:
                    {
                        return SharedCalculations.RequirementMetOrExempted(requirementActionName, supersededAtUtc, utcNow,
                            completedFamilyRequirements, exemptedFamilyRequirements);
                    }
                default:
                    throw new NotImplementedException(
                        $"The volunteer family requirement scope '{requirementScope}' has not been implemented.");
            }
        }

        internal static List<Guid> FamilyRequirementMissingForIndividuals(string roleName,
            VolunteerFamilyApprovalRequirement requirement,
            DateTime? supersededAtUtc, DateTime utcNow,
            ImmutableDictionary<Guid, ImmutableList<RemovedRole>> removedIndividualRoles,
            ImmutableList<(Guid Id, ImmutableList<CompletedRequirementInfo> CompletedRequirements, ImmutableList<ExemptedRequirementInfo> ExemptedRequirements)> activeAdults) =>
            requirement.Scope switch
            {
                VolunteerFamilyRequirementScope.AllAdultsInTheFamily => activeAdults.Where(a =>
                    !SharedCalculations.RequirementMetOrExempted(requirement.ActionName, supersededAtUtc, utcNow,
                        a.CompletedRequirements, a.ExemptedRequirements).IsMetOrExempted)
                    .Select(a => a.Id).ToList(),
                VolunteerFamilyRequirementScope.AllParticipatingAdultsInTheFamily => activeAdults.Where(a =>
                    !(removedIndividualRoles.TryGetValue(a.Id, out var removedRoles)
                        && removedRoles.Any(x => x.RoleName == roleName)) &&
                    !SharedCalculations.RequirementMetOrExempted(requirement.ActionName, supersededAtUtc, utcNow,
                        a.CompletedRequirements, a.ExemptedRequirements).IsMetOrExempted)
                    .Select(a => a.Id).ToList(),
                VolunteerFamilyRequirementScope.OncePerFamily => new List<Guid>(),
                _ => throw new NotImplementedException(
                    $"The volunteer family requirement scope '{requirement.Scope}' has not been implemented.")
            };
    }
}

using CareTogether.Resources;
using System;
using System.Collections.Generic;
using System.Collections.Immutable;
using System.Linq;

namespace CareTogether.Engines
{
    internal static class ApprovalCalculations
    {
        public static
            (RoleApprovalStatus? Status, ImmutableList<string> MissingRequirements, ImmutableList<string> AvailableApplications)
            CalculateIndividualVolunteerRoleApprovalStatus(
            VolunteerRolePolicyVersion policyVersion, DateTime utcNow,
            ImmutableList<CompletedRequirementInfo> completedRequirements, ImmutableList<ExemptedRequirementInfo> exemptedRequirements)
        {
            var supersededAtUtc = policyVersion.SupersededAtUtc;

            var requirementCompletionStatus = policyVersion.Requirements.Select(requirement =>
                (requirement.ActionName, requirement.Stage, RequirementMetOrExempted:
                    RequirementMetOrExempted(requirement.ActionName, supersededAtUtc, utcNow, completedRequirements, exemptedRequirements)))
                .ToImmutableList();

            var status = CalculateRoleApprovalStatusFromRequirementCompletions(requirementCompletionStatus);
            var missingRequirements = CalculateMissingIndividualRequirementsFromRequirementCompletion(status, requirementCompletionStatus);
            var availableApplications = CalculateAvailableIndividualApplicationsFromRequirementCompletion(status, requirementCompletionStatus);

            return (Status: status, MissingRequirements: missingRequirements, AvailableApplications: availableApplications);
        }

        public static
            (RoleApprovalStatus? Status, ImmutableList<string> MissingRequirements, ImmutableList<string> AvailableApplications,
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
                    RequirementMetOrExempted: FamilyRequirementMetOrExempted(roleName, requirement, supersededAtUtc, utcNow,
                        completedFamilyRequirements, exemptedFamilyRequirements, removedIndividualRoles,
                        activeAdults),
                RequirementMissingForIndividuals: FamilyRequirementMissingForIndividuals(roleName, requirement, supersededAtUtc, utcNow,
                    completedFamilyRequirements, exemptedFamilyRequirements, removedIndividualRoles,
                    activeAdults)))
                .ToImmutableList();

            var status = CalculateRoleApprovalStatusFromRequirementCompletions(
                requirementsMet.Select(x => (x.ActionName, x.Stage, x.RequirementMetOrExempted)).ToImmutableList());
            var missingRequirements = CalculateMissingFamilyRequirementsFromRequirementCompletion(status, requirementsMet);
            var availableApplications = CalculateAvailableFamilyApplicationsFromRequirementCompletion(status, requirementsMet);
            var missingIndividualRequirements = CalculateMissingFamilyIndividualRequirementsFromRequirementCompletion(status, requirementsMet);

            return (Status: status,
                MissingRequirements: missingRequirements,
                AvailableApplications: availableApplications,
                MissingIndividualRequirements: missingIndividualRequirements);
        }


        internal static RoleApprovalStatus? CalculateRoleApprovalStatusFromRequirementCompletions(
            ImmutableList<(string ActionName, RequirementStage Stage, bool RequirementMetOrExempted)> requirementCompletionStatus)
        {
            if (requirementCompletionStatus.All(x => x.RequirementMetOrExempted))
                return RoleApprovalStatus.Onboarded;
            else if (requirementCompletionStatus
                .Where(x => x.Stage == RequirementStage.Application || x.Stage == RequirementStage.Approval)
                .All(x => x.RequirementMetOrExempted))
                return RoleApprovalStatus.Approved;
            else if (requirementCompletionStatus
                .Where(x => x.Stage == RequirementStage.Application)
                .All(x => x.RequirementMetOrExempted))
                return RoleApprovalStatus.Prospective;
            else
                return null;
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

        internal static bool FamilyRequirementMetOrExempted(string roleName,
            VolunteerFamilyApprovalRequirement requirement,
            DateTime? supersededAtUtc, DateTime utcNow,
            ImmutableList<CompletedRequirementInfo> completedFamilyRequirements,
            ImmutableList<ExemptedRequirementInfo> exemptedFamilyRequirements,
            ImmutableDictionary<Guid, ImmutableList<RemovedRole>> removedIndividualRoles,
            ImmutableList<(Guid Id, ImmutableList<CompletedRequirementInfo> CompletedRequirements, ImmutableList<ExemptedRequirementInfo> ExemptedRequirements)> activeAdults) =>
            requirement.Scope switch
            {
                VolunteerFamilyRequirementScope.AllAdultsInTheFamily => activeAdults.All(a =>
                    RequirementMetOrExempted(requirement.ActionName, supersededAtUtc, utcNow,
                        a.CompletedRequirements, a.ExemptedRequirements)),
                VolunteerFamilyRequirementScope.AllParticipatingAdultsInTheFamily => activeAdults.All(a =>
                    (removedIndividualRoles.TryGetValue(a.Id, out var removedRoles)
                            && removedRoles.Any(x => x.RoleName == roleName)) ||
                    RequirementMetOrExempted(requirement.ActionName, supersededAtUtc, utcNow,
                        a.CompletedRequirements, a.ExemptedRequirements)),
                VolunteerFamilyRequirementScope.OncePerFamily =>
                    RequirementMetOrExempted(requirement.ActionName, supersededAtUtc, utcNow,
                        completedFamilyRequirements, exemptedFamilyRequirements),
                _ => throw new NotImplementedException(
                    $"The volunteer family requirement scope '{requirement.Scope}' has not been implemented.")
            };

        internal static List<Guid> FamilyRequirementMissingForIndividuals(string roleName,
            VolunteerFamilyApprovalRequirement requirement,
            DateTime? supersededAtUtc, DateTime utcNow,
            ImmutableList<CompletedRequirementInfo> completedFamilyRequirements,
            ImmutableList<ExemptedRequirementInfo> exemptedFamilyRequirements,
            ImmutableDictionary<Guid, ImmutableList<RemovedRole>> removedIndividualRoles,
            ImmutableList<(Guid Id, ImmutableList<CompletedRequirementInfo> CompletedRequirements, ImmutableList<ExemptedRequirementInfo> ExemptedRequirements)> activeAdults) =>
            requirement.Scope switch
            {
                VolunteerFamilyRequirementScope.AllAdultsInTheFamily => activeAdults.Where(a =>
                    !RequirementMetOrExempted(requirement.ActionName, supersededAtUtc, utcNow,
                        a.CompletedRequirements, a.ExemptedRequirements))
                    .Select(a => a.Id).ToList(),
                VolunteerFamilyRequirementScope.AllParticipatingAdultsInTheFamily => activeAdults.Where(a =>
                    !(removedIndividualRoles.TryGetValue(a.Id, out var removedRoles)
                        && removedRoles.Any(x => x.RoleName == roleName)) &&
                    !RequirementMetOrExempted(requirement.ActionName, supersededAtUtc, utcNow,
                        a.CompletedRequirements, a.ExemptedRequirements))
                    .Select(a => a.Id).ToList(),
                VolunteerFamilyRequirementScope.OncePerFamily => new List<Guid>(),
                _ => throw new NotImplementedException(
                    $"The volunteer family requirement scope '{requirement.Scope}' has not been implemented.")
            };

        internal static bool RequirementMetOrExempted(string requirementName,
            DateTime? policySupersededAtUtc, DateTime utcNow,
            ImmutableList<CompletedRequirementInfo> completedRequirements,
            ImmutableList<ExemptedRequirementInfo> exemptedRequirements) =>
            completedRequirements.Any(completed =>
                completed.RequirementName == requirementName &&
                (policySupersededAtUtc == null || completed.CompletedAtUtc < policySupersededAtUtc)) ||
            exemptedRequirements.Any(exempted =>
                exempted.RequirementName == requirementName &&
                (exempted.ExemptionExpiresAtUtc == null || exempted.ExemptionExpiresAtUtc > utcNow));
    }
}

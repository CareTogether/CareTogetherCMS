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
                .ToList();

            if (requirementCompletionStatus.All(x => x.RequirementMetOrExempted))
                return (RoleApprovalStatus.Onboarded,
                    MissingRequirements: ImmutableList<string>.Empty,
                    AvailableApplications: ImmutableList<string>.Empty);
            else if (requirementCompletionStatus
                .Where(x => x.Stage == RequirementStage.Application || x.Stage == RequirementStage.Approval)
                .All(x => x.RequirementMetOrExempted))
            {
                return (RoleApprovalStatus.Approved,
                    MissingRequirements: requirementCompletionStatus
                        .Where(x => !x.RequirementMetOrExempted && x.Stage == RequirementStage.Onboarding)
                        .Select(x => x.ActionName)
                        .ToImmutableList(),
                    AvailableApplications: ImmutableList<string>.Empty);
            }
            else if (requirementCompletionStatus
                .Where(x => x.Stage == RequirementStage.Application)
                .All(x => x.RequirementMetOrExempted))
            {
                return (RoleApprovalStatus.Prospective,
                    MissingRequirements: requirementCompletionStatus
                        .Where(x => !x.RequirementMetOrExempted && x.Stage == RequirementStage.Approval)
                        .Select(x => x.ActionName)
                        .ToImmutableList(),
                    AvailableApplications: ImmutableList<string>.Empty);
            }
            else
            {
                return (Status: null,
                    MissingRequirements: ImmutableList<string>.Empty,
                    AvailableApplications: requirementCompletionStatus
                        .Where(x => !x.RequirementMetOrExempted && x.Stage == RequirementStage.Application)
                        .Select(x => x.ActionName)
                        .ToImmutableList());
            }
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
                    var (person, familyRelationship) = a;
                    var completedRequirements = completedIndividualRequirements.GetValueOrEmptyList(person.Id);
                    var exemptedRequirements = exemptedIndividualRequirements.GetValueOrEmptyList(person.Id);
                    return (a.Item1.Id, CompletedRequirements: completedRequirements, ExemptedRequirements: exemptedRequirements);
                })
                .ToImmutableList();

            var requirementsMet = policyVersion.Requirements.Select(requirement =>
                (requirement.ActionName, requirement.Stage, requirement.Scope,
                RequirementMetOrExempted: requirement.Scope switch
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
                },
                RequirementMissingForIndividuals: requirement.Scope switch
                {
                    VolunteerFamilyRequirementScope.AllAdultsInTheFamily => activeAdults.Where(a =>
                        !RequirementMetOrExempted(requirement.ActionName, supersededAtUtc, utcNow,
                            a.CompletedRequirements, a.ExemptedRequirements)).Select(a => a.Id).ToList(),
                    VolunteerFamilyRequirementScope.AllParticipatingAdultsInTheFamily => activeAdults.Where(a =>
                        !(removedIndividualRoles.TryGetValue(a.Id, out var removedRoles)
                            && removedRoles.Any(x => x.RoleName == roleName)) &&
                        !RequirementMetOrExempted(requirement.ActionName, supersededAtUtc, utcNow,
                            a.CompletedRequirements, a.ExemptedRequirements)).Select(a => a.Id).ToList(),
                    VolunteerFamilyRequirementScope.OncePerFamily => new List<Guid>(),
                    _ => throw new NotImplementedException(
                        $"The volunteer family requirement scope '{requirement.Scope}' has not been implemented.")
                })).ToList();

            if (requirementsMet.All(x => x.RequirementMetOrExempted))
                return (RoleApprovalStatus.Onboarded,
                    MissingRequirements: ImmutableList<string>.Empty,
                    AvailableApplications: ImmutableList<string>.Empty,
                    MissingIndividualRequirements: ImmutableDictionary<Guid, ImmutableList<string>>.Empty);
            else if (requirementsMet
                .Where(x => x.Stage == RequirementStage.Application || x.Stage == RequirementStage.Approval)
                .All(x => x.RequirementMetOrExempted))
            {
                return (RoleApprovalStatus.Approved,
                    MissingRequirements: requirementsMet
                        .Where(x => !x.RequirementMetOrExempted && x.Stage == RequirementStage.Onboarding
                            && x.Scope == VolunteerFamilyRequirementScope.OncePerFamily)
                        .Select(x => x.ActionName)
                        .ToImmutableList(),
                    AvailableApplications: ImmutableList<string>.Empty,
                    MissingIndividualRequirements: requirementsMet
                        .Where(x => x.Stage == RequirementStage.Onboarding)
                        .SelectMany(x => x.RequirementMissingForIndividuals.Select(y => (PersonId: y, x.ActionName)))
                        .GroupBy(x => x.PersonId)
                        .ToImmutableDictionary(x => x.Key, x => x.Select(y => y.ActionName).ToImmutableList()));
            }
            else if (requirementsMet
                .Where(x => x.Stage == RequirementStage.Application)
                .All(x => x.RequirementMetOrExempted))
            {
                return (RoleApprovalStatus.Prospective,
                    MissingRequirements: requirementsMet
                        .Where(x => !x.RequirementMetOrExempted && x.Stage == RequirementStage.Approval
                            && x.Scope == VolunteerFamilyRequirementScope.OncePerFamily)
                        .Select(x => x.ActionName)
                        .ToImmutableList(),
                    AvailableApplications: ImmutableList<string>.Empty,
                    MissingIndividualRequirements: requirementsMet
                        .Where(x => x.Stage == RequirementStage.Approval)
                        .SelectMany(x => x.RequirementMissingForIndividuals.Select(y => (PersonId: y, x.ActionName)))
                        .GroupBy(x => x.PersonId)
                        .ToImmutableDictionary(x => x.Key, x => x.Select(y => y.ActionName).ToImmutableList()));
            }
            else
            {
                return (null,
                    MissingRequirements: ImmutableList<string>.Empty,
                    AvailableApplications: requirementsMet
                        .Where(x => !x.RequirementMetOrExempted && x.Stage == RequirementStage.Application
                            && x.Scope == VolunteerFamilyRequirementScope.OncePerFamily)
                        .Select(x => x.ActionName)
                        .ToImmutableList(),
                    MissingIndividualRequirements: ImmutableDictionary<Guid, ImmutableList<string>>.Empty);
            }
        }

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

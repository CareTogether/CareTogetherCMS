using CareTogether.Resources;
using System;
using System.Collections.Generic;
using System.Collections.Immutable;
using System.Linq;
using System.Threading.Tasks;

namespace CareTogether.Engines
{
    public sealed class PolicyEvaluationEngine : IPolicyEvaluationEngine
    {
        private readonly IPoliciesResource policiesResource;


        public PolicyEvaluationEngine(IPoliciesResource policiesResource)
        {
            this.policiesResource = policiesResource;
        }


        public async Task<VolunteerFamilyApprovalStatus> CalculateVolunteerFamilyApprovalStatusAsync(Guid organizationId, Guid locationId,
            Family family, ImmutableList<CompletedRequirementInfo> completedFamilyRequirements,
            ImmutableDictionary<Guid, ImmutableList<CompletedRequirementInfo>> completedIndividualRequirements)
        {
            static void AddToEntryList<T, U>(Dictionary<T, ImmutableList<U>> dictionary, T key, U value)
                where T : notnull
            {
                var list = dictionary.GetValueOrDefault(key, ImmutableList<U>.Empty);
                dictionary[key] = list.Add(value);
            }

            var policy = await policiesResource.GetCurrentPolicy(organizationId, locationId);

            var missingFamilyRequirements = new HashSet<string>();
            var missingIndividualRequirements = new Dictionary<Guid, HashSet<string>>();
            // We do not currently support family role application requirements with a scope of per-adult, so this only needs to track per-family.
            var availableFamilyApplications = new HashSet<string>();

            var individualVolunteerRoles = family.Adults.Select(x =>
            {
                var (person, familyRelationship) = x;
                var individualRoles = new Dictionary<string, ImmutableList<RoleVersionApproval>>();
                var missingRequirements = new HashSet<string>();
                var availableApplications = new HashSet<string>();

                ImmutableList<CompletedRequirementInfo>? completedRequirements;
                if (!completedIndividualRequirements.TryGetValue(person.Id, out completedRequirements))
                    completedRequirements = ImmutableList<CompletedRequirementInfo>.Empty;
                
                foreach (var (roleName, rolePolicy) in policy.VolunteerPolicy.VolunteerRoles)
                {
                    foreach (var policyVersion in rolePolicy.PolicyVersions)
                    {
                        var version = policyVersion.Version;
                        var supersededAtUtc = policyVersion.SupersededAtUtc;

                        var requirementsMet = policyVersion.Requirements.Select(requirement =>
                            (requirement.ActionName, requirement.Stage, RequirementMet: completedRequirements.Any(x =>
                                x.RequirementName == requirement.ActionName &&
                                (supersededAtUtc == null || x.CompletedAtUtc < supersededAtUtc))))
                            .ToList();

                        if (requirementsMet.All(x => x.RequirementMet))
                            AddToEntryList(individualRoles, roleName, new RoleVersionApproval(version, RoleApprovalStatus.Onboarded));
                        else if (requirementsMet
                            .Where(x => x.Stage == RequirementStage.Application || x.Stage == RequirementStage.Approval)
                            .All(x => x.RequirementMet))
                        {
                            AddToEntryList(individualRoles, roleName, new RoleVersionApproval(version, RoleApprovalStatus.Approved));
                            missingRequirements.UnionWith(requirementsMet
                                .Where(x => !x.RequirementMet && x.Stage == RequirementStage.Onboarding)
                                .Select(x => x.ActionName));
                        }
                        else if (requirementsMet
                            .Where(x => x.Stage == RequirementStage.Application)
                            .All(x => x.RequirementMet))
                        {
                            AddToEntryList(individualRoles, roleName, new RoleVersionApproval(version, RoleApprovalStatus.Prospective));
                            missingRequirements.UnionWith(requirementsMet
                                .Where(x => !x.RequirementMet && x.Stage == RequirementStage.Approval)
                                .Select(x => x.ActionName));
                        }
                        else
                        {
                            availableApplications.UnionWith(requirementsMet
                                .Where(x => !x.RequirementMet && x.Stage == RequirementStage.Application)
                                .Select(x => x.ActionName));
                        }
                    }
                }
                missingIndividualRequirements[person.Id] = missingRequirements;
                return (person.Id, new VolunteerApprovalStatus(individualRoles.ToImmutableDictionary(),
                    ImmutableList<string>.Empty, availableApplications.ToImmutableList()));
            }).ToImmutableDictionary(x => x.Item1, x => x.Item2);

            var familyRoles = new Dictionary<string, ImmutableList<RoleVersionApproval>>();
            foreach (var (roleName, rolePolicy) in policy.VolunteerPolicy.VolunteerFamilyRoles)
            {
                foreach (var policyVersion in rolePolicy.PolicyVersions)
                {
                    var version = policyVersion.Version;
                    var supersededAtUtc = policyVersion.SupersededAtUtc;

                    var requirementsMet = policyVersion.Requirements.Select(requirement =>
                        (requirement.ActionName, requirement.Stage, requirement.Scope, RequirementMet: requirement.Scope switch
                        {
                            VolunteerFamilyRequirementScope.AllAdultsInTheFamily => family.Adults.All(a =>
                            {
                                var (person, familyRelationship) = a;
                                return completedIndividualRequirements.TryGetValue(person.Id, out var completedRequirements)
                                    && completedRequirements.Any(x => x.RequirementName == requirement.ActionName &&
                                    (supersededAtUtc == null || x.CompletedAtUtc < supersededAtUtc));
                            }),
                            VolunteerFamilyRequirementScope.OncePerFamily => completedFamilyRequirements.Any(x =>
                                x.RequirementName == requirement.ActionName &&
                                (supersededAtUtc == null || x.CompletedAtUtc < supersededAtUtc)),
                            _ => throw new NotImplementedException(
                                $"The volunteer family requirement scope '{requirement.Scope}' has not been implemented.")
                        }, RequirementMissingForIndividuals: requirement.Scope switch
                        {
                            VolunteerFamilyRequirementScope.AllAdultsInTheFamily => family.Adults.Where(a =>
                            {
                                var (person, familyRelationship) = a;
                                return !completedIndividualRequirements.TryGetValue(person.Id, out var completedRequirements)
                                    || !completedRequirements.Any(x => x.RequirementName == requirement.ActionName &&
                                    (supersededAtUtc == null || x.CompletedAtUtc < supersededAtUtc));
                            }).Select(a => a.Item1.Id).ToList(),
                            VolunteerFamilyRequirementScope.OncePerFamily => new List<Guid>(),
                            _ => throw new NotImplementedException(
                                $"The volunteer family requirement scope '{requirement.Scope}' has not been implemented.")
                        })).ToList();

                    if (requirementsMet.All(x => x.RequirementMet))
                        AddToEntryList(familyRoles, roleName, new RoleVersionApproval(version, RoleApprovalStatus.Onboarded));
                    else if (requirementsMet
                        .Where(x => x.Stage == RequirementStage.Application || x.Stage == RequirementStage.Approval)
                        .All(x => x.RequirementMet))
                    {
                        AddToEntryList(familyRoles, roleName, new RoleVersionApproval(version, RoleApprovalStatus.Approved));
                        missingFamilyRequirements.UnionWith(requirementsMet
                            .Where(x => !x.RequirementMet && x.Stage == RequirementStage.Onboarding
                                && x.Scope == VolunteerFamilyRequirementScope.OncePerFamily)
                            .Select(x => x.ActionName));
                        foreach (var (PersonId, ActionName) in requirementsMet
                            .Where(x => x.Stage == RequirementStage.Onboarding)
                            .SelectMany(x => x.RequirementMissingForIndividuals.Select(y => (PersonId: y, x.ActionName))))
                            missingIndividualRequirements[PersonId].Add(ActionName);
                    }
                    else if (requirementsMet
                        .Where(x => x.Stage == RequirementStage.Application)
                        .All(x => x.RequirementMet))
                    {
                        AddToEntryList(familyRoles, roleName, new RoleVersionApproval(version, RoleApprovalStatus.Prospective));
                        missingFamilyRequirements.UnionWith(requirementsMet
                            .Where(x => !x.RequirementMet && x.Stage == RequirementStage.Approval
                                && x.Scope == VolunteerFamilyRequirementScope.OncePerFamily)
                            .Select(x => x.ActionName));
                        foreach (var (PersonId, ActionName) in requirementsMet
                            .Where(x => x.Stage == RequirementStage.Approval)
                            .SelectMany(x => x.RequirementMissingForIndividuals.Select(y => (PersonId: y, x.ActionName))))
                            missingIndividualRequirements[PersonId].Add(ActionName);
                    }
                    else
                    {
                        availableFamilyApplications.UnionWith(requirementsMet
                            .Where(x => !x.RequirementMet && x.Stage == RequirementStage.Application
                                && x.Scope == VolunteerFamilyRequirementScope.OncePerFamily)
                            .Select(x => x.ActionName));
                    }
                }
            }

            return new VolunteerFamilyApprovalStatus(
                familyRoles.ToImmutableDictionary(),
                missingFamilyRequirements.ToImmutableList(),
                availableFamilyApplications.ToImmutableList(),
                individualVolunteerRoles.ToImmutableDictionary(
                    x => x.Key,
                    x => x.Value with { MissingIndividualRequirements = missingIndividualRequirements[x.Key].ToImmutableList() }));
        }
    }
}

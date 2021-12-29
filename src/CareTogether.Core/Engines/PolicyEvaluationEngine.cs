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
            ImmutableList<ExemptedRequirementInfo> exemptedFamilyRequirements,
            ImmutableList<RemovedRole> removedFamilyRoles,
            ImmutableDictionary<Guid, ImmutableList<CompletedRequirementInfo>> completedIndividualRequirements,
            ImmutableDictionary<Guid, ImmutableList<ExemptedRequirementInfo>> exemptedIndividualRequirements,
            ImmutableDictionary<Guid, ImmutableList<RemovedRole>> removedIndividualRoles)
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

                ImmutableList<RemovedRole>? removedRoles;
                if (!removedIndividualRoles.TryGetValue(person.Id, out removedRoles))
                    removedRoles = ImmutableList<RemovedRole>.Empty;

                foreach (var (roleName, rolePolicy) in policy.VolunteerPolicy.VolunteerRoles
                    .Where(role => !removedRoles.Any(x => x.RoleName == role.Key)))
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
                    removedRoles, ImmutableList<string>.Empty, availableApplications.ToImmutableList()));
            }).ToImmutableDictionary(x => x.Item1, x => x.Item2);

            var familyRoles = new Dictionary<string, ImmutableList<RoleVersionApproval>>();
            foreach (var (roleName, rolePolicy) in policy.VolunteerPolicy.VolunteerFamilyRoles
                .Where(role => !removedFamilyRoles.Any(x => x.RoleName == role.Key)))
            {
                foreach (var policyVersion in rolePolicy.PolicyVersions)
                {
                    var version = policyVersion.Version;
                    var supersededAtUtc = policyVersion.SupersededAtUtc;

                    var requirementsMet = policyVersion.Requirements.Select(requirement =>
                        (requirement.ActionName, requirement.Stage, requirement.Scope, RequirementMet: requirement.Scope switch
                        {
                            VolunteerFamilyRequirementScope.AllAdultsInTheFamily => family.Adults.Where(a => a.Item1.Active).All(a =>
                            {
                                var (person, familyRelationship) = a;
                                return completedIndividualRequirements.TryGetValue(person.Id, out var completedRequirements)
                                    && completedRequirements.Any(x => x.RequirementName == requirement.ActionName &&
                                    (supersededAtUtc == null || x.CompletedAtUtc < supersededAtUtc));
                            }),
                            VolunteerFamilyRequirementScope.AllParticipatingAdultsInTheFamily => family.Adults.Where(a => a.Item1.Active).All(a =>
                            {
                                var (person, familyRelationship) = a;
                                return (removedIndividualRoles.TryGetValue(person.Id, out var removedRoles)
                                        && removedRoles.Any(x => x.RoleName == roleName)) ||
                                    (completedIndividualRequirements.TryGetValue(person.Id, out var completedRequirements)
                                        && completedRequirements.Any(x => x.RequirementName == requirement.ActionName &&
                                        (supersededAtUtc == null || x.CompletedAtUtc < supersededAtUtc)));
                            }),
                            VolunteerFamilyRequirementScope.OncePerFamily => completedFamilyRequirements.Any(x =>
                                x.RequirementName == requirement.ActionName &&
                                (supersededAtUtc == null || x.CompletedAtUtc < supersededAtUtc)),
                            _ => throw new NotImplementedException(
                                $"The volunteer family requirement scope '{requirement.Scope}' has not been implemented.")
                        }, RequirementMissingForIndividuals: requirement.Scope switch
                        {
                            VolunteerFamilyRequirementScope.AllAdultsInTheFamily => family.Adults.Where(a => a.Item1.Active).Where(a =>
                            {
                                var (person, familyRelationship) = a;
                                return !completedIndividualRequirements.TryGetValue(person.Id, out var completedRequirements)
                                    || !completedRequirements.Any(x => x.RequirementName == requirement.ActionName &&
                                    (supersededAtUtc == null || x.CompletedAtUtc < supersededAtUtc));
                            }).Select(a => a.Item1.Id).ToList(),
                            VolunteerFamilyRequirementScope.AllParticipatingAdultsInTheFamily => family.Adults.Where(a => a.Item1.Active).Where(a =>
                            {
                                var (person, familyRelationship) = a;
                                return !(removedIndividualRoles.TryGetValue(person.Id, out var removedRoles)
                                        && removedRoles.Any(x => x.RoleName == roleName)) &&
                                    (!completedIndividualRequirements.TryGetValue(person.Id, out var completedRequirements)
                                        || !completedRequirements.Any(x => x.RequirementName == requirement.ActionName &&
                                        (supersededAtUtc == null || x.CompletedAtUtc < supersededAtUtc)));
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
                removedFamilyRoles,
                missingFamilyRequirements.ToImmutableList(),
                availableFamilyApplications.ToImmutableList(),
                individualVolunteerRoles.ToImmutableDictionary(
                    x => x.Key,
                    x => x.Value with { MissingIndividualRequirements = missingIndividualRequirements[x.Key].ToImmutableList() }));
        }

        public async Task<ReferralStatus> CalculateReferralStatusAsync(
            Guid organizationId, Guid locationId, Family family,
            ReferralEntry referralEntry)
        {
            var policy = await policiesResource.GetCurrentPolicy(organizationId, locationId);

            var missingIntakeRequirements = policy.ReferralPolicy.RequiredIntakeActionNames.Where(requiredAction =>
                !referralEntry.CompletedRequirements.Any(completed => completed.RequirementName == requiredAction))
                .ToImmutableList();

            var individualArrangements = referralEntry.Arrangements.ToImmutableDictionary(
                arrangement => arrangement.Key,
                arrangement =>
                {
                    ArrangementPolicy arrangementPolicy = policy.ReferralPolicy.ArrangementPolicies
                        .Single(p => p.ArrangementType == arrangement.Value.ArrangementType);

                    var missingSetupRequirements = arrangementPolicy.RequiredSetupActionNames.Where(requiredAction =>
                        !arrangement.Value.CompletedRequirements.Any(completed => completed.RequirementName == requiredAction))
                        .ToImmutableList();

                    var missingMonitoringRequirements = ImmutableList<string>.Empty;

                    var missingCloseoutRequirements = arrangementPolicy.RequiredCloseoutActionNames.Where(requiredAction =>
                        !arrangement.Value.CompletedRequirements.Any(completed => completed.RequirementName == requiredAction))
                        .ToImmutableList();

                    var missingFunctionAssignments = arrangementPolicy.VolunteerFunctions
                        .Where(vf => (vf.Requirement == FunctionRequirement.ExactlyOne || vf.Requirement == FunctionRequirement.OneOrMore) &&
                            arrangement.Value.FamilyVolunteerAssignments.Where(fva => fva.ArrangementFunction == vf.ArrangementFunction).Count() == 0 &&
                            arrangement.Value.IndividualVolunteerAssignments.Where(iva => iva.ArrangementFunction == vf.ArrangementFunction).Count() == 0)
                        .ToImmutableList();

                    var phase = missingSetupRequirements.Count > 0 || missingFunctionAssignments.Count > 0
                        ? ArrangementPhase.SettingUp
                        : !arrangement.Value.StartedAtUtc.HasValue
                        ? ArrangementPhase.ReadyToStart
                        : !arrangement.Value.EndedAtUtc.HasValue
                        ? ArrangementPhase.Started
                        : ArrangementPhase.Ended;

                    var missingRequirements = phase switch
                    {
                        ArrangementPhase.SettingUp => missingSetupRequirements,
                        ArrangementPhase.ReadyToStart => ImmutableList<string>.Empty,
                        ArrangementPhase.Started => missingMonitoringRequirements,
                        ArrangementPhase.Ended => missingCloseoutRequirements,
                        _ => throw new NotImplementedException($"The arrangement phase '{phase}' has not been implemented.")
                    };

                    return new ArrangementStatus(phase,
                        missingRequirements);
                });

            return new ReferralStatus(
                missingIntakeRequirements,
                individualArrangements);
        }
    }
}

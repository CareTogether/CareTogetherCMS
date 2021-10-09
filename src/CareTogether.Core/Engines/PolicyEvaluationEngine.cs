using CareTogether.Managers;
using CareTogether.Resources;
using OneOf;
using OneOf.Types;
using System;
using System.Collections.Generic;
using System.Collections.Immutable;
using System.Linq;
using System.Security.Claims;
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


        public async Task<bool> AuthorizeArrangementCommandAsync(
            Guid organizationId, Guid locationId, ClaimsPrincipal user, ArrangementCommand command, Referral referral)
        {
            await Task.Yield();
            return true;
            //throw new NotImplementedException();
        }

        public async Task<bool> AuthorizeArrangementNoteCommandAsync(
            Guid organizationId, Guid locationId, ClaimsPrincipal user, ArrangementNoteCommand command, Referral referral)
        {
            await Task.Yield();
            return true;
            //throw new NotImplementedException();
        }

        public async Task<bool> AuthorizeReferralCommandAsync(
            Guid organizationId, Guid locationId, ClaimsPrincipal user, ReferralCommand command, Referral referral)
        {
            await Task.Yield();
            return true;
            //throw new NotImplementedException();
        }

        public async Task<bool> AuthorizeVolunteerCommandAsync(
            Guid organizationId, Guid locationId, ClaimsPrincipal user, VolunteerCommand command, VolunteerFamily volunteerFamily)
        {
            await Task.Yield();
            return true;
            //throw new NotImplementedException();
        }

        public async Task<bool> AuthorizeVolunteerFamilyCommandAsync(
            Guid organizationId, Guid locationId, ClaimsPrincipal user, VolunteerFamilyCommand command, VolunteerFamily volunteerFamily)
        {
            await Task.Yield();
            return true;
            //throw new NotImplementedException();
        }


        public async Task<VolunteerFamilyApprovalStatus> CalculateVolunteerFamilyApprovalStatusAsync(Guid organizationId, Guid locationId,
            Family family, ImmutableList<CompletedRequirementInfo> completedFamilyRequirements,
            ImmutableDictionary<Guid, ImmutableList<CompletedRequirementInfo>> completedIndividualRequirements)
        {
            var policy = await policiesResource.GetCurrentPolicy(organizationId, locationId);

            var missingFamilyRequirements = new HashSet<string>();
            var missingIndividualRequirements = new Dictionary<Guid, HashSet<string>>();

            var individualVolunteerRoles = family.Adults.Select(x =>
            {
                var (person, familyRelationship) = x;
                var individualRoles = new Dictionary<(string Role, string Version), RoleApprovalStatus>();
                var missingRequirements = new HashSet<string>();

                if (completedIndividualRequirements.TryGetValue(person.Id, out var completedRequirements))
                {
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
                                individualRoles[(roleName, version)] = RoleApprovalStatus.Onboarded;
                            else if (requirementsMet.Where(x => x.Stage == RequirementStage.Application || x.Stage == RequirementStage.Approval).All(x => x.RequirementMet))
                            {
                                individualRoles[(roleName, version)] = RoleApprovalStatus.Approved;
                                missingRequirements.UnionWith(requirementsMet
                                    .Where(x => !x.RequirementMet && x.Stage == RequirementStage.Onboarding)
                                    .Select(x => x.ActionName));
                            }
                            else if (requirementsMet.Where(x => x.Stage == RequirementStage.Application).All(x => x.RequirementMet))
                            {
                                individualRoles[(roleName, version)] = RoleApprovalStatus.Prospective;
                                missingRequirements.UnionWith(requirementsMet
                                    .Where(x => !x.RequirementMet && x.Stage == RequirementStage.Approval)
                                    .Select(x => x.ActionName));
                            }
                        }
                    }
                }
                missingIndividualRequirements[person.Id] = missingRequirements;
                return (person.Id, new VolunteerApprovalStatus(individualRoles.ToImmutableDictionary(), ImmutableList<string>.Empty));
            }).ToImmutableDictionary(x => x.Item1, x => x.Item2);

            var familyRoles = new Dictionary<(string Role, string Version), RoleApprovalStatus>();
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
                        familyRoles[(roleName, version)] = RoleApprovalStatus.Onboarded;
                    else if (requirementsMet.Where(x => x.Stage == RequirementStage.Application || x.Stage == RequirementStage.Approval).All(x => x.RequirementMet))
                    {
                        familyRoles[(roleName, version)] = RoleApprovalStatus.Approved;
                        missingFamilyRequirements.UnionWith(requirementsMet
                            .Where(x => !x.RequirementMet && x.Stage == RequirementStage.Onboarding
                                && x.Scope == VolunteerFamilyRequirementScope.OncePerFamily)
                            .Select(x => x.ActionName));
                        foreach (var (PersonId, ActionName) in requirementsMet
                            .Where(x => x.Stage == RequirementStage.Onboarding)
                            .SelectMany(x => x.RequirementMissingForIndividuals.Select(y => (PersonId: y, x.ActionName))))
                            missingIndividualRequirements[PersonId].Add(ActionName);
                    }
                    else if (requirementsMet.Where(x => x.Stage == RequirementStage.Application).All(x => x.RequirementMet))
                    {
                        familyRoles[(roleName, version)] = RoleApprovalStatus.Prospective;
                        missingFamilyRequirements.UnionWith(requirementsMet
                            .Where(x => !x.RequirementMet && x.Stage == RequirementStage.Approval
                                && x.Scope == VolunteerFamilyRequirementScope.OncePerFamily)
                            .Select(x => x.ActionName));
                        foreach (var (PersonId, ActionName) in requirementsMet
                            .Where(x => x.Stage == RequirementStage.Approval)
                            .SelectMany(x => x.RequirementMissingForIndividuals.Select(y => (PersonId: y, x.ActionName))))
                            missingIndividualRequirements[PersonId].Add(ActionName);
                    }
                }
            }

            return new VolunteerFamilyApprovalStatus(
                familyRoles.ToImmutableDictionary(),
                missingFamilyRequirements.ToImmutableList(),
                individualVolunteerRoles.ToImmutableDictionary(
                    x => x.Key,
                    x => x.Value with { MissingIndividualRequirements = missingIndividualRequirements[x.Key].ToImmutableList() }));
        }

        public async Task<Arrangement> DiscloseArrangementAsync(ClaimsPrincipal user, Arrangement arrangement)
        {
            await Task.Yield();
            return arrangement;
            //throw new NotImplementedException();
        }

        public async Task<ContactInfo> DiscloseContactInfoAsync(ClaimsPrincipal user, ContactInfo contactInfo)
        {
            await Task.Yield();
            return contactInfo;
            //throw new NotImplementedException();
        }

        public async Task<Family> DiscloseFamilyAsync(ClaimsPrincipal user, Family family)
        {
            await Task.Yield();
            return family;
            //throw new NotImplementedException();
        }

        public async Task<Person> DisclosePersonAsync(ClaimsPrincipal user, Person person)
        {
            await Task.Yield();
            return person;
            //throw new NotImplementedException();
        }

        public async Task<Referral> DiscloseReferralAsync(ClaimsPrincipal user, Referral referral)
        {
            await Task.Yield();
            return referral;
            //throw new NotImplementedException();
        }

        public async Task<VolunteerFamily> DiscloseVolunteerFamilyAsync(ClaimsPrincipal user, VolunteerFamily volunteerFamily)
        {
            await Task.Yield();
            return volunteerFamily;
            //throw new NotImplementedException();
        }
    }
}

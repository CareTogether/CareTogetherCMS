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

            var individualVolunteerRoles = family.Adults.Select(x =>
            {
                var (person, familyRelationship) = x;
                var individualRoles = new Dictionary<(string Role, string Version), RoleApprovalStatus>();
                var missingRequirements = new List<string>();

                if (completedIndividualRequirements.TryGetValue(person.Id, out var completedRequirements))
                {
                    foreach (var (roleName, rolePolicy) in policy.VolunteerPolicy.VolunteerRoles)
                    {
                        foreach (var policyVersion in rolePolicy.PolicyVersions)
                        {
                            var version = policyVersion.Version;
                            var supersededAtUtc = policyVersion.SupersededAtUtc;

                            var requirementsMet = policyVersion.Requirements.Select(requirement =>
                                (requirement.Stage, RequirementMet: completedRequirements.Any(x =>
                                    x.RequirementName == requirement.ActionName &&
                                    (supersededAtUtc == null || x.CompletedAtUtc < supersededAtUtc))))
                                .ToList();

                            if (requirementsMet.All(x => x.RequirementMet))
                                individualRoles[(roleName, version)] = RoleApprovalStatus.Onboarded;
                            else if (requirementsMet.Where(x => x.Stage == RequirementStage.Application || x.Stage == RequirementStage.Approval).All(x => x.RequirementMet))
                                individualRoles[(roleName, version)] = RoleApprovalStatus.Approved;
                            else if (requirementsMet.Where(x => x.Stage == RequirementStage.Application).All(x => x.RequirementMet))
                                individualRoles[(roleName, version)] = RoleApprovalStatus.Prospective;
                        }
                    }
                }
                return (person.Id, new VolunteerApprovalStatus(individualRoles.ToImmutableDictionary(), missingRequirements.ToImmutableList()));
            }).ToImmutableDictionary(x => x.Item1, x => x.Item2);

            var familyRoles = new Dictionary<(string Role, string Version), RoleApprovalStatus>();
            var missingRequirements = new List<string>();
            foreach (var (roleName, rolePolicy) in policy.VolunteerPolicy.VolunteerFamilyRoles)
            {
                foreach (var policyVersion in rolePolicy.PolicyVersions)
                {
                    var version = policyVersion.Version;
                    var supersededAtUtc = policyVersion.SupersededAtUtc;

                    var requirementsMet = policyVersion.Requirements.Select(requirement =>
                        (requirement.Stage, RequirementMet: requirement.Scope switch
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
                        })).ToList();

                    if (requirementsMet.All(x => x.RequirementMet))
                        familyRoles[(roleName, version)] = RoleApprovalStatus.Onboarded;
                    else if (requirementsMet.Where(x => x.Stage == RequirementStage.Application || x.Stage == RequirementStage.Approval).All(x => x.RequirementMet))
                        familyRoles[(roleName, version)] = RoleApprovalStatus.Approved;
                    else if (requirementsMet.Where(x => x.Stage == RequirementStage.Application).All(x => x.RequirementMet))
                        familyRoles[(roleName, version)] = RoleApprovalStatus.Prospective;
                }
            }

            return new VolunteerFamilyApprovalStatus(
                familyRoles.ToImmutableDictionary(),
                missingRequirements.ToImmutableList(),
                individualVolunteerRoles);
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

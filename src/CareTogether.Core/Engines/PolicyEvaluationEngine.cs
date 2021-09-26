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


        public async Task<OneOf<Yes, Error<string>>> AuthorizeArrangementCommandAsync(
            Guid organizationId, Guid locationId, ClaimsPrincipal user, ArrangementCommand command, Referral referral)
        {
            await Task.Yield();
            return new Yes();
            //throw new NotImplementedException();
        }

        public async Task<OneOf<Yes, Error<string>>> AuthorizeArrangementNoteCommandAsync(
            Guid organizationId, Guid locationId, ClaimsPrincipal user, ArrangementNoteCommand command, Referral referral)
        {
            await Task.Yield();
            return new Yes();
            //throw new NotImplementedException();
        }

        public async Task<OneOf<Yes, Error<string>>> AuthorizeReferralCommandAsync(
            Guid organizationId, Guid locationId, ClaimsPrincipal user, ReferralCommand command, Referral referral)
        {
            await Task.Yield();
            return new Yes();
            //throw new NotImplementedException();
        }

        public async Task<OneOf<Yes, Error<string>>> AuthorizeVolunteerCommandAsync(
            Guid organizationId, Guid locationId, ClaimsPrincipal user, VolunteerCommand command, VolunteerFamily volunteerFamily)
        {
            await Task.Yield();
            return new Yes();
            //throw new NotImplementedException();
        }

        public async Task<OneOf<Yes, Error<string>>> AuthorizeVolunteerFamilyCommandAsync(
            Guid organizationId, Guid locationId, ClaimsPrincipal user, VolunteerFamilyCommand command, VolunteerFamily volunteerFamily)
        {
            await Task.Yield();
            return new Yes();
            //throw new NotImplementedException();
        }


        public async Task<VolunteerFamilyApprovalStatus> CalculateVolunteerFamilyApprovalStatusAsync(Guid organizationId, Guid locationId,
            Family family, ImmutableList<FormUploadInfo> familyFormUploads, ImmutableList<ActivityInfo> familyActivitiesPerformed,
            ImmutableDictionary<Guid, (ImmutableList<FormUploadInfo> FormUploads, ImmutableList<ActivityInfo> ActivitiesPerformed)> individualInfo)
        {
            var policyResult = await policiesResource.GetCurrentPolicy(organizationId, locationId);
            if (!policyResult.TryPickT0(out var policy, out var error))
                throw new InvalidOperationException(error.ToString());

            var individualVolunteerRoles = family.Adults.Select(x =>
            {
                var (person, familyRelationship) = x;
                var individualRoles = new Dictionary<(string Role, string Version), RoleApprovalStatus>();

                if (individualInfo.TryGetValue(person.Id, out var personIndividualInfo))
                {
                    var (formUploads, activities) = personIndividualInfo;

                    foreach (var (roleName, rolePolicy) in policy.VolunteerPolicy.VolunteerRoles)
                    {
                        foreach (var (version, requirements) in rolePolicy.ApprovalRequirementsByPolicyVersion)
                        {
                            var requirementsMet = requirements.Select(requirement =>
                                (requirement.Stage, RequirementMet: policy.ActionDefinitions[requirement.ActionName] switch
                                {
                                    FormUploadRequirement r => formUploads.Any(upload => upload.FormName == r.FormName),
                                    ActivityRequirement r => activities.Any(activity => activity.ActivityName == r.ActivityName),
                                    _ => throw new NotImplementedException(
                                        $"The action requirement type '{policy.ActionDefinitions[requirement.ActionName].GetType().FullName}' has not been implemented.")
                                })).ToList();

                            if (requirementsMet.All(x => x.RequirementMet))
                                individualRoles[(roleName, version)] = RoleApprovalStatus.Onboarded;
                            else if (requirementsMet.Where(x => x.Stage == RequirementStage.Application || x.Stage == RequirementStage.Approval).All(x => x.RequirementMet))
                                individualRoles[(roleName, version)] = RoleApprovalStatus.Approved;
                            else if (requirementsMet.Where(x => x.Stage == RequirementStage.Application).All(x => x.RequirementMet))
                                individualRoles[(roleName, version)] = RoleApprovalStatus.Prospective;
                        }
                    }
                }
                return (person.Id, new VolunteerApprovalStatus(individualRoles.ToImmutableDictionary()));
            }).ToImmutableDictionary(x => x.Item1, x => x.Item2);

            var familyRoles = new Dictionary<(string Role, string Version), RoleApprovalStatus>();
            foreach (var (roleName, rolePolicy) in policy.VolunteerPolicy.VolunteerFamilyRoles)
            {
                foreach (var (version, requirements) in rolePolicy.ApprovalRequirementsByPolicyVersion)
                {
                    var requirementsMet = requirements.Select(requirement =>
                        (requirement.Stage, RequirementMet: requirement.Scope switch
                        {
                            VolunteerFamilyRequirementScope.AllAdultsInTheFamily => policy.ActionDefinitions[requirement.ActionName] switch
                            {
                                FormUploadRequirement r => family.Adults.All(x =>
                                {
                                    var (person, familyRelationship) = x;
                                    if (individualInfo.TryGetValue(person.Id, out var personIndividualInfo))
                                    {
                                        var (formUploads, activities) = personIndividualInfo;
                                        return formUploads.Any(upload => upload.FormName == r.FormName);
                                    }
                                    return false;
                                }),
                                ActivityRequirement r => family.Adults.All(x =>
                                {
                                    var (person, familyRelationship) = x;
                                    if (individualInfo.TryGetValue(person.Id, out var personIndividualInfo))
                                    {
                                        var (formUploads, activities) = personIndividualInfo;
                                        return activities.Any(activity => activity.ActivityName == r.ActivityName);
                                    }
                                    return false;
                                }),
                                _ => throw new NotImplementedException(
                                    $"The action requirement type '{policy.ActionDefinitions[requirement.ActionName].GetType().FullName}' " +
                                    $"has not been implemented for scope '{nameof(VolunteerFamilyRequirementScope.AllAdultsInTheFamily)}'.")
                            },
                            VolunteerFamilyRequirementScope.OncePerFamily => policy.ActionDefinitions[requirement.ActionName] switch
                            {
                                FormUploadRequirement r => familyFormUploads.Any(upload => upload.FormName == r.FormName),
                                ActivityRequirement r => familyActivitiesPerformed.Any(activity => activity.ActivityName == r.ActivityName),
                                _ => throw new NotImplementedException(
                                    $"The action requirement type '{policy.ActionDefinitions[requirement.ActionName].GetType().FullName}' " +
                                    $"has not been implemented for scope '{nameof(VolunteerFamilyRequirementScope.OncePerFamily)}'.")
                            },
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

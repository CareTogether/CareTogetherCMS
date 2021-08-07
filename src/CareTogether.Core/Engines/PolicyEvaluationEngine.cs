using CareTogether.Managers;
using CareTogether.Resources;
using OneOf;
using OneOf.Types;
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


        public async Task<OneOf<Yes, Error<string>>> AuthorizeArrangementCommandAsync(
            Guid organizationId, Guid locationId, AuthorizedUser user, ArrangementCommand command, Referral referral)
        {
            await Task.Yield();
            return new Yes();
            //throw new NotImplementedException();
        }

        public async Task<OneOf<Yes, Error<string>>> AuthorizeArrangementNoteCommandAsync(
            Guid organizationId, Guid locationId, AuthorizedUser user, ArrangementNoteCommand command, Referral referral)
        {
            await Task.Yield();
            return new Yes();
            //throw new NotImplementedException();
        }

        public async Task<OneOf<Yes, Error<string>>> AuthorizeReferralCommandAsync(
            Guid organizationId, Guid locationId, AuthorizedUser user, ReferralCommand command, Referral referral)
        {
            await Task.Yield();
            return new Yes();
            //throw new NotImplementedException();
        }

        public async Task<OneOf<Yes, Error<string>>> AuthorizeVolunteerCommandAsync(
            Guid organizationId, Guid locationId, AuthorizedUser user, VolunteerCommand command, VolunteerFamily volunteerFamily)
        {
            await Task.Yield();
            return new Yes();
            //throw new NotImplementedException();
        }

        public async Task<OneOf<Yes, Error<string>>> AuthorizeVolunteerFamilyCommandAsync(
            Guid organizationId, Guid locationId, AuthorizedUser user, VolunteerFamilyCommand command, VolunteerFamily volunteerFamily)
        {
            await Task.Yield();
            return new Yes();
            //throw new NotImplementedException();
        }


        public async Task<VolunteerFamilyApprovalStatus> CalculateVolunteerFamilyApprovalStatusAsync(Guid organizationId, Guid locationId,
            Family family, ImmutableList<FormUploadInfo> familyFormUploads, ImmutableList<ActivityInfo> familyActivitiesPerformed,
            ImmutableDictionary<Guid, (ImmutableList<FormUploadInfo> FormUploads, ImmutableList<ActivityInfo> ActivitiesPerformed)> individualInfo)
        {
            var policyResult = await policiesResource.GetEffectiveVolunteerPolicy(organizationId, locationId);
            if (!policyResult.TryPickT0(out var policy, out var error))
                throw new InvalidOperationException(error.ToString());

            var individualVolunteerRoles = family.Adults.Select(x =>
            {
                var (person, familyRelationship) = x;
                var (formUploads, activities) = individualInfo[person.Id];

                var individualRoles = new Dictionary<string, RoleApprovalStatus>();
                foreach (var (roleName, rolePolicy) in policy.VolunteerRoles)
                {
                    var requirementsMet = rolePolicy.ApprovalRequirements.Select(requirement =>
                        (requirement.RequiredToBeProspective, RequirementMet: requirement.ActionRequirement switch
                        {
                            FormUploadRequirement r => formUploads.Any(upload => upload.FormName == r.FormName),
                            ActivityRequirement r => activities.Any(activity => activity.ActivityName == r.ActivityName),
                            _ => throw new NotImplementedException(
                                $"The action requirement type '{requirement.ActionRequirement.GetType().FullName}' has not been implemented.")
                        })).ToList();

                    if (requirementsMet.All(x => x.RequirementMet))
                        individualRoles[roleName] = RoleApprovalStatus.Approved;
                    else if (requirementsMet.Where(x => x.RequiredToBeProspective).All(x => x.RequirementMet))
                        individualRoles[roleName] = RoleApprovalStatus.Prospective;
                }
                return (person.Id, new VolunteerApprovalStatus(individualRoles.ToImmutableDictionary()));
            }).ToImmutableDictionary(x => x.Item1, x => x.Item2);

            var familyRoles = new Dictionary<string, RoleApprovalStatus>();
            foreach (var (roleName, rolePolicy) in policy.VolunteerFamilyRoles)
            {
                var requirementsMet = rolePolicy.ApprovalRequirements.Select(requirement =>
                    (requirement.RequiredToBeProspective, RequirementMet: requirement.Scope switch
                    {
                        VolunteerFamilyRequirementScope.AllAdultsInTheFamily => requirement.ActionRequirement switch
                        {
                            FormUploadRequirement r => family.Adults.All(x =>
                            {
                                var (person, familyRelationship) = x;
                                var (formUploads, activities) = individualInfo[person.Id];
                                return formUploads.Any(upload => upload.FormName == r.FormName);
                            }),
                            ActivityRequirement r => family.Adults.All(x =>
                            {
                                var (person, familyRelationship) = x;
                                var (formUploads, activities) = individualInfo[person.Id];
                                return activities.Any(activity => activity.ActivityName == r.ActivityName);
                            }),
                            _ => throw new NotImplementedException(
                                $"The action requirement type '{requirement.ActionRequirement.GetType().FullName}' " +
                                $"has not been implemented for scope '{nameof(VolunteerFamilyRequirementScope.AllAdultsInTheFamily)}'.")
                        },
                        VolunteerFamilyRequirementScope.OncePerFamily => requirement.ActionRequirement switch
                        {
                            FormUploadRequirement r => familyFormUploads.Any(upload => upload.FormName == r.FormName),
                            ActivityRequirement r => familyActivitiesPerformed.Any(activity => activity.ActivityName == r.ActivityName),
                            _ => throw new NotImplementedException(
                                $"The action requirement type '{requirement.ActionRequirement.GetType().FullName}' " +
                                $"has not been implemented for scope '{nameof(VolunteerFamilyRequirementScope.OncePerFamily)}'.")
                        },
                        _ => throw new NotImplementedException(
                            $"The volunteer family requirement scope '{requirement.Scope}' has not been implemented.")
                    })).ToList();

                if (requirementsMet.All(x => x.RequirementMet))
                    familyRoles[roleName] = RoleApprovalStatus.Approved;
                else if (requirementsMet.Where(x => x.RequiredToBeProspective).All(x => x.RequirementMet))
                    familyRoles[roleName] = RoleApprovalStatus.Prospective;
            }

            return new VolunteerFamilyApprovalStatus(
                familyRoles.ToImmutableDictionary(),
                individualVolunteerRoles);
        }

        public async Task<Arrangement> DiscloseArrangementAsync(AuthorizedUser user, Arrangement arrangement)
        {
            await Task.Yield();
            return arrangement;
            //throw new NotImplementedException();
        }

        public async Task<ContactInfo> DiscloseContactInfoAsync(AuthorizedUser user, ContactInfo contactInfo)
        {
            await Task.Yield();
            return contactInfo;
            //throw new NotImplementedException();
        }

        public async Task<Family> DiscloseFamilyAsync(AuthorizedUser user, Family family)
        {
            await Task.Yield();
            return family;
            //throw new NotImplementedException();
        }

        public async Task<Person> DisclosePersonAsync(AuthorizedUser user, Person person)
        {
            await Task.Yield();
            return person;
            //throw new NotImplementedException();
        }

        public async Task<Referral> DiscloseReferralAsync(AuthorizedUser user, Referral referral)
        {
            await Task.Yield();
            return referral;
            //throw new NotImplementedException();
        }

        public async Task<VolunteerFamily> DiscloseVolunteerFamilyAsync(AuthorizedUser user, VolunteerFamily volunteerFamily)
        {
            await Task.Yield();
            return volunteerFamily;
            //throw new NotImplementedException();
        }
    }
}

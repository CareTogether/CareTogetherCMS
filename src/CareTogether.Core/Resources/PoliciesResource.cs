using System;
using System.Collections.Generic;
using System.Collections.Immutable;
using System.Threading.Tasks;

namespace CareTogether.Resources
{
    public sealed class PoliciesResource : IPoliciesResource
    {
        public async Task<ResourceResult<ReferralPolicy>> GetEffectiveReferralPolicy(Guid organizationId, Guid locationId,
            int? version = null)
        {
            if (version == null)
                version = 1;
            else if (version != 1)
                return ResourceResult.NotFound;

            await Task.Yield();

            return new ReferralPolicy(version.Value, "Local test policy",
                new List<ActionRequirement>
                {
                    new FormUploadRequirement("Request for Help Form", "v1",
                        "Can be done over the phone", new Uri("http://example.com/forms/requestforhelp-v1")),
                    new ActivityRequirement("Intake Coordinator Screening Call"),
                    new FormUploadRequirement("Intake Form", "v1",
                        "Email or text the Cognito Form link", new Uri("http://example.com/forms/intake-v1"))
                }.ToImmutableList(),
                new List<ArrangementPolicy>
                {
                    new ArrangementPolicy("Hosting", ChildInvolvement.ChildHousing,
                        VolunteerFunctions: new List<VolunteerFunction>
                        {
                            new VolunteerFunction("Host Family", FunctionRequirement.OneOrMore,
                            EligibleIndividualVolunteerRoles: ImmutableList<string>.Empty,
                            EligibleVolunteerFamilyRoles: new List<string>
                            {
                                "Host Family"
                            }.ToImmutableList()),
                            new VolunteerFunction("Family Coach", FunctionRequirement.ExactlyOne,
                            EligibleIndividualVolunteerRoles: new List<string>
                            {
                                "Family Coach"
                            }.ToImmutableList(),
                            EligibleVolunteerFamilyRoles: ImmutableList<string>.Empty),
                            new VolunteerFunction("Parent Friend", FunctionRequirement.ZeroOrMore,
                            EligibleIndividualVolunteerRoles: new List<string>
                            {
                                "Family Coach",
                                "Family Friend"
                            }.ToImmutableList(),
                            EligibleVolunteerFamilyRoles: new List<string>
                            {
                                "Host Family"
                            }.ToImmutableList()),
                            new VolunteerFunction("Host Family Friend", FunctionRequirement.ZeroOrMore,
                            EligibleIndividualVolunteerRoles: new List<string>
                            {
                                "Family Coach",
                                "Family Friend"
                            }.ToImmutableList(),
                            EligibleVolunteerFamilyRoles: new List<string>
                            {
                                "Host Family"
                            }.ToImmutableList()),
                            new VolunteerFunction("Parent and Host Family Friend", FunctionRequirement.ZeroOrMore,
                            EligibleIndividualVolunteerRoles: new List<string>
                            {
                                "Family Coach",
                                "Family Friend"
                            }.ToImmutableList(),
                            EligibleVolunteerFamilyRoles: new List<string>
                            {
                                "Host Family"
                            }.ToImmutableList())
                        }.ToImmutableList(),
                        RequiredSetupActions: new List<ActionRequirement>
                        {
                            new FormUploadRequirement("Hosting Consent", "v1",
                                "This must be notarized.", new Uri("http://example.com/forms/consent-v1")),
                            new FormUploadRequirement("Medical POA", "v2",
                                "This must be notarized.", new Uri("http://example.com/forms/medicalpoa-v2"))
                        }.ToImmutableList(),
                        RequiredMonitoringActions: new List<(ActionRequirement, RecurrencePolicy)>
                        {
                            (new ActivityRequirement("Family Coach Safety Visit"),
                                new RecurrencePolicy(new List<RecurrencePolicyStage>
                                {
                                    new RecurrencePolicyStage(TimeSpan.FromHours(48), 1),
                                    new RecurrencePolicyStage(TimeSpan.FromDays(7), 5),
                                    new RecurrencePolicyStage(TimeSpan.FromDays(14), null)
                                }.ToImmutableList())),
                            (new ActivityRequirement("Family Coach Supervision"),
                                new RecurrencePolicy(new List<RecurrencePolicyStage>
                                {
                                    new RecurrencePolicyStage(TimeSpan.FromDays(7), null)
                                }.ToImmutableList()))
                        }.ToImmutableList(),
                        RequiredCloseoutActions: new List<ActionRequirement>
                        {
                            new FormUploadRequirement("Return of Child", "v1",
                                null, new Uri("http://example.com/forms/returnofchild-v1")),
                        }.ToImmutableList()),
                    new ArrangementPolicy("Friending", ChildInvolvement.NoChildInvolvement,
                        VolunteerFunctions: new List<VolunteerFunction>
                        {
                            new VolunteerFunction("Family Friend", FunctionRequirement.OneOrMore,
                            EligibleIndividualVolunteerRoles: new List<string>
                            {
                                "Family Coach",
                                "Family Friend"
                            }.ToImmutableList(),
                            EligibleVolunteerFamilyRoles: new List<string>
                            {
                                "Host Family"
                            }.ToImmutableList()),
                            new VolunteerFunction("Family Coach", FunctionRequirement.ExactlyOne,
                            EligibleIndividualVolunteerRoles: new List<string>
                            {
                                "Family Coach"
                            }.ToImmutableList(),
                            EligibleVolunteerFamilyRoles: ImmutableList<string>.Empty)
                        }.ToImmutableList(),
                        RequiredSetupActions: new List<ActionRequirement>
                        {
                            new FormUploadRequirement("Advocacy Agreement", "v1",
                                null, new Uri("http://example.com/forms/advocacy-v1")),
                        }.ToImmutableList(),
                        RequiredMonitoringActions: new List<(ActionRequirement, RecurrencePolicy)>
                        {
                            (new ActivityRequirement("Family Coach Checkin"),
                                new RecurrencePolicy(new List<RecurrencePolicyStage>
                                {
                                    new RecurrencePolicyStage(TimeSpan.FromDays(7), null)
                                }.ToImmutableList())),
                            (new ActivityRequirement("Family Coach Supervision"),
                                new RecurrencePolicy(new List<RecurrencePolicyStage>
                                {
                                    new RecurrencePolicyStage(TimeSpan.FromDays(7), null)
                                }.ToImmutableList()))
                        }.ToImmutableList(),
                        RequiredCloseoutActions: new List<ActionRequirement>
                        { }.ToImmutableList())
                }.ToImmutableList());
        }

        public async Task<ResourceResult<VolunteerPolicy>> GetEffectiveVolunteerPolicy(Guid organizationId, Guid locationId,
            int? version = null)
        {
            if (version == null)
                version = 1;
            else if (version != 1)
                return ResourceResult.NotFound;

            await Task.Yield();

            return new VolunteerPolicy(version.Value, "Local test policy",
                new Dictionary<string, VolunteerRolePolicy>
                {
                    ["Family Friend"] = new VolunteerRolePolicy("Family Friend", new List<VolunteerApprovalRequirement>
                    {
                        new VolunteerApprovalRequirement("Family Friend Application", true,
                            new FormUploadRequirement("Family Friend Application", "v1", null, new Uri("http://example.com/forms/app-ff"))),
                        new VolunteerApprovalRequirement("Background Check", false,
                            new FormUploadRequirement("Background Check", "v1", "See approval guide for directions", new Uri("http://example.com/forms/app-ff")))
                    }.ToImmutableList()),
                    ["Family Coach"] = new VolunteerRolePolicy("Family Coach", new List<VolunteerApprovalRequirement>
                    {
                        new VolunteerApprovalRequirement("Family Coach Application", true,
                            new FormUploadRequirement("Family Coach Application", "v1", null, new Uri("http://example.com/forms/app-fc"))),
                        new VolunteerApprovalRequirement("Background Check", false,
                            new FormUploadRequirement("Background Check", "v1", "See approval guide for directions", new Uri("http://example.com/forms/app-ff"))),
                        new VolunteerApprovalRequirement("Interview with Family Coach Supervisor", false,
                            new ActivityRequirement("Interview with Family Coach Supervisor"))
                    }.ToImmutableList())
                }.ToImmutableDictionary(),
                new Dictionary<string, VolunteerFamilyRolePolicy>
                {
                    ["Host Family"] = new VolunteerFamilyRolePolicy("Host Family", new List<VolunteerFamilyApprovalRequirement>
                    {
                        new VolunteerFamilyApprovalRequirement("Host Family Application", true,
                            new FormUploadRequirement("Host Family Application", "v1", null, new Uri("http://example.com/forms/app-hf")),
                            VolunteerFamilyRequirementScope.OncePerFamily),
                        new VolunteerFamilyApprovalRequirement("Background Check", false,
                            new FormUploadRequirement("Background Check", "v1", "See approval guide for directions", new Uri("http://example.com/forms/app-ff")),
                            VolunteerFamilyRequirementScope.AllAdultsInTheFamily),
                        new VolunteerFamilyApprovalRequirement("Home Screening Checklist", false,
                            new FormUploadRequirement("Home Screening Checklist", "v1", "Must be filled out by an approved home screener", new Uri("http://example.com/forms/hscheck")),
                            VolunteerFamilyRequirementScope.OncePerFamily),
                        new VolunteerFamilyApprovalRequirement("Host Family Interview", false,
                            new ActivityRequirement("Host Family Interview"),
                            VolunteerFamilyRequirementScope.OncePerFamily)
                    }.ToImmutableList())
                }.ToImmutableDictionary());
        }
    }
}

using JsonPolymorph;
using System;
using System.Collections.Immutable;
using System.Threading.Tasks;

namespace CareTogether.Resources
{
    public sealed record EffectiveLocationPolicy(int Version, string VersionLabel,
        ReferralPolicy ReferralPolicy,
        VolunteerPolicy VolunteerPolicy);

    public sealed record ReferralPolicy(
        ImmutableList<ActionRequirement> RequiredIntakeActions,
        ImmutableList<ArrangementPolicy> ArrangementPolicies);
        //TODO: Include referral close reasons

    public sealed record ArrangementPolicy(string ArrangementType,
        ChildInvolvement ChildInvolvement,
        ImmutableList<VolunteerFunction> VolunteerFunctions,
        ImmutableList<ActionRequirement> RequiredSetupActions,
        //TODO: Include draft note approval policy
        ImmutableList<(ActionRequirement Action, RecurrencePolicy Recurrence)> RequiredMonitoringActions,
        ImmutableList<ActionRequirement> RequiredCloseoutActions);
    public enum ChildInvolvement { ChildHousing, DaytimeChildCareOnly, NoChildInvolvement };

    public enum FunctionRequirement { ZeroOrMore, ExactlyOne, OneOrMore };
    public sealed record VolunteerFunction(string ArrangementFunction, FunctionRequirement Requirement,
        ImmutableList<string> EligibleIndividualVolunteerRoles, ImmutableList<string> EligibleVolunteerFamilyRoles);

    public sealed record RecurrencePolicy(ImmutableList<RecurrencePolicyStage> Stages);
    public sealed record RecurrencePolicyStage(TimeSpan Delay, int? MaxOccurrences);


    public sealed record VolunteerPolicy(
        ImmutableDictionary<string, VolunteerRolePolicy> VolunteerRoles,
        ImmutableDictionary<string, VolunteerFamilyRolePolicy> VolunteerFamilyRoles);

    public sealed record VolunteerRolePolicy(string VolunteerRoleType,
        ImmutableList<VolunteerApprovalRequirement> ApprovalRequirements);

    public sealed record VolunteerFamilyRolePolicy(string VolunteerFamilyRoleType,
        ImmutableList<VolunteerFamilyApprovalRequirement> ApprovalRequirements);

    public sealed record VolunteerApprovalRequirement(
        RequirementStage Stage, ActionRequirement ActionRequirement);

    public enum RequirementStage { Application, Approval, Onboarding }

    public sealed record VolunteerFamilyApprovalRequirement(
        RequirementStage Stage, ActionRequirement ActionRequirement, VolunteerFamilyRequirementScope Scope);

    public enum VolunteerFamilyRequirementScope { OncePerFamily, AllAdultsInTheFamily };


    [JsonHierarchyBase]
    public abstract partial record ActionRequirement(); //TODO: Include the arrangement function (who can perform the action)
    public sealed record FormUploadRequirement(string FormName, string FormVersion, string? Instructions, Uri? TemplateLink)
        : ActionRequirement;
    public sealed record ActivityRequirement(string ActivityName)
        : ActionRequirement;


    /// <summary>
    /// The <see cref="IPoliciesResource"/> is responsible for the configuration aspects of CareTogether.
    /// An organization can be comprised of multiple locations or chapters, each of which may implement
    /// policies that can inherit from the organization's base policies as well as global or regional policies.
    /// </summary>
    public interface IPoliciesResource
    {
        Task<ResourceResult<EffectiveLocationPolicy>> GetCurrentPolicy(Guid organizationId, Guid locationId);

        Task<ResourceResult<ReferralPolicy>> GetEffectiveReferralPolicy(Guid organizationId, Guid locationId,
            int? version = null);

        Task<ResourceResult<VolunteerPolicy>> GetEffectiveVolunteerPolicy(Guid organizationId, Guid locationId,
            int? version = null);
    }
}

using JsonPolymorph;
using System;
using System.Collections.Immutable;
using System.Threading.Tasks;

namespace CareTogether.Resources
{
    public sealed record ReferralPolicy(int Version,
        IImmutableList<ActionRequirement> RequiredIntakeActions,
        IImmutableList<ArrangementPolicy> ArrangementPolicies);
        //TODO: Include referral close reasons

    public sealed record ArrangementPolicy(string ArrangementType,
        ChildInvolvement ChildInvolvement,
        IImmutableList<VolunteerFunction> VolunteerFunctions,
        IImmutableList<ActionRequirement> RequiredSetupActions,
        //TODO: Include draft note approval policy
        IImmutableList<(ActionRequirement Action, RecurrencePolicy Recurrence)> RequiredMonitoringActions,
        IImmutableList<ActionRequirement> RequiredCloseoutActions);
    public enum ChildInvolvement { ChildHousing, DaytimeChildCareOnly, NoChildInvolvement };

    public enum FunctionRequirement { ZeroOrMore, ExactlyOne, OneOrMore };
    public sealed record VolunteerFunction(string ArrangementFunction, FunctionRequirement Requirement,
        IImmutableList<string> EligibleIndividualVolunteerRoles, IImmutableList<string> EligibleVolunteerFamilyRoles);

    public sealed record RecurrencePolicy(IImmutableList<RecurrencePolicyStage> Stages);
    public sealed record RecurrencePolicyStage(TimeSpan Delay, int? MaxOccurrences);

    [JsonHierarchyBase]
    public abstract partial record ActionRequirement(); //TODO: Include the arrangement function linked to the action
    public sealed record FormUploadRequirement(string FormName, string FormVersion, string Instructions, Uri TemplateLink)
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
        Task<ResourceResult<ReferralPolicy>> GetEffectiveReferralPolicy(Guid organizationId, Guid locationId,
            int? version = null);
    }
}

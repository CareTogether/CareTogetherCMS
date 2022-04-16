using JsonPolymorph;
using System;
using System.Collections.Immutable;
using System.Threading.Tasks;

namespace CareTogether.Resources.Policies
{
    public sealed record OrganizationConfiguration(string OrganizationName,
        ImmutableList<LocationConfiguration> Locations,
        ImmutableList<RoleDefinition> Roles,
        ImmutableDictionary<Guid, UserAccessConfiguration> Users);

    public sealed record LocationConfiguration(Guid Id, string Name,
        ImmutableList<string> Ethnicities, ImmutableList<string> AdultFamilyRelationships);

    public sealed record RoleDefinition(string RoleName, ImmutableList<Permission> Permissions);

    public sealed record UserAccessConfiguration(Guid PersonId,
        ImmutableList<UserLocationRole> LocationRoles);

    public sealed record UserLocationRole(Guid LocationId, string RoleName);

    public sealed record EffectiveLocationPolicy(
        ImmutableDictionary<string, ActionRequirement> ActionDefinitions,
        ReferralPolicy ReferralPolicy,
        VolunteerPolicy VolunteerPolicy);

    public enum DocumentLinkRequirement
    {
        None,
        Allowed,
        Required
    }

    public enum NoteEntryRequirement
    {
        None,
        Allowed,
        Required
    }

    public sealed record ActionRequirement(
        DocumentLinkRequirement DocumentLink, NoteEntryRequirement NoteEntry,
        string? Instructions, Uri? InfoLink);

    public sealed record ReferralPolicy(
        ImmutableList<string> RequiredIntakeActionNames,
        ImmutableList<CustomField> CustomFields,
        ImmutableList<ArrangementPolicy> ArrangementPolicies);
        //TODO: Include referral close reasons

    public sealed record CustomField(string Name, CustomFieldType Type);

    public enum CustomFieldType
    {
        Boolean,
        String
    }

    public sealed record ArrangementPolicy(string ArrangementType,
        ChildInvolvement ChildInvolvement,
        ImmutableList<ArrangementFunction> ArrangementFunctions,
        ImmutableList<string> RequiredSetupActionNames,
        ImmutableList<MonitoringRequirement> RequiredMonitoringActions,
        ImmutableList<string> RequiredCloseoutActionNames);
    public enum ChildInvolvement { ChildHousing, DaytimeChildCareOnly, NoChildInvolvement };

    public sealed record MonitoringRequirement(string ActionName, RecurrencePolicy Recurrence);

    public enum FunctionRequirement { ZeroOrMore, ExactlyOne, OneOrMore };
    public sealed record ArrangementFunction(string FunctionName, FunctionRequirement Requirement,
        ImmutableList<string> EligibleIndividualVolunteerRoles, ImmutableList<string> EligibleVolunteerFamilyRoles,
        ImmutableList<Guid> EligiblePeople);

    [JsonHierarchyBase]
    public abstract partial record RecurrencePolicy();
    public sealed record DurationStagesRecurrencePolicy(ImmutableList<RecurrencePolicyStage> Stages)
        : RecurrencePolicy;
    public sealed record DurationStagesPerChildLocationRecurrencePolicy(ImmutableList<RecurrencePolicyStage> Stages)
        : RecurrencePolicy;
    public sealed record ChildCareOccurrenceBasedRecurrencePolicy(
        TimeSpan Delay, int Frequency, int InitialSkipCount, bool Positive)
        : RecurrencePolicy;

    public sealed record RecurrencePolicyStage(TimeSpan Delay, int? MaxOccurrences);


    public sealed record VolunteerPolicy(
        ImmutableDictionary<string, VolunteerRolePolicy> VolunteerRoles,
        ImmutableDictionary<string, VolunteerFamilyRolePolicy> VolunteerFamilyRoles);

    public sealed record VolunteerRolePolicy(string VolunteerRoleType,
        ImmutableList<VolunteerRolePolicyVersion> PolicyVersions);

    public sealed record VolunteerRolePolicyVersion(string Version, DateTime? SupersededAtUtc,
        ImmutableList<VolunteerApprovalRequirement> Requirements);

    public sealed record VolunteerFamilyRolePolicy(string VolunteerFamilyRoleType,
        ImmutableList<VolunteerFamilyRolePolicyVersion> PolicyVersions);

    public sealed record VolunteerFamilyRolePolicyVersion(string Version, DateTime? SupersededAtUtc,
        ImmutableList<VolunteerFamilyApprovalRequirement> Requirements);

    public sealed record VolunteerApprovalRequirement(
        RequirementStage Stage, string ActionName);

    public enum RequirementStage { Application, Approval, Onboarding }

    public sealed record VolunteerFamilyApprovalRequirement(
        RequirementStage Stage, string ActionName, VolunteerFamilyRequirementScope Scope);

    public enum VolunteerFamilyRequirementScope { OncePerFamily, AllAdultsInTheFamily, AllParticipatingAdultsInTheFamily };


    /// <summary>
    /// The <see cref="IPoliciesResource"/> is responsible for the configuration aspects of CareTogether.
    /// An organization can be comprised of multiple locations or chapters, each of which may implement
    /// policies that can inherit from the organization's base policies as well as global or regional policies.
    /// </summary>
    public interface IPoliciesResource
    {
        Task<OrganizationConfiguration> GetConfigurationAsync(Guid organizationId);

        Task<EffectiveLocationPolicy> GetCurrentPolicy(Guid organizationId, Guid locationId);
    }
}

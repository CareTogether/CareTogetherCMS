using System;
using System.Collections.Immutable;
using System.Threading.Tasks;
using JsonPolymorph;

namespace CareTogether.Resources.Policies
{
    public sealed record OrganizationConfiguration(
        string OrganizationName,
        ImmutableList<LocationConfiguration> Locations,
        ImmutableList<RoleDefinition> Roles,
        ImmutableList<string> CommunityRoles
    );

    public sealed record LocationConfiguration(
        Guid Id,
        string Name,
        ImmutableList<string> Ethnicities,
        ImmutableList<string> AdultFamilyRelationships,
        ImmutableList<string>? ArrangementReasons,
        ImmutableList<SourcePhoneNumberConfiguration> SmsSourcePhoneNumbers,
        TimeZoneInfo? timeZone = null
    );

    public sealed record SourcePhoneNumberConfiguration(string SourcePhoneNumber, string Description);

    public sealed record RoleDefinition(
        string RoleName,
        bool? IsProtected,
        ImmutableList<ContextualPermissionSet> PermissionSets
    );

    public sealed record ContextualPermissionSet(PermissionContext Context, ImmutableList<Permission> Permissions);

    [JsonHierarchyBase]
    public abstract partial record PermissionContext();

    public sealed record GlobalPermissionContext() : PermissionContext();

    public sealed record OwnFamilyPermissionContext() : PermissionContext();

    public sealed record AllVolunteerFamiliesPermissionContext() : PermissionContext();

    public sealed record AllPartneringFamiliesPermissionContext() : PermissionContext();

    public sealed record AssignedFunctionsInReferralPartneringFamilyPermissionContext(
        bool? WhenReferralIsOpen,
        ImmutableList<string>? WhenOwnFunctionIsIn
    ) : PermissionContext();

    public sealed record OwnReferralAssigneeFamiliesPermissionContext(
        bool? WhenReferralIsOpen,
        ImmutableList<string>? WhenAssigneeFunctionIsIn
    ) : PermissionContext();

    public sealed record AssignedFunctionsInReferralCoAssigneeFamiliesPermissionContext(
        bool? WhenReferralIsOpen,
        ImmutableList<string>? WhenOwnFunctionIsIn,
        ImmutableList<string>? WhenAssigneeFunctionIsIn
    ) : PermissionContext();

    public sealed record CommunityMemberPermissionContext(ImmutableList<string>? WhenOwnCommunityRoleIsIn)
        : PermissionContext();

    public sealed record CommunityCoMemberFamiliesPermissionContext(ImmutableList<string>? WhenOwnCommunityRoleIsIn)
        : PermissionContext();

    public sealed record UserAccessConfiguration(ImmutableList<UserLocationRoles> LocationRoles);

    public sealed record UserLocationRoles(Guid LocationId, Guid PersonId, ImmutableList<string> RoleNames);

    public sealed record OrganizationSecrets(string ApiKey);

    public sealed record EffectiveLocationPolicy(
        ImmutableDictionary<string, ActionRequirement> ActionDefinitions,
        ImmutableList<CustomField> CustomFamilyFields,
        ReferralPolicy ReferralPolicy,
        VolunteerPolicy VolunteerPolicy
    );

    public enum DocumentLinkRequirement
    {
        None,
        Allowed,
        Required,
    }

    public enum NoteEntryRequirement
    {
        None,
        Allowed,
        Required,
    }

    public sealed record ActionRequirement(
        DocumentLinkRequirement DocumentLink,
        NoteEntryRequirement NoteEntry,
        string? Instructions,
        Uri? InfoLink,
        TimeSpan? Validity
    );

    public sealed record ReferralPolicy(
        ImmutableList<string> RequiredIntakeActionNames,
        ImmutableList<CustomField> CustomFields,
        ImmutableList<ArrangementPolicy> ArrangementPolicies,
        ImmutableList<FunctionPolicy>? FunctionPolicies
    );

    //TODO: Include referral close reasons

    public sealed record CustomField(
        string Name,
        CustomFieldType Type,
        CustomFieldValidation? Validation,
        ImmutableList<string>? ValidValues
    );

    public enum CustomFieldType
    {
        Boolean,
        String,
    }

    public enum CustomFieldValidation
    {
        SuggestOnly,
    }

    public sealed record ArrangementPolicy(
        string ArrangementType,
        ChildInvolvement ChildInvolvement,
        ImmutableList<ArrangementFunction> ArrangementFunctions,
        ImmutableList<string> RequiredSetupActionNames,
        ImmutableList<MonitoringRequirement> RequiredMonitoringActions,
        ImmutableList<string> RequiredCloseoutActionNames
    );

    public enum ChildInvolvement
    {
        ChildHousing,
        DaytimeChildCareOnly,
        NoChildInvolvement,
    };

    public sealed record MonitoringRequirement(string ActionName, RecurrencePolicy Recurrence);

    public enum FunctionRequirement
    {
        ZeroOrMore,
        ExactlyOne,
        OneOrMore,
    };

    public sealed record ArrangementFunction(
        string FunctionName,
        FunctionRequirement Requirement,
        ImmutableList<string>? EligibleIndividualVolunteerRoles,
        ImmutableList<string>? EligibleVolunteerFamilyRoles,
        ImmutableList<Guid>? EligiblePeople,
        ImmutableList<ArrangementFunctionVariant> Variants
    );

    public sealed record ArrangementFunctionVariant(
        string VariantName,
        ImmutableList<string> RequiredSetupActionNames,
        ImmutableList<MonitoringRequirement> RequiredMonitoringActions,
        ImmutableList<string> RequiredCloseoutActionNames
    );

    [JsonHierarchyBase]
    public abstract partial record RecurrencePolicy();

    public sealed record OneTimeRecurrencePolicy(TimeSpan? Delay) : RecurrencePolicy;

    public sealed record DurationStagesRecurrencePolicy(ImmutableList<RecurrencePolicyStage> Stages) : RecurrencePolicy;

    public sealed record DurationStagesPerChildLocationRecurrencePolicy(ImmutableList<RecurrencePolicyStage> Stages)
        : RecurrencePolicy;

    public sealed record ChildCareOccurrenceBasedRecurrencePolicy(
        TimeSpan Delay,
        int Frequency,
        int InitialSkipCount,
        bool Positive
    ) : RecurrencePolicy;

    public sealed record RecurrencePolicyStage(TimeSpan Delay, int? MaxOccurrences);

    public sealed record FunctionPolicy(string FunctionName, FunctionEligibility Eligibility);

    public sealed record FunctionEligibility(
        ImmutableList<string> EligibleIndividualVolunteerRoles,
        ImmutableList<string> EligibleVolunteerFamilyRoles,
        ImmutableList<Guid> EligiblePeople
    );

    public sealed record VolunteerPolicy(
        ImmutableDictionary<string, VolunteerRolePolicy> VolunteerRoles,
        ImmutableDictionary<string, VolunteerFamilyRolePolicy> VolunteerFamilyRoles
    );

    public sealed record VolunteerRolePolicy(
        string VolunteerRoleType,
        ImmutableList<VolunteerRolePolicyVersion> PolicyVersions
    );

    public sealed record VolunteerRolePolicyVersion(
        string Version,
        DateTime? SupersededAtUtc,
        ImmutableList<VolunteerApprovalRequirement> Requirements
    );

    public sealed record VolunteerFamilyRolePolicy(
        string VolunteerFamilyRoleType,
        ImmutableList<VolunteerFamilyRolePolicyVersion> PolicyVersions
    );

    public sealed record VolunteerFamilyRolePolicyVersion(
        string Version,
        DateTime? SupersededAtUtc,
        ImmutableList<VolunteerFamilyApprovalRequirement> Requirements
    );

    public sealed record VolunteerApprovalRequirement(RequirementStage Stage, string ActionName);

    public enum RequirementStage
    {
        Application,
        Approval,
        Onboarding,
    }

    public sealed record VolunteerFamilyApprovalRequirement(
        RequirementStage Stage,
        string ActionName,
        VolunteerFamilyRequirementScope Scope,
        ScopeCriteria[]? ScopeCriteria
    );

    public enum VolunteerFamilyRequirementScope
    {
        OncePerFamily,
        AllAdultsInTheFamily,
        AllParticipatingAdultsInTheFamily,
        AllInHouseholdParticipatingAdultsInTheFamily,
    };

    public enum HouseholdStatus
    {
        IsInHousehold,
        NotInHousehold,
    }

    public enum ParticipationStatus
    {
        Active,
        Inactive,
        OptOut,
        Denied,
    };

    public sealed record ScopeCriteria(HouseholdStatus[] HouseholdStatus, ParticipationStatus[] ParticipationStatus);

    /// <summary>
    /// The <see cref="IPoliciesResource"/> is responsible for the configuration aspects of CareTogether.
    /// An organization can be comprised of multiple locations or chapters, each of which may implement
    /// policies that can inherit from the organization's base policies as well as global or regional policies.
    /// </summary>
    public interface IPoliciesResource
    {
        Task<OrganizationConfiguration> GetConfigurationAsync(Guid organizationId);

        Task<OrganizationConfiguration> UpsertRoleDefinitionAsync(
            Guid organizationId,
            string roleName,
            RoleDefinition role
        );

        Task<OrganizationConfiguration> DeleteRoleDefinitionAsync(Guid organizationId, string roleName);

        Task<OrganizationSecrets> GetOrganizationSecretsAsync(Guid organizationId);

        Task<EffectiveLocationPolicy> GetCurrentPolicy(Guid organizationId, Guid locationId);
    }
}

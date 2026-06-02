using System;
using System.Collections.Generic;
using System.Collections.Immutable;
using System.Linq;

namespace CareTogether.Resources.Policies
{
    public static class EffectiveLocationPolicyValidator
    {
        public static ImmutableList<string> Validate(
            EffectiveLocationPolicy? policy,
            OrganizationConfiguration organizationConfiguration
        )
        {
            var errors = ImmutableList.CreateBuilder<string>();

            if (policy == null)
            {
                errors.Add("Policy is required.");
                return errors.ToImmutable();
            }

            var actionNames = ValidateActionDefinitions(policy, errors);
            ValidateCustomFields("Custom Family Fields", policy.CustomFamilyFields, errors);
            ValidateCasePolicy(policy, organizationConfiguration, actionNames, errors);
            ValidateReferralPolicy(policy, organizationConfiguration, errors);
            ValidateVolunteerPolicy(policy, actionNames, errors);

            return errors.ToImmutable();
        }

        private static HashSet<string> ValidateActionDefinitions(
            EffectiveLocationPolicy policy,
            ImmutableList<string>.Builder errors
        )
        {
            var actionNames = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
            var actionDefinitions =
                policy.ActionDefinitions ?? ImmutableDictionary<string, ActionRequirement>.Empty;

            foreach (var (actionName, action) in actionDefinitions)
            {
                if (IsBlank(actionName))
                {
                    errors.Add("Action Definitions cannot contain a blank action name.");
                    continue;
                }

                if (!actionNames.Add(actionName.Trim()))
                    errors.Add(
                        $"Action Definitions contains duplicate action name '{actionName}'."
                    );

                foreach (var alternateName in action?.AlternateNames ?? ImmutableList<string>.Empty)
                {
                    if (IsBlank(alternateName))
                    {
                        errors.Add(
                            $"Action Definition '{actionName}' cannot contain a blank alternate name."
                        );
                        continue;
                    }

                    if (actionDefinitions.ContainsKey(alternateName.Trim()))
                    {
                        errors.Add(
                            $"Action Definition '{actionName}' has alternate name '{alternateName}' that conflicts with an action name."
                        );
                    }

                    actionNames.Add(alternateName.Trim());
                }
            }

            return actionNames;
        }

        private static void ValidateCasePolicy(
            EffectiveLocationPolicy policy,
            OrganizationConfiguration organizationConfiguration,
            HashSet<string> actionNames,
            ImmutableList<string>.Builder errors
        )
        {
            var casePolicy = policy.ReferralPolicy;

            ValidateCustomFields("Case Policies Custom Fields", casePolicy?.CustomFields, errors);
            ValidateRequirements(
                "Case Policies Intake Requirements",
                casePolicy?.IntakeRequirements,
                actionNames,
                errors
            );
            ValidateFunctionPolicies(policy, errors);
            ValidateFunctionAssignmentPolicies(
                "Case Policies Function Assignment Policies",
                casePolicy?.FunctionAssignmentPolicies,
                policy,
                organizationConfiguration,
                errors
            );

            ValidateArrangementPolicies(policy, actionNames, errors);
        }

        private static void ValidateReferralPolicy(
            EffectiveLocationPolicy policy,
            OrganizationConfiguration organizationConfiguration,
            ImmutableList<string>.Builder errors
        )
        {
            ValidateFunctionAssignmentPolicies(
                "Referral Policies Function Assignment Policies",
                policy.V1ReferralPolicy?.FunctionAssignmentPolicies,
                policy,
                organizationConfiguration,
                errors
            );
        }

        private static void ValidateVolunteerPolicy(
            EffectiveLocationPolicy policy,
            HashSet<string> actionNames,
            ImmutableList<string>.Builder errors
        )
        {
            var volunteerPolicy = policy.VolunteerPolicy;

            ValidateCustomFields(
                "Volunteer Policies Custom Fields",
                volunteerPolicy?.CustomFields,
                errors
            );
            ValidateVolunteerRolePolicies(
                "Volunteer Policies Volunteer Roles",
                volunteerPolicy?.VolunteerRoles,
                actionNames,
                errors
            );
            ValidateVolunteerFamilyRolePolicies(
                "Volunteer Policies Volunteer Family Roles",
                volunteerPolicy?.VolunteerFamilyRoles,
                actionNames,
                errors
            );
        }

        private static void ValidateArrangementPolicies(
            EffectiveLocationPolicy policy,
            HashSet<string> actionNames,
            ImmutableList<string>.Builder errors
        )
        {
            var arrangementPolicies =
                policy.ReferralPolicy?.ArrangementPolicies
                ?? ImmutableList<ArrangementPolicy>.Empty;
            ValidateUniqueNames(
                "Case Policies Arrangement Policies",
                arrangementPolicies.Select(arrangement => arrangement.ArrangementType),
                errors
            );

            var functionPolicyNames = new HashSet<string>(
                policy.ReferralPolicy?.FunctionPolicies?.Select(functionPolicy =>
                    functionPolicy.FunctionName
                ) ?? [],
                StringComparer.OrdinalIgnoreCase
            );

            foreach (var arrangement in arrangementPolicies)
            {
                var owner = $"Arrangement Policy '{arrangement.ArrangementType}'";
                ValidateRequirements(
                    $"{owner} Required Setup Actions",
                    arrangement.RequiredSetupActions,
                    actionNames,
                    errors
                );
                ValidateMonitoringRequirements(
                    $"{owner} Required Monitoring Actions",
                    arrangement.RequiredMonitoringActionsNew,
                    actionNames,
                    errors
                );
                ValidateRequirements(
                    $"{owner} Required Closeout Actions",
                    arrangement.RequiredCloseoutActions,
                    actionNames,
                    errors
                );

                ValidateUniqueNames(
                    $"{owner} Functions",
                    arrangement.ArrangementFunctions?.Select(function => function.FunctionName),
                    errors
                );

                foreach (
                    var function in arrangement.ArrangementFunctions
                        ?? ImmutableList<ArrangementFunction>.Empty
                )
                {
                    if (IsBlank(function.FunctionName))
                    {
                        errors.Add($"{owner} cannot contain a blank function name.");
                    }

                    var inheritsEligibility =
                        function.EligibleIndividualVolunteerRoles == null
                        && function.EligibleVolunteerFamilyRoles == null
                        && function.EligiblePeople == null;

                    if (inheritsEligibility && !functionPolicyNames.Contains(function.FunctionName))
                    {
                        errors.Add(
                            $"{owner} function '{function.FunctionName}' inherits eligibility but no matching Function Policy exists."
                        );
                    }

                    ValidateUniqueNames(
                        $"{owner} Function '{function.FunctionName}' Variants",
                        function.Variants?.Select(variant => variant.VariantName),
                        errors
                    );

                    foreach (
                        var variant in function.Variants
                            ?? ImmutableList<ArrangementFunctionVariant>.Empty
                    )
                    {
                        var variantOwner =
                            $"{owner} Function '{function.FunctionName}' Variant '{variant.VariantName}'";
                        ValidateRequirements(
                            $"{variantOwner} Required Setup Actions",
                            variant.RequiredSetupActions,
                            actionNames,
                            errors
                        );
                        ValidateMonitoringRequirements(
                            $"{variantOwner} Required Monitoring Actions",
                            variant.RequiredMonitoringActionsNew,
                            actionNames,
                            errors
                        );
                        ValidateRequirements(
                            $"{variantOwner} Required Closeout Actions",
                            variant.RequiredCloseoutActions,
                            actionNames,
                            errors
                        );
                    }
                }
            }
        }

        private static void ValidateFunctionPolicies(
            EffectiveLocationPolicy policy,
            ImmutableList<string>.Builder errors
        )
        {
            var functionPolicies =
                policy.ReferralPolicy?.FunctionPolicies ?? ImmutableList<FunctionPolicy>.Empty;
            ValidateUniqueNames(
                "Case Policies Function Policies",
                functionPolicies.Select(functionPolicy => functionPolicy.FunctionName),
                errors
            );

            foreach (var functionPolicy in functionPolicies)
            {
                ValidateVolunteerEligibility(
                    $"Function Policy '{functionPolicy.FunctionName}'",
                    functionPolicy.Eligibility?.EligibleIndividualVolunteerRoles,
                    functionPolicy.Eligibility?.EligibleVolunteerFamilyRoles,
                    functionPolicy.Eligibility?.EligiblePeople,
                    policy,
                    errors
                );
            }
        }

        private static void ValidateFunctionAssignmentPolicies(
            string area,
            ImmutableList<FunctionAssignmentPolicy>? policies,
            EffectiveLocationPolicy policy,
            OrganizationConfiguration? organizationConfiguration,
            ImmutableList<string>.Builder errors
        )
        {
            var rows = policies ?? ImmutableList<FunctionAssignmentPolicy>.Empty;
            ValidateUniqueNames(area, rows.Select(row => row.AssignmentRole), errors);

            var locationRoles = new HashSet<string>(
                (organizationConfiguration?.Roles.Select(role => role.RoleName) ?? []).Concat(
                    [SystemConstants.ORGANIZATION_ADMINISTRATOR]
                ),
                StringComparer.OrdinalIgnoreCase
            );

            foreach (var assignmentPolicy in rows)
            {
                var owner = $"{area} '{assignmentPolicy.AssignmentRole}'";
                var eligibility = assignmentPolicy.Eligibility;

                ValidateVolunteerEligibility(
                    owner,
                    eligibility?.EligibleIndividualVolunteerRoles,
                    eligibility?.EligibleVolunteerFamilyRoles,
                    eligibility?.EligiblePeople,
                    policy,
                    errors
                );

                foreach (
                    var role in eligibility?.EligibleLocationRoles ?? ImmutableList<string>.Empty
                )
                {
                    if (IsBlank(role))
                    {
                        errors.Add($"{owner} cannot contain a blank eligible location role.");
                        continue;
                    }

                    if (organizationConfiguration != null && !locationRoles.Contains(role))
                        errors.Add($"{owner} references unknown location role '{role}'.");
                }

                var hasEligibility =
                    (eligibility?.EligibleLocationRoles?.Count ?? 0) > 0
                    || (eligibility?.EligibleIndividualVolunteerRoles?.Count ?? 0) > 0
                    || (eligibility?.EligibleVolunteerFamilyRoles?.Count ?? 0) > 0
                    || (eligibility?.EligiblePeople?.Count ?? 0) > 0;

                if (!hasEligibility)
                    errors.Add($"{owner} must include at least one eligible role or person.");
            }
        }

        private static void ValidateVolunteerEligibility(
            string owner,
            ImmutableList<string>? eligibleIndividualVolunteerRoles,
            ImmutableList<string>? eligibleVolunteerFamilyRoles,
            ImmutableList<Guid>? eligiblePeople,
            EffectiveLocationPolicy policy,
            ImmutableList<string>.Builder errors
        )
        {
            var volunteerRoleNames = new HashSet<string>(
                policy.VolunteerPolicy?.VolunteerRoles?.Keys ?? [],
                StringComparer.OrdinalIgnoreCase
            );
            var volunteerFamilyRoleNames = new HashSet<string>(
                policy.VolunteerPolicy?.VolunteerFamilyRoles?.Keys ?? [],
                StringComparer.OrdinalIgnoreCase
            );

            foreach (var role in eligibleIndividualVolunteerRoles ?? ImmutableList<string>.Empty)
            {
                if (IsBlank(role))
                {
                    errors.Add($"{owner} cannot contain a blank eligible volunteer role.");
                    continue;
                }

                if (!volunteerRoleNames.Contains(role))
                    errors.Add($"{owner} references unknown volunteer role '{role}'.");
            }

            foreach (var role in eligibleVolunteerFamilyRoles ?? ImmutableList<string>.Empty)
            {
                if (IsBlank(role))
                {
                    errors.Add($"{owner} cannot contain a blank eligible volunteer family role.");
                    continue;
                }

                if (!volunteerFamilyRoleNames.Contains(role))
                    errors.Add($"{owner} references unknown volunteer family role '{role}'.");
            }

            foreach (var personId in eligiblePeople ?? ImmutableList<Guid>.Empty)
            {
                if (personId == Guid.Empty)
                    errors.Add($"{owner} cannot contain an empty eligible person ID.");
            }
        }

        private static void ValidateVolunteerRolePolicies(
            string area,
            ImmutableDictionary<string, VolunteerRolePolicy>? roles,
            HashSet<string> actionNames,
            ImmutableList<string>.Builder errors
        )
        {
            ValidateUniqueNames(area, roles?.Keys, errors);

            foreach (
                var (roleName, rolePolicy) in roles
                    ?? ImmutableDictionary<string, VolunteerRolePolicy>.Empty
            )
            {
                ValidateUniqueNames(
                    $"{area} '{roleName}' Versions",
                    rolePolicy.PolicyVersions?.Select(version => version.Version),
                    errors
                );

                foreach (
                    var version in rolePolicy.PolicyVersions
                        ?? ImmutableList<VolunteerRolePolicyVersion>.Empty
                )
                {
                    foreach (
                        var requirement in version.Requirements
                            ?? ImmutableList<VolunteerApprovalRequirement>.Empty
                    )
                        ValidateActionReference(
                            $"{area} '{roleName}' Version '{version.Version}'",
                            requirement.ActionName,
                            actionNames,
                            errors
                        );
                }
            }
        }

        private static void ValidateVolunteerFamilyRolePolicies(
            string area,
            ImmutableDictionary<string, VolunteerFamilyRolePolicy>? roles,
            HashSet<string> actionNames,
            ImmutableList<string>.Builder errors
        )
        {
            ValidateUniqueNames(area, roles?.Keys, errors);

            foreach (
                var (roleName, rolePolicy) in roles
                    ?? ImmutableDictionary<string, VolunteerFamilyRolePolicy>.Empty
            )
            {
                ValidateUniqueNames(
                    $"{area} '{roleName}' Versions",
                    rolePolicy.PolicyVersions?.Select(version => version.Version),
                    errors
                );

                foreach (
                    var version in rolePolicy.PolicyVersions
                        ?? ImmutableList<VolunteerFamilyRolePolicyVersion>.Empty
                )
                {
                    foreach (
                        var requirement in version.Requirements
                            ?? ImmutableList<VolunteerFamilyApprovalRequirement>.Empty
                    )
                        ValidateActionReference(
                            $"{area} '{roleName}' Version '{version.Version}'",
                            requirement.ActionName,
                            actionNames,
                            errors
                        );
                }
            }
        }

        private static void ValidateRequirements(
            string area,
            ImmutableList<RequirementDefinition>? requirements,
            HashSet<string> actionNames,
            ImmutableList<string>.Builder errors
        )
        {
            foreach (var requirement in requirements ?? ImmutableList<RequirementDefinition>.Empty)
                ValidateActionReference(area, requirement.ActionName, actionNames, errors);
        }

        private static void ValidateMonitoringRequirements(
            string area,
            ImmutableList<MonitoringRequirement>? requirements,
            HashSet<string> actionNames,
            ImmutableList<string>.Builder errors
        )
        {
            foreach (var requirement in requirements ?? ImmutableList<MonitoringRequirement>.Empty)
                ValidateActionReference(area, requirement.Action?.ActionName, actionNames, errors);
        }

        private static void ValidateActionReference(
            string area,
            string? actionName,
            HashSet<string> actionNames,
            ImmutableList<string>.Builder errors
        )
        {
            if (IsBlank(actionName))
            {
                errors.Add($"{area} cannot contain a blank action name.");
                return;
            }

            var trimmedActionName = actionName!.Trim();
            if (!actionNames.Contains(trimmedActionName))
                errors.Add($"{area} references unknown action '{trimmedActionName}'.");
        }

        private static void ValidateCustomFields(
            string area,
            ImmutableList<CustomField>? fields,
            ImmutableList<string>.Builder errors
        )
        {
            var rows = fields ?? ImmutableList<CustomField>.Empty;
            ValidateUniqueNames(area, rows.Select(field => field.Name), errors);

            foreach (var field in rows)
            {
                if (field.ValidValues == null)
                    continue;

                ValidateUniqueNames(
                    $"{area} '{field.Name}' Valid Values",
                    field.ValidValues,
                    errors
                );
            }
        }

        private static void ValidateUniqueNames(
            string area,
            IEnumerable<string>? names,
            ImmutableList<string>.Builder errors
        )
        {
            var seen = new HashSet<string>(StringComparer.OrdinalIgnoreCase);

            foreach (var name in names ?? [])
            {
                if (IsBlank(name))
                {
                    errors.Add($"{area} cannot contain a blank name.");
                    continue;
                }

                if (!seen.Add(name.Trim()))
                    errors.Add($"{area} contains duplicate name '{name}'.");
            }
        }

        private static bool IsBlank(string? value) => string.IsNullOrWhiteSpace(value);
    }
}

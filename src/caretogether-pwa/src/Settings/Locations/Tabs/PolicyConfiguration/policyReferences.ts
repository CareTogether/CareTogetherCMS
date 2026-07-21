import { EffectiveLocationPolicy } from '../../../../GeneratedClient';
import type { NamedPolicyReference } from './types';

export function getRequirementUsage(policy: EffectiveLocationPolicy) {
  const references = new Map<string, NamedPolicyReference[]>();

  const addReference = (
    actionName: string | undefined,
    area: string,
    owner: string
  ) => {
    if (!actionName) return;
    references.set(actionName, [
      ...(references.get(actionName) ?? []),
      { area, owner },
    ]);
  };

  policy.referralPolicy?.intakeRequirements?.forEach((requirement) =>
    addReference(
      requirement.actionName,
      'CasePolicy.IntakeRequirements',
      'CasePolicy'
    )
  );

  policy.referralPolicy?.arrangementPolicies?.forEach((arrangement) => {
    const owner = arrangement.arrangementType;

    arrangement.requiredSetupActions?.forEach((requirement) =>
      addReference(
        requirement.actionName,
        'CasePolicy.ArrangementPolicies.RequiredSetupActions',
        owner
      )
    );
    arrangement.requiredMonitoringActionsNew?.forEach((requirement) =>
      addReference(
        requirement.action?.actionName,
        'CasePolicy.ArrangementPolicies.RequiredMonitoringActions',
        owner
      )
    );
    arrangement.requiredCloseoutActions?.forEach((requirement) =>
      addReference(
        requirement.actionName,
        'CasePolicy.ArrangementPolicies.RequiredCloseoutActions',
        owner
      )
    );

    arrangement.arrangementFunctions?.forEach((arrangementFunction) => {
      arrangementFunction.variants?.forEach((variant) => {
        const variantOwner = `${owner} / ${arrangementFunction.functionName} / ${variant.variantName}`;
        variant.requiredSetupActions?.forEach((requirement) =>
          addReference(
            requirement.actionName,
            'CasePolicy.ArrangementFunctionVariant.RequiredSetupActions',
            variantOwner
          )
        );
        variant.requiredMonitoringActionsNew?.forEach((requirement) =>
          addReference(
            requirement.action?.actionName,
            'CasePolicy.ArrangementFunctionVariant.RequiredMonitoringActions',
            variantOwner
          )
        );
        variant.requiredCloseoutActions?.forEach((requirement) =>
          addReference(
            requirement.actionName,
            'CasePolicy.ArrangementFunctionVariant.RequiredCloseoutActions',
            variantOwner
          )
        );
      });
    });
  });

  Object.entries(policy.volunteerPolicy?.volunteerRoles ?? {}).forEach(
    ([roleName, rolePolicy]) => {
      rolePolicy.policyVersions?.forEach((version) => {
        version.requirements?.forEach((requirement) =>
          addReference(
            requirement.actionName,
            'VolunteerPolicy.VolunteerRoles.Requirements',
            `${roleName} ${version.version}`
          )
        );
      });
    }
  );

  Object.entries(policy.volunteerPolicy?.volunteerFamilyRoles ?? {}).forEach(
    ([roleName, rolePolicy]) => {
      rolePolicy.policyVersions?.forEach((version) => {
        version.requirements?.forEach((requirement) =>
          addReference(
            requirement.actionName,
            'VolunteerPolicy.VolunteerFamilyRoles.Requirements',
            `${roleName} ${version.version}`
          )
        );
      });
    }
  );

  return references;
}


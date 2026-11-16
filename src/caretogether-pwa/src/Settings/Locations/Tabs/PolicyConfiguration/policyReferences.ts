import { EffectiveLocationPolicy } from '../../../../GeneratedClient';
import {
  arrangementRequirementLists,
  intakeRequirements,
  variantRequirementLists,
} from './requirementListsModel';
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

  intakeRequirements(policy.referralPolicy).forEach((requirement) =>
    addReference(
      requirement.actionName,
      'CasePolicy.IntakeRequirements',
      'CasePolicy'
    )
  );

  policy.referralPolicy?.arrangementPolicies?.forEach((arrangement) => {
    const owner = arrangement.arrangementType;
    const lists = arrangementRequirementLists(arrangement);

    lists.setup.forEach((requirement) =>
      addReference(
        requirement.actionName,
        'CasePolicy.ArrangementPolicies.RequiredSetupActions',
        owner
      )
    );
    lists.monitoring.forEach((requirement) =>
      addReference(
        requirement.action?.actionName,
        'CasePolicy.ArrangementPolicies.RequiredMonitoringActions',
        owner
      )
    );
    lists.closeout.forEach((requirement) =>
      addReference(
        requirement.actionName,
        'CasePolicy.ArrangementPolicies.RequiredCloseoutActions',
        owner
      )
    );

    arrangement.arrangementFunctions?.forEach((arrangementFunction) => {
      arrangementFunction.variants?.forEach((variant) => {
        const variantOwner = `${owner} / ${arrangementFunction.functionName} / ${variant.variantName}`;
        const variantLists = variantRequirementLists(variant);
        variantLists.setup.forEach((requirement) =>
          addReference(
            requirement.actionName,
            'CasePolicy.ArrangementFunctionVariant.RequiredSetupActions',
            variantOwner
          )
        );
        variantLists.monitoring.forEach((requirement) =>
          addReference(
            requirement.action?.actionName,
            'CasePolicy.ArrangementFunctionVariant.RequiredMonitoringActions',
            variantOwner
          )
        );
        variantLists.closeout.forEach((requirement) =>
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

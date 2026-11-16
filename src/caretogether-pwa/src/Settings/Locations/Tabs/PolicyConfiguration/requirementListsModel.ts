import {
  ArrangementFunctionVariant,
  ArrangementPolicy,
  MonitoringRequirement,
  MonitoringRequirementOld,
  RequirementDefinition,
  V1CasePolicy,
} from '../../../../GeneratedClient';
import {
  mergeMonitoringRequirements,
  mergeRequirements,
} from './requirementLists';

export type RequirementLists = {
  setup: RequirementDefinition[];
  monitoring: MonitoringRequirement[];
  closeout: RequirementDefinition[];
};

function requiredAction(actionName: string) {
  return new RequirementDefinition({ actionName, isRequired: true });
}

function fromLegacyMonitoring(requirement: MonitoringRequirementOld) {
  return new MonitoringRequirement({
    action: requiredAction(requirement.actionName),
    recurrence: requirement.recurrence,
  });
}

export function arrangementRequirementLists(
  arrangement: ArrangementPolicy
): RequirementLists {
  return {
    setup: mergeRequirements(
      arrangement.requiredSetupActionNames,
      arrangement.requiredSetupActions,
      arrangement.requiredSetupActions_PRE_MIGRATION,
      requiredAction
    ),
    monitoring: mergeMonitoringRequirements(
      arrangement.requiredMonitoringActions,
      arrangement.requiredMonitoringActionsNew,
      arrangement.requiredMonitoringActions_PRE_MIGRATION,
      fromLegacyMonitoring
    ),
    closeout: mergeRequirements(
      arrangement.requiredCloseoutActionNames,
      arrangement.requiredCloseoutActions,
      arrangement.requiredCloseoutActionNames_PRE_MIGRATION,
      requiredAction
    ),
  };
}

// Writes the lists only to the new fields and mirrors them into the
// `_PRE_MIGRATION` fields, so the server stores what the editor shows.
export function withArrangementRequirementLists(
  arrangement: ArrangementPolicy,
  lists: RequirementLists
) {
  return new ArrangementPolicy({
    ...arrangement,
    requiredSetupActionNames: [],
    requiredMonitoringActions: [],
    requiredCloseoutActionNames: [],
    requiredSetupActions: lists.setup,
    requiredMonitoringActionsNew: lists.monitoring,
    requiredCloseoutActions: lists.closeout,
    requiredSetupActions_PRE_MIGRATION: lists.setup,
    requiredMonitoringActions_PRE_MIGRATION: lists.monitoring,
    requiredCloseoutActionNames_PRE_MIGRATION: lists.closeout,
  });
}

export function variantRequirementLists(
  variant: ArrangementFunctionVariant
): RequirementLists {
  return {
    setup: mergeRequirements(
      variant.requiredSetupActionNames,
      variant.requiredSetupActions,
      variant.requiredSetupActionNames_PRE_MIGRATION,
      requiredAction
    ),
    monitoring: mergeMonitoringRequirements(
      variant.requiredMonitoringActions,
      variant.requiredMonitoringActionsNew,
      variant.requiredMonitoringActions_PRE_MIGRATION,
      fromLegacyMonitoring
    ),
    closeout: mergeRequirements(
      variant.requiredCloseoutActionNames,
      variant.requiredCloseoutActions,
      variant.requiredCloseoutActionNames_PRE_MIGRATION,
      requiredAction
    ),
  };
}

export function withVariantRequirementLists(
  variant: ArrangementFunctionVariant,
  lists: RequirementLists
) {
  return new ArrangementFunctionVariant({
    ...variant,
    requiredSetupActionNames: [],
    requiredMonitoringActions: [],
    requiredCloseoutActionNames: [],
    requiredSetupActions: lists.setup,
    requiredMonitoringActionsNew: lists.monitoring,
    requiredCloseoutActions: lists.closeout,
    requiredSetupActionNames_PRE_MIGRATION: lists.setup,
    requiredMonitoringActions_PRE_MIGRATION: lists.monitoring,
    requiredCloseoutActionNames_PRE_MIGRATION: lists.closeout,
  });
}

export function newVariant(variantName: string) {
  return withVariantRequirementLists(
    new ArrangementFunctionVariant({
      variantName,
      requiredSetupActionNames: [],
      requiredMonitoringActions: [],
      requiredCloseoutActionNames: [],
      requiredSetupActionNames_PRE_MIGRATION: [],
      requiredMonitoringActions_PRE_MIGRATION: [],
      requiredCloseoutActionNames_PRE_MIGRATION: [],
    }),
    { setup: [], monitoring: [], closeout: [] }
  );
}

export function intakeRequirements(casePolicy?: V1CasePolicy) {
  return mergeRequirements(
    casePolicy?.requiredIntakeActionNames,
    casePolicy?.intakeRequirements,
    casePolicy?.intakeRequirements_PRE_MIGRATION,
    requiredAction
  );
}

export function intakeRequirementsUpdate(
  requirements: RequirementDefinition[]
): Partial<V1CasePolicy> {
  return {
    requiredIntakeActionNames: [],
    intakeRequirements: requirements,
    intakeRequirements_PRE_MIGRATION: requirements,
  };
}

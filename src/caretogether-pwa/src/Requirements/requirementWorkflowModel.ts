import { formatRelative } from 'date-fns';
import {
  ActionRequirement,
  Arrangement,
  ArrangementPhase,
  CompletedRequirementInfo,
  ExemptedRequirementInfo,
  MissingArrangementRequirement,
  RequirementDefinition,
  V1Case,
} from '../GeneratedClient';
import { RequirementContext } from './RequirementContext';

export type ArrangementRequirementContext =
  | Extract<RequirementContext, { kind: 'Arrangement' }>
  | Extract<RequirementContext, { kind: 'Family Volunteer Assignment' }>
  | Extract<RequirementContext, { kind: 'Individual Volunteer Assignment' }>;

export type RequirementValidityDuration = {
  days: number;
};

export function familyIdFromRequirementContext(
  context: RequirementContext
): string | null {
  if (
    context.kind === 'V1Case' ||
    context.kind === 'Arrangement' ||
    context.kind === 'Family Volunteer Assignment' ||
    context.kind === 'Individual Volunteer Assignment'
  ) {
    return context.partneringFamilyId;
  }

  if (context.kind === 'V1Referral') {
    return context.partneringFamilyId ?? null;
  }

  return context.volunteerFamilyId;
}

export function requirementNameFromRequirement(
  requirement: MissingArrangementRequirement | RequirementDefinition | string
) {
  if (requirement instanceof MissingArrangementRequirement) {
    return requirement.action!.actionName!;
  }

  if (requirement instanceof RequirementDefinition) {
    return requirement.actionName!;
  }

  return requirement;
}

export function requirementNameFromWorkflowRequirement(
  requirement:
    | MissingArrangementRequirement
    | CompletedRequirementInfo
    | ExemptedRequirementInfo
) {
  if (requirement instanceof MissingArrangementRequirement) {
    return requirement.action?.actionName ?? 'Requirement';
  }

  return requirement.requirementName;
}

export function parseRequirementValidity(
  validity: string | null | undefined
): RequirementValidityDuration | null {
  return validity ? { days: parseInt(validity.split('.')[0]) } : null;
}

export function findActionRequirementPolicy(
  actionDefinitions: Record<string, ActionRequirement>,
  actionName: string
) {
  return (
    actionDefinitions[actionName] ??
    Object.values(actionDefinitions).find((definition) =>
      definition.alternateNames?.includes(actionName)
    )
  );
}

export function isArrangementRequirementContext(
  context: RequirementContext
): context is ArrangementRequirementContext {
  return (
    context.kind === 'Arrangement' ||
    context.kind === 'Family Volunteer Assignment' ||
    context.kind === 'Individual Volunteer Assignment'
  );
}

export function getArrangementRequirementStatusLabel(
  arrangement: Arrangement,
  now = new Date()
) {
  if (arrangement.phase === ArrangementPhase.Cancelled) {
    return `Cancelled ${formatRelative(arrangement.cancelledAtUtc!, now)}`;
  }

  if (arrangement.phase === ArrangementPhase.SettingUp) {
    return 'Setting up';
  }

  if (arrangement.phase === ArrangementPhase.ReadyToStart) {
    return 'Ready to start';
  }

  if (arrangement.phase === ArrangementPhase.Started) {
    return `Started ${formatRelative(arrangement.startedAtUtc!, now)}`;
  }

  return `Ended ${formatRelative(arrangement.endedAtUtc!, now)}`;
}

export function arrangementMatchesRequirement(
  arrangement: Arrangement,
  requirement: MissingArrangementRequirement,
  context: RequirementContext
) {
  return [
    ...(arrangement.missingRequirements ?? []),
    ...(arrangement.missingOptionalRequirements ?? []),
  ].some((missingRequirementInfo) => {
    if (context.kind === 'Family Volunteer Assignment') {
      return (
        missingRequirementInfo.action?.actionName ===
          requirement.action?.actionName &&
        missingRequirementInfo.arrangementFunction ===
          context.assignment.arrangementFunction &&
        missingRequirementInfo.arrangementFunctionVariant ===
          context.assignment.arrangementFunctionVariant &&
        missingRequirementInfo.volunteerFamilyId === context.assignment.familyId
      );
    }

    if (context.kind === 'Individual Volunteer Assignment') {
      return (
        missingRequirementInfo.action?.actionName ===
          requirement.action?.actionName &&
        missingRequirementInfo.arrangementFunction ===
          context.assignment.arrangementFunction &&
        missingRequirementInfo.arrangementFunctionVariant ===
          context.assignment.arrangementFunctionVariant &&
        missingRequirementInfo.volunteerFamilyId ===
          context.assignment.familyId &&
        missingRequirementInfo.personId === context.assignment.personId
      );
    }

    return (
      missingRequirementInfo.action?.actionName === requirement.action?.actionName
    );
  });
}

export function getAvailableArrangementsForRequirement(
  selectedV1Case: V1Case | undefined,
  requirement: MissingArrangementRequirement | unknown,
  context: RequirementContext | undefined
) {
  if (
    !selectedV1Case ||
    !(requirement instanceof MissingArrangementRequirement) ||
    !context
  ) {
    return [];
  }

  return selectedV1Case.arrangements!.filter((arrangement) =>
    arrangementMatchesRequirement(arrangement, requirement, context)
  );
}

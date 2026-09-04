import {
  CompletedRequirementInfo,
  ExemptedRequirementInfo,
  FunctionRequirement,
  MissingArrangementRequirement,
} from '../../GeneratedClient';
import { RequirementContext } from '../../Requirements/RequirementContext';
import {
  ArrangementFunctionSummaryV2,
  ArrangementRowV2,
} from './arrangementViewModel';

const EXPIRING_REQUIREMENT_DAYS = 30;

export function arrangementFunctionSummariesMissingRequiredAssignments(
  functionSummaries: ArrangementFunctionSummaryV2[]
) {
  return functionSummaries.filter(
    (summary) =>
      summary.functionPolicy.requirement !== FunctionRequirement.ZeroOrMore &&
      summary.assignments.length === 0
  );
}

export function arrangementFunctionSummariesMissingVariants(
  functionSummaries: ArrangementFunctionSummaryV2[]
) {
  return functionSummaries.filter(
    (summary) => summary.missingVariantLabels.length > 0
  );
}

function isExpired(date?: Date, now = new Date()) {
  return date !== undefined && date < now;
}

function isExpiring(date?: Date, now = new Date()) {
  if (!date || isExpired(date, now)) {
    return false;
  }

  const cutoff = new Date(now);
  cutoff.setDate(cutoff.getDate() + EXPIRING_REQUIREMENT_DAYS);

  return date <= cutoff;
}

export function arrangementRequirementRequiresAttention(
  requirement: CompletedRequirementInfo
): boolean;
export function arrangementRequirementRequiresAttention(
  requirement: ExemptedRequirementInfo
): boolean;
export function arrangementRequirementRequiresAttention(
  requirement: CompletedRequirementInfo | ExemptedRequirementInfo
) {
  const expirationDate =
    requirement instanceof CompletedRequirementInfo
      ? requirement.expiresAtUtc
      : requirement.exemptionExpiresAtUtc;

  return isExpired(expirationDate) || isExpiring(expirationDate);
}

export function isUpcomingArrangementRequirement(
  requirement: MissingArrangementRequirement
) {
  if (!requirement.action?.isRequired) {
    return true;
  }

  return (
    requirement.dueBy !== undefined && requirement.pastDueSince === undefined
  );
}

export function requirementContextFamilyId(context: RequirementContext) {
  if (
    context.kind === 'Arrangement' ||
    context.kind === 'Family Volunteer Assignment' ||
    context.kind === 'Individual Volunteer Assignment'
  ) {
    return context.partneringFamilyId;
  }

  if (
    context.kind === 'Volunteer Family' ||
    context.kind === 'Individual Volunteer'
  ) {
    return context.volunteerFamilyId;
  }

  return '';
}

export function defaultArrangementFunctionSummary(
  functionSummaries: ArrangementFunctionSummaryV2[]
) {
  return (
    functionSummaries.find(
      (summary) =>
        summary.functionPolicy.requirement !== FunctionRequirement.ZeroOrMore &&
        summary.assignments.length === 0
    ) ??
    functionSummaries.find((summary) => summary.assignments.length === 0) ??
    functionSummaries[0] ??
    null
  );
}

export function isArrangementMonitoringRequirement(
  row: ArrangementRowV2,
  requirementName: string | undefined
) {
  const allMonitoringRequirements =
    row.arrangementPolicy?.requiredMonitoringActions_PRE_MIGRATION?.concat(
      row.arrangementPolicy.arrangementFunctions?.flatMap(
        (arrangementFunction) =>
          arrangementFunction.variants?.flatMap(
            (variant) => variant.requiredMonitoringActions_PRE_MIGRATION || []
          ) || []
      ) || []
    );

  return allMonitoringRequirements?.some(
    (requirement) => requirement.action?.actionName === requirementName
  );
}

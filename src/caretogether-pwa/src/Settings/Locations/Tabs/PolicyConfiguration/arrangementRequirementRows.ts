import type {
  ArrangementPolicy,
  RecurrencePolicy,
} from '../../../../GeneratedClient.ts';

export type RequirementPhase = 'Setup' | 'Monitoring' | 'Closeout';
export type ArrangementRequirementRow = {
  id: string;
  index: number;
  source: 'newer' | 'legacy' | 'compatibility';
  actionName: string;
  isRequired: boolean;
  recurrence?: RecurrencePolicy;
  readOnlyReason?: string;
};

export function arrangementRequirementRows(
  arrangement: ArrangementPolicy,
  phase: RequirementPhase,
  actionNames: string[]
): ArrangementRequirementRow[] {
  const monitoring = phase === 'Monitoring';
  const newer: {
    actionName: string;
    isRequired: boolean;
    recurrence?: RecurrencePolicy;
  }[] = monitoring
    ? (arrangement.requiredMonitoringActionsNew ?? []).map((item) => ({
        ...item.action,
        recurrence: item.recurrence,
      }))
    : phase === 'Setup'
      ? (arrangement.requiredSetupActions ?? [])
      : (arrangement.requiredCloseoutActions ?? []);
  const legacy: {
    actionName: string;
    isRequired: boolean;
    recurrence?: RecurrencePolicy;
  }[] = monitoring
    ? (arrangement.requiredMonitoringActions ?? []).map((item) => ({
        actionName: item.actionName,
        isRequired: true,
        recurrence: item.recurrence,
      }))
    : (phase === 'Setup'
        ? (arrangement.requiredSetupActionNames ?? [])
        : (arrangement.requiredCloseoutActionNames ?? [])
      ).map((actionName) => ({ actionName, isRequired: true }));
  const compatibility: {
    actionName: string;
    isRequired: boolean;
    recurrence?: RecurrencePolicy;
  }[] = monitoring
    ? (arrangement.requiredMonitoringActions_PRE_MIGRATION ?? []).map(
        (item) => ({ ...item.action, recurrence: item.recurrence })
      )
    : phase === 'Setup'
      ? (arrangement.requiredSetupActions_PRE_MIGRATION ?? [])
      : (arrangement.requiredCloseoutActionNames_PRE_MIGRATION ?? []);
  const sourceNames = new Set(
    [...newer, ...legacy].map((item) => item.actionName)
  );
  const rows: ArrangementRequirementRow[] = [];
  for (const [source, requirements] of [
    ['newer', newer],
    ['legacy', legacy],
    [
      'compatibility',
      compatibility.filter((item) => !sourceNames.has(item.actionName)),
    ],
  ] as const) {
    requirements.forEach((requirement, index) => {
      rows.push({
        id: JSON.stringify([
          phase,
          source,
          requirement.actionName,
          requirements
            .slice(0, index)
            .filter((item) => item.actionName === requirement.actionName)
            .length,
        ]),
        index,
        source,
        actionName: requirement.actionName ?? '',
        isRequired: requirement.isRequired,
        recurrence: requirement.recurrence,
      });
    });
  }
  return rows.map((row) => ({
    ...row,
    readOnlyReason: arrangement.supersededAtUtc
      ? 'Superseded arrangement; read-only.'
      : rows.filter((item) => item.actionName === row.actionName).length > 1
        ? 'Duplicate or mixed-source reference; read-only.'
        : row.source !== 'newer'
          ? 'Legacy or migration-backed requirement; read-only.'
          : !actionNames.includes(row.actionName)
            ? 'Unknown Action Definition; read-only.'
            : undefined,
  }));
}

export function assertRequirementCanBeAdded(
  rows: ArrangementRequirementRow[],
  actionNames: string[],
  actionName: string
) {
  if (!actionNames.includes(actionName))
    throw new Error('Action name must exist in Action Definitions.');
  if (rows.some((row) => row.actionName === actionName))
    throw new Error('Action name is already referenced in this list.');
}

import {
  ArrangementPolicy,
  MonitoringRequirement,
  RequirementDefinition,
  type RecurrencePolicy,
} from '../../../../GeneratedClient';
import {
  arrangementRequirementRows,
  assertRequirementCanBeAdded,
  type ArrangementRequirementRow,
  type RequirementPhase,
} from './arrangementRequirementRows';

export function canEditMonitoringSchedule(recurrence?: RecurrencePolicy) {
  const data = recurrence?.toJSON();
  return (
    data?.discriminator === 'OneTimeRecurrencePolicy' &&
    (!data.delay || /^[1-9]\d*\.00:00:00$/.test(data.delay))
  );
}

export function replaceArrangementRequirement(
  arrangement: ArrangementPolicy,
  phase: RequirementPhase,
  row: ArrangementRequirementRow,
  isRequired: boolean
) {
  if (row.readOnlyReason) throw new Error(row.readOnlyReason);
  if (row.source !== 'newer' || typeof isRequired !== 'boolean')
    throw new Error('This requirement cannot be edited inline.');
  if (row.isRequired === isRequired) return arrangement;
  const current =
    phase === 'Monitoring'
      ? arrangement.requiredMonitoringActionsNew?.[row.index]?.action
      : (phase === 'Setup'
          ? arrangement.requiredSetupActions
          : arrangement.requiredCloseoutActions)?.[row.index];
  if (current?.actionName !== row.actionName)
    throw new Error(
      'The requirement changed. Review the current policy before editing.'
    );
  if (phase === 'Monitoring')
    return new ArrangementPolicy({
      ...arrangement,
      requiredMonitoringActionsNew: (
        arrangement.requiredMonitoringActionsNew ?? []
      ).map((item, index) =>
        index === row.index
          ? new MonitoringRequirement({
              ...item,
              action: new RequirementDefinition({ ...item.action, isRequired }),
            })
          : item
      ),
    });
  const key =
    phase === 'Setup' ? 'requiredSetupActions' : 'requiredCloseoutActions';
  return new ArrangementPolicy({
    ...arrangement,
    [key]: (arrangement[key] ?? []).map((item, index) =>
      index === row.index
        ? new RequirementDefinition({ ...item, isRequired })
        : item
    ),
  });
}

export function addArrangementRequirement(
  arrangement: ArrangementPolicy,
  phase: 'Setup' | 'Closeout',
  actionNames: string[],
  actionName: string,
  isRequired: boolean
) {
  if (arrangement.supersededAtUtc)
    throw new Error('Superseded arrangement; read-only.');
  assertRequirementCanBeAdded(
    arrangementRequirementRows(arrangement, phase, actionNames),
    actionNames,
    actionName
  );
  const key =
    phase === 'Setup' ? 'requiredSetupActions' : 'requiredCloseoutActions';
  return new ArrangementPolicy({
    ...arrangement,
    [key]: [
      ...(arrangement[key] ?? []),
      new RequirementDefinition({ actionName, isRequired }),
    ],
  });
}

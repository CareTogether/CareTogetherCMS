import type {
  ArrangementFunctionVariant,
  RecurrencePolicy,
} from '../../../../GeneratedClient.ts';
import type { RequirementPhase } from './arrangementRequirementRows.ts';

export type VariantRequirementRow = {
  id: string;
  actionName: string;
  isRequired: boolean;
  source: 'Current' | 'Legacy' | 'Stored compatibility';
  recurrence?: RecurrencePolicy;
};

export function variantRequirementRows(
  variant: ArrangementFunctionVariant,
  phase: RequirementPhase
): VariantRequirementRow[] {
  type Contribution = Pick<
    VariantRequirementRow,
    'actionName' | 'isRequired' | 'recurrence'
  >;
  const current: Contribution[] =
    phase === 'Monitoring'
      ? (variant.requiredMonitoringActionsNew ?? []).map((item) => ({
          ...item.action,
          recurrence: item.recurrence,
        }))
      : phase === 'Setup'
        ? (variant.requiredSetupActions ?? [])
        : (variant.requiredCloseoutActions ?? []);
  const legacy: Contribution[] =
    phase === 'Monitoring'
      ? (variant.requiredMonitoringActions ?? []).map((item) => ({
          actionName: item.actionName,
          isRequired: true,
          recurrence: item.recurrence,
        }))
      : (phase === 'Setup'
          ? (variant.requiredSetupActionNames ?? [])
          : (variant.requiredCloseoutActionNames ?? [])
        ).map((actionName) => ({ actionName, isRequired: true }));
  const compatibility: Contribution[] =
    phase === 'Monitoring'
      ? (variant.requiredMonitoringActions_PRE_MIGRATION ?? []).map((item) => ({
          ...item.action,
          recurrence: item.recurrence,
        }))
      : phase === 'Setup'
        ? (variant.requiredSetupActionNames_PRE_MIGRATION ?? [])
        : (variant.requiredCloseoutActionNames_PRE_MIGRATION ?? []);
  const signature = (item: Contribution) =>
    JSON.stringify([item.actionName, item.isRequired, item.recurrence]);
  const remaining = [...current, ...legacy].map(signature);
  const additionalCompatibility = compatibility.filter((item) => {
    const index = remaining.indexOf(signature(item));
    if (index < 0) return true;
    remaining.splice(index, 1);
    return false;
  });
  return (
    [
      ['Current', current],
      ['Legacy', legacy],
      ['Stored compatibility', additionalCompatibility],
    ] as const
  ).flatMap(([source, requirements]) =>
    requirements.map((item, index) => ({
      ...item,
      source,
      id: JSON.stringify([phase, source, index]),
    }))
  );
}

export function recurrenceDelayLabel(value?: string) {
  if (!value) return 'no delay';
  const match = /^(?:(\d+)\.)?(\d+):(\d{2}):(\d{2})$/.exec(value);
  if (!match) return value;
  const amounts = [
    Number(match[1] ?? 0),
    Number(match[2]),
    Number(match[3]),
    Number(match[4]),
  ];
  const units = ['day', 'hour', 'minute', 'second'];
  return (
    amounts
      .flatMap((amount, index) =>
        amount ? [`${amount} ${units[index]}${amount === 1 ? '' : 's'}`] : []
      )
      .join(', ') || '0 seconds'
  );
}

export function variantScheduleSummary(
  recurrence?: RecurrencePolicy
): string[] {
  if (!recurrence) return ['No schedule configured'];
  const data = recurrence.toJSON();
  switch (data.discriminator) {
    case 'OneTimeRecurrencePolicy':
      return [
        data.delay
          ? `Once after ${recurrenceDelayLabel(data.delay)}`
          : 'Once, with no delay',
      ];
    case 'DurationStagesRecurrencePolicy':
    case 'DurationStagesPerChildLocationRecurrencePolicy':
      return [
        data.discriminator === 'DurationStagesPerChildLocationRecurrencePolicy'
          ? 'Stages based on child placement with the assigned family'
          : 'Stages based on arrangement duration',
        ...(data.stages ?? []).map(
          (
            stage: { delay?: string; maxOccurrences?: number | null },
            index: number
          ) =>
            `Stage ${index + 1}: ${recurrenceDelayLabel(stage.delay)}; ${stage.maxOccurrences == null ? 'unlimited occurrences' : `${stage.maxOccurrences} occurrence(s)`}`
        ),
      ];
    case 'ChildCareOccurrenceBasedRecurrencePolicy':
      return [
        `Child-care occurrences: frequency ${data.frequency}, initial skip ${data.initialSkipCount}, ${data.positive ? 'matching' : 'non-matching'} occurrences; delay ${recurrenceDelayLabel(data.delay)}`,
      ];
    default:
      return ['This schedule cannot be summarized in the read-only viewer.'];
  }
}

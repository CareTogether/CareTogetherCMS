export const matrixScheduleKinds = [
  { value: 'OneTimeRecurrencePolicy', label: 'One-time' },
  {
    value: 'DurationStagesRecurrencePolicy',
    label: 'Arrangement-duration stages',
  },
  {
    value: 'DurationStagesPerChildLocationRecurrencePolicy',
    label: 'Per-child placement stages',
  },
  {
    value: 'ChildCareOccurrenceBasedRecurrencePolicy',
    label: 'Child-care occurrence pattern',
  },
] as const;

export function wholeScheduleDays(delay: unknown): number | undefined {
  if (typeof delay !== 'string') return undefined;
  const match = /^(?:(\d+)\.)?00:00:00(?:\.0{1,7})?$/.exec(delay);
  if (!match) return undefined;
  const days = Number(match[1] ?? 0);
  return Number.isSafeInteger(days) && days <= 10675199 ? days : undefined;
}

export function scheduleValidation(
  data: Record<string, unknown> | undefined
): string | undefined {
  if (!data) return 'A monitoring schedule is required.';
  if (!matrixScheduleKinds.some((item) => item.value === data.discriminator))
    return 'Unsupported recurrence type; read-only.';
  const staged =
    data.discriminator === 'DurationStagesRecurrencePolicy' ||
    data.discriminator === 'DurationStagesPerChildLocationRecurrencePolicy';
  const allowed = staged
    ? ['discriminator', 'stages']
    : data.discriminator === 'OneTimeRecurrencePolicy'
      ? ['discriminator', 'delay']
      : ['discriminator', 'delay', 'frequency', 'initialSkipCount', 'positive'];
  if (Object.keys(data).some((key) => !allowed.includes(key)))
    return 'Unrecognized schedule fields; read-only.';
  if (staged) {
    if (!Array.isArray(data.stages) || data.stages.length === 0)
      return 'Configure at least one stage.';
    for (const [index, stage] of data.stages.entries()) {
      if (
        !stage ||
        typeof stage !== 'object' ||
        Object.keys(stage).some(
          (key) => !['delay', 'maxOccurrences'].includes(key)
        )
      )
        return 'Unsupported stage structure; read-only.';
      const days = wholeScheduleDays(stage.delay);
      if (days === undefined || days < 1)
        return 'Stage intervals must be positive whole days. Other intervals are read-only.';
      if (
        stage.maxOccurrences != null &&
        (!Number.isSafeInteger(stage.maxOccurrences) ||
          stage.maxOccurrences < 0 ||
          stage.maxOccurrences > 2147483647)
      )
        return 'Occurrence limits must be nonnegative whole numbers.';
      if (stage.maxOccurrences == null && index !== data.stages.length - 1)
        return 'Only the last stage may have unlimited occurrences.';
    }
    return undefined;
  }
  if (
    !(data.discriminator === 'OneTimeRecurrencePolicy' && data.delay == null) &&
    wholeScheduleDays(data.delay) === undefined
  )
    return 'Evaluation uses whole days. Other delays are preserved read-only.';
  if (data.discriminator === 'ChildCareOccurrenceBasedRecurrencePolicy') {
    if (
      typeof data.frequency !== 'number' ||
      !Number.isSafeInteger(data.frequency) ||
      data.frequency < 1 ||
      data.frequency > 2147483647
    )
      return 'Frequency must be a positive whole number.';
    if (
      typeof data.initialSkipCount !== 'number' ||
      !Number.isSafeInteger(data.initialSkipCount) ||
      data.initialSkipCount < 0 ||
      data.initialSkipCount >= data.frequency
    )
      return 'Initial skip must be between zero and frequency minus one.';
    if (typeof data.positive !== 'boolean')
      return 'Choose matching or non-matching occurrences.';
  }
  return undefined;
}

export function defaultMatrixSchedule(
  kind = 'OneTimeRecurrencePolicy'
): Record<string, unknown> {
  if (
    kind === 'DurationStagesRecurrencePolicy' ||
    kind === 'DurationStagesPerChildLocationRecurrencePolicy'
  )
    return {
      discriminator: kind,
      stages: [{ delay: '1.00:00:00', maxOccurrences: null }],
    };
  if (kind === 'ChildCareOccurrenceBasedRecurrencePolicy')
    return {
      discriminator: kind,
      delay: '1.00:00:00',
      frequency: 1,
      initialSkipCount: 0,
      positive: true,
    };
  return { discriminator: 'OneTimeRecurrencePolicy', delay: '1.00:00:00' };
}

import type { GridFilterOperator } from '@mui/x-data-grid-premium';

export function filterDateToPickerValue(value: unknown, timestamp: boolean) {
  if (value == null || value === '') return null;
  if (
    !(value instanceof Date) &&
    typeof value !== 'string' &&
    typeof value !== 'number'
  )
    return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  if (timestamp) return date;
  const localDate = new Date(0);
  localDate.setFullYear(
    date.getUTCFullYear(),
    date.getUTCMonth(),
    date.getUTCDate()
  );
  localDate.setHours(0, 0, 0, 0);
  return localDate;
}

export function pickerValueToFilterDate(date: Date | null, timestamp: boolean) {
  if (!date || Number.isNaN(date.getTime())) return undefined;
  if (timestamp) {
    const localDate = new Date(date);
    localDate.setHours(0, 0, 0, 0);
    return localDate;
  }
  const utcDate = new Date(0);
  utcDate.setUTCFullYear(date.getFullYear(), date.getMonth(), date.getDate());
  utcDate.setUTCHours(0, 0, 0, 0);
  return utcDate;
}

export const getCalendarDayFilterFn: GridFilterOperator['getApplyFilterFn'] = (
  item
) => {
  if (item.value == null || item.value === '') return null;
  const start = new Date(item.value);
  if (Number.isNaN(start.getTime())) return null;
  start.setHours(0, 0, 0, 0);
  const nextDay = new Date(start);
  nextDay.setDate(nextDay.getDate() + 1);
  const startTime = start.getTime();
  const nextTime = nextDay.getTime();
  const comparisons: Record<string, (time: number) => boolean> = {
    is: (time) => time >= startTime && time < nextTime,
    not: (time) => time < startTime || time >= nextTime,
    before: (time) => time < startTime,
    after: (time) => time >= nextTime,
    onOrBefore: (time) => time < nextTime,
    onOrAfter: (time) => time >= startTime,
  };
  const compare = comparisons[item.operator];
  if (!compare) return null;
  return (value: unknown) =>
    value instanceof Date &&
    !Number.isNaN(value.getTime()) &&
    compare(value.getTime());
};

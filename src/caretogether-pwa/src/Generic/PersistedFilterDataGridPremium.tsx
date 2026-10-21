import {
  DataGridPremium,
  GridFilterInputDate,
  getGridDateOperators,
  type DataGridPremiumProps,
  type GridValidRowModel,
  type GridFilterOperator,
} from '@mui/x-data-grid-premium';
import { useMemo } from 'react';
import { DataGridFilterInputDate } from './DataGridFilterInputDate';

type PersistedFilterDataGridPremiumProps<R extends GridValidRowModel> =
  DataGridPremiumProps<R> & {
    filterModelRestored: boolean;
    filterModel: NonNullable<DataGridPremiumProps<R>['filterModel']>;
    onFilterModelChange: NonNullable<
      DataGridPremiumProps<R>['onFilterModelChange']
    >;
  };

const getCalendarDayFilterFn: GridFilterOperator['getApplyFilterFn'] = (
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

export function PersistedFilterDataGridPremium<R extends GridValidRowModel>({
  filterModelRestored,
  columns,
  filterDebounceMs,
  ...gridProps
}: PersistedFilterDataGridPremiumProps<R>) {
  const pickerColumns = useMemo(
    () =>
      columns.map((column) => {
        if (column.type !== 'date' && column.type !== 'dateTime') return column;
        const operators =
          column.filterOperators ??
          getGridDateOperators(column.type === 'dateTime');
        if (
          !operators.some(
            (operator) => operator.InputComponent === GridFilterInputDate
          )
        )
          return column;
        return {
          ...column,
          filterOperators: operators.map((operator) =>
            operator.InputComponent === GridFilterInputDate
              ? {
                  ...operator,
                  getApplyFilterFn:
                    column.type === 'dateTime' && !column.filterOperators
                      ? getCalendarDayFilterFn
                      : operator.getApplyFilterFn,
                  InputComponent: DataGridFilterInputDate,
                  InputComponentProps: {
                    ...operator.InputComponentProps,
                    filterDebounceMs,
                  },
                }
              : operator
          ),
        };
      }),
    [columns, filterDebounceMs]
  );
  // MUI reads the quick filter's initial expanded state only when it mounts.
  return (
    <DataGridPremium
      key={filterModelRestored ? 'restored' : 'loading'}
      {...gridProps}
      columns={pickerColumns}
      filterDebounceMs={filterDebounceMs}
    />
  );
}

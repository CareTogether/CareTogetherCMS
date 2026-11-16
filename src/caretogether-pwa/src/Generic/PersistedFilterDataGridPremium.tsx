import {
  DataGridPremium,
  GridFilterInputDate,
  getGridDateOperators,
  type DataGridPremiumProps,
  type GridValidRowModel,
} from '@mui/x-data-grid-premium';
import { useMemo } from 'react';
import { DataGridFilterInputDate } from './DataGridFilterInputDate';
import { getCalendarDayFilterFn } from './dataGridDateFilterUtils';

type PersistedFilterDataGridPremiumProps<R extends GridValidRowModel> =
  DataGridPremiumProps<R> & {
    filterModelRestored: boolean;
    filterModel: NonNullable<DataGridPremiumProps<R>['filterModel']>;
    onFilterModelChange: NonNullable<
      DataGridPremiumProps<R>['onFilterModelChange']
    >;
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

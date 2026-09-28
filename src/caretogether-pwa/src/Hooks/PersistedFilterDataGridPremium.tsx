import {
  DataGridPremium,
  type DataGridPremiumProps,
  type GridValidRowModel,
} from '@mui/x-data-grid-premium';

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
  ...gridProps
}: PersistedFilterDataGridPremiumProps<R>) {
  // MUI reads the quick filter's initial expanded state only when it mounts.
  return (
    <DataGridPremium
      key={filterModelRestored ? 'restored' : 'loading'}
      {...gridProps}
    />
  );
}

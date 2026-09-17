import { Box, useTheme } from '@mui/material';
import {
  DataGridPremium,
  type GridColumnVisibilityModel,
  type GridRowParams,
} from '@mui/x-data-grid-premium';
import { useCallback, useMemo, useState } from 'react';
import { v2DataGridStyles } from '../../Families/v2DataGridStyles';
import { usePersistedGridFilterModel } from '../../Hooks/usePersistedGridFilterModel';
import {
  arrangementsInitialSortModel,
  arrangementsDefaultColumnVisibility,
  buildArrangementsGridColumns,
} from './arrangementsGridColumns';
import type { ArrangementBrowserRowV2 } from './arrangementViewModel';

type ArrangementsDataGridV2Props = {
  filterScopeId?: string;
  highlightedArrangementId?: string;
  onRowClick: (row: ArrangementBrowserRowV2) => void;
  rows: ArrangementBrowserRowV2[];
};

export function ArrangementsDataGridV2({
  filterScopeId,
  highlightedArrangementId,
  onRowClick,
  rows,
}: ArrangementsDataGridV2Props) {
  const theme = useTheme();
  const columns = useMemo(() => buildArrangementsGridColumns(rows), [rows]);
  const { filterModel, onFilterModelChange } = usePersistedGridFilterModel({
    columns,
    entityId: filterScopeId,
    namespace: 'arrangements',
  });
  const [columnVisibilityModel, setColumnVisibilityModel] =
    useState<GridColumnVisibilityModel>({});
  const visibleColumns = useMemo(
    () => ({
      ...arrangementsDefaultColumnVisibility(columns),
      ...columnVisibilityModel,
    }),
    [columnVisibilityModel, columns]
  );
  const handleRowClick = useCallback(
    ({ row }: GridRowParams<ArrangementBrowserRowV2>) => onRowClick(row),
    [onRowClick]
  );
  const pageSize = 10;
  const paginationNeeded = rows.length > pageSize;

  return (
    <Box
      sx={v2DataGridStyles(theme, {
        highlightedRowClassName: 'arrangement-row-highlight',
        highlightedRowColor: theme.palette.primary.main,
      })}
    >
      <DataGridPremium
        showToolbar
        autoHeight
        density="comfortable"
        disableAggregation
        disablePivoting
        disableRowGrouping
        rows={rows}
        columns={columns}
        filterModel={filterModel}
        onFilterModelChange={onFilterModelChange}
        columnVisibilityModel={visibleColumns}
        onColumnVisibilityModelChange={setColumnVisibilityModel}
        getRowHeight={() => 'auto'}
        getEstimatedRowHeight={() => 72}
        columnHeaderHeight={42}
        disableRowSelectionOnClick
        hideFooter={!paginationNeeded}
        onRowClick={handleRowClick}
        pageSizeOptions={[10, 25, 50]}
        getRowClassName={({ row }) =>
          row.id === highlightedArrangementId ? 'arrangement-row-highlight' : ''
        }
        initialState={{
          columns: {
            columnVisibilityModel: arrangementsDefaultColumnVisibility(columns),
          },
          pagination: {
            paginationModel: { pageSize },
          },
          sorting: {
            sortModel: arrangementsInitialSortModel,
          },
        }}
        sx={{
          '& .MuiDataGrid-cell': {
            py: 1,
          },
        }}
      />
    </Box>
  );
}

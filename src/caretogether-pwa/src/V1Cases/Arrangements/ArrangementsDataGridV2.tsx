import { Box, useTheme } from '@mui/material';
import {
  DataGrid,
  GridColDef,
  GridFilterModel,
  GridToolbar,
} from '@mui/x-data-grid';
import { v2DataGridStyles } from '../../Families/v2DataGridStyles';
import type { ArrangementRowV2 } from './arrangementViewModel';

type ArrangementsDataGridV2Props = {
  columns: GridColDef<ArrangementRowV2>[];
  filterModel: GridFilterModel;
  highlightedArrangementId?: string;
  onRowClick: (row: ArrangementRowV2) => void;
  onFilterModelChange: (model: GridFilterModel) => void;
  rows: ArrangementRowV2[];
};

export function ArrangementsDataGridV2({
  columns,
  filterModel,
  highlightedArrangementId,
  onFilterModelChange,
  onRowClick,
  rows,
}: ArrangementsDataGridV2Props) {
  const theme = useTheme();
  const pageSize = 10;
  const paginationNeeded = rows.length > pageSize;

  return (
    <Box
      sx={v2DataGridStyles(theme, {
        highlightedRowClassName: 'arrangement-row-highlight',
        highlightedRowColor: theme.palette.primary.main,
      })}
    >
      <DataGrid
        autoHeight
        rows={rows}
        columns={columns}
        getRowHeight={() => 'auto'}
        getEstimatedRowHeight={() => 72}
        columnHeaderHeight={42}
        disableRowSelectionOnClick
        filterModel={filterModel}
        hideFooter={!paginationNeeded}
        onRowClick={({ row }) => onRowClick(row)}
        onFilterModelChange={onFilterModelChange}
        pageSizeOptions={[10, 25, 50]}
        getRowClassName={({ row }) =>
          row.id === highlightedArrangementId ? 'arrangement-row-highlight' : ''
        }
        initialState={{
          pagination: {
            paginationModel: { pageSize },
          },
          sorting: {
            sortModel: [{ field: 'statusLabel', sort: 'asc' }],
          },
        }}
        slots={{
          toolbar: GridToolbar,
        }}
        slotProps={{
          toolbar: {
            showQuickFilter: true,
          },
        }}
      />
    </Box>
  );
}

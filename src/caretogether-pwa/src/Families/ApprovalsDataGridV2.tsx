import { Box, useTheme } from '@mui/material';
import {
  DataGrid,
  GridColDef,
  GridFilterModel,
  GridToolbar,
} from '@mui/x-data-grid';
import { useRef } from 'react';
import type { ApprovalLedgerRow } from './approvalLedgerViewModel';
import type { ApprovalLedgerDataGridRowV2 } from './approvalLedgerDataGridViewModel';
import { v2DataGridStyles } from './v2DataGridStyles';

type ApprovalsDataGridV2Props = {
  columns: GridColDef<ApprovalLedgerDataGridRowV2>[];
  filterModel: GridFilterModel;
  onRowClick: (row: ApprovalLedgerRow) => void;
  onFilterModelChange: (model: GridFilterModel) => void;
  rows: ApprovalLedgerRow[];
};

export function ApprovalsDataGridV2({
  columns,
  filterModel,
  onFilterModelChange,
  onRowClick,
  rows,
}: ApprovalsDataGridV2Props) {
  const theme = useTheme();
  const gridContainerRef = useRef<HTMLDivElement | null>(null);

  const clearGridFocus = () => {
    const activeElement = document.activeElement;

    if (
      activeElement instanceof HTMLElement &&
      gridContainerRef.current?.contains(activeElement)
    ) {
      activeElement.blur();
    }
  };

  return (
    <Box
      ref={gridContainerRef}
      sx={[
        v2DataGridStyles(theme),
        {
          '& .MuiDataGrid-cell': {
            pointerEvents: 'none',
          },
          '& .MuiDataGrid-cell:hover, & .MuiDataGrid-cell.Mui-selected, & .MuiDataGrid-cell--editing':
            {
              backgroundColor: 'transparent',
            },
          '& .MuiDataGrid-root .MuiDataGrid-cell:focus, & .MuiDataGrid-root .MuiDataGrid-cell:focus-visible, & .MuiDataGrid-root .MuiDataGrid-cell:focus-within, & .MuiDataGrid-cell.Mui-selected':
            {
              backgroundColor: 'transparent',
              boxShadow: 'none',
              outline: 'none',
            },
          '& .MuiDataGrid-columnHeader:focus, & .MuiDataGrid-columnHeader:focus-within':
            {
              backgroundColor: 'transparent',
              boxShadow: 'none',
              outline: 'none',
            },
          '& .MuiDataGrid-columnHeader:focus-visible': {
            backgroundColor: 'transparent',
            boxShadow: 'none',
            outline: 'none',
          },
        },
      ]}
    >
      <DataGrid
        autoHeight
        rows={rows}
        columns={columns}
        rowHeight={56}
        columnHeaderHeight={42}
        disableRowSelectionOnClick
        filterModel={filterModel}
        hideFooter
        initialState={{
          columns: {
            columnVisibilityModel: {
              searchText: false,
            },
          },
        }}
        onRowClick={({ row }) => {
          clearGridFocus();
          onRowClick(row);
        }}
        onFilterModelChange={onFilterModelChange}
        onCellKeyDown={({ row }, event) => {
          if (event.key !== 'Enter' && event.key !== ' ') {
            return;
          }

          event.preventDefault();
          clearGridFocus();
          onRowClick(row);
        }}
        slots={{ toolbar: GridToolbar }}
        slotProps={{
          toolbar: {
            showQuickFilter: true,
          },
        }}
      />
    </Box>
  );
}

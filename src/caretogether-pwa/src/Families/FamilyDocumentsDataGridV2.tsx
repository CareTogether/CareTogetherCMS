import { Box, useTheme } from '@mui/material';
import {
  DataGrid,
  GridColDef,
  GridFilterModel,
  GridToolbar,
} from '@mui/x-data-grid';
import { FamilyDocumentRowV2 } from './familyDocumentsViewModelV2';
import { v2DataGridStyles } from './v2DataGridStyles';

type FamilyDocumentsDataGridV2Props = {
  columns: GridColDef<FamilyDocumentRowV2>[];
  filterModel: GridFilterModel;
  onFilterModelChange: (model: GridFilterModel) => void;
  rows: FamilyDocumentRowV2[];
};

export function FamilyDocumentsDataGridV2({
  columns,
  filterModel,
  onFilterModelChange,
  rows,
}: FamilyDocumentsDataGridV2Props) {
  const theme = useTheme();

  return (
    <Box sx={v2DataGridStyles(theme)}>
      <DataGrid
        autoHeight
        rows={rows}
        columns={columns}
        rowHeight={56}
        columnHeaderHeight={42}
        disableRowSelectionOnClick
        hideFooter
        filterModel={filterModel}
        initialState={{
          columns: {
            columnVisibilityModel: {
              searchText: false,
              sourceLabel: false,
            },
          },
          sorting: {
            sortModel: [{ field: 'uploadedAtUtc', sort: 'desc' }],
          },
        }}
        onFilterModelChange={onFilterModelChange}
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

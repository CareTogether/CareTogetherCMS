import { Box, useTheme } from '@mui/material';
import {
  DataGrid,
  GridColDef,
  GridFilterModel,
  GridToolbar,
} from '@mui/x-data-grid';
import { VolunteerAssignmentRowV2 } from './volunteerAssignmentViewModel';
import { v2DataGridStyles } from './v2DataGridStyles';

type VolunteerAssignmentsDataGridV2Props = {
  columns: GridColDef<VolunteerAssignmentRowV2>[];
  filterModel: GridFilterModel;
  onRowClick: (row: VolunteerAssignmentRowV2) => void;
  onFilterModelChange: (model: GridFilterModel) => void;
  rows: VolunteerAssignmentRowV2[];
};

function clearActiveGridElement() {
  const activeElement = document.activeElement;

  if (!(activeElement instanceof HTMLElement)) return;

  activeElement.blur();
}

export function VolunteerAssignmentsDataGridV2({
  columns,
  filterModel,
  onFilterModelChange,
  onRowClick,
  rows,
}: VolunteerAssignmentsDataGridV2Props) {
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
        onRowClick={({ row }) => {
          if (!row.childFamilyId) return;

          onRowClick(row);
          clearActiveGridElement();
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

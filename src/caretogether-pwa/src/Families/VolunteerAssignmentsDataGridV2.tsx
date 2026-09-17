import { Box, useTheme } from '@mui/material';
import {
  DataGridPremium,
  type GridInitialState,
  type GridRowParams,
} from '@mui/x-data-grid-premium';
import { useMemo } from 'react';
import {
  assignmentsDefaultColumnVisibility,
  assignmentsInitialSortModel,
  buildVolunteerAssignmentsGridColumns,
} from './volunteerAssignmentsGridColumns';
import type { AssignmentBrowserRowV2 } from './volunteerAssignmentViewModel';
import { v2DataGridStyles } from './v2DataGridStyles';

type VolunteerAssignmentsDataGridV2Props = {
  onRowClick: (row: AssignmentBrowserRowV2) => void;
  rows: AssignmentBrowserRowV2[];
};

const assignmentsGridInitialState: GridInitialState = {
  columns: {
    columnVisibilityModel: assignmentsDefaultColumnVisibility,
  },
  filter: {
    filterModel: { items: [], quickFilterExcludeHiddenColumns: false },
  },
  sorting: {
    sortModel: assignmentsInitialSortModel,
  },
};

function clearActiveGridElement() {
  const activeElement = document.activeElement;

  if (!(activeElement instanceof HTMLElement)) return;

  activeElement.blur();
}

export function VolunteerAssignmentsDataGridV2({
  onRowClick,
  rows,
}: VolunteerAssignmentsDataGridV2Props) {
  const theme = useTheme();
  const columns = useMemo(
    () => buildVolunteerAssignmentsGridColumns(rows),
    [rows]
  );

  return (
    <Box sx={v2DataGridStyles(theme)}>
      <DataGridPremium
        showToolbar
        autoHeight
        disableAggregation
        disablePivoting
        disableRowGrouping
        rows={rows}
        columns={columns}
        rowHeight={56}
        columnHeaderHeight={42}
        disableRowSelectionOnClick
        hideFooter
        initialState={assignmentsGridInitialState}
        onRowClick={({ row }: GridRowParams<AssignmentBrowserRowV2>) => {
          if (!row.childFamilyId) return;

          onRowClick(row);
          clearActiveGridElement();
        }}
      />
    </Box>
  );
}

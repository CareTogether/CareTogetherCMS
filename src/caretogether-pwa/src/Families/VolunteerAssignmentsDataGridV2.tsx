import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { Box, Chip, Typography, useTheme } from '@mui/material';
import { DataGrid, GridColDef, GridToolbar } from '@mui/x-data-grid';
import { useMemo } from 'react';
import { VolunteerAssignmentRowV2 } from './volunteerAssignmentViewModel';
import { v2Typography } from './v2Typography';

type VolunteerAssignmentsDataGridV2Props = {
  onRowClick: (row: VolunteerAssignmentRowV2) => void;
  rows: VolunteerAssignmentRowV2[];
};

function buildColumns(): GridColDef<VolunteerAssignmentRowV2>[] {
  return [
    {
      field: 'typeLabel',
      headerName: 'Type',
      minWidth: 160,
      flex: 0.8,
      renderCell: ({ row }) => (
        <Typography className="ph-unmask" {...v2Typography.browserCell} noWrap>
          {row.typeLabel}
        </Typography>
      ),
    },
    {
      field: 'personLabel',
      headerName: 'Person',
      minWidth: 180,
      flex: 0.9,
      renderCell: ({ row }) => (
        <Typography
          className="ph-unmask"
          {...v2Typography.browserCell}
          noWrap
          sx={{ fontWeight: 600 }}
        >
          {row.personLabel}
        </Typography>
      ),
    },
    {
      field: 'status',
      headerName: 'Status',
      width: 140,
      valueGetter: (_value, row) => row.status.label,
      renderCell: ({ row }) => (
        <Chip label={row.status.label} color={row.status.color} size="small" />
      ),
    },
    {
      field: 'startedLabel',
      headerName: 'Started',
      width: 120,
      renderCell: ({ row }) => (
        <Typography {...v2Typography.browserCell}>{row.startedLabel}</Typography>
      ),
    },
    {
      field: 'endedLabel',
      headerName: 'Ended',
      width: 120,
      renderCell: ({ row }) => (
        <Typography {...v2Typography.browserCell}>{row.endedLabel}</Typography>
      ),
    },
    {
      field: 'currentLocationLabel',
      headerName: 'Current Location',
      minWidth: 200,
      flex: 1,
      renderCell: ({ row }) => (
        <Typography className="ph-unmask" {...v2Typography.browserCell} noWrap>
          {row.currentLocationLabel}
        </Typography>
      ),
    },
    {
      field: 'nextPlannedLocationLabel',
      headerName: 'Next Planned Location',
      minWidth: 220,
      flex: 1,
      renderCell: ({ row }) => (
        <Typography
          className="ph-unmask"
          {...v2Typography.browserCell}
          noWrap
          sx={{
            color: row.nextPlanIsPastDue ? 'error.main' : undefined,
            fontWeight: row.nextPlanIsPastDue ? 600 : undefined,
          }}
        >
          {row.nextPlanIsPastDue && 'PAST DUE - '}
          {row.nextPlannedLocationLabel}
        </Typography>
      ),
    },
    {
      field: 'openDetails',
      headerName: '',
      width: 44,
      sortable: false,
      filterable: false,
      disableColumnMenu: true,
      renderCell: ({ row }) =>
        row.childFamilyId ? (
          <ChevronRightIcon
            fontSize="small"
            sx={{
              color: 'text.secondary',
              opacity: 0,
              transition: 'opacity 120ms ease-in-out',
            }}
          />
        ) : null,
    },
  ];
}

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
  const columns = useMemo(() => buildColumns(), []);

  return (
    <Box
      sx={{
        width: '100%',
        border: 1,
        borderColor: 'divider',
        borderRadius: 1,
        bgcolor: 'background.paper',
        overflow: 'hidden',
        '& .MuiDataGrid-row': {
          cursor: 'pointer',
          minHeight: 56,
          transition: theme.transitions.create(
            ['background-color', 'box-shadow'],
            {
              duration: theme.transitions.duration.shortest,
            }
          ),
          '&:hover': {
            backgroundColor: theme.palette.action.hover,
          },
          '&:hover .MuiDataGrid-cell': {
            backgroundColor: theme.palette.action.hover,
          },
          '&:hover .MuiSvgIcon-root': {
            opacity: 1,
          },
        },
        '& .MuiDataGrid-cell': {
          alignItems: 'center',
          cursor: 'inherit',
          display: 'flex',
          py: 1,
        },
        '& .MuiDataGrid-root': {
          border: 0,
        },
        '& .MuiDataGrid-columnHeaders': {
          backgroundColor: theme.palette.action.hover,
          borderBottomColor: theme.palette.divider,
        },
        '& .MuiDataGrid-cell:focus, & .MuiDataGrid-cell:focus-within': {
          outline: 'none',
        },
        '& .MuiDataGrid-columnHeader:focus, & .MuiDataGrid-columnHeader:focus-within':
          {
            outline: 'none',
          },
      }}
    >
      <DataGrid
        autoHeight
        rows={rows}
        columns={columns}
        rowHeight={56}
        columnHeaderHeight={42}
        disableRowSelectionOnClick
        hideFooter
        onRowClick={({ row }) => {
          if (!row.childFamilyId) return;

          onRowClick(row);
          clearActiveGridElement();
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

import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { Chip, Typography } from '@mui/material';
import type { GridColDef } from '@mui/x-data-grid';
import type { VolunteerAssignmentRowV2 } from './volunteerAssignmentViewModel';
import { v2Typography } from './v2Typography';

export function volunteerAssignmentsDataGridColumns(): GridColDef<VolunteerAssignmentRowV2>[] {
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

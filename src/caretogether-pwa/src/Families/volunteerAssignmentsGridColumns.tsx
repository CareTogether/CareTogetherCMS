import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { Chip, Typography } from '@mui/material';
import {
  type GridColDef,
  type GridColumnVisibilityModel,
  type GridSortModel,
} from '@mui/x-data-grid-premium';
import { format } from 'date-fns';
import {
  assignmentBrowserStatusPresentation,
  assignmentCurrentLocationLabel,
  assignmentNextPlannedLocationLabel,
  assignmentPersonLabel,
  assignmentTypeLabel,
  type AssignmentBrowserRowV2,
} from './volunteerAssignmentViewModel';
import { v2Typography } from './v2Typography';

export const ASSIGNMENTS_SEARCH_FIELD = 'searchableText';

export const assignmentsInitialSortModel: GridSortModel = [
  { field: 'startedAtUtc', sort: 'desc' },
];

export const assignmentsDefaultColumnVisibility: GridColumnVisibilityModel = {
  [ASSIGNMENTS_SEARCH_FIELD]: false,
};

const reportingLockdown = {
  aggregable: false,
  groupable: false,
  pivotable: false,
};

const quickFilterDisabled = {
  getApplyQuickFilterFn: () => null,
};

export function formatAssignmentDate(value: Date | null | undefined) {
  return value ? format(value, 'M/d/yyyy') : '-';
}

function stringOrNull(value: unknown) {
  return typeof value === 'string' ? value : null;
}

function assignmentStatusLabel(value: unknown) {
  if (
    value !== 'cancelled' &&
    value !== 'ended' &&
    value !== 'active' &&
    value !== 'pending'
  ) {
    return '';
  }

  return assignmentBrowserStatusPresentation(value).label;
}

export function buildVolunteerAssignmentsGridColumns(
  rows: AssignmentBrowserRowV2[]
): GridColDef<AssignmentBrowserRowV2>[] {
  const arrangementTypes = Array.from(
    new Set(rows.map((row) => row.arrangementType).filter(Boolean))
  ).sort();

  return [
    {
      ...reportingLockdown,
      field: 'arrangementType',
      headerName: 'Type',
      type: 'singleSelect',
      minWidth: 160,
      flex: 0.8,
      valueOptions: arrangementTypes,
      ...quickFilterDisabled,
      valueFormatter: (value) => assignmentTypeLabel(stringOrNull(value) ?? ''),
      renderCell: ({ row }) => (
        <Typography className="ph-unmask" {...v2Typography.browserCell} noWrap>
          {assignmentTypeLabel(row.arrangementType)}
        </Typography>
      ),
    },
    {
      ...reportingLockdown,
      field: 'personLabel',
      headerName: 'Person',
      minWidth: 180,
      flex: 0.9,
      ...quickFilterDisabled,
      valueFormatter: (value) => assignmentPersonLabel(stringOrNull(value)),
      renderCell: ({ row }) => (
        <Typography
          className="ph-unmask"
          {...v2Typography.browserCell}
          noWrap
          sx={{ fontWeight: 600 }}
        >
          {assignmentPersonLabel(row.personLabel)}
        </Typography>
      ),
    },
    {
      ...reportingLockdown,
      field: 'status',
      headerName: 'Status',
      type: 'singleSelect',
      width: 140,
      valueOptions: [
        { value: 'cancelled', label: 'Cancelled' },
        { value: 'ended', label: 'Ended' },
        { value: 'active', label: 'Active' },
        { value: 'pending', label: 'Pending' },
      ],
      ...quickFilterDisabled,
      valueFormatter: (value) => assignmentStatusLabel(value),
      renderCell: ({ row }) => {
        const status = assignmentBrowserStatusPresentation(row.status);
        return <Chip label={status.label} color={status.color} size="small" />;
      },
    },
    {
      ...reportingLockdown,
      field: 'startedAtUtc',
      headerName: 'Started',
      type: 'date',
      width: 120,
      ...quickFilterDisabled,
      valueFormatter: (_value, row) => formatAssignmentDate(row.startedAtUtc),
      renderCell: ({ row }) => (
        <Typography {...v2Typography.browserCell}>
          {formatAssignmentDate(row.startedAtUtc)}
        </Typography>
      ),
    },
    {
      ...reportingLockdown,
      field: 'endedAtUtc',
      headerName: 'Ended',
      type: 'date',
      width: 120,
      ...quickFilterDisabled,
      valueFormatter: (_value, row) => formatAssignmentDate(row.endedAtUtc),
      renderCell: ({ row }) => (
        <Typography {...v2Typography.browserCell}>
          {formatAssignmentDate(row.endedAtUtc)}
        </Typography>
      ),
    },
    {
      ...reportingLockdown,
      field: 'currentLocationLabel',
      headerName: 'Current Location',
      minWidth: 200,
      flex: 1,
      ...quickFilterDisabled,
      valueFormatter: (value) =>
        assignmentCurrentLocationLabel(stringOrNull(value)),
      renderCell: ({ row }) => (
        <Typography className="ph-unmask" {...v2Typography.browserCell} noWrap>
          {assignmentCurrentLocationLabel(row.currentLocationLabel)}
        </Typography>
      ),
    },
    {
      ...reportingLockdown,
      field: 'nextPlannedLocationLabel',
      headerName: 'Next Planned Location',
      minWidth: 220,
      flex: 1,
      ...quickFilterDisabled,
      valueFormatter: (_value, row) =>
        assignmentNextPlannedLocationLabel(
          row.nextPlannedLocationLabel,
          row.nextPlannedLocationAtUtc
        ),
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
          {assignmentNextPlannedLocationLabel(
            row.nextPlannedLocationLabel,
            row.nextPlannedLocationAtUtc
          )}
        </Typography>
      ),
    },
    {
      ...reportingLockdown,
      field: 'openDetails',
      headerName: '',
      width: 44,
      sortable: false,
      filterable: false,
      disableColumnMenu: true,
      disableExport: true,
      ...quickFilterDisabled,
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
    {
      ...reportingLockdown,
      field: ASSIGNMENTS_SEARCH_FIELD,
      headerName: 'Search',
      hideable: false,
      filterable: false,
      sortable: false,
      disableColumnMenu: true,
      disableExport: true,
    },
  ];
}

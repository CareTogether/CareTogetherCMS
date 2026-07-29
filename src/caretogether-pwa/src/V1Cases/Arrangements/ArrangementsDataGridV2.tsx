import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningIcon from '@mui/icons-material/Warning';
import { Box, Chip, Stack, Typography, useTheme } from '@mui/material';
import { DataGrid, GridColDef, GridToolbar } from '@mui/x-data-grid';
import type { GridComparatorFn } from '@mui/x-data-grid';
import {
  ArrangementPolicy,
  ArrangementPhase,
  ChildInvolvement,
  FunctionRequirement,
} from '../../GeneratedClient';
import { v2DataGridStyles } from '../../Families/v2DataGridStyles';
import { v2Typography } from '../../Families/v2Typography';
import { useMemo } from 'react';
import type {
  ArrangementRowV2,
  ChildcareArrangementRowV2,
} from './arrangementViewModel';
import { arrangementPhaseColor } from './arrangementPresentationV2';

type ArrangementsDataGridV2Props = {
  highlightedArrangementId?: string;
  onRowClick: (row: ArrangementRowV2) => void;
  rows: ArrangementRowV2[];
};

function displayValue(value?: string) {
  return value || '-';
}

function arrangementPhaseSortValue(phase?: ArrangementPhase) {
  return phase ?? Number.MAX_SAFE_INTEGER;
}

function requestedAtSortValue(row: ArrangementRowV2 | null) {
  return row?.source.requestedAtUtc?.getTime() ?? 0;
}

function usesChildLocation(arrangementPolicy?: ArrangementPolicy) {
  return (
    arrangementPolicy?.childInvolvement === ChildInvolvement.ChildHousing ||
    arrangementPolicy?.childInvolvement ===
      ChildInvolvement.DaytimeChildCareOnly
  );
}

function hasLocationLabels(
  row: ArrangementRowV2
): row is ChildcareArrangementRowV2 {
  return row.arrangementType === 'Childcare';
}

function ArrangementLocationSummary({ row }: { row: ArrangementRowV2 }) {
  if (!usesChildLocation(row.arrangementPolicy)) {
    return (
      <Typography color="text.secondary" {...v2Typography.browserCell}>
        -
      </Typography>
    );
  }

  const currentLocationLabel = hasLocationLabels(row)
    ? row.currentLocationLabel
    : undefined;
  const nextPlannedLocationLabel = hasLocationLabels(row)
    ? row.nextPlannedLocationLabel
    : undefined;

  return (
    <Stack spacing={0.5}>
      <Box>
        <Typography variant="caption" color="text.secondary">
          Current Location
        </Typography>
        <Typography {...v2Typography.browserCell}>
          {currentLocationLabel || <strong>Location unspecified</strong>}
        </Typography>
      </Box>
      {nextPlannedLocationLabel && (
        <Box>
          <Typography variant="caption" color="text.secondary">
            Next Planned Location
          </Typography>
          <Typography {...v2Typography.browserCell}>
            {nextPlannedLocationLabel}
          </Typography>
        </Box>
      )}
    </Stack>
  );
}

function assignmentHealth(row: ArrangementRowV2) {
  const requiredSummaries = row.functionSummaries.filter(
    (summary) =>
      summary.functionPolicy.requirement !== FunctionRequirement.ZeroOrMore
  );
  const missingRequiredSummaries = requiredSummaries.filter(
    (summary) => summary.assignments.length === 0
  );

  return {
    requiredCount: requiredSummaries.length,
    missingRequiredSummaries,
  };
}

const compareStatusThenRequestedAt: GridComparatorFn<string> = (
  _phase1,
  _phase2,
  cellParams1,
  cellParams2
) => {
  const row1 = cellParams1.api.getRow(cellParams1.id) as ArrangementRowV2 | null;
  const row2 = cellParams2.api.getRow(cellParams2.id) as ArrangementRowV2 | null;
  const phaseComparison =
    arrangementPhaseSortValue(row1?.source.phase) -
    arrangementPhaseSortValue(row2?.source.phase);

  if (phaseComparison !== 0) {
    return phaseComparison;
  }

  return requestedAtSortValue(row2) - requestedAtSortValue(row1);
};

function AssignmentHealthSummary({ row }: { row: ArrangementRowV2 }) {
  const { missingRequiredSummaries, requiredCount } = assignmentHealth(row);

  if (requiredCount === 0) {
    return (
      <Typography color="text.secondary" {...v2Typography.browserCell}>
        Optional only
      </Typography>
    );
  }

  if (missingRequiredSummaries.length === 0) {
    return (
      <Stack direction="row" spacing={0.75} sx={{ alignItems: 'center' }}>
        <CheckCircleIcon color="success" fontSize="small" />
        <Typography {...v2Typography.browserCell}>
          All required assigned
        </Typography>
      </Stack>
    );
  }

  const visibleMissingSummaries = missingRequiredSummaries.slice(0, 2);
  const remainingCount =
    missingRequiredSummaries.length - visibleMissingSummaries.length;

  return (
    <Stack spacing={0.35}>
      <Stack direction="row" spacing={0.75} sx={{ alignItems: 'center' }}>
        <WarningIcon color="warning" fontSize="small" />
        <Typography {...v2Typography.primaryValue}>
          {missingRequiredSummaries.length} required missing
        </Typography>
      </Stack>
      {visibleMissingSummaries.map((summary) => (
        <Typography
          key={summary.functionName}
          color="text.secondary"
          variant="caption"
          noWrap
        >
          {summary.functionName}
        </Typography>
      ))}
      {remainingCount > 0 && (
        <Typography color="text.secondary" variant="caption">
          +{remainingCount} more
        </Typography>
      )}
    </Stack>
  );
}

function buildColumns(): GridColDef<ArrangementRowV2>[] {
  return [
    {
      field: 'arrangementType',
      headerName: 'Type',
      minWidth: 160,
      flex: 0.85,
      valueGetter: (_value, row) =>
        row.source.arrangementType ?? row.arrangementType,
      renderCell: ({ row }) => (
        <Stack spacing={0.25} sx={{ minWidth: 0 }}>
          <Typography {...v2Typography.primaryValue} noWrap>
            {row.source.arrangementType ?? row.arrangementType}
          </Typography>
          {row.source.arrangementPolicyVersion && (
            <Typography color="text.secondary" variant="caption" noWrap>
              {row.source.arrangementPolicyVersion}
            </Typography>
          )}
        </Stack>
      ),
    },
    {
      field: 'caseLabel',
      headerName: 'Case',
      minWidth: 160,
      flex: 0.8,
      valueGetter: (_value, row) => displayValue(row.caseLabel),
      renderCell: ({ row }) => (
        <Typography {...v2Typography.browserCell} noWrap>
          {displayValue(row.caseLabel)}
        </Typography>
      ),
    },
    {
      field: 'statusLabel',
      headerName: 'Status',
      width: 150,
      type: 'singleSelect',
      valueOptions: [
        'Setting up',
        'Ready to start',
        'Started',
        'Ended',
        'Cancelled',
        'Unknown',
      ],
      sortComparator: compareStatusThenRequestedAt,
      renderCell: ({ row }) => (
        <Chip
          label={row.statusLabel}
          color={arrangementPhaseColor(row.source.phase)}
          size="small"
        />
      ),
    },
    {
      field: 'person',
      headerName: 'Person',
      minWidth: 180,
      flex: 1,
      valueGetter: (_value, row) => displayValue(row.childOrPersonLabel),
      renderCell: ({ row }) => (
        <Typography {...v2Typography.browserCell} noWrap>
          {displayValue(row.childOrPersonLabel)}
        </Typography>
      ),
    },
    {
      field: 'plannedStartDate',
      headerName: 'Planned Start',
      minWidth: 130,
      flex: 0.65,
      valueGetter: (_value, row) => row.source.plannedStartUtc?.getTime(),
      renderCell: ({ row }) => (
        <Typography {...v2Typography.browserCell} noWrap>
          {displayValue(row.plannedStartDate)}
        </Typography>
      ),
    },
    {
      field: 'plannedEndDate',
      headerName: 'Planned End',
      minWidth: 130,
      flex: 0.65,
      valueGetter: (_value, row) => row.source.plannedEndUtc?.getTime(),
      renderCell: ({ row }) => (
        <Typography {...v2Typography.browserCell} noWrap>
          {displayValue(row.plannedEndDate)}
        </Typography>
      ),
    },
    {
      field: 'startedDate',
      headerName: 'Actual Start',
      minWidth: 130,
      flex: 0.65,
      valueGetter: (_value, row) => row.source.startedAtUtc?.getTime(),
      renderCell: ({ row }) => (
        <Typography {...v2Typography.browserCell} noWrap>
          {displayValue(row.startedDate)}
        </Typography>
      ),
    },
    {
      field: 'endedDate',
      headerName: 'Actual End',
      minWidth: 130,
      flex: 0.65,
      valueGetter: (_value, row) => row.source.endedAtUtc?.getTime(),
      renderCell: ({ row }) => (
        <Typography {...v2Typography.browserCell} noWrap>
          {displayValue(row.endedDate)}
        </Typography>
      ),
    },
    {
      field: 'location',
      headerName: 'Location',
      minWidth: 220,
      flex: 1,
      valueGetter: (_value, row) =>
        hasLocationLabels(row)
          ? [row.currentLocationLabel, row.nextPlannedLocationLabel]
              .filter(Boolean)
              .join(' ')
          : '',
      renderCell: ({ row }) => <ArrangementLocationSummary row={row} />,
    },
    {
      field: 'assignments',
      headerName: 'Assignments',
      minWidth: 210,
      flex: 1,
      sortable: false,
      valueGetter: (_value, row) => {
        const { missingRequiredSummaries, requiredCount } =
          assignmentHealth(row);

        if (requiredCount === 0) return 'Optional only';
        if (missingRequiredSummaries.length === 0) {
          return 'All required assigned';
        }

        return `${missingRequiredSummaries.length} required missing ${missingRequiredSummaries
          .map((summary) => summary.functionName)
          .join(' ')}`;
      },
      renderCell: ({ row }) => <AssignmentHealthSummary row={row} />,
    },
    {
      field: 'openDetails',
      headerName: '',
      width: 44,
      sortable: false,
      filterable: false,
      disableColumnMenu: true,
      renderCell: () => (
        <ChevronRightIcon
          fontSize="small"
          sx={{
            color: 'text.secondary',
            opacity: 0,
            transition: 'opacity 120ms ease-in-out',
          }}
        />
      ),
    },
  ];
}

export function ArrangementsDataGridV2({
  highlightedArrangementId,
  onRowClick,
  rows,
}: ArrangementsDataGridV2Props) {
  const theme = useTheme();
  const columns = useMemo(() => buildColumns(), []);
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
        hideFooter={!paginationNeeded}
        onRowClick={({ row }) => onRowClick(row)}
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

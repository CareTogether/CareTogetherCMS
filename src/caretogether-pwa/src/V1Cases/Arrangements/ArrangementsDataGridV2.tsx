import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningIcon from '@mui/icons-material/Warning';
import { Box, Chip, Stack, Typography, useTheme } from '@mui/material';
import { DataGrid, GridColDef, GridToolbar } from '@mui/x-data-grid';
import {
  Arrangement,
  ArrangementPhase,
  ArrangementPolicy,
  ChildInvolvement,
  FunctionRequirement,
} from '../../GeneratedClient';
import { v2Typography } from '../../Families/v2Typography';
import { useMemo } from 'react';
import type { ArrangementRowV2 } from './arrangementViewModel';

type ArrangementsDataGridV2Props = {
  highlightedArrangementId?: string;
  onRowClick: (row: ArrangementRowV2) => void;
  rows: ArrangementRowV2[];
};

function displayValue(value?: string) {
  return value || '-';
}

function arrangementPhaseColor(phase?: ArrangementPhase) {
  if (phase === ArrangementPhase.Ended) return 'success';
  if (phase === ArrangementPhase.Cancelled) return 'default';
  if (phase === ArrangementPhase.Started) return 'info';
  return 'warning';
}

function usesChildLocation(arrangementPolicy?: ArrangementPolicy) {
  return (
    arrangementPolicy?.childInvolvement === ChildInvolvement.ChildHousing ||
    arrangementPolicy?.childInvolvement ===
      ChildInvolvement.DaytimeChildCareOnly
  );
}

function formatArrangementDate(date?: Date) {
  return date
    ? `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`
    : '-';
}

function ArrangementDurationSummary({
  arrangement,
}: {
  arrangement: Arrangement;
}) {
  const startLabel = arrangement.startedAtUtc ? 'Started' : 'Planned start';
  const startDate = arrangement.startedAtUtc ?? arrangement.plannedStartUtc;
  const endLabel = arrangement.endedAtUtc ? 'Ended' : 'Planned end';
  const endDate = arrangement.endedAtUtc ?? arrangement.plannedEndUtc;

  return (
    <Stack className="ph-unmask" spacing={0.5}>
      <Box>
        <Typography component="span" variant="caption" color="text.secondary">
          {startLabel}:&nbsp;
        </Typography>
        <Typography component="span" {...v2Typography.browserCell}>
          {formatArrangementDate(startDate)}
        </Typography>
      </Box>
      <Box>
        <Typography component="span" variant="caption" color="text.secondary">
          {endLabel}:&nbsp;
        </Typography>
        <Typography component="span" {...v2Typography.browserCell}>
          {formatArrangementDate(endDate)}
        </Typography>
      </Box>
    </Stack>
  );
}

function ArrangementLocationSummary({ row }: { row: ArrangementRowV2 }) {
  if (!usesChildLocation(row.arrangementPolicy)) {
    return (
      <Typography color="text.secondary" {...v2Typography.browserCell}>
        -
      </Typography>
    );
  }

  return (
    <Stack className="ph-unmask" spacing={0.5}>
      <Box>
        <Typography variant="caption" color="text.secondary">
          Current Location
        </Typography>
        <Typography {...v2Typography.browserCell}>
          {row.currentLocationLabel || <strong>Location unspecified</strong>}
        </Typography>
      </Box>
      {row.nextPlannedLocationLabel && (
        <Box>
          <Typography variant="caption" color="text.secondary">
            Next Planned Location
          </Typography>
          <Typography {...v2Typography.browserCell}>
            {row.nextPlannedLocationLabel}
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
    <Stack spacing={0.35} className="ph-unmask">
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
      renderCell: ({ row }) => (
        <Stack className="ph-unmask" spacing={0.25} sx={{ minWidth: 0 }}>
          <Typography {...v2Typography.primaryValue} noWrap>
            {row.arrangementType}
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
        <Typography className="ph-unmask" {...v2Typography.browserCell} noWrap>
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
        <Typography className="ph-unmask" {...v2Typography.browserCell} noWrap>
          {displayValue(row.childOrPersonLabel)}
        </Typography>
      ),
    },
    {
      field: 'duration',
      headerName: 'Duration',
      minWidth: 170,
      flex: 0.9,
      valueGetter: (_value, row) =>
        [
          row.source.startedAtUtc ?? row.source.plannedStartUtc,
          row.source.endedAtUtc ?? row.source.plannedEndUtc,
        ]
          .filter(Boolean)
          .map((date) => (date as Date).getTime())
          .join('|'),
      renderCell: ({ row }) => (
        <ArrangementDurationSummary arrangement={row.source} />
      ),
    },
    {
      field: 'location',
      headerName: 'Location',
      minWidth: 220,
      flex: 1,
      valueGetter: (_value, row) =>
        [row.currentLocationLabel, row.nextPlannedLocationLabel]
          .filter(Boolean)
          .join(' '),
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
          '&.arrangement-row-highlight': {
            boxShadow: `inset 3px 0 0 ${theme.palette.primary.main}`,
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

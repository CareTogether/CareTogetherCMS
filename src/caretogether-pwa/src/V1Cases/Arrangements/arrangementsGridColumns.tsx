import { Chip, Stack, Tooltip, Typography } from '@mui/material';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import {
  getGridMultiSelectOperators,
  type GridColDef,
  type GridColumnVisibilityModel,
  type GridComparatorFn,
  type GridFilterOperator,
  type GridSortModel,
} from '@mui/x-data-grid-premium';
import { format } from 'date-fns';
import {
  ArrangementPhase,
  ChildInvolvement,
  type ArrangementPolicy,
} from '../../GeneratedClient';
import { v2Typography } from '../../Families/v2Typography';
import { arrangementPhaseColor } from './arrangementPresentationV2';
import {
  arrangementFunctionFieldId,
  type ArrangementBrowserRowV2,
} from './arrangementViewModel';

export const ARRANGEMENTS_SEARCH_FIELD = 'searchableText';

export const arrangementsInitialSortModel: GridSortModel = [
  { field: 'phase', sort: 'asc' },
];

type ArrangementFunctionColumn = {
  field: string;
  functionName: string;
  arrangementType: string;
  arrangementPolicyVersion: string | null;
  options: Array<{ value: string; label: string }>;
};

function displayValue(value: string | null | undefined) {
  return value || '-';
}

export function formatArrangementDate(value: Date | null | undefined) {
  return value ? format(value, 'M/d/yy') : '';
}

export function arrangementPhaseLabel(phase: ArrangementPhase | null) {
  if (phase === ArrangementPhase.SettingUp) return 'Setting up';
  if (phase === ArrangementPhase.ReadyToStart) return 'Ready to start';
  if (phase === ArrangementPhase.Started) return 'Started';
  if (phase === ArrangementPhase.Ended) return 'Ended';
  if (phase === ArrangementPhase.Cancelled) return 'Cancelled';
  return 'Unknown';
}

function functionColumns(rows: ArrangementBrowserRowV2[]) {
  const columns = new Map<string, ArrangementFunctionColumn>();

  rows.forEach((row) => {
    row.functionSummaries.forEach((summary) => {
      const field = arrangementFunctionFieldId(
        row.arrangementType,
        row.arrangementPolicyVersion,
        summary.functionName
      );
      const existing = columns.get(field);
      const options = new Map(
        existing?.options.map((option) => [option.value, option]) ?? []
      );
      const value = row.functionAssignmentValues[field];

      value?.assignmentIds.forEach((id, index) => {
        options.set(id, {
          value: id,
          label: value.assignmentLabels[index] ?? id,
        });
      });
      columns.set(field, {
        field,
        functionName: summary.functionName,
        arrangementType: row.arrangementType,
        arrangementPolicyVersion: row.arrangementPolicyVersion,
        options: [...options.values()].sort((first, second) =>
          first.label.localeCompare(second.label)
        ),
      });
    });
  });

  const duplicateNames = new Set<string>();
  const names = new Set<string>();
  columns.forEach((column) => {
    if (names.has(column.functionName)) duplicateNames.add(column.functionName);
    names.add(column.functionName);
  });

  return [...columns.values()]
    .sort((first, second) => first.field.localeCompare(second.field))
    .map((column) => ({
      ...column,
      headerName: duplicateNames.has(column.functionName)
        ? `${column.functionName} (${column.arrangementType}${
            column.arrangementPolicyVersion
              ? ` v${column.arrangementPolicyVersion}`
              : ''
          })`
        : column.functionName,
    }));
}

const assignmentFilterOperators: GridFilterOperator<
  ArrangementBrowserRowV2,
  string[] | null,
  string
>[] = getGridMultiSelectOperators().map((operator) => ({
  ...operator,
  getApplyFilterFn: (item, column) => {
    const apply = operator.getApplyFilterFn(item, column);
    if (
      !apply ||
      (operator.value !== 'contains' && operator.value !== 'doesNotContain')
    )
      return apply;
    return (values, row, definition, apiRef) =>
      apply(values?.length ? values : [''], row, definition, apiRef);
  },
}));

const comparePhaseThenRequestedAt: GridComparatorFn<ArrangementPhase | null> = (
  phase1,
  phase2,
  cellParams1,
  cellParams2
) => {
  const phaseComparison =
    (phase1 ?? Number.MAX_SAFE_INTEGER) - (phase2 ?? Number.MAX_SAFE_INTEGER);
  if (phaseComparison !== 0) return phaseComparison;

  const row1 = cellParams1.api.getRow(cellParams1.id) as
    | ArrangementBrowserRowV2
    | undefined;
  const row2 = cellParams2.api.getRow(cellParams2.id) as
    | ArrangementBrowserRowV2
    | undefined;
  return (
    (row2?.requestedAtUtc?.getTime() ?? 0) -
    (row1?.requestedAtUtc?.getTime() ?? 0)
  );
};

function assignmentSummary(row: ArrangementBrowserRowV2) {
  return row.functionSummaries
    .filter((summary) => summary.assignmentLabels.length > 0)
    .map(
      (summary) =>
        `${summary.functionName}: ${summary.assignmentLabels.join(', ')}`
    );
}

function usesChildLocation(arrangementPolicy?: ArrangementPolicy) {
  return (
    arrangementPolicy?.childInvolvement === ChildInvolvement.ChildHousing ||
    arrangementPolicy?.childInvolvement ===
      ChildInvolvement.DaytimeChildCareOnly
  );
}

function arrangementLocationSummary(row: ArrangementBrowserRowV2) {
  if (!usesChildLocation(row.arrangementPolicy)) {
    return (
      <Typography color="text.secondary" {...v2Typography.browserCell}>
        -
      </Typography>
    );
  }

  return (
    <Typography {...v2Typography.browserCell} noWrap>
      {row.currentLocationLabel || 'Unspecified'}
    </Typography>
  );
}

function assignmentSummaryCell(row: ArrangementBrowserRowV2) {
  const assignments = assignmentSummary(row);
  if (assignments.length === 0) {
    return (
      <Stack spacing={0.35} sx={{ justifyContent: 'center', minHeight: 48 }}>
        <Typography color="text.secondary" {...v2Typography.browserCell}>
          -
        </Typography>
      </Stack>
    );
  }

  const visibleAssignments = assignments.slice(0, 2);
  const remainingAssignments = assignments.slice(visibleAssignments.length);
  return (
    <Stack spacing={0.35} sx={{ minHeight: 48 }}>
      {visibleAssignments.map((assignment) => {
        const separator = assignment.indexOf(': ');
        const functionName = assignment.slice(0, separator);
        const assignmentText = assignment.slice(separator + 2);

        return (
          <Typography key={assignment} {...v2Typography.browserCell} noWrap>
            <Typography component="span" sx={{ fontWeight: 600 }}>
              {functionName}:
            </Typography>{' '}
            {assignmentText}
          </Typography>
        );
      })}
      {remainingAssignments.length > 0 && (
        <Tooltip title={remainingAssignments.join('\n')}>
          <Typography color="text.secondary" variant="caption">
            +{remainingAssignments.length} more
          </Typography>
        </Tooltip>
      )}
    </Stack>
  );
}

const reportingLockdown = {
  aggregable: false,
  groupable: false,
  pivotable: false,
};

export function isInternalArrangementsColumn(field: string) {
  return field === ARRANGEMENTS_SEARCH_FIELD || field === 'openDetails';
}

export function isOptionalArrangementsColumn(field: string) {
  return (
    ['requestedAtUtc', 'cancelledAtUtc'].includes(field) ||
    field.startsWith('functionAssignment:')
  );
}

export function arrangementsDefaultColumnVisibility(
  columns: GridColDef<ArrangementBrowserRowV2>[]
): GridColumnVisibilityModel {
  return {
    ...Object.fromEntries(
      columns
        .filter((column) => isOptionalArrangementsColumn(column.field))
        .map((column) => [column.field, false])
    ),
    [ARRANGEMENTS_SEARCH_FIELD]: false,
    functionAssignments: true,
    openDetails: true,
  };
}

export function buildArrangementsGridColumns(
  rows: ArrangementBrowserRowV2[]
): GridColDef<ArrangementBrowserRowV2>[] {
  const arrangementTypes = Array.from(
    new Set(rows.map((row) => row.arrangementType))
  ).sort();
  const functionAssignmentColumns = functionColumns(rows).map(
    (
      functionColumn
    ): GridColDef<ArrangementBrowserRowV2, string[] | null, string> => ({
      ...reportingLockdown,
      field: functionColumn.field,
      headerName: functionColumn.headerName,
      type: 'multiSelect',
      minWidth: 190,
      flex: 1,
      valueOptions: functionColumn.options,
      valueGetter: (_value, row) =>
        row.functionAssignmentValues[functionColumn.field]?.assignmentIds ?? [],
      valueFormatter: (_value, row) =>
        row.functionAssignmentValues[
          functionColumn.field
        ]?.assignmentLabels.join(', ') ?? '',
      filterOperators: assignmentFilterOperators,
      renderCell: ({ formattedValue }) => (
        <Typography {...v2Typography.browserCell} noWrap>
          {displayValue(formattedValue)}
        </Typography>
      ),
    })
  );

  return [
    {
      ...reportingLockdown,
      field: 'arrangementType',
      headerName: 'Type',
      type: 'singleSelect',
      minWidth: 160,
      flex: 0.85,
      valueOptions: arrangementTypes,
      renderCell: ({ row }) => (
        <Stack spacing={0.25} sx={{ minWidth: 0 }}>
          <Typography {...v2Typography.primaryValue} noWrap>
            {row.arrangementType}
          </Typography>
          {row.arrangementPolicyVersion && (
            <Typography color="text.secondary" variant="caption" noWrap>
              {row.arrangementPolicyVersion}
            </Typography>
          )}
        </Stack>
      ),
    },
    {
      ...reportingLockdown,
      field: 'participantLabel',
      headerName: 'Person',
      minWidth: 180,
      flex: 1,
      valueGetter: (_value, row) => row.participantLabel,
      valueFormatter: (value) => displayValue(value as string | null),
      renderCell: ({ formattedValue }) => (
        <Typography {...v2Typography.browserCell} noWrap>
          {formattedValue}
        </Typography>
      ),
    },
    {
      ...reportingLockdown,
      field: 'phase',
      headerName: 'Status',
      width: 150,
      type: 'singleSelect',
      valueOptions: Object.values(ArrangementPhase)
        .filter((value): value is ArrangementPhase => typeof value === 'number')
        .map((value) => ({ value, label: arrangementPhaseLabel(value) })),
      sortComparator: comparePhaseThenRequestedAt,
      valueFormatter: (value) =>
        arrangementPhaseLabel(value as ArrangementPhase | null),
      renderCell: ({ value }) => (
        <Chip
          label={arrangementPhaseLabel(value as ArrangementPhase | null)}
          color={arrangementPhaseColor(value as ArrangementPhase | undefined)}
          size="small"
        />
      ),
    },
    {
      ...reportingLockdown,
      field: 'caseLabel',
      headerName: 'Case',
      minWidth: 160,
      flex: 0.8,
      valueGetter: (_value, row) => row.caseLabel ?? null,
      valueFormatter: (value) => displayValue(value as string | null),
      renderCell: ({ formattedValue }) => (
        <Typography {...v2Typography.browserCell} noWrap>
          {formattedValue}
        </Typography>
      ),
    },
    ...[
      ['plannedStartUtc', 'Planned Start'],
      ['plannedEndUtc', 'Planned End'],
      ['startedAtUtc', 'Actual Start'],
      ['endedAtUtc', 'Actual End'],
      ['requestedAtUtc', 'Requested'],
      ['cancelledAtUtc', 'Cancelled'],
    ].map(
      ([field, headerName]): GridColDef<
        ArrangementBrowserRowV2,
        Date | null,
        string
      > => ({
        ...reportingLockdown,
        field,
        headerName,
        type: 'date',
        minWidth: 130,
        flex: 0.65,
        valueGetter: (_value, row) =>
          row[field as keyof ArrangementBrowserRowV2] as Date | null,
        valueFormatter: (value) => formatArrangementDate(value as Date | null),
        renderCell: ({ formattedValue }) => (
          <Typography {...v2Typography.browserCell} noWrap>
            {displayValue(formattedValue)}
          </Typography>
        ),
      })
    ),
    {
      ...reportingLockdown,
      field: 'currentLocationLabel',
      headerName: 'Current Location',
      minWidth: 220,
      flex: 1,
      valueGetter: (_value, row) => row.currentLocationLabel,
      valueFormatter: (value) => displayValue(value as string | null),
      renderCell: ({ row }) => arrangementLocationSummary(row),
    },
    {
      ...reportingLockdown,
      field: 'functionAssignments',
      headerName: 'Assignments',
      minWidth: 210,
      flex: 1,
      sortable: false,
      filterable: false,
      valueGetter: (_value, row) => assignmentSummary(row),
      valueFormatter: (_value, row) => assignmentSummary(row).join('; '),
      renderCell: ({ row }) => assignmentSummaryCell(row),
    },
    ...functionAssignmentColumns,
    {
      ...reportingLockdown,
      field: ARRANGEMENTS_SEARCH_FIELD,
      headerName: 'Search',
      hideable: false,
      sortable: false,
      filterable: false,
      pinnable: false,
      disableExport: true,
      getApplyQuickFilterFn: (value) => {
        const query = String(value).trim().toLocaleLowerCase();
        return (searchableText) =>
          String(searchableText ?? '')
            .toLocaleLowerCase()
            .includes(query);
      },
    },
    {
      ...reportingLockdown,
      field: 'openDetails',
      headerName: '',
      width: 44,
      sortable: false,
      filterable: false,
      hideable: false,
      pinnable: false,
      disableExport: true,
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

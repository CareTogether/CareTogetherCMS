import { Box, Stack, Typography, useTheme } from '@mui/material';
import {
  DataGridPremium,
  GridColDef,
  GridFilterModel,
  GridRowParams,
  GridToolbar,
  getGridSingleSelectOperators,
} from '@mui/x-data-grid-premium';
import { useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';
import { v2DataGridStyles } from '../Families/v2DataGridStyles';
import { v2Typography } from '../Families/v2Typography';
import type { ReferralRowModel } from './referralBrowserTypes';
import {
  gridFilterModelFromReferralFilters,
  REFERRAL_COUNTY_BLANK_FILTER_VALUE,
  referralAssignmentFilterField,
  referralFiltersFromGridFilterModel,
  type ReferralAssignmentGridFilter,
  type ReferralsGridFilterLogicOperator,
} from './referralsGridFilterAdapter';
import type { ReferralStatusFilter } from './referralStatusFilter';

type ReferralGridValueOption = {
  label: string;
  value: string;
};

type ReferralsDataGridV2Props = {
  assignmentFilterLogicOperator: ReferralsGridFilterLogicOperator;
  assignmentFilters: ReferralAssignmentGridFilter[];
  assignmentRoles?: string[];
  countyFilter: (string | null)[];
  countyValueOptions: ReferralGridValueOption[];
  expanded?: boolean;
  filterText: string;
  loading?: boolean;
  onAssignmentFilterLogicOperatorChange: (
    logicOperator: ReferralsGridFilterLogicOperator
  ) => void;
  onAssignmentFiltersChange: (
    assignmentFilters: ReferralAssignmentGridFilter[]
  ) => void;
  onCountyFilterChange: (countyFilter: (string | null)[]) => void;
  onFilterTextChange: (filterText: string) => void;
  onRowClick: (row: ReferralRowModel) => void;
  onStatusFilterChange: (statusFilter: ReferralStatusFilter) => void;
  rows: ReferralRowModel[];
  statusFilter: ReferralStatusFilter;
};

const REFERRALS_GRID_PAGE_SIZE = 100;
const referralsGridPageSizeOptions = [REFERRALS_GRID_PAGE_SIZE];
const referralsGridInitialState = {
  pagination: {
    paginationModel: { pageSize: REFERRALS_GRID_PAGE_SIZE },
  },
};
const referralsGridSlots = {
  noRowsOverlay: ReferralsEmptyState,
  toolbar: GridToolbar,
};
const referralsGridSlotProps = {
  toolbar: {
    showQuickFilter: true,
    quickFilterProps: {
      quickFilterFormatter: (values: unknown[]) => values.join(' '),
      quickFilterParser: (searchText: string) =>
        searchText.trim() === '' ? [] : [searchText],
    },
  },
};
const REFERRALS_CELL_MIN_HEIGHT = 48;
const referralStatusFilterOperators = getGridSingleSelectOperators().filter(
  (operator) => operator.value === 'is'
);
const referralCountyFilterOperators = getGridSingleSelectOperators().filter(
  (operator) => operator.value === 'isAnyOf'
);
const referralStatusValueOptions = [
  { label: 'Open', value: 'OPEN' },
  { label: 'Accepted', value: 'ACCEPTED' },
  { label: 'Closed', value: 'CLOSED' },
];

function getReferralsRowHeight() {
  return 'auto' as const;
}

function getEstimatedReferralsRowHeight() {
  return 72;
}

function displayValue(value: string | null | undefined) {
  return value || '-';
}

function formatDate(date?: Date) {
  if (!date) return '';
  return date.toLocaleDateString();
}

function referralCommentPreview(comments?: string) {
  if (!comments) return '';

  return comments.length > 500 ? `${comments.slice(0, 500)}...` : comments;
}

function statusText(referral: ReferralRowModel) {
  const statusLabel =
    referral.status === 'OPEN'
      ? 'Open since'
      : referral.status === 'ACCEPTED'
        ? 'Accepted on'
        : 'Closed since';
  const statusDate =
    referral.status === 'OPEN'
      ? referral.openedAtUtc
      : referral.status === 'ACCEPTED'
        ? referral.acceptedAtUtc
        : referral.closedAtUtc;

  return [statusLabel, formatDate(statusDate)].filter(Boolean).join(' ');
}

function ReferralsEmptyState() {
  return (
    <Stack
      spacing={0.5}
      sx={{
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 180,
        px: 2,
        textAlign: 'center',
      }}
    >
      <Typography className="ph-unmask" variant="subtitle1">
        No referrals found.
      </Typography>
      <Typography className="ph-unmask" color="text.secondary" variant="body2">
        Referrals will appear here when they are available.
      </Typography>
    </Stack>
  );
}

function ReferralsCellContent({ children }: { children: ReactNode }) {
  return (
    <Box
      sx={{
        alignItems: 'center',
        display: 'flex',
        minHeight: REFERRALS_CELL_MIN_HEIGHT,
        minWidth: 0,
        width: '100%',
      }}
    >
      {children}
    </Box>
  );
}

function buildAssignmentColumns(
  assignmentRoles: string[]
): GridColDef<ReferralRowModel>[] {
  return assignmentRoles.map((assignmentRole) => ({
    field: referralAssignmentFilterField(assignmentRole),
    filterable: true,
    flex: 1,
    headerName: assignmentRole,
    minWidth: 160,
    renderCell: ({ row }) => (
      <ReferralsCellContent>
        <Typography {...v2Typography.browserCell}>
          {displayValue(row.assignmentNamesByRole[assignmentRole])}
        </Typography>
      </ReferralsCellContent>
    ),
    sortable: false,
    valueGetter: (_value, row) =>
      displayValue(row.assignmentNamesByRole[assignmentRole]),
  }));
}

function buildColumns(
  assignmentRoles: string[],
  countyValueOptions: ReferralGridValueOption[],
  expanded: boolean
): GridColDef<ReferralRowModel>[] {
  return [
    {
      field: 'title',
      filterable: false,
      flex: 1.3,
      headerName: 'Referral Title',
      minWidth: 220,
      renderCell: ({ row }) => {
        const preview = referralCommentPreview(row.comments);

        return (
          <Stack
            spacing={0.75}
            sx={{
              justifyContent: 'center',
              minHeight: REFERRALS_CELL_MIN_HEIGHT,
              minWidth: 0,
              width: '100%',
            }}
          >
            <Typography {...v2Typography.browserCell}>
              {displayValue(row.title)}
            </Typography>
            {expanded && preview && (
              <Typography
                {...v2Typography.browserSecondary}
                color="text.secondary"
                sx={{
                  overflowWrap: 'break-word',
                  whiteSpace: 'pre-wrap',
                }}
              >
                {preview}
              </Typography>
            )}
          </Stack>
        );
      },
    },
    {
      field: 'status',
      filterOperators: referralStatusFilterOperators,
      filterable: true,
      flex: 1,
      headerName: 'Status',
      minWidth: 160,
      renderCell: ({ row }) => (
        <ReferralsCellContent>
          <Typography {...v2Typography.browserCell} noWrap>
            {statusText(row)}
          </Typography>
        </ReferralsCellContent>
      ),
      type: 'singleSelect',
      valueOptions: referralStatusValueOptions,
      valueGetter: (_value, row) => statusText(row),
    },
    {
      field: 'clientFamilyName',
      filterable: false,
      flex: 1,
      headerName: 'Client Family',
      minWidth: 180,
      renderCell: ({ row }) => (
        <ReferralsCellContent>
          <Typography {...v2Typography.browserCell}>
            {displayValue(row.clientFamilyName)}
          </Typography>
        </ReferralsCellContent>
      ),
    },
    {
      field: 'county',
      filterOperators: referralCountyFilterOperators,
      filterable: true,
      flex: 1,
      headerName: 'County',
      minWidth: 140,
      renderCell: ({ row }) => (
        <ReferralsCellContent>
          <Typography {...v2Typography.browserCell}>
            {displayValue(row.county)}
          </Typography>
        </ReferralsCellContent>
      ),
      type: 'singleSelect',
      valueGetter: (_value, row) =>
        row.county ?? REFERRAL_COUNTY_BLANK_FILTER_VALUE,
      valueOptions: countyValueOptions,
    },
    ...buildAssignmentColumns(assignmentRoles),
  ];
}

export function ReferralsDataGridV2({
  assignmentFilterLogicOperator,
  assignmentFilters,
  assignmentRoles = [],
  countyFilter,
  countyValueOptions,
  expanded = false,
  filterText,
  loading = false,
  onAssignmentFilterLogicOperatorChange,
  onAssignmentFiltersChange,
  onCountyFilterChange,
  onFilterTextChange,
  onRowClick,
  onStatusFilterChange,
  rows,
  statusFilter,
}: ReferralsDataGridV2Props) {
  const theme = useTheme();
  const columns = useMemo(
    () => buildColumns(assignmentRoles, countyValueOptions, expanded),
    [assignmentRoles, countyValueOptions, expanded]
  );
  const handleRowClick = useCallback(
    ({ row }: GridRowParams<ReferralRowModel>) => onRowClick(row),
    [onRowClick]
  );
  const filterModel = useMemo(
    () =>
      gridFilterModelFromReferralFilters(
        statusFilter,
        countyFilter,
        assignmentFilters,
        assignmentFilterLogicOperator,
        filterText
      ),
    [
      assignmentFilterLogicOperator,
      assignmentFilters,
      countyFilter,
      filterText,
      statusFilter,
    ]
  );
  const handleFilterModelChange = useCallback(
    (filterModel: GridFilterModel) => {
      const nextFilters = referralFiltersFromGridFilterModel(filterModel);

      onStatusFilterChange(nextFilters.statusFilter);
      onCountyFilterChange(nextFilters.countyFilter);
      onAssignmentFiltersChange(nextFilters.assignmentFilters);
      onAssignmentFilterLogicOperatorChange(nextFilters.logicOperator);
      onFilterTextChange(nextFilters.searchText);
    },
    [
      onAssignmentFilterLogicOperatorChange,
      onAssignmentFiltersChange,
      onCountyFilterChange,
      onFilterTextChange,
      onStatusFilterChange,
    ]
  );

  return (
    <Box sx={v2DataGridStyles(theme, { height: '100%' })}>
      <DataGridPremium
        rows={rows}
        columns={columns}
        columnHeaderHeight={42}
        density="comfortable"
        disableRowSelectionOnClick
        filterMode="server"
        filterModel={filterModel}
        getRowHeight={getReferralsRowHeight}
        getEstimatedRowHeight={getEstimatedReferralsRowHeight}
        loading={loading}
        onFilterModelChange={handleFilterModelChange}
        onRowClick={handleRowClick}
        pageSizeOptions={referralsGridPageSizeOptions}
        initialState={referralsGridInitialState}
        slots={referralsGridSlots}
        slotProps={referralsGridSlotProps}
      />
    </Box>
  );
}

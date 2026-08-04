import { Box, Stack, Typography, useTheme } from '@mui/material';
import { DataGrid, GridColDef, GridRowParams } from '@mui/x-data-grid';
import { useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';
import { v2DataGridStyles } from '../Families/v2DataGridStyles';
import { v2Typography } from '../Families/v2Typography';
import type { ReferralRowModel } from './referralBrowserTypes';

type ReferralsDataGridV2Props = {
  assignmentRoles?: string[];
  expanded?: boolean;
  loading?: boolean;
  onRowClick: (row: ReferralRowModel) => void;
  rows: ReferralRowModel[];
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
};
const REFERRALS_CELL_MIN_HEIGHT = 48;

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
    field: `assignmentRole:${assignmentRole}`,
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
      row.assignmentNamesByRole[assignmentRole] ?? '',
  }));
}

function buildColumns(
  assignmentRoles: string[],
  expanded: boolean
): GridColDef<ReferralRowModel>[] {
  return [
    {
      field: 'title',
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
      valueGetter: (_value, row) => statusText(row),
    },
    {
      field: 'clientFamilyName',
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
    },
    ...buildAssignmentColumns(assignmentRoles),
  ];
}

export function ReferralsDataGridV2({
  assignmentRoles = [],
  expanded = false,
  loading = false,
  onRowClick,
  rows,
}: ReferralsDataGridV2Props) {
  const theme = useTheme();
  const columns = useMemo(
    () => buildColumns(assignmentRoles, expanded),
    [assignmentRoles, expanded]
  );
  const handleRowClick = useCallback(
    ({ row }: GridRowParams<ReferralRowModel>) => onRowClick(row),
    [onRowClick]
  );

  return (
    <Box sx={v2DataGridStyles(theme, { height: '100%' })}>
      <DataGrid
        rows={rows}
        columns={columns}
        columnHeaderHeight={42}
        density="comfortable"
        disableRowSelectionOnClick
        getRowHeight={getReferralsRowHeight}
        getEstimatedRowHeight={getEstimatedReferralsRowHeight}
        loading={loading}
        onRowClick={handleRowClick}
        pageSizeOptions={referralsGridPageSizeOptions}
        initialState={referralsGridInitialState}
        slots={referralsGridSlots}
      />
    </Box>
  );
}

import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { Box, Chip, Typography, useTheme } from '@mui/material';
import { DataGrid, GridColDef, GridToolbar } from '@mui/x-data-grid';
import { useRef } from 'react';
import { useUserLookup } from '../Model/DirectoryModel';
import { PersonName } from './PersonName';
import type { ApprovalLedgerRow } from './approvalLedgerViewModel';
import {
  ApprovalLedgerDataGridRowV2,
  approvalLedgerSearchText,
  approvalLedgerStatusColor,
  approvalLedgerStatusLabels,
  countLabel,
  formatApprovalLedgerDate,
  subjectKey,
} from './approvalLedgerDataGridViewModel';
import { v2Typography } from './v2Typography';

type ApprovalsDataGridV2Props = {
  onRowClick: (row: ApprovalLedgerRow) => void;
  rows: ApprovalLedgerRow[];
};

function ChipList({ labels }: { labels: string[] }) {
  if (labels.length === 0) {
    return <Typography {...v2Typography.browserSecondary}>-</Typography>;
  }

  return (
    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
      {labels.map((label) => (
        <Chip
          key={label}
          className="ph-unmask"
          label={<Typography {...v2Typography.browserCell}>{label}</Typography>}
          size="small"
          variant="outlined"
        />
      ))}
    </Box>
  );
}

function AppliesToChips({ row }: { row: ApprovalLedgerRow }) {
  return (
    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
      {row.appliesTo.map((subject) => (
        <Chip
          key={subjectKey(subject.scope, subject.id)}
          className="ph-unmask"
          label={
            <Typography {...v2Typography.browserCell}>
              {subject.label}
            </Typography>
          }
          size="small"
          variant="outlined"
        />
      ))}
    </Box>
  );
}

function buildColumns(
  userLookup: ReturnType<typeof useUserLookup>
): GridColDef<ApprovalLedgerDataGridRowV2>[] {
  return [
    {
      field: 'status',
      headerName: 'Status',
      width: 140,
      valueGetter: (_value, row) => approvalLedgerStatusLabels[row.status],
      renderCell: ({ row }) => (
        <Chip
          color={approvalLedgerStatusColor(row.status)}
          label={approvalLedgerStatusLabels[row.status]}
          size="small"
        />
      ),
    },
    {
      field: 'requirementName',
      headerName: 'Requirement',
      minWidth: 220,
      flex: 1,
      renderCell: ({ row }) => (
        <Typography className="ph-unmask" {...v2Typography.browserCell} noWrap>
          {row.requirementName}
        </Typography>
      ),
    },
    {
      field: 'appliesTo',
      headerName: 'Applies To',
      minWidth: 220,
      flex: 0.9,
      valueGetter: (_value, row) =>
        row.appliesTo.map((subject) => subject.label).join(', '),
      renderCell: ({ row }) => <AppliesToChips row={row} />,
    },
    {
      field: 'completedOrExemptedOn',
      headerName: 'Completed / Exempted On',
      minWidth: 190,
      valueGetter: (_value, row) =>
        row.completedOrExemptedOn?.getTime() ?? null,
      renderCell: ({ row }) => (
        <Typography {...v2Typography.browserSecondary}>
          {formatApprovalLedgerDate(row.completedOrExemptedOn)}
        </Typography>
      ),
    },
    {
      field: 'validUntil',
      headerName: 'Valid Until',
      minWidth: 140,
      valueGetter: (_value, row) => row.validUntil?.getTime() ?? null,
      renderCell: ({ row }) => (
        <Typography {...v2Typography.browserSecondary}>
          {formatApprovalLedgerDate(row.validUntil)}
        </Typography>
      ),
    },
    {
      field: 'neededForRoles',
      headerName: 'Needed For Roles',
      minWidth: 220,
      flex: 0.9,
      valueGetter: (_value, row) => row.neededForRoleLabels.join(', '),
      renderCell: ({ row }) => (
        <ChipList labels={row.neededForRoleLabels} />
      ),
    },
    {
      field: 'documents',
      headerName: 'Documents',
      width: 130,
      valueGetter: (_value, row) => row.linkedDocumentIds.length,
      renderCell: ({ row }) => (
        <Typography {...v2Typography.browserSecondary}>
          {countLabel(row.linkedDocumentIds.length, 'document', 'documents')}
        </Typography>
      ),
    },
    {
      field: 'notes',
      headerName: 'Notes',
      width: 110,
      valueGetter: (_value, row) => row.noteIds.length + row.notes.length,
      renderCell: ({ row }) => (
        <Typography {...v2Typography.browserSecondary}>
          {countLabel(
            row.noteIds.length + row.notes.length,
            'note',
            'notes'
          )}
        </Typography>
      ),
    },
    {
      field: 'completedOrExemptedByUserId',
      headerName: 'Completed / Exempted By',
      minWidth: 200,
      flex: 0.8,
      valueGetter: (_value, row) => row.completedOrExemptedByUserId ?? '',
      renderCell: ({ row }) =>
        row.completedOrExemptedByUserId ? (
          <Typography className="ph-unmask" {...v2Typography.browserCell} noWrap>
            <PersonName
              person={userLookup(row.completedOrExemptedByUserId)}
            />
          </Typography>
        ) : (
          <Typography {...v2Typography.browserSecondary}>-</Typography>
        ),
    },
    {
      field: 'searchText',
      headerName: 'Search',
      valueGetter: (_value, row) => approvalLedgerSearchText(row),
      hideable: false,
      filterable: true,
      sortable: false,
      disableColumnMenu: true,
      width: 0,
      renderCell: () => null,
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

export function ApprovalsDataGridV2({
  onRowClick,
  rows,
}: ApprovalsDataGridV2Props) {
  const theme = useTheme();
  const userLookup = useUserLookup();
  const gridContainerRef = useRef<HTMLDivElement | null>(null);
  const columns = buildColumns(userLookup);

  const clearGridFocus = () => {
    const activeElement = document.activeElement;

    if (
      activeElement instanceof HTMLElement &&
      gridContainerRef.current?.contains(activeElement)
    ) {
      activeElement.blur();
    }
  };

  return (
    <Box
      ref={gridContainerRef}
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
          transition: theme.transitions.create('background-color', {
            duration: theme.transitions.duration.shortest,
          }),
          '&:hover': {
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
          pointerEvents: 'none',
        },
        '& .MuiDataGrid-cell:hover, & .MuiDataGrid-cell.Mui-selected, & .MuiDataGrid-cell--editing':
          {
            backgroundColor: 'transparent',
          },
        '& .MuiDataGrid-root .MuiDataGrid-cell:focus, & .MuiDataGrid-root .MuiDataGrid-cell:focus-visible, & .MuiDataGrid-root .MuiDataGrid-cell:focus-within, & .MuiDataGrid-cell.Mui-selected':
          {
            backgroundColor: 'transparent',
            boxShadow: 'none',
            outline: 'none',
          },
        '& .MuiDataGrid-root': {
          border: 0,
        },
        '& .MuiDataGrid-columnHeaders': {
          backgroundColor: theme.palette.action.hover,
          borderBottomColor: theme.palette.divider,
        },
        '& .MuiDataGrid-columnHeader:focus, & .MuiDataGrid-columnHeader:focus-within':
          {
            backgroundColor: 'transparent',
            boxShadow: 'none',
            outline: 'none',
          },
        '& .MuiDataGrid-columnHeader:focus-visible': {
          backgroundColor: 'transparent',
          boxShadow: 'none',
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
        initialState={{
          columns: {
            columnVisibilityModel: {
              searchText: false,
            },
          },
        }}
        onRowClick={({ row }) => {
          clearGridFocus();
          onRowClick(row);
        }}
        onCellKeyDown={({ row }, event) => {
          if (event.key !== 'Enter' && event.key !== ' ') {
            return;
          }

          event.preventDefault();
          clearGridFocus();
          onRowClick(row);
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

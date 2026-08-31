import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { Box, Chip, Typography } from '@mui/material';
import {
  GridFilterInputSingleSelect,
  type GridColDef,
  type GridFilterOperator,
} from '@mui/x-data-grid';
import { useUserLookup } from '../Model/DirectoryModel';
import { ApprovalNeededForRolesCellV2 } from './ApprovalNeededForRolesCellV2';
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

export type NeededForRoleValueOption = {
  label: string;
  value: string;
};

function appliesToChips(row: ApprovalLedgerRow) {
  return (
    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
      {row.appliesTo.map((subject) => (
        <Chip
          key={subjectKey(subject.scope, subject.id)}
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

export function neededForRoleValueOptions(
  rows: ApprovalLedgerRow[]
): NeededForRoleValueOption[] {
  const roleLabelsByValue = new Map<string, string>();

  rows.forEach((row) => {
    row.neededForRoles.forEach((role, index) => {
      if (roleLabelsByValue.has(role)) {
        return;
      }

      roleLabelsByValue.set(role, row.neededForRoleLabels[index] ?? role);
    });
  });

  return Array.from(roleLabelsByValue.entries())
    .map(([value, label]) => ({ label, value }))
    .sort((firstOption, secondOption) =>
      firstOption.label.localeCompare(secondOption.label)
    );
}

const neededForRoleFilterOperators: GridFilterOperator<
  ApprovalLedgerDataGridRowV2,
  string
>[] = [
  {
    label: 'is',
    value: 'is',
    getApplyFilterFn: (filterItem) => {
      if (filterItem.value == null || filterItem.value === '') {
        return null;
      }

      const role = String(filterItem.value);

      return (_value, row) => row.neededForRoles.includes(role);
    },
    InputComponent: GridFilterInputSingleSelect,
  },
];

export function approvalsDataGridColumns(
  userLookup: ReturnType<typeof useUserLookup>,
  neededForRoleOptions: NeededForRoleValueOption[]
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
      renderCell: ({ row }) => appliesToChips(row),
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
      type: 'singleSelect',
      valueGetter: (_value, row) => row.neededForRoleLabels.join(', '),
      valueOptions: neededForRoleOptions,
      filterOperators: neededForRoleFilterOperators,
      renderCell: ({ row }) => (
        <ApprovalNeededForRolesCellV2 labels={row.neededForRoleLabels} />
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
          <Typography {...v2Typography.browserCell} noWrap>
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

import { Box, FormControl, InputLabel, MenuItem, Select } from '@mui/material';
import { SelectChangeEvent } from '@mui/material/Select';
import { ReactNode, useMemo, useState } from 'react';
import { ApprovalLedgerRow } from './approvalLedgerViewModel';
import {
  filterApprovalLedgerRows,
  subjectKey,
  type ApprovalLedgerDomainFilters,
} from './approvalLedgerDataGridViewModel';
import { ApprovalsDataGridV2 } from './ApprovalsDataGridV2';

type ApprovalLedgerSectionProps = {
  groupByMember?: boolean;
  rows: ApprovalLedgerRow[];
  renderDetailsDrawer: (
    row: ApprovalLedgerRow | null,
    open: boolean,
    onClose: () => void
  ) => ReactNode;
};

const statusFilterOptions: {
  value: ApprovalLedgerDomainFilters['statusFilter'];
  label: string;
}[] = [
  { value: 'all', label: 'All' },
  { value: 'missing', label: 'Missing' },
  { value: 'optional', label: 'Optional' },
  { value: 'completed', label: 'Completed' },
  { value: 'exempted', label: 'Exempted' },
  { value: 'expiring', label: 'Expiring' },
  { value: 'expired', label: 'Expired' },
  { value: 'availableApplication', label: 'Available Application' },
];

function sortStrings(a: string, b: string) {
  return a.localeCompare(b);
}

export function ApprovalLedgerSection({
  groupByMember = false,
  rows,
  renderDetailsDrawer,
}: ApprovalLedgerSectionProps) {
  const [statusFilter, setStatusFilter] =
    useState<ApprovalLedgerDomainFilters['statusFilter']>('all');
  const [roleFilter, setRoleFilter] = useState('all');
  const [appliesToFilter, setAppliesToFilter] = useState('all');
  const [selectedRowId, setSelectedRowId] = useState<string | null>(null);
  const selectedRow = useMemo(
    () => rows.find((row) => row.id === selectedRowId) ?? null,
    [rows, selectedRowId]
  );

  const roleOptions = useMemo(
    () =>
      [...new Set(rows.flatMap((row) => row.neededForRoles))]
        .filter(Boolean)
        .sort(sortStrings),
    [rows]
  );

  const appliesToOptions = useMemo(
    () =>
      [
        ...new Map(
          rows
            .flatMap((row) => row.appliesTo)
            .map((subject) => [
              subjectKey(subject.scope, subject.id),
              {
                value: subjectKey(subject.scope, subject.id),
                label: subject.label,
              },
            ])
        ).values(),
      ].sort((a, b) => a.label.localeCompare(b.label)),
    [rows]
  );

  const visibleRows = useMemo(
    () =>
      filterApprovalLedgerRows(rows, {
        appliesToFilter,
        roleFilter,
        statusFilter,
      }),
    [appliesToFilter, roleFilter, rows, statusFilter]
  );

  function handleStatusFilterChange(
    event: SelectChangeEvent<ApprovalLedgerDomainFilters['statusFilter']>
  ) {
    setStatusFilter(event.target.value);
  }

  function handleRoleFilterChange(event: SelectChangeEvent) {
    setRoleFilter(event.target.value);
  }

  function handleAppliesToFilterChange(event: SelectChangeEvent) {
    setAppliesToFilter(event.target.value);
  }

  function closeDetailsDrawer() {
    setSelectedRowId(null);
  }

  function openDetailsDrawer(rowId: string) {
    setSelectedRowId(rowId);
  }

  return (
    <Box>
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: '1fr',
            md: 'repeat(3, minmax(180px, 1fr))',
          },
          gap: 1,
          mb: 1,
        }}
      >
        <FormControl size="small">
          <InputLabel id="approval-ledger-status-filter-label">
            Status
          </InputLabel>
          <Select
            labelId="approval-ledger-status-filter-label"
            label="Status"
            value={statusFilter}
            onChange={handleStatusFilterChange}
          >
            {statusFilterOptions.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControl size="small">
          <InputLabel id="approval-ledger-role-filter-label">Role</InputLabel>
          <Select
            labelId="approval-ledger-role-filter-label"
            label="Role"
            value={roleFilter}
            onChange={handleRoleFilterChange}
          >
            <MenuItem value="all">All</MenuItem>
            {roleOptions.map((role) => (
              <MenuItem key={role} value={role}>
                {role}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControl size="small">
          <InputLabel id="approval-ledger-applies-to-filter-label">
            Applies To
          </InputLabel>
          <Select
            labelId="approval-ledger-applies-to-filter-label"
            label="Applies To"
            value={appliesToFilter}
            onChange={handleAppliesToFilterChange}
          >
            <MenuItem value="all">All</MenuItem>
            {appliesToOptions.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>
      <ApprovalsDataGridV2
        groupByMember={groupByMember}
        rows={visibleRows}
        onRowClick={(row) => openDetailsDrawer(row.id)}
      />
      {renderDetailsDrawer(
        selectedRow,
        selectedRow !== null,
        closeDetailsDrawer
      )}
    </Box>
  );
}

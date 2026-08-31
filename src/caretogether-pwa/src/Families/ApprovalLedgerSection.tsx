import {
  Box,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  TextField,
} from '@mui/material';
import { SelectChangeEvent } from '@mui/material/Select';
import { useMemo, useState } from 'react';
import { ActiveFiltersAlert } from '../Generic/ActiveFiltersAlert';
import { useUserLookup } from '../Model/DirectoryModel';
import { ApprovalLedgerRow } from './approvalLedgerViewModel';
import { ApprovalDetailsDrawerV2 } from './ApprovalDetailsDrawerV2';
import { subjectKey } from './approvalLedgerDataGridViewModel';
import {
  approvalsDataGridColumns,
  neededForRoleValueOptions,
} from './approvalsDataGridColumnsV2';
import { ApprovalsDataGridV2 } from './ApprovalsDataGridV2';
import {
  approvalStatusFilterOptions,
  ApprovalStatusFilter,
  useApprovalsFilterPreferences,
} from './useApprovalsFilterPreferences';

type ApprovalLedgerSectionProps = {
  familyId: string;
  locationId: string;
  organizationId: string;
  rows: ApprovalLedgerRow[];
  userId?: string;
};

function includesText(value: string, searchText: string) {
  return value.toLocaleLowerCase().includes(searchText);
}

function sortStrings(a: string, b: string) {
  return a.localeCompare(b);
}

export function ApprovalLedgerSection({
  familyId,
  locationId,
  organizationId,
  rows,
  userId,
}: ApprovalLedgerSectionProps) {
  const [selectedRowId, setSelectedRowId] = useState<string | null>(null);
  const selectedRow = useMemo(
    () => rows.find((row) => row.id === selectedRowId) ?? null,
    [rows, selectedRowId]
  );
  const userLookup = useUserLookup();

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
  const neededForRoleOptions = useMemo(
    () => neededForRoleValueOptions(rows),
    [rows]
  );
  const columns = useMemo(
    () => approvalsDataGridColumns(userLookup, neededForRoleOptions),
    [neededForRoleOptions, userLookup]
  );
  const {
    appliesToFilter,
    clearFilters,
    filterModel,
    hasActiveFilters,
    onFilterModelChange,
    roleFilter,
    searchText,
    setAppliesToFilter,
    setRoleFilter,
    setSearchText,
    setStatusFilter,
    statusFilter,
  } = useApprovalsFilterPreferences({
    appliesToOptionValues: appliesToOptions.map((option) => option.value),
    columns,
    neededForRoleOptionValues: neededForRoleOptions.map(
      (option) => option.value
    ),
    scope: {
      entityId: familyId,
      locationId,
      organizationId,
      userId,
    },
  });

  const visibleRows = useMemo(() => {
    const normalizedSearchText = searchText.trim().toLocaleLowerCase();

    return rows.filter((row) => {
      if (statusFilter !== 'all' && row.status !== statusFilter) {
        return false;
      }

      if (roleFilter !== 'all' && !row.neededForRoles.includes(roleFilter)) {
        return false;
      }

      if (
        appliesToFilter !== 'all' &&
        !row.appliesTo.some(
          (subject) =>
            subjectKey(subject.scope, subject.id) === appliesToFilter
        )
      ) {
        return false;
      }

      if (!normalizedSearchText) {
        return true;
      }

      return [
        row.requirementName,
        ...row.appliesTo.map((subject) => subject.label),
        ...row.neededForRoles,
        ...row.notes,
      ].some((value) => includesText(value, normalizedSearchText));
    });
  }, [appliesToFilter, roleFilter, rows, searchText, statusFilter]);

  function handleStatusFilterChange(
    event: SelectChangeEvent<ApprovalStatusFilter>
  ) {
    setStatusFilter(event.target.value as ApprovalStatusFilter);
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
            md: 'minmax(220px, 1fr) 180px 180px 180px',
          },
          gap: 1,
          mb: 1,
        }}
      >
        <TextField
          label="Search"
          placeholder="Search approvals..."
          size="small"
          value={searchText}
          onChange={(event) => setSearchText(event.target.value)}
        />
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
            {approvalStatusFilterOptions.map((option) => (
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
      {hasActiveFilters && (
        <Box sx={{ mb: 1 }}>
          <ActiveFiltersAlert onClear={clearFilters} />
        </Box>
      )}
      <ApprovalsDataGridV2
        columns={columns}
        filterModel={filterModel}
        rows={visibleRows}
        onFilterModelChange={onFilterModelChange}
        onRowClick={(row) => openDetailsDrawer(row.id)}
      />
      <ApprovalDetailsDrawerV2
        row={selectedRow}
        open={selectedRow !== null}
        onClose={closeDetailsDrawer}
      />
    </Box>
  );
}

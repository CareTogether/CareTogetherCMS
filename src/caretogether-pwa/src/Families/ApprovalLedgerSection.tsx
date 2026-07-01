import {
  Box,
  Chip,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import { SelectChangeEvent } from '@mui/material/Select';
import type { KeyboardEvent } from 'react';
import { useMemo, useState } from 'react';
import { containedStickyHeaderTableSx } from '../Utilities/stickyHeaderTableSx';
import { formatUtcDateOnly } from '../Utilities/dateUtils';
import { WideTableContainer } from '../Utilities/WideTableContainer';
import {
  ApprovalLedgerRow,
  ApprovalLedgerStatus,
} from './approvalLedgerViewModel';
import { useUserLookup } from '../Model/DirectoryModel';
import { PersonName } from './PersonName';
import { ApprovalDetailsDrawerV2 } from './ApprovalDetailsDrawerV2';

type ApprovalLedgerSectionProps = {
  rows: ApprovalLedgerRow[];
};

type StatusFilter = ApprovalLedgerStatus | 'all';

const statusLabels: Record<ApprovalLedgerStatus, string> = {
  missing: 'Missing',
  completed: 'Completed',
  exempted: 'Exempted',
  expiring: 'Expiring',
  expired: 'Expired',
  availableApplication: 'Application',
};

const statusFilterOptions: { value: StatusFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'missing', label: 'Missing' },
  { value: 'completed', label: 'Completed' },
  { value: 'exempted', label: 'Exempted' },
  { value: 'expiring', label: 'Expiring' },
  { value: 'expired', label: 'Expired' },
  { value: 'availableApplication', label: 'Available Application' },
];

function statusColor(status: ApprovalLedgerStatus) {
  switch (status) {
    case 'expired':
      return 'warning';
    case 'missing':
      return 'error';
    case 'expiring':
      return 'warning';
    case 'availableApplication':
      return 'info';
    case 'completed':
      return 'success';
    case 'exempted':
    default:
      return 'default';
  }
}

function includesText(value: string, searchText: string) {
  return value.toLocaleLowerCase().includes(searchText);
}

function subjectKey(scope: string, id: string) {
  return `${scope}:${id}`;
}

function countLabel(count: number, singular: string, plural: string) {
  if (count === 0) {
    return '-';
  }

  return `${count} ${count === 1 ? singular : plural}`;
}

function formatDate(date?: Date) {
  return date ? formatUtcDateOnly(date) : '-';
}

function sortStrings(a: string, b: string) {
  return a.localeCompare(b);
}

export function ApprovalLedgerSection({ rows }: ApprovalLedgerSectionProps) {
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [roleFilter, setRoleFilter] = useState('all');
  const [appliesToFilter, setAppliesToFilter] = useState('all');
  const [selectedRowId, setSelectedRowId] = useState<string | null>(null);
  const userLookup = useUserLookup();
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

  function handleStatusFilterChange(event: SelectChangeEvent<StatusFilter>) {
    setStatusFilter(event.target.value as StatusFilter);
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

  function handleRowKeyDown(
    event: KeyboardEvent<HTMLTableRowElement>,
    rowId: string
  ) {
    if (event.key !== 'Enter' && event.key !== ' ') {
      return;
    }

    event.preventDefault();
    openDetailsDrawer(rowId);
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
      <WideTableContainer>
        <Table
          aria-label="Approval ledger"
          stickyHeader
          size="small"
          sx={{ ...containedStickyHeaderTableSx, minWidth: 1200 }}
        >
          <TableHead>
            <TableRow>
              <TableCell>Status</TableCell>
              <TableCell>Requirement</TableCell>
              <TableCell>Applies To</TableCell>
              <TableCell>Completed / Exempted On</TableCell>
              <TableCell>Valid Until</TableCell>
              <TableCell>Needed For Roles</TableCell>
              <TableCell>Documents</TableCell>
              <TableCell>Notes</TableCell>
              <TableCell>Completed / Exempted By</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {visibleRows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9}>
                  <Typography color="text.secondary">
                    No approval items found.
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              visibleRows.map((row) => (
                <TableRow
                  key={row.id}
                  hover
                  tabIndex={0}
                  role="button"
                  aria-label={`Open approval details for ${row.requirementName}`}
                  onClick={() => openDetailsDrawer(row.id)}
                  onKeyDown={(event) => handleRowKeyDown(event, row.id)}
                  sx={{ cursor: 'pointer' }}
                >
                  <TableCell>
                    <Chip
                      size="small"
                      color={statusColor(row.status)}
                      label={statusLabels[row.status]}
                    />
                  </TableCell>
                  <TableCell className="ph-unmask">
                    {row.requirementName}
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {row.appliesTo.map((subject) => (
                        <Chip
                          key={subjectKey(subject.scope, subject.id)}
                          size="small"
                          variant="outlined"
                          label={subject.label}
                          className="ph-unmask"
                        />
                      ))}
                    </Box>
                  </TableCell>
                  <TableCell>{formatDate(row.completedOrExemptedOn)}</TableCell>
                  <TableCell>{formatDate(row.validUntil)}</TableCell>
                  <TableCell>
                    {row.neededForRoleLabels.length === 0 ? (
                      '-'
                    ) : (
                      <Box
                        sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}
                      >
                        {row.neededForRoleLabels.map((role) => (
                          <Chip
                            key={role}
                            size="small"
                            variant="outlined"
                            label={role}
                          />
                        ))}
                      </Box>
                    )}
                  </TableCell>
                  <TableCell>
                    {countLabel(
                      row.linkedDocumentIds.length,
                      'document',
                      'documents'
                    )}
                  </TableCell>
                  <TableCell>
                    {countLabel(
                      row.noteIds.length + row.notes.length,
                      'note',
                      'notes'
                    )}
                  </TableCell>
                  <TableCell className="ph-unmask">
                    {row.completedOrExemptedByUserId ? (
                      <PersonName
                        person={userLookup(row.completedOrExemptedByUserId)}
                      />
                    ) : (
                      '-'
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </WideTableContainer>
      <ApprovalDetailsDrawerV2
        row={selectedRow}
        open={selectedRow !== null}
        onClose={closeDetailsDrawer}
      />
    </Box>
  );
}

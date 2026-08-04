import {
  Button,
  FormControl,
  InputAdornment,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
} from '@mui/material';
import type { SelectChangeEvent } from '@mui/material/Select';
import { Add as AddIcon, Search as SearchIcon } from '@mui/icons-material';
import type {
  AssignedIndividualVolunteer,
  CombinedFamilyInfo,
  Person,
} from '../GeneratedClient';
import type { AssignmentFilterSelectionsByRole } from '../FunctionAssignments/assignmentRoleColumns';
import { AssignmentRoleFilters } from '../FunctionAssignments/AssignmentRoleFilters';
import { CountyFilter } from '../Generic/CountyFilter';
import type { ReferralStatusFilter } from './referralStatusFilter';

type ReferralsToolbarV2Props = {
  assignmentFilters: AssignmentFilterSelectionsByRole;
  assignmentPersonLookup: (personId: string) => Person | undefined;
  assignmentRoles: string[];
  assignmentsForAssignmentFilter: AssignedIndividualVolunteer[];
  canAddNewReferral: boolean;
  countyFilter: (string | null)[];
  familiesForCountyFilter: CombinedFamilyInfo[];
  filterText: string;
  onAddNewReferral: () => void;
  setAssignmentFilter: (
    assignmentRole: string,
    selectedValues: (string | null)[]
  ) => void;
  setCountyFilter: (value: (string | null)[]) => void;
  setFilterText: (value: string) => void;
  setStatusFilter: (value: ReferralStatusFilter) => void;
  statusFilter: ReferralStatusFilter;
};

const statusFilterOptions: { label: string; value: ReferralStatusFilter }[] = [
  { label: 'All', value: 'ALL' },
  { label: 'Open', value: 'OPEN' },
  { label: 'Accepted', value: 'ACCEPTED' },
  { label: 'Closed', value: 'CLOSED' },
];

export function ReferralsToolbarV2({
  assignmentFilters,
  assignmentPersonLookup,
  assignmentRoles,
  assignmentsForAssignmentFilter,
  canAddNewReferral,
  countyFilter,
  familiesForCountyFilter,
  filterText,
  onAddNewReferral,
  setAssignmentFilter,
  setCountyFilter,
  setFilterText,
  setStatusFilter,
  statusFilter,
}: ReferralsToolbarV2Props) {
  const handleStatusChange = (event: SelectChangeEvent<ReferralStatusFilter>) =>
    setStatusFilter(event.target.value as ReferralStatusFilter);

  return (
    <Stack
      direction={{ xs: 'column', md: 'row' }}
      spacing={1}
      sx={{
        alignItems: { xs: 'stretch', md: 'center' },
      }}
    >
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={1}
        sx={{
          alignItems: { xs: 'stretch', sm: 'center' },
          flex: 1,
          flexWrap: { sm: 'wrap' },
          minWidth: 0,
        }}
      >
        <TextField
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              ),
            },
          }}
          label="Search"
          onChange={(event) => setFilterText(event.target.value)}
          size="small"
          sx={{ minWidth: { xs: '100%', sm: 260 } }}
          value={filterText}
        />

        <FormControl size="small" sx={{ minWidth: 140 }}>
          <InputLabel>Status</InputLabel>
          <Select
            label="Status"
            onChange={handleStatusChange}
            value={statusFilter}
          >
            {statusFilterOptions.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <CountyFilter
          families={familiesForCountyFilter}
          value={countyFilter}
          onChange={setCountyFilter}
          size="small"
          variant="outlined"
        />

        <AssignmentRoleFilters
          assignmentRoles={assignmentRoles}
          assignments={assignmentsForAssignmentFilter}
          selectedValuesByRole={assignmentFilters}
          onChange={setAssignmentFilter}
          personLookup={assignmentPersonLookup}
          size="small"
          variant="outlined"
        />
      </Stack>

      {canAddNewReferral && (
        <Button
          size="small"
          variant="contained"
          startIcon={<AddIcon />}
          sx={{
            alignSelf: { xs: 'stretch', md: 'center' },
            flexShrink: 0,
            whiteSpace: 'nowrap',
          }}
          onClick={onAddNewReferral}
        >
          Add new referral
        </Button>
      )}
    </Stack>
  );
}

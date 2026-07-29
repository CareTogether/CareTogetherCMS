import {
  FilterList as FilterListIcon,
  Search as SearchIcon,
  Sort as SortIcon,
} from '@mui/icons-material';
import {
  Box,
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
import type {
  AssignedIndividualVolunteer,
  Person,
} from '../GeneratedClient';
import type {
  AssignmentFilterSelectionsByRole,
} from '../FunctionAssignments/assignmentRoleColumns';
import { AssignmentRoleFilters } from '../FunctionAssignments/AssignmentRoleFilters';
import { PartneringFamiliesSortMode } from './PartneringFamilies/sortPartneringFamilies';
import { ArrangementsFilter } from './PartneringFamilies/types';

const BLANK_COUNTY_LABEL = '(blank)';
const BLANK_COUNTY_SELECT_VALUE = '__blank_county__';

type ClientsBrowserToolbarV2Props = {
  activeCustomFieldFilterCount?: number;
  assignmentFilterAssignments?: AssignedIndividualVolunteer[];
  assignmentFilters?: AssignmentFilterSelectionsByRole;
  assignmentPersonLookup?: (personId: string) => Person | undefined;
  assignmentRoles?: string[];
  customFieldCount?: number;
  countyOptions: string[];
  countyValue: (string | null)[];
  onAssignmentFilterChange?: (
    assignmentRole: string,
    selectedValues: (string | null)[]
  ) => void;
  onCountyChange?: (value: (string | null)[]) => void;
  onMoreFiltersClick?: () => void;
  onSearchChange?: (value: string) => void;
  onSortChange?: (value: PartneringFamiliesSortMode) => void;
  onStatusChange?: (value: ArrangementsFilter) => void;
  searchValue: string;
  sortValue: PartneringFamiliesSortMode;
  statusValue: ArrangementsFilter;
};

export function ClientsBrowserToolbarV2({
  activeCustomFieldFilterCount = 0,
  assignmentFilterAssignments = [],
  assignmentFilters = {},
  assignmentPersonLookup,
  assignmentRoles = [],
  customFieldCount = 0,
  countyOptions,
  countyValue,
  onAssignmentFilterChange,
  onCountyChange,
  onMoreFiltersClick,
  onSearchChange,
  onSortChange,
  onStatusChange,
  searchValue,
  sortValue,
  statusValue,
}: ClientsBrowserToolbarV2Props) {
  const selectedCountyValues = countyValue.map(
    (county) => county ?? BLANK_COUNTY_SELECT_VALUE
  );
  const handleCountyChange = (event: SelectChangeEvent<string[]>) => {
    const value = event.target.value;
    const selectedValues = typeof value === 'string' ? value.split(',') : value;

    onCountyChange?.(
      selectedValues.map((county) =>
        county === BLANK_COUNTY_SELECT_VALUE ? null : county
      )
    );
  };
  const shouldRenderAssignmentFilters =
    assignmentRoles.length > 0 &&
    !!assignmentPersonLookup &&
    !!onAssignmentFilterChange;
  const shouldRenderMoreFilters =
    customFieldCount > 0 && !!onMoreFiltersClick;

  return (
    <Stack
      direction={{ xs: 'column', md: 'row' }}
      spacing={1}
      sx={{ alignItems: { xs: 'stretch', md: 'center' } }}
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
        onChange={(event) => onSearchChange?.(event.target.value)}
        size="small"
        sx={{ minWidth: { xs: '100%', sm: 260 } }}
        value={searchValue}
      />
      <FormControl size="small" sx={{ minWidth: 140 }}>
        <InputLabel>Status</InputLabel>
        <Select
          label="Status"
          onChange={(event) =>
            onStatusChange?.(event.target.value as ArrangementsFilter)
          }
          value={statusValue}
        >
          <MenuItem value="All">All</MenuItem>
          <MenuItem value="Intake">Intake</MenuItem>
          <MenuItem value="Active">Active</MenuItem>
          <MenuItem value="Setup">Setup</MenuItem>
          <MenuItem value="Active + Setup">Active + Setup</MenuItem>
        </Select>
      </FormControl>
      <FormControl size="small" sx={{ minWidth: 140 }}>
        <InputLabel>County</InputLabel>
        <Select
          label="County"
          multiple
          onChange={handleCountyChange}
          renderValue={(selected) =>
            selected
              .map((county) =>
                county === BLANK_COUNTY_SELECT_VALUE
                  ? BLANK_COUNTY_LABEL
                  : county
              )
              .join(', ')
          }
          value={selectedCountyValues}
        >
          <MenuItem value={BLANK_COUNTY_SELECT_VALUE}>
            {BLANK_COUNTY_LABEL}
          </MenuItem>
          {countyOptions.map((county) => (
            <MenuItem key={county} value={county}>
              {county}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
      {shouldRenderAssignmentFilters && (
        <AssignmentRoleFilters
          assignmentRoles={assignmentRoles}
          assignments={assignmentFilterAssignments}
          selectedValuesByRole={assignmentFilters}
          onChange={onAssignmentFilterChange}
          personLookup={assignmentPersonLookup}
          size="small"
          variant="outlined"
        />
      )}
      <FormControl size="small" sx={{ minWidth: 140 }}>
        <InputLabel>Sort</InputLabel>
        <Select
          IconComponent={SortIcon}
          label="Sort"
          onChange={(event) =>
            onSortChange?.(event.target.value as PartneringFamiliesSortMode)
          }
          value={sortValue}
        >
          <MenuItem value="lastNameAsc">Last name (ascending)</MenuItem>
          <MenuItem value="lastNameDesc">Last name (descending)</MenuItem>
          <MenuItem value="firstNameAsc">First name (ascending)</MenuItem>
          <MenuItem value="firstNameDesc">First name (descending)</MenuItem>
          <MenuItem value="dateOpenedDesc">Date opened (descending)</MenuItem>
          <MenuItem value="dateOpenedAsc">Date opened (ascending)</MenuItem>
        </Select>
      </FormControl>
      {shouldRenderMoreFilters && (
        <Button
          className="ph-unmask"
          onClick={onMoreFiltersClick}
          startIcon={<FilterListIcon />}
          sx={{ justifyContent: 'flex-start', minHeight: 40 }}
          variant="outlined"
        >
          More Filters ({activeCustomFieldFilterCount}/{customFieldCount})
        </Button>
      )}
      <Box sx={{ flex: 1 }} />
    </Stack>
  );
}

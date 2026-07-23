import {
  Add as AddIcon,
  Email as EmailIcon,
  Search as SearchIcon,
  Sms as SmsIcon,
} from '@mui/icons-material';
import {
  Box,
  Button,
  Divider,
  IconButton,
  InputAdornment,
  Menu,
  MenuItem,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import { useState } from 'react';
import { FamilyNameSortMode } from '../Families/FamilyUtils';
import { VolunteerBrowserFilterButtonV2 } from './VolunteerBrowserFilterButtonV2';
import {
  completeRequirementFilterValue,
  missingRequirementFilterValue,
  RequirementFilterValue,
} from './VolunteerApprovalTab/volunteerMissingRequirementsPresentation';
import { filterOption } from './VolunteerApprovalTab/filterOption';
import { VolunteerFilter } from './VolunteerApprovalTab/VolunteerFilter';

type VolunteersToolbarV2Props = {
  activeAssignmentFilterCount: number;
  activeCustomFieldFilterCount: number;
  arrangementTypeCount: number;
  customFieldCount: number;
  canCreateVolunteerFamily: boolean;
  canUseBulkEmail: boolean;
  canUseBulkSms: boolean;
  searchValue: string;
  requirementFilter: RequirementFilterValue | undefined;
  requirementFilterOptions: string[];
  roleFilters: filterOption[];
  selectedSort: FamilyNameSortMode;
  selectedVolunteerCount: number;
  smsMode: boolean;
  statusFilters: filterOption[];
  onSearchChange: (value: string) => void;
  onRequirementFilterChange: (
    value: RequirementFilterValue | undefined
  ) => void;
  onRoleChange: (value: string | string[]) => void;
  onSortChange: (value: FamilyNameSortMode) => void;
  onStatusChange: (value: string | string[]) => void;
  onAssignmentFiltersClick: () => void;
  onCopyEmailAddresses: () => void;
  onCreateVolunteerFamily: () => void;
  onCustomFieldFiltersClick: () => void;
  onToggleBulkSms: () => void;
};

export function VolunteersToolbarV2({
  activeAssignmentFilterCount,
  activeCustomFieldFilterCount,
  arrangementTypeCount,
  canCreateVolunteerFamily,
  canUseBulkEmail,
  canUseBulkSms,
  customFieldCount,
  searchValue,
  requirementFilter,
  requirementFilterOptions,
  roleFilters,
  selectedSort,
  selectedVolunteerCount,
  smsMode,
  statusFilters,
  onSearchChange,
  onRequirementFilterChange,
  onRoleChange,
  onSortChange,
  onStatusChange,
  onAssignmentFiltersClick,
  onCopyEmailAddresses,
  onCreateVolunteerFamily,
  onCustomFieldFiltersClick,
  onToggleBulkSms,
}: VolunteersToolbarV2Props) {
  const [sortMenuAnchorEl, setSortMenuAnchorEl] =
    useState<null | HTMLElement>(null);
  const [requirementsMenuAnchorEl, setRequirementsMenuAnchorEl] =
    useState<null | HTMLElement>(null);
  const sortLabelByMode: Record<FamilyNameSortMode, string> = {
    lastNameAsc: 'Last Name A-Z',
    lastNameDesc: 'Last Name Z-A',
    firstNameAsc: 'First Name A-Z',
    firstNameDesc: 'First Name Z-A',
  };

  function handleSortChange(value: FamilyNameSortMode) {
    onSortChange(value);
    setSortMenuAnchorEl(null);
  }

  function handleRequirementFilterChange(
    value: RequirementFilterValue | undefined
  ) {
    onRequirementFilterChange(value);
    setRequirementsMenuAnchorEl(null);
  }

  const bulkActionsDisabled = selectedVolunteerCount === 0;
  const bulkActionsTooltip = bulkActionsDisabled
    ? 'Select one or more families to enable bulk actions.'
    : '';

  return (
    <Stack
      direction={{ xs: 'column', lg: 'row' }}
      spacing={1.25}
      sx={{ alignItems: { xs: 'stretch', lg: 'center' } }}
    >
      <TextField
        size="small"
        label="Search"
        value={searchValue}
        onChange={(event) => onSearchChange(event.target.value)}
        sx={{ minWidth: { md: 280 } }}
        slotProps={{
          input: {
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" />
              </InputAdornment>
            ),
          },
        }}
      />
      <Stack
        direction="row"
        spacing={1}
        sx={{ alignItems: 'center', flexWrap: 'wrap' }}
      >
        <VolunteerFilter
          label="Roles"
          options={roleFilters}
          setSelected={onRoleChange}
        />
        <VolunteerFilter
          label="Statuses"
          options={statusFilters}
          setSelected={onStatusChange}
        />
        <VolunteerBrowserFilterButtonV2
          activeCount={requirementFilter ? 1 : 0}
          label="Requirements"
          totalCount={requirementFilterOptions.length + 2}
          onClick={(event) => setRequirementsMenuAnchorEl(event.currentTarget)}
        />
        {arrangementTypeCount > 0 && (
          <VolunteerBrowserFilterButtonV2
            activeCount={activeAssignmentFilterCount}
            label="Assignments"
            totalCount={arrangementTypeCount}
            onClick={onAssignmentFiltersClick}
          />
        )}
        {customFieldCount > 0 && (
          <VolunteerBrowserFilterButtonV2
            activeCount={activeCustomFieldFilterCount}
            label="Custom fields"
            totalCount={customFieldCount}
            onClick={onCustomFieldFiltersClick}
          />
        )}
      </Stack>
      <Menu
        anchorEl={sortMenuAnchorEl}
        open={Boolean(sortMenuAnchorEl)}
        onClose={() => setSortMenuAnchorEl(null)}
      >
        <MenuItem onClick={() => handleSortChange('lastNameAsc')}>
          Last name (ascending)
        </MenuItem>
        <MenuItem onClick={() => handleSortChange('lastNameDesc')}>
          Last name (descending)
        </MenuItem>
        <MenuItem onClick={() => handleSortChange('firstNameAsc')}>
          First name (ascending)
        </MenuItem>
        <MenuItem onClick={() => handleSortChange('firstNameDesc')}>
          First name (descending)
        </MenuItem>
      </Menu>
      <Menu
        anchorEl={requirementsMenuAnchorEl}
        open={Boolean(requirementsMenuAnchorEl)}
        onClose={() => setRequirementsMenuAnchorEl(null)}
      >
        <MenuItem
          selected={!requirementFilter}
          onClick={() => handleRequirementFilterChange(undefined)}
        >
          All
        </MenuItem>
        <MenuItem
          selected={requirementFilter === missingRequirementFilterValue}
          onClick={() =>
            handleRequirementFilterChange(missingRequirementFilterValue)
          }
        >
          Missing
        </MenuItem>
        <MenuItem
          selected={requirementFilter === completeRequirementFilterValue}
          onClick={() =>
            handleRequirementFilterChange(completeRequirementFilterValue)
          }
        >
          Complete
        </MenuItem>
        {requirementFilterOptions.map((requirementName) => (
          <MenuItem
            key={requirementName}
            selected={requirementFilter === requirementName}
            onClick={() => handleRequirementFilterChange(requirementName)}
          >
            {requirementName}
          </MenuItem>
        ))}
      </Menu>
      <Box sx={{ flex: 1 }} />
      <Stack
        direction="row"
        spacing={1}
        sx={{ alignItems: 'center', flexWrap: 'wrap' }}
      >
        <VolunteerBrowserFilterButtonV2
          label="Sort"
          selectedLabel={`Sort (${sortLabelByMode[selectedSort]})`}
          onClick={(event) => setSortMenuAnchorEl(event.currentTarget)}
        />
        <Divider flexItem orientation="vertical" />
        <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center' }}>
          <Typography color="text.secondary" variant="body2">
            {selectedVolunteerCount} selected
          </Typography>
          {canUseBulkEmail && (
            <Tooltip title={bulkActionsTooltip}>
              <span>
                <IconButton
                  color="inherit"
                  aria-label="copy email addresses"
                  disabled={bulkActionsDisabled}
                  onClick={onCopyEmailAddresses}
                  size="small"
                >
                  <EmailIcon fontSize="small" />
                </IconButton>
              </span>
            </Tooltip>
          )}
          {canUseBulkSms && (
            <Tooltip title={bulkActionsTooltip}>
              <span>
                <IconButton
                  color={smsMode ? 'secondary' : 'inherit'}
                  aria-label="send bulk sms"
                  disabled={bulkActionsDisabled}
                  onClick={onToggleBulkSms}
                  size="small"
                >
                  <SmsIcon
                    fontSize="small"
                    sx={{ position: 'relative', top: 1 }}
                  />
                </IconButton>
              </span>
            </Tooltip>
          )}
        </Stack>
        {canCreateVolunteerFamily && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={onCreateVolunteerFamily}
            size="small"
          >
            Add Volunteer Family
          </Button>
        )}
      </Stack>
    </Stack>
  );
}

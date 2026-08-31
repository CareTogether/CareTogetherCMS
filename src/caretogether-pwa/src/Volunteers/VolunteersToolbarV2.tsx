import {
  Add as AddIcon,
  Email as EmailIcon,
  FilterList as FilterListIcon,
  Search as SearchIcon,
  Sms as SmsIcon,
} from '@mui/icons-material';
import {
  Button,
  IconButton,
  InputAdornment,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import type { ReactNode } from 'react';

type VolunteersToolbarV2Props = {
  activeAssignmentFilterCount: number;
  activeCustomFieldFilterCount: number;
  activeFiltersIndicator?: ReactNode;
  arrangementTypeCount: number;
  customFieldCount: number;
  canCreateVolunteerFamily: boolean;
  canUseBulkEmail: boolean;
  canUseBulkSms: boolean;
  searchValue: string;
  selectedVolunteerCount: number;
  smsMode: boolean;
  onSearchChange: (value: string) => void;
  onAssignmentFiltersClick: () => void;
  onCopyEmailAddresses: () => void;
  onCreateVolunteerFamily: () => void;
  onCustomFieldFiltersClick: () => void;
  onToggleBulkSms: () => void;
};

export function VolunteersToolbarV2({
  activeAssignmentFilterCount,
  activeCustomFieldFilterCount,
  activeFiltersIndicator,
  arrangementTypeCount,
  canCreateVolunteerFamily,
  canUseBulkEmail,
  canUseBulkSms,
  customFieldCount,
  searchValue,
  selectedVolunteerCount,
  smsMode,
  onSearchChange,
  onAssignmentFiltersClick,
  onCopyEmailAddresses,
  onCreateVolunteerFamily,
  onCustomFieldFiltersClick,
  onToggleBulkSms,
}: VolunteersToolbarV2Props) {
  const bulkActionsDisabled = selectedVolunteerCount === 0;
  const bulkActionsTooltip = bulkActionsDisabled
    ? 'Select one or more families to enable bulk actions.'
    : '';

  return (
    <Stack
      direction={{ xs: 'column', sm: 'row' }}
      sx={{
        alignItems: { xs: 'stretch', sm: 'center' },
        flexWrap: { xs: 'nowrap', sm: 'wrap' },
        gap: 1,
      }}
    >
      {canCreateVolunteerFamily && (
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={onCreateVolunteerFamily}
          sx={{ flexShrink: 0, whiteSpace: 'nowrap' }}
        >
          Add Volunteer Family
        </Button>
      )}
      {arrangementTypeCount > 0 && (
        <Button
          className="ph-unmask"
          onClick={onAssignmentFiltersClick}
          startIcon={<FilterListIcon />}
          sx={{ flexShrink: 0, justifyContent: 'flex-start', minHeight: 40 }}
          variant="outlined"
        >
          Assignments ({activeAssignmentFilterCount}/{arrangementTypeCount})
        </Button>
      )}
      {customFieldCount > 0 && (
        <Button
          className="ph-unmask"
          onClick={onCustomFieldFiltersClick}
          startIcon={<FilterListIcon />}
          sx={{ flexShrink: 0, justifyContent: 'flex-start', minHeight: 40 }}
          variant="outlined"
        >
          Custom fields ({activeCustomFieldFilterCount}/{customFieldCount})
        </Button>
      )}
      <TextField
        size="small"
        label="Search"
        value={searchValue}
        onChange={(event) => onSearchChange(event.target.value)}
        sx={{ width: { xs: '100%', sm: 260 } }}
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
      <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center' }}>
        <Typography
          color="text.secondary"
          variant="body2"
          sx={{ flexShrink: 0, whiteSpace: 'nowrap' }}
        >
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
      {activeFiltersIndicator}
    </Stack>
  );
}

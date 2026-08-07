import {
  Add as AddIcon,
  Email as EmailIcon,
  Search as SearchIcon,
  Sms as SmsIcon,
} from '@mui/icons-material';
import {
  Box,
  Button,
  IconButton,
  InputAdornment,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import { VolunteerBrowserFilterButtonV2 } from './VolunteerBrowserFilterButtonV2';

type VolunteersToolbarV2Props = {
  activeAssignmentFilterCount: number;
  activeCustomFieldFilterCount: number;
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
    <Stack spacing={1}>
      <Stack
        direction="row"
        spacing={1}
        sx={{ alignItems: 'center', flexWrap: 'wrap' }}
      >
        <TextField
          size="small"
          label="Search"
          value={searchValue}
          onChange={(event) => onSearchChange(event.target.value)}
          sx={{ minWidth: { xs: '100%', sm: 260 } }}
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
      <Stack
        direction="row"
        spacing={1}
        sx={{ alignItems: 'center', flexWrap: 'wrap' }}
      >
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
        <Box sx={{ display: { xs: 'none', sm: 'block' }, flex: 1 }} />
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

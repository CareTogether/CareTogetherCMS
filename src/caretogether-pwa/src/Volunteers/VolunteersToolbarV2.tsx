import { Email as EmailIcon, Sms as SmsIcon } from '@mui/icons-material';
import { IconButton, Stack, Tooltip, Typography } from '@mui/material';

type VolunteersToolbarV2Props = {
  canUseBulkEmail: boolean;
  canUseBulkSms: boolean;
  bulkActionsDisabled?: boolean;
  selectedVolunteerCount: number;
  smsMode: boolean;
  onCopyEmailAddresses: () => void;
  onToggleBulkSms: () => void;
};

export function VolunteersToolbarV2({
  canUseBulkEmail,
  canUseBulkSms,
  bulkActionsDisabled = false,
  selectedVolunteerCount,
  smsMode,
  onCopyEmailAddresses,
  onToggleBulkSms,
}: VolunteersToolbarV2Props) {
  const disabled = bulkActionsDisabled || selectedVolunteerCount === 0;
  const bulkActionsTooltip = disabled
    ? 'Select one or more families to enable bulk actions.'
    : '';

  return (
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
              disabled={disabled}
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
              disabled={disabled}
              onClick={onToggleBulkSms}
              size="small"
            >
              <SmsIcon fontSize="small" sx={{ position: 'relative', top: 1 }} />
            </IconButton>
          </span>
        </Tooltip>
      )}
    </Stack>
  );
}

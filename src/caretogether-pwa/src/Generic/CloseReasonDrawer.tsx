import { useState } from 'react';
import {
  Button,
  Drawer,
  FormControl,
  FormControlLabel,
  FormLabel,
  Radio,
  RadioGroup,
  Typography,
} from '@mui/material';
import Grid from './GridLegacyCompat';
import { ValidateDatePicker } from './Forms/ValidateDatePicker';

type CloseReasonDrawerProps = {
  title: string;
  reasons: string[];
  dateLabel: string;
  saveLabel: string;
  onClose: () => void;
  onSave: (reason: string, closedAtLocal: Date) => Promise<void>;
};

export function CloseReasonDrawer({
  title,
  reasons,
  dateLabel,
  saveLabel,
  onClose,
  onSave,
}: CloseReasonDrawerProps) {
  const [reason, setReason] = useState<string | null>(null);
  const [closedAtLocal, setClosedAtLocal] = useState<Date | null>(null);
  const [dateError, setDateError] = useState(false);

  const canSave = reason !== null && closedAtLocal !== null && !dateError;

  async function save() {
    if (!reason || !closedAtLocal) return;

    await onSave(reason, closedAtLocal);
  }

  return (
    <Drawer
      anchor="right"
      open
      onClose={onClose}
      slotProps={{
        paper: {
          sx: {
            width: { xs: '100%', sm: 500 },
            boxSizing: 'border-box',
            p: 3,
            top: 45,
          },
        },
      }}
    >
      <form noValidate>
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <Typography variant="h6">{title}</Typography>
          </Grid>

          <Grid item xs={12}>
            <FormControl component="fieldset">
              <FormLabel component="legend">Reason for Closing:</FormLabel>
              <RadioGroup
                aria-label="reason"
                name="reason"
                value={reason ?? ''}
                onChange={(e) => setReason(e.target.value)}
              >
                {reasons.map((reasonOption) => (
                  <FormControlLabel
                    key={reasonOption}
                    value={reasonOption}
                    control={<Radio size="small" />}
                    label={reasonOption}
                  />
                ))}
              </RadioGroup>
            </FormControl>
          </Grid>

          <Grid item xs={12}>
            <ValidateDatePicker
              label={dateLabel}
              value={closedAtLocal}
              onChange={setClosedAtLocal}
              onErrorChange={setDateError}
              disableFuture
              textFieldProps={{ fullWidth: true, required: true }}
            />
          </Grid>

          <Grid
            item
            xs={12}
            sx={{
              textAlign: 'right',
              display: { xs: 'flex', sm: 'block' },
              flexDirection: 'column',
              gap: { xs: 2, sm: 0 },
              '& > .MuiButton-root': {
                width: { xs: '100%', sm: 'auto' },
                minHeight: { xs: 44, sm: 'auto' },
              },
            }}
          >
            <Button
              color="secondary"
              variant="contained"
              sx={{ mr: { xs: 0, sm: 2 } }}
              onClick={onClose}
            >
              Cancel
            </Button>

            <Button
              color="primary"
              variant="contained"
              onClick={save}
              disabled={!canSave}
            >
              {saveLabel}
            </Button>
          </Grid>
        </Grid>
      </form>
    </Drawer>
  );
}

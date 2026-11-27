import { useState } from 'react';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Radio,
  RadioGroup,
  Stack,
} from '@mui/material';
import { SnoozeOutlined } from '@mui/icons-material';
import { DateTimePicker } from '@mui/x-date-pickers';
import { snoozeWakeAt, type SnoozePreset } from './dashboardSnoozes';

const presets = {
  hour: 'For 1 hour',
  tomorrow: 'Until tomorrow at 8:00 AM',
  monday: 'Until next Monday at 8:00 AM',
  custom: 'Custom date and time',
} satisfies Record<SnoozePreset, string>;

export function DashboardSnoozeDialog({
  onClose,
  onSnooze,
}: {
  onClose: () => void;
  onSnooze: (wakeAt: number, now: number) => void;
}) {
  const [preset, setPreset] = useState<SnoozePreset>('hour');
  const [custom, setCustom] = useState<Date | null>(null);
  const [invalidInput, setInvalidInput] = useState(false);
  const [attempted, setAttempted] = useState(false);
  const invalidCustom =
    preset === 'custom' &&
    (invalidInput || snoozeWakeAt('custom', Date.now(), custom) === null);

  function confirm() {
    setAttempted(true);
    const now = Date.now();
    const wakeAt = snoozeWakeAt(preset, now, custom);
    if (wakeAt !== null && (preset !== 'custom' || !invalidInput))
      onSnooze(wakeAt, now);
  }

  return (
    <Dialog
      open
      onClose={onClose}
      fullWidth
      maxWidth="xs"
      aria-labelledby="dashboard-snooze-title"
    >
      <DialogTitle id="dashboard-snooze-title">
        <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
          <SnoozeOutlined aria-hidden />
          <span className="ph-unmask">Snooze until</span>
        </Stack>
      </DialogTitle>
      <DialogContent>
        <RadioGroup value={preset} aria-labelledby="dashboard-snooze-title">
          {(Object.keys(presets) as SnoozePreset[]).map((value) => (
            <FormControlLabel
              key={value}
              value={value}
              control={
                <Radio
                  onChange={() => {
                    setPreset(value);
                    setAttempted(false);
                  }}
                />
              }
              label={<span className="ph-unmask">{presets[value]}</span>}
            />
          ))}
        </RadioGroup>
        {preset === 'custom' && (
          <DateTimePicker
            label="Wake date and time"
            value={custom}
            disablePast
            onChange={(date, context) => {
              setCustom(date);
              setInvalidInput(context.validationError !== null);
            }}
            onError={(error) => setInvalidInput(error !== null)}
            slotProps={{
              textField: {
                fullWidth: true,
                margin: 'dense',
                error: attempted && invalidCustom,
                helperText:
                  attempted && invalidCustom
                    ? 'Enter a valid future date and time.'
                    : 'Use your local time.',
              },
            }}
          />
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={confirm}>
          Snooze
        </Button>
      </DialogActions>
    </Dialog>
  );
}

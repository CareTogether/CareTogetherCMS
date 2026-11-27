import { useState } from 'react';
import {
  Box,
  Button,
  Drawer,
  FormControlLabel,
  Radio,
  RadioGroup,
  Stack,
  Typography,
} from '@mui/material';
import { SnoozeOutlined } from '@mui/icons-material';
import { DateTimePicker } from '@mui/x-date-pickers';
import { snoozeWakeAt, type SnoozePreset } from './dashboardSnoozes';

const titleId = 'dashboard-snooze-title';

const presets = {
  hour: 'For 1 hour',
  tomorrow: 'Until tomorrow at 8:00 AM',
  monday: 'Until next Monday at 8:00 AM',
  custom: 'Custom date and time',
} satisfies Record<SnoozePreset, string>;

export function DashboardSnoozeDrawer({
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
    <Drawer
      anchor="right"
      open
      onClose={onClose}
      slotProps={{
        paper: {
          role: 'dialog',
          'aria-modal': true,
          'aria-labelledby': titleId,
          sx: {
            width: { xs: '100%', sm: 500 },
            top: 45,
            height: 'calc(100% - 45px)',
            display: 'flex',
          },
        },
      }}
    >
      <Box sx={{ flex: 1, minHeight: 0, overflowY: 'auto', p: 3 }}>
        <Stack direction="row" spacing={1} sx={{ alignItems: 'center', mb: 2 }}>
          <SnoozeOutlined aria-hidden color="action" />
          <Typography id={titleId} className="ph-unmask" variant="h6">
            Snooze until
          </Typography>
        </Stack>
        <RadioGroup value={preset} aria-labelledby={titleId}>
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
      </Box>
      <Box
        sx={{
          borderTop: 1,
          borderColor: 'divider',
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          gap: 1,
          justifyContent: 'flex-end',
          p: 2,
          pb: 'calc(16px + env(safe-area-inset-bottom))',
          backgroundColor: 'background.paper',
        }}
      >
        <Button onClick={onClose} color="secondary">
          Cancel
        </Button>
        <Button variant="contained" color="primary" onClick={confirm}>
          Snooze
        </Button>
      </Box>
    </Drawer>
  );
}

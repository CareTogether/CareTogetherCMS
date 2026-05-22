import { useState } from 'react';
import {
  Button,
  Drawer,
  FormControl,
  FormControlLabel,
  FormLabel,
  Grid,
  Radio,
  RadioGroup,
  Typography,
} from '@mui/material';
import { ValidateDatePicker } from '../Generic/Forms/ValidateDatePicker';
import { useV1ReferralsModel } from '../Model/V1ReferralsModel';
import { useRecoilValue } from 'recoil';
import { referralCloseReasonsData } from '../Model/ConfigurationModel';

interface CloseV1ReferralDrawerProps {
  referralId: string;
  onClose: () => void;
}

function isSameLocalDate(left: Date, right: Date) {
  return (
    left.getFullYear() === right.getFullYear() &&
    left.getMonth() === right.getMonth() &&
    left.getDate() === right.getDate()
  );
}

function isSameLocalTime(left: Date, right: Date) {
  return (
    left.getHours() === right.getHours() &&
    left.getMinutes() === right.getMinutes() &&
    left.getSeconds() === right.getSeconds() &&
    left.getMilliseconds() === right.getMilliseconds()
  );
}

function withLocalTime(date: Date, time: Date) {
  const dateWithTime = new Date(date);
  dateWithTime.setHours(
    time.getHours(),
    time.getMinutes(),
    time.getSeconds(),
    time.getMilliseconds()
  );

  return dateWithTime;
}

function atStartOfLocalDay(date: Date) {
  const dateAtStartOfDay = new Date(date);
  dateAtStartOfDay.setHours(0, 0, 0, 0);

  return dateAtStartOfDay;
}

function defaultCloseDateTimeForDate(date: Date, now = new Date()) {
  return isSameLocalDate(date, now)
    ? withLocalTime(date, now)
    : atStartOfLocalDay(date);
}

export function CloseV1ReferralDrawer({
  referralId,
  onClose,
}: CloseV1ReferralDrawerProps) {
  const { closeReferral } = useV1ReferralsModel();
  const referralCloseReasons = useRecoilValue(referralCloseReasonsData);

  const [fields, setFields] = useState<{
    reason: string | null;
    closedAtLocal: Date | null;
  }>({
    reason: null,
    closedAtLocal: new Date(),
  });
  const [timeWasEdited, setTimeWasEdited] = useState(false);

  const [dateError, setDateError] = useState(false);
  const { reason, closedAtLocal } = fields;

  const canSave = reason !== null && closedAtLocal !== null && !dateError;

  function updateClosedAtLocal(date: Date | null) {
    if (date === null) {
      setFields({ ...fields, closedAtLocal: null });
      setTimeWasEdited(false);
      return;
    }

    if (!closedAtLocal) {
      setFields({
        ...fields,
        closedAtLocal: defaultCloseDateTimeForDate(date),
      });
      return;
    }

    const dateChanged = !isSameLocalDate(date, closedAtLocal);
    const timeChanged = !isSameLocalTime(date, closedAtLocal);

    if (!dateChanged && timeChanged) {
      setTimeWasEdited(true);
      setFields({ ...fields, closedAtLocal: date });
      return;
    }

    if (dateChanged && !timeWasEdited) {
      setFields({
        ...fields,
        closedAtLocal: defaultCloseDateTimeForDate(date),
      });
      return;
    }

    setFields({ ...fields, closedAtLocal: date });
  }

  async function save() {
    await closeReferral(referralId, reason!, closedAtLocal!);
    onClose();
  }

  return (
    <Drawer
      anchor="right"
      open
      onClose={onClose}
      PaperProps={{ sx: { width: 500, p: 3, top: 45 } }}
    >
      <form noValidate>
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <Typography variant="h6">
              Why is this Referral being closed?
            </Typography>
          </Grid>

          <Grid item xs={12}>
            <FormControl component="fieldset">
              <FormLabel>Reason for Closing:</FormLabel>

              <RadioGroup
                value={reason ?? ''}
                onChange={(e) =>
                  setFields({ ...fields, reason: e.target.value })
                }
              >
                {referralCloseReasons.map((reasonOption) => (
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
              label="When was this Referral closed?"
              value={closedAtLocal}
              onChange={updateClosedAtLocal}
              onErrorChange={setDateError}
              disableFuture
              includeTime
              textFieldProps={{ fullWidth: true, required: true }}
            />
          </Grid>

          <Grid item xs={12} sx={{ textAlign: 'right' }}>
            <Button
              color="secondary"
              variant="contained"
              sx={{ mr: 2 }}
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
              Save
            </Button>
          </Grid>
        </Grid>
      </form>
    </Drawer>
  );
}

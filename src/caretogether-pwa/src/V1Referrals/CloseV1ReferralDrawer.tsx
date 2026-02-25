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
    closedAtLocal: null,
  });

  const [dateError, setDateError] = useState(false);
  const { reason, closedAtLocal } = fields;

  const canSave = reason !== null && closedAtLocal !== null && !dateError;

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
              onChange={(date) => setFields({ ...fields, closedAtLocal: date })}
              onErrorChange={setDateError}
              disableFuture
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

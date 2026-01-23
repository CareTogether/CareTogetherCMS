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
import { V1ReferralCloseReason } from '../GeneratedClient';
import { ValidateDatePicker } from '../Generic/Forms/ValidateDatePicker';
import { useV1ReferralsModel } from '../Model/V1ReferralsModel';

interface CloseV1ReferralDrawerProps {
  referralId: string;
  onClose: () => void;
}

export function CloseV1ReferralDrawer({
  referralId,
  onClose,
}: CloseV1ReferralDrawerProps) {
  const { closeReferral } = useV1ReferralsModel();

  const [fields, setFields] = useState<{
    reason: V1ReferralCloseReason | null;
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
      PaperProps={{
        sx: {
          width: 500,
          p: 3,
          top: 45,
        },
      }}
    >
      <form noValidate autoComplete="off">
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <Typography variant="h6">
              Why is this Referral being closed?
            </Typography>
          </Grid>

          <Grid item xs={12}>
            <FormControl component="fieldset">
              <FormLabel component="legend">Reason for Closing:</FormLabel>

              <RadioGroup
                name="reason"
                value={reason ?? ''}
                onChange={(e) =>
                  setFields({
                    ...fields,
                    reason: Number(e.target.value) as V1ReferralCloseReason,
                  })
                }
              >
                <FormControlLabel
                  value={V1ReferralCloseReason.NotAppropriate}
                  control={<Radio size="small" />}
                  label="Not Appropriate"
                />
                <FormControlLabel
                  value={V1ReferralCloseReason.NoCapacity}
                  control={<Radio size="small" />}
                  label="No Capacity"
                />
                <FormControlLabel
                  value={V1ReferralCloseReason.NoLongerNeeded}
                  control={<Radio size="small" />}
                  label="No Longer Needed"
                />
                <FormControlLabel
                  value={V1ReferralCloseReason.Resourced}
                  control={<Radio size="small" />}
                  label="Resourced"
                />
                <FormControlLabel
                  value={V1ReferralCloseReason.NeedMet}
                  control={<Radio size="small" />}
                  label="Need Met"
                />
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
              textFieldProps={{
                fullWidth: true,
                required: true,
              }}
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

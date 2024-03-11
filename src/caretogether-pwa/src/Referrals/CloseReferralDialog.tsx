import { useState } from 'react';
import { FormControl, FormControlLabel, FormLabel, Grid, Radio, RadioGroup } from '@mui/material';
import { ReferralCloseReason } from '../GeneratedClient';
import { UpdateDialog } from '../Generic/UpdateDialog';
import { DatePicker } from '@mui/x-date-pickers';
import { useReferralsModel } from '../Model/ReferralsModel';

interface CloseReferralDialogProps {
  partneringFamilyId: string,
  referralId: string,
  onClose: () => void
}

export function CloseReferralDialog({ partneringFamilyId, referralId, onClose }: CloseReferralDialogProps) {
  const referralsModel = useReferralsModel();
  const [fields, setFields] = useState({
    reason: null as ReferralCloseReason | null,
    closedAtLocal: null as Date | null
  });
  const { reason, closedAtLocal } = fields;

  async function save() {
    await referralsModel.closeReferral(partneringFamilyId, referralId,
      reason!, closedAtLocal!);
  }

  return (
    <UpdateDialog title={`Why is this referral being closed?`}
      onClose={onClose} onSave={save} enableSave={() => reason != null && closedAtLocal != null}>
      <form noValidate autoComplete="off">
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <FormControl component="fieldset">
              <FormLabel component="legend">Reason for Closing:</FormLabel>
              <RadioGroup aria-label="reason" name="reason"
                value={reason == null ? '' : ReferralCloseReason[reason]}
                onChange={e => setFields({ ...fields, reason: ReferralCloseReason[e.target.value as keyof typeof ReferralCloseReason] })}>
                <FormControlLabel value={ReferralCloseReason[ReferralCloseReason.NotAppropriate]} control={<Radio size="small" />} label="Not Appropriate" />
                <FormControlLabel value={ReferralCloseReason[ReferralCloseReason.NoCapacity]} control={<Radio size="small" />} label="No Capacity" />
                <FormControlLabel value={ReferralCloseReason[ReferralCloseReason.NoLongerNeeded]} control={<Radio size="small" />} label="No Longer Needed" />
                <FormControlLabel value={ReferralCloseReason[ReferralCloseReason.Resourced]} control={<Radio size="small" />} label="Resourced" />
                <FormControlLabel value={ReferralCloseReason[ReferralCloseReason.NeedMet]} control={<Radio size="small" />} label="Need Met" />
              </RadioGroup>
            </FormControl>
          </Grid>
          <Grid item xs={12}>
            <DatePicker
              label="When was this referral closed?"
              value={closedAtLocal}
              disableFuture format="MM/dd/yyyy"
              onChange={(date: Date | null) => date && setFields({ ...fields, closedAtLocal: date })} />
          </Grid>
        </Grid>
      </form>
    </UpdateDialog>
  );
}

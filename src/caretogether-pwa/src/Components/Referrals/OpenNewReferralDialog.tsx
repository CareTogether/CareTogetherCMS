import { useState } from 'react';
import { Grid } from '@mui/material';
import { UpdateDialog } from '../UpdateDialog';
import { KeyboardDatePicker } from '@material-ui/pickers';
import { useReferralsModel } from '../../Model/ReferralsModel';

interface OpenNewReferralDialogProps {
  partneringFamilyId: string,
  onClose: () => void
}

export function OpenNewReferralDialog({partneringFamilyId, onClose}: OpenNewReferralDialogProps) {
  const referralsModel = useReferralsModel();
  const [fields, setFields] = useState({
    openedAtLocal: new Date()
  });
  const { openedAtLocal } = fields;

  async function save() {
    await referralsModel.openReferral(partneringFamilyId,
      openedAtLocal);
  }

  return (
    <UpdateDialog title={`Open a new referral`} onClose={onClose}
      onSave={save}>
      <form noValidate autoComplete="off">
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <KeyboardDatePicker
              label="When was this referral opened?"
              value={openedAtLocal} fullWidth required
              disableFuture format="MM/dd/yyyy"
              onChange={(date) => date && setFields({...fields, openedAtLocal: date})}
              showTodayButton />
          </Grid>
        </Grid>
      </form>
    </UpdateDialog>
  );
}

import { useState } from 'react';
import { Grid } from '@mui/material';
import { UpdateDialog } from '../Generic/UpdateDialog';
import { useReferralsModel } from '../Model/ReferralsModel';
import { ValidateDatePicker } from '../Generic/Forms/ValidateDatePicker';

interface OpenNewReferralDialogProps {
  partneringFamilyId: string;
  onClose: () => void;
}

export function OpenNewReferralDialog({
  partneringFamilyId,
  onClose,
}: OpenNewReferralDialogProps) {
  const referralsModel = useReferralsModel();
  const [fields, setFields] = useState({
    openedAtLocal: new Date(),
  });
  const { openedAtLocal } = fields;

  const [dobError, setDobError] = useState(false);

  async function save() {
    await referralsModel.openReferral(partneringFamilyId, openedAtLocal);
  }

  return (
    <UpdateDialog
      title={`Open a new referral`}
      onClose={onClose}
      onSave={save}
      enableSave={() => openedAtLocal != null && !dobError}
    >
      <form noValidate autoComplete="off">
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <ValidateDatePicker
              label="When was this referral opened?"
              value={openedAtLocal}
              disableFuture
              onChange={(date) => {
                if (date) setFields({ ...fields, openedAtLocal: date });
              }}
              onErrorChange={setDobError}
              textFieldProps={{
                fullWidth: true,
                required: true,
                sx: { marginTop: 1 },
              }}
            />
          </Grid>
        </Grid>
      </form>
    </UpdateDialog>
  );
}

import { useState } from 'react';
import { Grid } from '@mui/material';
import { UpdateDialog } from '../Generic/UpdateDialog';
import { DatePicker } from '@mui/x-date-pickers';
import { useReferralsModel } from '../Model/ReferralsModel';

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
            <DatePicker
              label="When was this referral opened?"
              value={openedAtLocal}
              disableFuture
              minDate={new Date(1900, 0, 1)}
              format="MM/dd/yyyy"
              onChange={(date: Date | null) => {
                const invalid = !date || date.getFullYear() < 1900;
                setDobError(invalid);
                if (date) setFields({ ...fields, openedAtLocal: date });
              }}
              slotProps={{
                textField: {
                  fullWidth: true,
                  required: true,
                  error: dobError,
                  helperText: dobError
                    ? 'Hmm, that doesn’t seem to be a valid date. Please enter a valid date to continue.'
                    : '',
                  sx: { marginTop: 1 },
                },
              }}
            />
          </Grid>
        </Grid>
      </form>
    </UpdateDialog>
  );
}

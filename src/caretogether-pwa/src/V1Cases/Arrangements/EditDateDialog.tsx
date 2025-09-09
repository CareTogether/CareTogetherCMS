import { Grid } from '@mui/material';
import { ValidateDatePicker } from '../../Generic/Forms/ValidateDatePicker';
import { useState } from 'react';
import { UpdateDialog } from '../../Generic/UpdateDialog';

interface EditDateDialogProps {
  initialDate?: Date;
  disablePast?: boolean;
  disableFuture?: boolean;
  label: string;
  onClose: () => void;
  onSave: (date: Date) => Promise<void>;
}

export function EditDateDialog({
  initialDate,
  disablePast = false,
  disableFuture = true,
  label,
  onClose,
  onSave,
}: EditDateDialogProps) {
  const [dateLocal, setDateLocal] = useState(initialDate || new Date());

  const [dobError, setDobError] = useState(dateLocal.getFullYear() < 1900);

  async function save() {
    await onSave(dateLocal);
  }

  return (
    <UpdateDialog
      title={`Editing "${label}" date`}
      onClose={onClose}
      onSave={save}
      enableSave={() => dateLocal != null && !dobError}
    >
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <ValidateDatePicker
            label={label}
            value={dateLocal}
            onChange={(date) => date && setDateLocal(date)}
            onErrorChange={setDobError}
            disablePast={disablePast}
            disableFuture={disableFuture}
            textFieldProps={{
              fullWidth: true,
              required: true,
              sx: { marginTop: 1 },
            }}
          />
        </Grid>
      </Grid>
    </UpdateDialog>
  );
}

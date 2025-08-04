import { Grid } from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers';
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
          <DatePicker
            label={label}
            value={dateLocal}
            disablePast={disablePast}
            disableFuture={disableFuture}
            minDate={new Date(1900, 0, 1)}
            format="M/d/yyyy"
            onChange={(date: Date | null) => {
              const invalid = !date || date.getFullYear() < 1900;
              setDobError(invalid);
              if (date) setDateLocal(date);
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
    </UpdateDialog>
  );
}

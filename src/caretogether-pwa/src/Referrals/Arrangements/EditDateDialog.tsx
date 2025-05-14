import { Grid } from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers';
import { useState } from 'react';
import { UpdateDialog } from '../../Generic/UpdateDialog';

interface EditDateDialogProps {
  initialDate?: Date;
  label: string;
  onClose: () => void;
  onSave: (date: Date) => Promise<void>;
}

export function EditDateDialog({
  initialDate,
  label,
  onClose,
  onSave,
}: EditDateDialogProps) {
  const [dateLocal, setDateLocal] = useState(initialDate || new Date());

  async function save() {
    await onSave(dateLocal);
  }

  return (
    <UpdateDialog
      title={`Editing "${label}" date`}
      onClose={onClose}
      onSave={save}
      enableSave={() => dateLocal != null}
    >
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <DatePicker
            label={label}
            value={dateLocal}
            disableFuture
            format="M/d/yyyy"
            onChange={(date: Date | null) => date && setDateLocal(date)}
            slotProps={{
              textField: {
                fullWidth: true,
                required: true,
                sx: { marginTop: 1 },
              },
            }}
          />
        </Grid>
      </Grid>
    </UpdateDialog>
  );
}

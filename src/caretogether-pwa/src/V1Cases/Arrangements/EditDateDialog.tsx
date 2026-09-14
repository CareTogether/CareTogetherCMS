import Grid from '@mui/material/Grid';
import { ValidateDatePicker } from '../../Generic/Forms/ValidateDatePicker';
import { useState } from 'react';
import { UpdateDialog } from '../../Generic/UpdateDialog';
import { Box, Button } from '@mui/material';

interface EditDateDialogProps {
  initialDate?: Date;
  disablePast?: boolean;
  disableFuture?: boolean;
  label: string;
  onClose: () => void;
  onSave: (date: Date | null) => Promise<void>;
  allowClear?: boolean;
}

export function EditDateDialog({
  initialDate,
  disablePast = false,
  disableFuture = true,
  label,
  onClose,
  onSave,
  allowClear = false,
}: EditDateDialogProps) {
  const [dateLocal, setDateLocal] = useState<Date | null>(
    initialDate ?? (allowClear ? null : new Date())
  );

  const [dobError, setDobError] = useState(
    dateLocal ? dateLocal.getFullYear() < 1900 : false
  );

  async function save() {
    if (!allowClear && dateLocal === null) {
      return;
    }

    await onSave(dateLocal);
  }

  return (
    <UpdateDialog
      title={`Editing "${label}" date`}
      onClose={onClose}
      onSave={save}
      enableSave={() => !dobError && (allowClear || dateLocal !== null)}
    >
      <Grid container spacing={2}>
        <Grid size={12}>
          <ValidateDatePicker
            label={label}
            value={dateLocal}
            onChange={(date) => {
              if (allowClear) {
                setDateLocal(date);
                return;
              }

              if (date) {
                setDateLocal(date);
              }
            }}
            onErrorChange={setDobError}
            disablePast={disablePast}
            disableFuture={disableFuture}
            textFieldProps={{
              fullWidth: true,
              required: !allowClear,
              sx: { marginTop: 1 },
            }}
          />
          {allowClear && dateLocal !== null && (
            <Box sx={{ display: 'flex', justifyContent: 'flex-start' }}>
              <Button
                color="secondary"
                onClick={() => setDateLocal(null)}
                size="small"
                variant="text"
                sx={{ mt: 0.5, p: 0, textTransform: 'none' }}
              >
                Clear date
              </Button>
            </Box>
          )}
        </Grid>
      </Grid>
    </UpdateDialog>
  );
}

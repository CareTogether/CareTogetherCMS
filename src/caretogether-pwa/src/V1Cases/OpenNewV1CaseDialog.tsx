import { useState } from 'react';
import { Grid } from '@mui/material';
import { UpdateDialog } from '../Generic/UpdateDialog';
import { DatePicker } from '@mui/x-date-pickers';
import { useV1CasesModel } from '../Model/V1CasesModel';

interface OpenNewV1CaseDialogProps {
  partneringFamilyId: string;
  onClose: () => void;
}

export function OpenNewV1CaseDialog({
  partneringFamilyId,
  onClose,
}: OpenNewV1CaseDialogProps) {
  const v1CasesModel = useV1CasesModel();
  const [fields, setFields] = useState({
    openedAtLocal: new Date(),
  });
  const { openedAtLocal } = fields;

  async function save() {
    await v1CasesModel.openV1Case(partneringFamilyId, openedAtLocal);
  }

  return (
    <UpdateDialog title={`Open a new Case`} onClose={onClose} onSave={save}>
      <form noValidate autoComplete="off">
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <DatePicker
              label="When was this Case opened?"
              value={openedAtLocal}
              disableFuture
              format="MM/dd/yyyy"
              onChange={(date: Date | null) =>
                date && setFields({ ...fields, openedAtLocal: date })
              }
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
      </form>
    </UpdateDialog>
  );
}

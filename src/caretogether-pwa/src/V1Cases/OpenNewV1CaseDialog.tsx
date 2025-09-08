import { useState } from 'react';
import { Grid } from '@mui/material';
import { UpdateDialog } from '../Generic/UpdateDialog';
import { useV1CasesModel } from '../Model/V1CasesModel';
import { ValidateDatePicker } from '../Generic/Forms/ValidateDatePicker';

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

  const [dobError, setDobError] = useState(false);

  async function save() {
    await v1CasesModel.openV1Case(partneringFamilyId, openedAtLocal);
  }

  return (
    <UpdateDialog
      title={`Open a new Case`}
      onClose={onClose}
      onSave={save}
      enableSave={() => openedAtLocal != null && !dobError}
    >
      <form noValidate autoComplete="off">
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <ValidateDatePicker
              label="When was this Case opened?"
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

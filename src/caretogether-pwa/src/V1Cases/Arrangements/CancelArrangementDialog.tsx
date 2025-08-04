import { Grid } from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers';
import { useState } from 'react';
import { useParams } from 'react-router';
import { Arrangement, Person } from '../../GeneratedClient';
import { usePersonLookup } from '../../Model/DirectoryModel';
import { useV1CasesModel } from '../../Model/V1CasesModel';
import { UpdateDialog } from '../../Generic/UpdateDialog';

interface CancelArrangementDialogProps {
  v1CaseId: string;
  arrangement: Arrangement;
  onClose: () => void;
}

export function CancelArrangementDialog({
  v1CaseId,
  arrangement,
  onClose,
}: CancelArrangementDialogProps) {
  const familyIdMaybe = useParams<{ familyId: string }>();
  const familyId = familyIdMaybe.familyId as string;

  const v1CasesModel = useV1CasesModel();
  const personLookup = usePersonLookup();

  const person = personLookup(
    familyId,
    arrangement.partneringFamilyPersonId
  ) as Person;

  const [fields, setFields] = useState({
    cancelledAtLocal: null as Date | null,
  });
  const { cancelledAtLocal } = fields;

  async function save() {
    await v1CasesModel.cancelArrangement(
      familyId,
      v1CaseId,
      arrangement.id!,
      cancelledAtLocal!
    );
  }

  return (
    <UpdateDialog
      title={`Do you want to cancel setting up this ${arrangement.arrangementType} arrangement for ${person.firstName} ${person.lastName}?`}
      onClose={onClose}
      onSave={save}
      enableSave={() => cancelledAtLocal != null}
    >
      <Grid container spacing={0}>
        <Grid item xs={12}>
          <DatePicker
            label="When was this arrangement cancelled?"
            value={cancelledAtLocal}
            disableFuture
            format="M/d/yyyy"
            onChange={(date: Date | null) =>
              date && setFields({ ...fields, cancelledAtLocal: date })
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
    </UpdateDialog>
  );
}

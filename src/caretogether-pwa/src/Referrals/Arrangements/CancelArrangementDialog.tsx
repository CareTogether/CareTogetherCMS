import { Grid } from '@mui/material';
import { useState } from 'react';
import { useParams } from 'react-router';
import { Arrangement, Person } from '../../GeneratedClient';
import { usePersonLookup } from '../../Model/DirectoryModel';
import { useReferralsModel } from '../../Model/ReferralsModel';
import { UpdateDialog } from '../../Generic/UpdateDialog';
import { ValidateDatePicker } from '../../Generic/Forms/ValidateDatePicker';

interface CancelArrangementDialogProps {
  referralId: string;
  arrangement: Arrangement;
  onClose: () => void;
}

export function CancelArrangementDialog({
  referralId,
  arrangement,
  onClose,
}: CancelArrangementDialogProps) {
  const familyIdMaybe = useParams<{ familyId: string }>();
  const familyId = familyIdMaybe.familyId as string;

  const referralsModel = useReferralsModel();
  const personLookup = usePersonLookup();

  const person = personLookup(
    familyId,
    arrangement.partneringFamilyPersonId
  ) as Person;

  const [fields, setFields] = useState({
    cancelledAtLocal: null as Date | null,
  });
  const { cancelledAtLocal } = fields;

  const [dobError, setDobError] = useState(false);

  async function save() {
    await referralsModel.cancelArrangement(
      familyId,
      referralId,
      arrangement.id!,
      cancelledAtLocal!
    );
  }

  return (
    <UpdateDialog
      title={`Do you want to cancel setting up this ${arrangement.arrangementType} arrangement for ${person.firstName} ${person.lastName}?`}
      onClose={onClose}
      onSave={save}
      enableSave={() => cancelledAtLocal != null && !dobError}
    >
      <Grid container spacing={0}>
        <Grid item xs={12}>
          <ValidateDatePicker
            label="When was this arrangement cancelled?"
            value={cancelledAtLocal}
            onChange={(date) =>
              setFields({ ...fields, cancelledAtLocal: date })
            }
            disableFuture
            onErrorChange={setDobError}
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

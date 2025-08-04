import { Grid } from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers';
import { useState } from 'react';
import { useParams } from 'react-router';
import { Arrangement, Person } from '../../GeneratedClient';
import { usePersonLookup } from '../../Model/DirectoryModel';
import { useReferralsModel } from '../../Model/ReferralsModel';
import { UpdateDialog } from '../../Generic/UpdateDialog';

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
          <DatePicker
            label="When was this arrangement cancelled?"
            value={cancelledAtLocal}
            disableFuture
            minDate={new Date(1900, 0, 1)}
            format="M/d/yyyy"
            onChange={(date: Date | null) => {
              const invalid = !date || date.getFullYear() < 1900;
              setDobError(invalid);
              if (date) setFields({ ...fields, cancelledAtLocal: date });
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

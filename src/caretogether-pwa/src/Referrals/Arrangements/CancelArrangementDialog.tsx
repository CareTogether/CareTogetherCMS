import { Grid, TextField } from '@mui/material';
import { DateTimePicker } from '@mui/x-date-pickers';
import { useState } from 'react';
import { useParams } from 'react-router';
import { Arrangement, Person } from '../../GeneratedClient';
import { usePersonLookup } from '../../Model/DirectoryModel';
import { useReferralsModel } from '../../Model/ReferralsModel';
import { UpdateDialog } from '../../UpdateDialog';

interface CancelArrangementDialogProps {
  referralId: string,
  arrangement: Arrangement,
  onClose: () => void
}

export function CancelArrangementDialog({referralId, arrangement, onClose}: CancelArrangementDialogProps) {
  const familyIdMaybe = useParams<{ familyId: string }>();
  const familyId = familyIdMaybe.familyId as string;
  
  const referralsModel = useReferralsModel();
  const personLookup = usePersonLookup();
  
  const person = personLookup(familyId, arrangement.partneringFamilyPersonId) as Person;

  const [fields, setFields] = useState({
    cancelledAtLocal: null as Date | null
  });
  const { cancelledAtLocal } = fields;

  async function save() {
    await referralsModel.cancelArrangement(familyId, referralId, arrangement.id!, cancelledAtLocal!);
  }

  return (
    <UpdateDialog title={`Do you want to cancel setting up this ${arrangement.arrangementType} arrangement for ${person.firstName} ${person.lastName}?`}
      onClose={onClose} onSave={save} enableSave={() => cancelledAtLocal != null}>
      <Grid container spacing={0}>
        <Grid item xs={12}>
          <DateTimePicker
            label="When was this arrangement cancelled?"
            value={cancelledAtLocal}
            disableFuture format="M/d/yyyy h:mma"
            onChange={(date: any) => date && setFields({ ...fields, cancelledAtLocal: date })}
            renderInput={(params: any) => <TextField fullWidth required {...params} sx={{marginTop: 1}} />} />
        </Grid>
      </Grid>
    </UpdateDialog>
  );
}

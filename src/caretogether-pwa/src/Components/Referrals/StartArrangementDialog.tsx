import { Grid, TextField } from '@mui/material';
import { DateTimePicker } from '@mui/lab';
import { useState } from 'react';
import { useParams } from 'react-router';
import { Arrangement, Person } from '../../GeneratedClient';
import { usePersonLookup } from '../../Model/DirectoryModel';
import { useReferralsModel } from '../../Model/ReferralsModel';
import { UpdateDialog } from '../UpdateDialog';

interface StartArrangementDialogProps {
  referralId: string,
  arrangement: Arrangement,
  onClose: () => void
}

export function StartArrangementDialog({referralId, arrangement, onClose}: StartArrangementDialogProps) {
  const familyIdMaybe = useParams<{ familyId: string }>();
  const familyId = familyIdMaybe.familyId as string;
  
  const referralsModel = useReferralsModel();
  const personLookup = usePersonLookup();
  
  const person = personLookup(familyId, arrangement.partneringFamilyPersonId) as Person;

  const [startedAtLocal, setStartedAtLocal] = useState(null as Date | null);

  async function save() {
    await referralsModel.startArrangement(familyId, referralId, arrangement.id!, startedAtLocal!);
  }

  return (
    <UpdateDialog
      title={`Do you want to start this ${arrangement.arrangementType} arrangement for ${person.firstName} ${person.lastName}?`}
      onClose={onClose} onSave={save} enableSave={() => startedAtLocal != null}>
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <DateTimePicker
            label="When was this arrangement started?"
            value={startedAtLocal}
            disableFuture inputFormat="M/d/yyyy h:mma"
            onChange={(date: any) => date && setStartedAtLocal(date)}
            showTodayButton
            renderInput={(params: any) => <TextField fullWidth required {...params} sx={{marginTop: 1}} />} />
        </Grid>
      </Grid>
    </UpdateDialog>
  );
}

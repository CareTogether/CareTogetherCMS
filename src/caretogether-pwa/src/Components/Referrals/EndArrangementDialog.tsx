import { Grid, TextField } from '@mui/material';
import { DateTimePicker } from '@mui/lab';
import { useState } from 'react';
import { useParams } from 'react-router';
import { Arrangement, Person } from '../../GeneratedClient';
import { usePersonLookup } from '../../Model/DirectoryModel';
import { useReferralsModel } from '../../Model/ReferralsModel';
import { UpdateDialog } from '../UpdateDialog';

interface EndArrangementDialogProps {
  referralId: string,
  arrangement: Arrangement,
  onClose: () => void
}

export function EndArrangementDialog({referralId, arrangement, onClose}: EndArrangementDialogProps) {
  const familyIdMaybe = useParams<{ familyId: string }>();
  const familyId = familyIdMaybe.familyId as string;
  
  const referralsModel = useReferralsModel();
  const personLookup = usePersonLookup();
  
  const person = personLookup(familyId, arrangement.partneringFamilyPersonId) as Person;

  const [endedAtLocal, setEndedAtLocal] = useState(null as Date | null);

  async function save() {
    await referralsModel.endArrangement(familyId, referralId, arrangement.id!, endedAtLocal!);
  }

  return (
    <UpdateDialog
      title={`Do you want to end this ${arrangement.arrangementType} arrangement for ${person.firstName} ${person.lastName}?`}
      onClose={onClose} onSave={save} enableSave={() => endedAtLocal != null}>
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <DateTimePicker
            label="When was this arrangement ended?"
            value={endedAtLocal}
            disableFuture inputFormat="M/d/yyyy h:mma"
            onChange={(date: any) => date && setEndedAtLocal(date)}
            showTodayButton
            renderInput={(params: any) => <TextField fullWidth required {...params} sx={{marginTop: 1}} />} />
        </Grid>
      </Grid>
    </UpdateDialog>
  );
}

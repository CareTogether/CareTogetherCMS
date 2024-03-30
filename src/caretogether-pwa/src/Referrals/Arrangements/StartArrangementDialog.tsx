import { Grid } from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers';
import { useState } from 'react';
import { useParams } from 'react-router';
import { Arrangement, Person } from '../../GeneratedClient';
import { usePersonLookup } from '../../Model/DirectoryModel';
import { useReferralsModel } from '../../Model/ReferralsModel';
import { UpdateDialog } from '../../Generic/UpdateDialog';

interface StartArrangementDialogProps {
  referralId: string,
  arrangement: Arrangement,
  onClose: () => void
}

export function StartArrangementDialog({ referralId, arrangement, onClose }: StartArrangementDialogProps) {
  const familyIdMaybe = useParams<{ familyId: string }>();
  const familyId = familyIdMaybe.familyId as string;

  const referralsModel = useReferralsModel();
  const personLookup = usePersonLookup();

  const person = personLookup(familyId, arrangement.partneringFamilyPersonId) as Person;

  const [startedAtLocal, setStartedAtLocal] = useState(null as Date | null);

  async function save() {
    // Enforce that this goes to the very start of the day (00:00:00.000 AM) for now.
    // In the future, this should be a date-only value.
    startedAtLocal?.setHours(0, 0, 0, 0);
    await referralsModel.startArrangement(familyId, referralId, arrangement.id!, startedAtLocal!);
  }

  return (
    <UpdateDialog
      title={`Do you want to start this ${arrangement.arrangementType} arrangement for ${person.firstName} ${person.lastName}?`}
      onClose={onClose} onSave={save} enableSave={() => startedAtLocal != null}>
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <DatePicker
            label="When was this arrangement started?"
            value={startedAtLocal}
            disableFuture format="M/d/yyyy"
            onChange={(date: Date | null) => date && setStartedAtLocal(date)}
            slotProps={{ textField: { fullWidth: true, required: true, sx: { marginTop: 1 } } }} />
        </Grid>
      </Grid>
    </UpdateDialog>
  );
}

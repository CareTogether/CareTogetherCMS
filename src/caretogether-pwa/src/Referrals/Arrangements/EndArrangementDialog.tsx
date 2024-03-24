import { Grid } from '@mui/material';
import { DateTimePicker } from '@mui/x-date-pickers';
import { useState } from 'react';
import { useParams } from 'react-router';
import { Arrangement, Person } from '../../GeneratedClient';
import { usePersonLookup } from '../../Model/DirectoryModel';
import { useReferralsModel } from '../../Model/ReferralsModel';
import { UpdateDialog } from '../../Generic/UpdateDialog';

interface EndArrangementDialogProps {
  referralId: string,
  arrangement: Arrangement,
  onClose: () => void
}

export function EndArrangementDialog({ referralId, arrangement, onClose }: EndArrangementDialogProps) {
  const familyIdMaybe = useParams<{ familyId: string }>();
  const familyId = familyIdMaybe.familyId as string;

  const referralsModel = useReferralsModel();
  const personLookup = usePersonLookup();

  const person = personLookup(familyId, arrangement.partneringFamilyPersonId) as Person;

  const latestChildLocationChange = arrangement.childLocationHistory?.slice().sort((a, b) =>
    a.timestampUtc! < b.timestampUtc! ? 1 : a.timestampUtc! > b.timestampUtc! ? -1 : 0)[0];
  const earliestAllowedEndDate = latestChildLocationChange?.timestampUtc ?? arrangement.startedAtUtc;

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
            minDate={earliestAllowedEndDate}
            disableFuture format="M/d/yyyy h:mm a"
            onChange={(date: Date | null) => date && setEndedAtLocal(date)}
            slotProps={{ textField: { fullWidth: true, required: true, sx: { marginTop: 1 } } }} />
        </Grid>
      </Grid>
    </UpdateDialog>
  );
}

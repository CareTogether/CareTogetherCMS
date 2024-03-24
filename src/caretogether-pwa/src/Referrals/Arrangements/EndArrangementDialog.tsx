import { Grid } from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers';
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
    // Enforce that this goes to the very end of the day (11:59:59.999 PM) for now.
    // In the future, this should be a date-only value.
    endedAtLocal?.setHours(23, 59, 59, 999);
    await referralsModel.endArrangement(familyId, referralId, arrangement.id!, endedAtLocal!);
  }

  return (
    <UpdateDialog
      title={`Do you want to end this ${arrangement.arrangementType} arrangement for ${person.firstName} ${person.lastName}?`}
      onClose={onClose} onSave={save} enableSave={() => endedAtLocal != null}>
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <DatePicker
            label="When was this arrangement ended?"
            value={endedAtLocal}
            minDate={earliestAllowedEndDate}
            disableFuture format="M/d/yyyy"
            onChange={(date: Date | null) => date && setEndedAtLocal(date)}
            slotProps={{ textField: { fullWidth: true, required: true, sx: { marginTop: 1 } } }} />
        </Grid>
      </Grid>
    </UpdateDialog>
  );
}

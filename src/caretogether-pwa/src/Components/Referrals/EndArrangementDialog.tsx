import { Grid } from '@material-ui/core';
import { KeyboardDateTimePicker } from '@material-ui/pickers';
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
  const { familyId } = useParams<{ familyId: string }>();
  
  const referralsModel = useReferralsModel();
  const personLookup = usePersonLookup();
  
  const person = personLookup(familyId, arrangement.partneringFamilyPersonId) as Person;

  const [fields, setFields] = useState({
    endedAtLocal: new Date()
  });
  const { endedAtLocal } = fields;

  async function save() {
    await referralsModel.endArrangement(familyId, referralId, arrangement.id!, endedAtLocal);
  }

  return (
    <UpdateDialog title={`Do you want to end this ${arrangement.arrangementType} arrangement for ${person.firstName} ${person.lastName}?`} onClose={onClose}
      onSave={save}>
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <KeyboardDateTimePicker
            label="When was this arrangement ended?"
            value={endedAtLocal} fullWidth required
            disableFuture format="MM/dd/yyyy hh:mm a"
            onChange={(date) => date && setFields({ ...fields, endedAtLocal: date })}
            showTodayButton />
        </Grid>
      </Grid>
    </UpdateDialog>
  );
}

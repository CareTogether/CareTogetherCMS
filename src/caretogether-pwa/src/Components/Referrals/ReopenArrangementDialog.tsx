import { Grid, TextField } from '@mui/material';
import { useState } from 'react';
import { useParams } from 'react-router';
import { Arrangement, Note, Person } from '../../GeneratedClient';
import { useDirectoryModel, usePersonLookup } from '../../Model/DirectoryModel';
import { useReferralsModel } from '../../Model/ReferralsModel';
import { UpdateDialog } from '../UpdateDialog';

interface ReopenArrangementDialogProps {
  referralId: string,
  arrangement: Arrangement,
  onClose: () => void
}

export function ReopenArrangementDialog({referralId, arrangement, onClose}: ReopenArrangementDialogProps) {
  const familyIdMaybe = useParams<{ familyId: string }>();
  const familyId = familyIdMaybe.familyId as string;
  
  const referralsModel = useReferralsModel();
  const directoryModel = useDirectoryModel();
  const personLookup = usePersonLookup();
  
  const person = personLookup(familyId, arrangement.partneringFamilyPersonId) as Person;
  
  const [notes, setNotes] = useState("");

  async function save() {
    let note: Note | undefined = undefined;
    if (notes !== "")
      note = (await directoryModel.createDraftNote(familyId as string, notes)).note;
      await referralsModel.reopenArrangement(familyId, referralId, arrangement.id!, note?.id || null);
  }

  return (
    <UpdateDialog title={`Do you want to reopen this already-ended ${arrangement.arrangementType} arrangement for ${person.firstName} ${person.lastName}?`}
      onClose={onClose} onSave={save}>
      <Grid container spacing={0}>
        <Grid item xs={12}>
          <TextField
            id="notes" required
            label="Notes" placeholder="Space for any general notes"
            multiline fullWidth variant="outlined" minRows={6} size="medium"
            value={notes} onChange={e => setNotes(e.target.value)}
          />
        </Grid>
      </Grid>
    </UpdateDialog>
  );
}

import { Grid, TextField } from '@mui/material';
import { useState } from 'react';
import { useParams } from 'react-router';
import { Arrangement, Person } from '../../GeneratedClient';
import { useDirectoryModel, usePersonLookup } from '../../Model/DirectoryModel';
import { useReferralsModel } from '../../Model/ReferralsModel';
import { UpdateDialog } from '../../Generic/UpdateDialog';

interface ReopenArrangementDialogProps {
  referralId: string,
  arrangement: Arrangement,
  onClose: () => void
}

export function ReopenArrangementDialog({ referralId, arrangement, onClose }: ReopenArrangementDialogProps) {
  const familyIdMaybe = useParams<{ familyId: string }>();
  const familyId = familyIdMaybe.familyId as string;

  const referralsModel = useReferralsModel();
  const directoryModel = useDirectoryModel();
  const personLookup = usePersonLookup();

  const person = personLookup(familyId, arrangement.partneringFamilyPersonId) as Person;

  const [notes, setNotes] = useState("");

  async function save() {
    let noteId: string | undefined = undefined;
    if (notes !== "") {
      noteId = crypto.randomUUID();
      await directoryModel.createDraftNote(familyId as string, noteId, notes);
    }
    await referralsModel.reopenArrangement(familyId, referralId, arrangement.id!, noteId || null);
  }

  return (
    <UpdateDialog title={`Do you want to reopen this already-ended ${arrangement.arrangementType} arrangement for ${person.firstName} ${person.lastName}?`}
      onClose={onClose} onSave={save}>
      <Grid container spacing={0}>
        <Grid item xs={12}>
          <TextField
            id="notes"
            label="Notes" placeholder="Space for any general notes"
            multiline fullWidth variant="outlined" minRows={6} size="medium"
            value={notes} onChange={e => setNotes(e.target.value)}
          />
        </Grid>
      </Grid>
    </UpdateDialog>
  );
}

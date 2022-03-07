import { useState } from 'react';
import { Grid, TextField } from '@mui/material';
import { Person } from '../../GeneratedClient';
import { useDirectoryModel } from '../../Model/DirectoryModel';
import { UpdateDialog } from '../UpdateDialog';

interface UpdateNotesDialogProps {
  familyId: string,
  person: Person,
  onClose: () => void
}

export function UpdateNotesDialog({familyId, person, onClose}: UpdateNotesDialogProps) {
  const [fields, setFields] = useState({
    notes: person.notes || ''
  });
  const { notes } = fields;
  const directoryModel = useDirectoryModel();

  async function save() {
    await directoryModel.updatePersonNotes(familyId, person.id as string,
      notes.length > 0 ? notes : null);
  }

  return (
    <UpdateDialog title={`Update Notes for ${person.firstName} ${person.lastName}`} onClose={onClose}
      onSave={save} enableSave={() => notes !== person.notes}>
      <form noValidate autoComplete="off">
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <TextField
              id="notes"
              label="Notes" placeholder="Space for any general notes"
              multiline fullWidth variant="outlined" minRows={2} maxRows={5} size="small"
              value={notes} onChange={e => setFields({...fields, notes: e.target.value})}
            />
          </Grid>
        </Grid>
      </form>
    </UpdateDialog>
  );
}

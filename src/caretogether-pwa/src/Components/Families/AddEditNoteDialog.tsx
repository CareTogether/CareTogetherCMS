import { useState } from 'react';
import { Grid, TextField } from '@mui/material';
import { useDirectoryModel } from '../../Model/DirectoryModel';
import { UpdateDialog } from '../UpdateDialog';
import { Note } from '../../GeneratedClient';

interface AddEditNoteDialogProps {
  familyId: string,
  note?: Note,
  onClose: () => void
}

export function AddEditNoteDialog({familyId, note, onClose}: AddEditNoteDialogProps) {
  const [fields, setFields] = useState({
    contents: note?.contents || ''
  });
  const { contents } = fields;
  const directoryModel = useDirectoryModel();

  async function save() {
    if (note)
      await directoryModel.editDraftNote(familyId, note.id!, contents);
    else
      await directoryModel.createDraftNote(familyId, contents);
  }

  return (
    <UpdateDialog title={note ? "Update Draft Note" : "Add New Note"} onClose={onClose}
      onSave={save} enableSave={() => contents !== note?.contents}>
      <form noValidate autoComplete="off">
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <TextField
              id="notes"
              label="Notes" placeholder="Space for any general notes"
              multiline fullWidth variant="outlined" minRows={6} size="medium"
              value={contents} onChange={e => setFields({...fields, contents: e.target.value})}
            />
          </Grid>
        </Grid>
      </form>
    </UpdateDialog>
  );
}

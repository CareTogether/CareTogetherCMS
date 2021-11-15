import { useState } from 'react';
import { Grid, TextField } from '@material-ui/core';
import { useDirectoryModel } from '../../Model/DirectoryModel';
import { UpdateDialog } from '../UpdateDialog';

interface AddEditNoteDialogProps {
  noteId: string | null,
  familyId: string,
  contents?: string
  onClose: () => void
}

export function AddEditNoteDialog({noteId, familyId, contents, onClose}: AddEditNoteDialogProps) {
  const [fields, setFields] = useState({
    updatedContents: contents || ''
  });
  const { updatedContents } = fields;
  const directoryModel = useDirectoryModel();

  async function save() {
    // await directoryModel.updatePersonNotes(familyId, person.id as string,
    //   notes.length > 0 ? notes : null);
  }

  return (
    <UpdateDialog title={noteId ? "Update Draft Note" : "Add New Note"} onClose={onClose}
      onSave={save} enableSave={() => updatedContents !== contents}>
      <form noValidate autoComplete="off">
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <TextField
              id="notes"
              label="Notes" placeholder="Space for any general notes"
              multiline fullWidth variant="outlined" minRows={6} /*maxRows={10}*/ size="medium"
              value={updatedContents} onChange={e => setFields({...fields, updatedContents: e.target.value})}
            />
          </Grid>
        </Grid>
      </form>
    </UpdateDialog>
  );
}

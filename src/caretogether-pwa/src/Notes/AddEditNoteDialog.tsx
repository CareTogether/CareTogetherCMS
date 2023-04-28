import { useState } from 'react';
import { Grid, TextField } from '@mui/material';
import { useDirectoryModel } from '../Model/DirectoryModel';
import { UpdateDialog } from '../UpdateDialog';
import { Note } from '../GeneratedClient';
import { DateTimePicker } from '@mui/x-date-pickers';

interface AddEditNoteDialogProps {
  familyId: string,
  note?: Note,
  onClose: () => void
}

export function AddEditNoteDialog({familyId, note, onClose}: AddEditNoteDialogProps) {
  const [fields, setFields] = useState({
    contents: note?.contents || '',
    backdatedTimestampLocal: note?.backdatedTimestampUtc
  });
  const { contents, backdatedTimestampLocal } = fields;
  const directoryModel = useDirectoryModel();

  async function save() {
    if (note)
      await directoryModel.editDraftNote(familyId, note.id!, contents, backdatedTimestampLocal);
    else
      await directoryModel.createDraftNote(familyId, crypto.randomUUID(), contents, backdatedTimestampLocal);
  }

  return (
    <UpdateDialog title={note ? "Update Draft Note" : "Add New Note"} onClose={onClose}
      onSave={save} enableSave={() =>
        (contents !== note?.contents || backdatedTimestampLocal !== note?.backdatedTimestampUtc) && contents.length > 0}>
      <form noValidate autoComplete="off">
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <TextField
              id="notes"
              label="Notes" placeholder="Space for any general notes"
              required multiline fullWidth variant="outlined" minRows={6} size="medium"
              value={contents} onChange={e => setFields({...fields, contents: e.target.value})}
            />
          </Grid>
          <Grid item xs={12}>
            <DateTimePicker
              label="Backdate (optional - leave blank to use the current date & time)"
              value={backdatedTimestampLocal || null}
              disableFuture format="M/d/yyyy h:mma"
              onChange={(date: any) => setFields({...fields, backdatedTimestampLocal: date})}
              renderInput={(params: any) => <TextField fullWidth {...params} />} />
          </Grid>
        </Grid>
      </form>
    </UpdateDialog>
  );
}

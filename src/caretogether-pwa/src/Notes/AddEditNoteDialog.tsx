import { useState } from 'react';
import {
  FormControl,
  FormHelperText,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  TextField,
} from '@mui/material';
import { useDirectoryModel } from '../Model/DirectoryModel';
import { UpdateDialog } from '../Generic/UpdateDialog';
import { Note } from '../GeneratedClient';
import { ValidateDatePicker } from '../Generic/Forms/ValidateDatePicker';
import { useRecoilValue } from 'recoil';
import { locationConfigurationQuery } from '../Model/ConfigurationModel';

interface AddEditNoteDialogProps {
  familyId: string;
  note?: Note;
  onClose: () => void;
}

export function AddEditNoteDialog({
  familyId,
  note,
  onClose,
}: AddEditNoteDialogProps) {
  const [fields, setFields] = useState({
    contents: note?.contents || '',
    backdatedTimestampLocal: note?.backdatedTimestampUtc,
    accessLevel: note?.accessLevel || 'Everyone',
  });
  const { contents, backdatedTimestampLocal, accessLevel } = fields;
  const directoryModel = useDirectoryModel();

  const locationConfiguration = useRecoilValue(locationConfigurationQuery);

  const accessLevels = locationConfiguration?.accessLevels || [];

  async function save() {
    if (note)
      await directoryModel.editDraftNote(
        familyId,
        note.id!,
        contents,
        backdatedTimestampLocal,
        accessLevel === 'Everyone' ? undefined : accessLevel
      );
    else
      await directoryModel.createDraftNote(
        familyId,
        crypto.randomUUID(),
        contents,
        backdatedTimestampLocal,
        accessLevel === 'Everyone' ? undefined : accessLevel
      );
  }

  return (
    <UpdateDialog
      title={note ? 'Update Draft Note' : 'Add New Note'}
      onClose={onClose}
      onSave={save}
      enableSave={() =>
        (contents !== note?.contents ||
          backdatedTimestampLocal !== note?.backdatedTimestampUtc ||
          accessLevel !== note?.accessLevel) &&
        contents.length > 0
      }
    >
      <form noValidate autoComplete="off">
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <TextField
              id="notes"
              label="Notes"
              placeholder="Space for any general notes"
              required
              multiline
              fullWidth
              variant="outlined"
              minRows={6}
              size="medium"
              value={contents}
              onChange={(e) =>
                setFields({ ...fields, contents: e.target.value })
              }
            />
          </Grid>
          <Grid item xs={12}>
            <ValidateDatePicker
              label="Backdate (optional - leave blank to use the current date & time)"
              value={backdatedTimestampLocal || null}
              onChange={(date) =>
                setFields({
                  ...fields,
                  backdatedTimestampLocal: date ?? undefined,
                })
              }
              includeTime
              disableFuture
              textFieldProps={{ fullWidth: true }}
            />
          </Grid>
          <Grid item xs={12}>
            <FormControl fullWidth>
              <InputLabel id="access-level-label">Access Level</InputLabel>
              <Select
                labelId="access-level-label"
                label="Access Level"
                value={fields.accessLevel || ''}
                onChange={(e) =>
                  setFields({ ...fields, accessLevel: e.target.value })
                }
              >
                <MenuItem value="Everyone">
                  <em>Everyone</em>
                </MenuItem>
                {accessLevels.map((accessLevel) => (
                  <MenuItem key={accessLevel.name} value={accessLevel.name}>
                    {accessLevel.name}
                  </MenuItem>
                ))}
              </Select>
              <FormHelperText>Who can see this note?</FormHelperText>
            </FormControl>
          </Grid>
        </Grid>
      </form>
    </UpdateDialog>
  );
}

import Grid from '@mui/material/Grid';
import { useState } from 'react';
import {
  Box,
  Button,
  Drawer,
  FormControl,
  FormHelperText,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Typography,
} from '@mui/material';
import { Note } from '../GeneratedClient';
import { ValidateDatePicker } from '../Generic/Forms/ValidateDatePicker';
import { useBackdrop } from '../Hooks/useBackdrop';
import { useDirectoryModel } from '../Model/DirectoryModel';
import { locationConfigurationQuery } from '../Model/ConfigurationModel';
import { useRecoilValue } from 'recoil';

interface AddEditNoteDrawerProps {
  familyId: string;
  note?: Note;
  onClose: () => void;
}

export function AddEditNoteDrawer({
  familyId,
  note,
  onClose,
}: AddEditNoteDrawerProps) {
  const [fields, setFields] = useState({
    contents: note?.contents || '',
    backdatedTimestampLocal: note?.backdatedTimestampUtc,
    accessLevel: note?.accessLevel || 'Everyone',
  });
  const { contents, backdatedTimestampLocal, accessLevel } = fields;
  const directoryModel = useDirectoryModel();
  const locationConfiguration = useRecoilValue(locationConfigurationQuery);
  const accessLevels = locationConfiguration?.accessLevels || [];
  const withBackdrop = useBackdrop();

  async function save() {
    await withBackdrop(async () => {
      if (note) {
        await directoryModel.editDraftNote(
          familyId,
          note.id!,
          contents,
          backdatedTimestampLocal,
          accessLevel === 'Everyone' ? undefined : accessLevel
        );
      } else {
        await directoryModel.createDraftNote(
          familyId,
          crypto.randomUUID(),
          contents,
          backdatedTimestampLocal,
          accessLevel === 'Everyone' ? undefined : accessLevel
        );
      }

      onClose();
    });
  }

  const saveEnabled =
    (contents !== note?.contents ||
      backdatedTimestampLocal !== note?.backdatedTimestampUtc ||
      accessLevel !== note?.accessLevel) &&
    contents.length > 0;

  return (
    <Drawer
      anchor="right"
      open
      onClose={onClose}
      slotProps={{
        paper: {
          sx: {
            width: { xs: '100%', sm: 600 },
            top: 45,
            height: 'calc(100% - 45px)',
            display: 'flex',
          },
        },
      }}
    >
      <Box sx={{ flex: 1, minHeight: 0, overflowY: 'auto', p: 3 }}>
        <Typography id="add-edit-note-title" variant="h6" sx={{ mb: 2 }}>
          {note ? 'Update Draft Note' : 'Add New Note'}
        </Typography>
        <form noValidate autoComplete="off">
          <Grid container spacing={2}>
            <Grid size={12}>
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
            <Grid size={12}>
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
            <Grid size={12}>
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
      </Box>
      <Box
        sx={{
          borderTop: 1,
          borderColor: 'divider',
          display: 'flex',
          gap: 1,
          justifyContent: 'flex-end',
          p: 2,
          pb: 'calc(16px + env(safe-area-inset-bottom))',
          backgroundColor: 'background.paper',
        }}
      >
        <Button onClick={onClose} color="secondary">
          Cancel
        </Button>
        <Button
          onClick={save}
          variant="contained"
          color="primary"
          disabled={!saveEnabled}
        >
          Save
        </Button>
      </Box>
    </Drawer>
  );
}

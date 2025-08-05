import { useState } from 'react';
import {
  DialogContent,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Typography,
  Box,
  FormHelperText,
} from '@mui/material';
import { UpdateDialog } from '../Generic/UpdateDialog';
import { Note } from '../GeneratedClient';
import { useDirectoryModel } from '../Model/DirectoryModel';
import { useRecoilValue } from 'recoil';
import { locationConfigurationQuery } from '../Model/ConfigurationModel';
import { PersonName } from '../Families/PersonName';
import { useUserLookup } from '../Model/DirectoryModel';
import { format } from 'date-fns';

interface EditNoteAccessLevelDialogProps {
  familyId: string;
  note: Note;
  onClose: () => void;
}

export function EditNoteAccessLevelDialog({
  familyId,
  note,
  onClose,
}: EditNoteAccessLevelDialogProps) {
  const [accessLevel, setAccessLevel] = useState(note.accessLevel);

  const directoryModel = useDirectoryModel();
  const locationConfiguration = useRecoilValue(locationConfigurationQuery);
  const userLookup = useUserLookup();

  const accessLevels = locationConfiguration?.accessLevels || [
    { name: 'Everyone' },
  ];

  async function save() {
    if (accessLevel !== note.accessLevel) {
      await directoryModel.updateNoteAccessLevel(
        familyId,
        note.id!,
        accessLevel
      );
    }
    onClose();
  }

  const canSave = accessLevel !== note.accessLevel;

  return (
    <UpdateDialog
      title="Edit Note Visibility"
      onClose={onClose}
      onSave={save}
      enableSave={() => canSave}
    >
      <DialogContent>
        <Box mb={2}>
          <Typography variant="body2">
            <PersonName person={userLookup(note.authorId)} /> –{' '}
            {format(note.timestampUtc!, 'MM/dd/yyyy hh:mm aa')}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {note.contents}
          </Typography>
        </Box>
        <FormControl fullWidth>
          <InputLabel id="access-level-label">Access Level</InputLabel>
          <Select
            labelId="access-level-label"
            label="Access Level"
            value={accessLevel}
            onChange={(e) => setAccessLevel(e.target.value)}
          >
            {accessLevels.map((al) => (
              <MenuItem key={al.name} value={al.name}>
                {al.name}
              </MenuItem>
            ))}
          </Select>
          <FormHelperText>Who can see this note?</FormHelperText>
        </FormControl>
      </DialogContent>
    </UpdateDialog>
  );
}

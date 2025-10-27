import { useState } from 'react';
import {
  DialogContent,
  FormControl,
  FormLabel,
  Typography,
  Box,
  FormHelperText,
  RadioGroup,
  FormControlLabel,
  Radio,
} from '@mui/material';
import { useRecoilValue } from 'recoil';
import { format } from 'date-fns';
import { PersonName } from '../../Families/PersonName';
import { Note, NoteStatus } from '../../GeneratedClient';
import { UpdateDialog } from '../../Generic/UpdateDialog';
import { locationConfigurationQuery } from '../../Model/ConfigurationModel';
import { useDirectoryModel, useUserLookup } from '../../Model/DirectoryModel';

interface EditNoteAccessLevelDialogProps {
  familyId: string;
  note: Note;
  onClose: (updatedAccessLevel?: string) => void;
}

export function AccessLevelDialog({
  familyId,
  note,
  onClose,
}: EditNoteAccessLevelDialogProps) {
  const directoryModel = useDirectoryModel();
  const locationConfiguration = useRecoilValue(locationConfigurationQuery);
  const userLookup = useUserLookup();

  const [accessLevel, setAccessLevel] = useState<string>(
    note.accessLevel ?? 'Everyone'
  );
  const [saving, setSaving] = useState(false);

  const accessLevels = locationConfiguration?.accessLevels || [];
  const options: string[] = ['Everyone', ...accessLevels.map((x) => x.name!)];

  const canSave = accessLevel !== (note.accessLevel ?? 'Everyone');

  async function save() {
    if (!canSave || saving) {
      onClose();
      return;
    }

    setSaving(true);
    const normalized = accessLevel === 'Everyone' ? undefined : accessLevel;

    try {
      if (note.status === NoteStatus.Draft) {
        await directoryModel.editDraftNote(
          familyId,
          note.id!,
          note.contents ?? '',
          note.backdatedTimestampUtc,
          normalized
        );
      } else {
        await directoryModel.updateNoteAccessLevel(
          familyId,
          note.id!,
          normalized ?? ''
        );
      }
    } catch (error) {
      setSaving(false);
    }

    setSaving(false);
    onClose(accessLevel);
  }

  return (
    <UpdateDialog
      title="Edit Note Visibility"
      onClose={() => onClose()}
      onSave={save}
      enableSave={() => canSave && !saving}
    >
      <DialogContent>
        <Box mb={2}>
          <Typography variant="body2">
            <PersonName person={userLookup(note.authorId)} /> –{' '}
            {format(
              note.createdTimestampUtc ?? note.lastEditTimestampUtc,
              'MM/dd/yyyy hh:mm aa'
            )}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {note.contents}
          </Typography>
        </Box>

        <FormControl component="fieldset" fullWidth>
          <FormLabel component="legend">Who can see this note?</FormLabel>
          <RadioGroup
            name="note-access-level"
            value={accessLevel}
            onChange={(_, val) => setAccessLevel(val)}
          >
            {options.map((name) => (
              <FormControlLabel
                key={name}
                value={name}
                control={<Radio />}
                label={name}
              />
            ))}
          </RadioGroup>
          <FormHelperText>
            Current: {note.accessLevel ?? 'Everyone'}
          </FormHelperText>
        </FormControl>
      </DialogContent>
    </UpdateDialog>
  );
}

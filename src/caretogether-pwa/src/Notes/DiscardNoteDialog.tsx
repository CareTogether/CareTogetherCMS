import { Divider, Typography } from '@mui/material';
import { useDirectoryModel, useUserLookup } from '../Model/DirectoryModel';
import { UpdateDialog } from '../Generic/UpdateDialog';
import { Note } from '../GeneratedClient';
import { PersonName } from '../Families/PersonName';
import { format } from 'date-fns';

interface DiscardNoteDialogProps {
  familyId: string,
  note: Note,
  onClose: () => void
}

export function DiscardNoteDialog({ familyId, note, onClose }: DiscardNoteDialogProps) {
  const directoryModel = useDirectoryModel();
  const userLookup = useUserLookup();

  async function save() {
    await directoryModel.discardDraftNote(familyId, note.id!);
  }

  return (
    <UpdateDialog title="Are you sure you want to discard this note?" onClose={onClose}
      onSave={save}>
      <Typography variant="body2" component="p">
        <PersonName person={userLookup(note.authorId)} /> -&nbsp;
        {format(note.timestampUtc!, "MM/dd/yyyy hh:mm aa")}
      </Typography>
      <Divider />
      <Typography>
        {note.contents}
      </Typography>
    </UpdateDialog>
  );
}

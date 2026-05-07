import { Divider, Typography } from '@mui/material';
import { useDirectoryModel, useNoteAuthorLookup } from '../Model/DirectoryModel';
import { UpdateDialog } from '../Generic/UpdateDialog';
import { Note } from '../GeneratedClient';
import { PersonName } from '../Families/PersonName';
import { format } from 'date-fns';

interface DiscardNoteDialogProps {
  familyId: string;
  note: Note;
  onClose: () => void;
}

export function DiscardNoteDialog({
  familyId,
  note,
  onClose,
}: DiscardNoteDialogProps) {
  const directoryModel = useDirectoryModel();
  const noteAuthorLookup = useNoteAuthorLookup();

  async function save() {
    await directoryModel.discardDraftNote(familyId, note.id!);
  }

  return (
    <UpdateDialog
      title="Are you sure you want to discard this note?"
      onClose={onClose}
      onSave={save}
    >
      <Typography variant="body2" component="p">
        <PersonName person={noteAuthorLookup(note)} /> -&nbsp;
        {format(
          note.createdTimestampUtc ?? note.lastEditTimestampUtc,
          'MM/dd/yyyy hh:mm aa'
        )}
      </Typography>
      <Divider />
      <Typography>{note.contents}</Typography>
    </UpdateDialog>
  );
}

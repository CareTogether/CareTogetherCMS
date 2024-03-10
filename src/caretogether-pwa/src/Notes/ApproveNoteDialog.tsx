import { Divider, Typography } from '@mui/material';
import { useDirectoryModel, useUserLookup } from '../Model/DirectoryModel';
import { UpdateDialog } from '../Generic/UpdateDialog';
import { Note } from '../GeneratedClient';
import { PersonName } from '../Families/PersonName';
import { format } from 'date-fns';

interface ApproveNoteDialogProps {
  familyId: string,
  note: Note,
  onClose: () => void
}

export function ApproveNoteDialog({ familyId, note, onClose }: ApproveNoteDialogProps) {
  const directoryModel = useDirectoryModel();
  const userLookup = useUserLookup();

  async function approve() {
    await directoryModel.approveNote(familyId, note.id!, note.contents!, note.backdatedTimestampUtc);
  }

  return (
    <UpdateDialog title="Do you want to approve and finalize this note?" onClose={onClose}
      onSave={approve}>
      <Typography variant="body2" component="p">
        <PersonName person={userLookup(note.authorId)} /> -&nbsp;
        {format(note.timestampUtc!, "MM/dd/yyyy hh:mm aa")}
      </Typography>
      {note.backdatedTimestampUtc && <Typography variant="body2" component="p">
        Backdated to: {format(note.backdatedTimestampUtc!, "MM/dd/yyyy hh:mm aa")}
      </Typography>}
      <Divider />
      <Typography>
        {note.contents}
      </Typography>
    </UpdateDialog>
  );
}

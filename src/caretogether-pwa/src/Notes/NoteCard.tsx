import {
  Card,
  CardContent,
  CardHeader,
  CardActions,
  Button,
  Typography,
} from '@mui/material';
import { useState } from 'react';
import { Note, NoteStatus, Permission } from '../GeneratedClient';
import { useUserLookup } from '../Model/DirectoryModel';
import { PersonName } from '../Families/PersonName';
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';
import CheckIcon from '@mui/icons-material/Check';
import EditIcon from '@mui/icons-material/Edit';
import { AddEditNoteDialog } from './AddEditNoteDialog';
import { ApproveNoteDialog } from './ApproveNoteDialog';
import { DiscardNoteDialog } from './DiscardNoteDialog';
import { useFamilyIdPermissions } from '../Model/SessionModel';

type NoteCardProps = {
  familyId: string;
  note?: Note;
};

export function NoteCard({ familyId, note }: NoteCardProps) {
  const userLookup = useUserLookup();

  const [showDiscardNoteDialog, setShowDiscardNoteDialog] = useState(false);
  const [showApproveNoteDialog, setShowApproveNoteDialog] = useState(false);
  const [showEditNoteDialog, setShowEditNoteDialog] = useState(false);

  const permissions = useFamilyIdPermissions(familyId);

  return typeof note === 'undefined' ? null : (
    <Card sx={{ margin: 0 }} variant="outlined">
      <CardHeader
        sx={{ padding: 1 }}
        subheader={
          <>
            <PersonName person={userLookup(note.authorId)} />
            {note.status === NoteStatus.Draft ? ' - DRAFT' : ''}
          </>
        }
      />
      <CardContent
        sx={{
          padding: 1,
          paddingTop: 0,
          paddingBottom: 0,
          whiteSpace: 'pre-wrap',
          overflowWrap: 'anywhere',
        }}
      >
        <Typography variant="body2" component="p">
          {note.contents}
        </Typography>
      </CardContent>
      {note.status === NoteStatus.Draft && (
        <CardActions sx={{ paddingTop: 0 }}>
          {permissions(Permission.DiscardDraftNotes) && (
            <Button
              className="ph-unmask"
              onClick={() => setShowDiscardNoteDialog(true)}
              variant="contained"
              size="small"
              color="secondary"
              sx={{ marginTop: 1, marginLeft: 'auto !important' }}
              startIcon={<DeleteForeverIcon />}
            >
              Delete
            </Button>
          )}
          {permissions(Permission.AddEditDraftNotes) && (
            <Button
              className="ph-unmask"
              onClick={() => setShowEditNoteDialog(true)}
              variant="contained"
              size="small"
              sx={{ marginTop: 1, marginLeft: 'auto !important' }}
              startIcon={<EditIcon />}
            >
              Edit
            </Button>
          )}
          {permissions(Permission.ApproveNotes) && (
            <Button
              className="ph-unmask"
              onClick={() => setShowApproveNoteDialog(true)}
              variant="contained"
              size="small"
              sx={{ marginTop: 1, marginLeft: 'auto !important' }}
              startIcon={<CheckIcon />}
            >
              Approve
            </Button>
          )}
        </CardActions>
      )}
      {(showDiscardNoteDialog && (
        <DiscardNoteDialog
          familyId={familyId}
          note={note}
          onClose={() => setShowDiscardNoteDialog(false)}
        />
      )) ||
        null}
      {(showApproveNoteDialog && (
        <ApproveNoteDialog
          familyId={familyId}
          note={note}
          onClose={() => setShowApproveNoteDialog(false)}
        />
      )) ||
        null}
      {(showEditNoteDialog && (
        <AddEditNoteDialog
          familyId={familyId}
          note={note}
          onClose={() => setShowEditNoteDialog(false)}
        />
      )) ||
        null}
    </Card>
  );
}

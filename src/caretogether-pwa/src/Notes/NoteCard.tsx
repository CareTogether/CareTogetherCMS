import {
  Card,
  CardContent,
  CardHeader,
  CardActions,
  Button,
  Typography,
  Box,
  Collapse,
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
import { useLoadable } from '../Hooks/useLoadable';
import { accountInfoState } from '../Authentication/Auth';
import { format } from 'date-fns';

type NoteCardProps = {
  familyId: string;
  note?: Note;
};

export function NoteCard({ familyId, note }: NoteCardProps) {
  const userLookup = useUserLookup();

  const [showDiscardNoteDialog, setShowDiscardNoteDialog] = useState(false);
  const [showApproveNoteDialog, setShowApproveNoteDialog] = useState(false);
  const [showEditNoteDialog, setShowEditNoteDialog] = useState(false);
  const [showMoreDetails, setShowMoreDetails] = useState(false);

  const permissions = useFamilyIdPermissions(familyId);

  const userId = useLoadable(accountInfoState)?.userId;

  const isOwnNote = note?.authorId === userId;

  const canEditOwnNote =
    isOwnNote && permissions(Permission.AddEditOwnDraftNotes);

  const canEditAnyNote = permissions(Permission.AddEditDraftNotes);

  const canEdit = canEditOwnNote || canEditAnyNote;

  const canDiscardOwnNote =
    isOwnNote && permissions(Permission.DiscardOwnDraftNotes);
  const canDiscardAnyNote = permissions(Permission.DiscardDraftNotes);

  const canDiscard = canDiscardOwnNote || canDiscardAnyNote;

  return typeof note === 'undefined' ? null : (
    <Card sx={{ margin: 0 }} variant="outlined">
      <CardHeader
        sx={{ padding: 1 }}
        subheader={
          <>
            {(() => {
              const created = note.createdTimestampUtc
                ? new Date(note.createdTimestampUtc)
                : null;
              const edited = note.lastEditTimestampUtc
                ? new Date(note.lastEditTimestampUtc)
                : null;

              if (edited && created && edited.getTime() !== created.getTime()) {
                return <>Edited {format(edited, 'M/d/yy h:mm a')}&nbsp;</>;
              }

              if (created) {
                return <>Created {format(created, 'M/d/yy h:mm a')}&nbsp;</>;
              }

              return null;
            })()}

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

        <Collapse in={showMoreDetails} timeout={300}>
          <Box
            sx={{
              backgroundColor: '#f5f5f5',
              padding: 1,
              marginTop: 2,
              borderRadius: 1,
            }}
          >
            <Typography variant="caption">
              <>
                Author: <PersonName person={userLookup(note.authorId)} />
                <br />
                Created at: {format(note.createdTimestampUtc, 'M/d/yy h:mm a')}
                <br />
                Last edited at:{' '}
                {note.lastEditTimestampUtc
                  ? format(note.lastEditTimestampUtc, 'M/d/yy h:mm a')
                  : 'N/A'}
                <br />
                Backdated as:{' '}
                {note.backdatedTimestampUtc
                  ? format(note.backdatedTimestampUtc, 'M/d/yy h:mm a')
                  : 'N/A'}
                <hr />
                Approved by: {/* TODO: should be activity.userId */}
                {note.authorId ? (
                  <PersonName person={userLookup(note.authorId)} />
                ) : (
                  'N/A'
                )}
                <br />
                Approved at:{' '}
                {note.approvedTimestampUtc
                  ? format(note.approvedTimestampUtc, 'M/d/yy h:mm a')
                  : 'N/A'}
              </>
            </Typography>
          </Box>
        </Collapse>
      </CardContent>
      <CardActions sx={{ paddingTop: 0 }}>
        <Button
          className="ph-unmask"
          size="small"
          sx={{
            marginTop: 1,
            marginRight: 'auto',
            transition: 'all 0.2s ease-in-out',
          }}
          onClick={() => setShowMoreDetails(!showMoreDetails)}
        >
          {showMoreDetails ? 'Hide Details' : 'More Details'}
        </Button>
        {note.status === NoteStatus.Draft && (
          <>
            {canDiscard && (
              <Button
                className="ph-unmask"
                onClick={() => setShowDiscardNoteDialog(true)}
                variant="outlined"
                size="small"
                color="error"
                sx={{ marginTop: 1 }}
                startIcon={<DeleteForeverIcon />}
              >
                Delete
              </Button>
            )}
            {canEdit && (
              <Button
                className="ph-unmask"
                onClick={() => setShowEditNoteDialog(true)}
                variant="outlined"
                size="small"
                sx={{ marginTop: 1 }}
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
                sx={{ marginTop: 1 }}
                startIcon={<CheckIcon />}
              >
                Approve
              </Button>
            )}
          </>
        )}
      </CardActions>

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

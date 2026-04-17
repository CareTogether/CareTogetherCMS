import {
  Card,
  CardContent,
  CardHeader,
  CardActions,
  Button,
  Typography,
  Box,
  Collapse,
  IconButton,
  Tooltip,
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import { useState } from 'react';
import { Note, NoteStatus, Permission } from '../GeneratedClient';
import { useDirectoryModel, useUserLookup } from '../Model/DirectoryModel';
import { PersonName } from '../Families/PersonName';
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';
import CheckIcon from '@mui/icons-material/Check';
import EditIcon from '@mui/icons-material/Edit';
import PushPinIcon from '@mui/icons-material/PushPin';
import PushPinOutlinedIcon from '@mui/icons-material/PushPinOutlined';
import { AddEditNoteDialog } from './AddEditNoteDialog';
import { ApproveNoteDialog } from './ApproveNoteDialog';
import { DiscardNoteDialog } from './DiscardNoteDialog';
import { useFamilyIdPermissions } from '../Model/SessionModel';
import { useLoadable } from '../Hooks/useLoadable';
import { accountInfoState } from '../Authentication/Auth';
import { format } from 'date-fns';
import { ChevronRight } from '@mui/icons-material';

type NoteCardProps = {
  familyId: string;
  note?: Note;
  showPinAction?: boolean;
  isPinnedPresentation?: boolean;
};

export function NoteCard({
  familyId,
  note,
  showPinAction = false,
  isPinnedPresentation = false,
}: NoteCardProps) {
  const userLookup = useUserLookup();
  const directoryModel = useDirectoryModel();
  const theme = useTheme();

  const [showDiscardNoteDialog, setShowDiscardNoteDialog] = useState(false);
  const [showApproveNoteDialog, setShowApproveNoteDialog] = useState(false);
  const [showEditNoteDialog, setShowEditNoteDialog] = useState(false);
  const [showMoreDetails, setShowMoreDetails] = useState(false);
  const [isSavingPin, setIsSavingPin] = useState(false);

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

  const canPin = permissions(Permission.ApproveNotes);
  const isPinned = note?.isPinned ?? false;

  async function handleTogglePin(event: React.MouseEvent<HTMLButtonElement>) {
    event.preventDefault();
    event.stopPropagation();

    if (!note || isSavingPin) return;

    try {
      setIsSavingPin(true);

      if (isPinned) {
        await directoryModel.unpinNote(familyId, note.id);
      } else {
        await directoryModel.pinNote(familyId, note.id);
      }
    } catch (error) {
      console.error('Failed to toggle pinned state for note.', error);
    } finally {
      setIsSavingPin(false);
    }
  }

  if (!note) return null;

  return (
    <Card
      variant="outlined"
      sx={{
        margin: 0,
        borderWidth: isPinnedPresentation ? 2 : 1,
        borderColor: isPinnedPresentation
          ? theme.palette.primary.main
          : undefined,
        backgroundColor: isPinnedPresentation
          ? alpha(theme.palette.primary.main, 0.06)
          : undefined,
        boxShadow: isPinnedPresentation ? 2 : 0,
      }}
    >
      <CardHeader
        sx={{ padding: 1, paddingBottom: 0 }}
        action={
          showPinAction && note.status === NoteStatus.Approved && canPin ? (
            <Tooltip title={isPinned ? 'Unpin note' : 'Pin note'}>
              <span>
                <IconButton
                  className="ph-unmask"
                  onClick={handleTogglePin}
                  size="small"
                  aria-label={isPinned ? 'Unpin note' : 'Pin note'}
                  disabled={isSavingPin}
                >
                  {isPinned ? (
                    <PushPinIcon color="primary" />
                  ) : (
                    <PushPinOutlinedIcon />
                  )}
                </IconButton>
              </span>
            </Tooltip>
          ) : undefined
        }
        subheader={
          <>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                flexWrap: 'wrap',
              }}
            >
              <span>
                {note.status === NoteStatus.Draft ? 'Draft note' : ''}
                {note.status === NoteStatus.Approved ? 'Approved note' : ''}
              </span>
            </Box>{' '}
            -{' '}
            <span
              style={{
                cursor: 'pointer',
                userSelect: 'none',
                display: 'inline-flex',
                alignItems: 'center',
              }}
              onClick={() => setShowMoreDetails((current) => !current)}
            >
              {showMoreDetails ? 'hide details' : 'more details'}{' '}
              <ChevronRight
                sx={{
                  transform: showMoreDetails
                    ? 'rotate(-90deg)'
                    : 'rotate(90deg)',
                  transition: 'transform 0.2s ease-in-out',
                  fontSize: 'inherit',
                }}
              />
            </span>
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
        <Collapse in={showMoreDetails} timeout={300}>
          <Box
            sx={{
              backgroundColor: '#f5f5f5',
              padding: 1,
              marginBottom: 1,
              borderRadius: 1,
            }}
          >
            <Typography variant="caption">
              <>
                Author: <PersonName person={userLookup(note.authorId)} />
                <br />
                Created at:{' '}
                {note.createdTimestampUtc
                  ? format(note.createdTimestampUtc, 'M/d/yy h:mm a')
                  : 'N/A'}
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
                Approved by:{' '}
                {note.approverId ? (
                  <PersonName person={userLookup(note.approverId)} />
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

        <Typography variant="body2" component="p">
          {note.contents}
        </Typography>
      </CardContent>
      <CardActions
        sx={{ paddingTop: 0, justifyContent: 'flex-end', flexWrap: 'wrap' }}
      >
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

      {showDiscardNoteDialog && (
        <DiscardNoteDialog
          familyId={familyId}
          note={note}
          onClose={() => setShowDiscardNoteDialog(false)}
        />
      )}

      {showApproveNoteDialog && (
        <ApproveNoteDialog
          familyId={familyId}
          note={note}
          onClose={() => setShowApproveNoteDialog(false)}
        />
      )}

      {showEditNoteDialog && (
        <AddEditNoteDialog
          familyId={familyId}
          note={note}
          onClose={() => setShowEditNoteDialog(false)}
        />
      )}
    </Card>
  );
}

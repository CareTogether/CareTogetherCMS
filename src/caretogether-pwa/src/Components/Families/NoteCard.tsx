import {
  Card,
  CardContent,
  CardHeader,
  CardActions,
  IconButton,
  Button,
  ListItemText,
  Menu,
  MenuItem,
  Typography,
} from '@mui/material';
import makeStyles from '@mui/styles/makeStyles';
import { format } from 'date-fns';
import React, { useState } from 'react';
import { Note, NoteStatus } from '../../GeneratedClient';
import { useUserLookup } from '../../Model/DirectoryModel';
import { PersonName } from './PersonName';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import CheckIcon from '@mui/icons-material/Check';
import EditIcon from '@mui/icons-material/Edit';
import { AddEditNoteDialog } from './AddEditNoteDialog';
import { ApproveNoteDialog } from './ApproveNoteDialog';
import { DiscardNoteDialog } from './DiscardNoteDialog';

const useStyles = makeStyles((theme) => ({
  card: {
    margin: 8
  },
  cardHeader: {
    padding: 8
  },
  cardContent: {
    padding: 8,
    paddingTop: 0,
    paddingBottom: 0,
    whiteSpace: 'pre-wrap',
    overflowWrap: 'anywhere'
  },
  cardActions: {
    paddingTop: 0
  },
  cardList: {
    padding: 0,
    margin: 0,
    marginTop: 8,
    listStyle: 'none',
    '& > li': {
      marginTop: 4
    }
  },
  rightCardActionButton: {
    marginTop: 8,
    marginLeft: 'auto !important'
  }
}));

type NoteCardProps = {
  familyId: string;
  note: Note;
};

export function NoteCard({ familyId, note }: NoteCardProps) {
  const classes = useStyles();

  const userLookup = useUserLookup();

  const [moreMenuAnchor, setMoreMenuAnchor] = useState<{anchor: Element} | null>(null);
  const [showDiscardNoteDialog, setShowDiscardNoteDialog] = useState(false);
  function selectDiscardDraftNote() {
    setMoreMenuAnchor(null);
    setShowDiscardNoteDialog(true);
  }
  
  const [showApproveNoteDialog, setShowApproveNoteDialog] = useState(false);
  const [showEditNoteDialog, setShowEditNoteDialog] = useState(false);

  return (
    <Card className={classes.card}>
      <CardHeader className={classes.cardHeader}
        subheader={<>
          <PersonName person={userLookup(note.authorId)} /> -&nbsp;
          {format(note.timestampUtc!, "MM/dd/yyyy hh:mm aa")}
          {note.status === NoteStatus.Draft ? " - DRAFT" : ""}
        </>}
        action={
          note.status === NoteStatus.Draft && (
          <IconButton
            onClick={(event) => setMoreMenuAnchor({anchor: event.currentTarget})}
            size="large">
            <MoreVertIcon />
          </IconButton>
        )} />
      <CardContent className={classes.cardContent}>
        <Typography variant="body2" component="p">
          {note.contents}
        </Typography>
      </CardContent>
      <CardActions className={classes.cardActions}>
        {note.status === NoteStatus.Draft && (
          <Button
            onClick={() => setShowEditNoteDialog(true)}
            variant="contained"
            size="small"
            className={classes.rightCardActionButton}
            startIcon={<EditIcon />}>
            Edit
          </Button>
        )}
        {note.status === NoteStatus.Draft && (
          <Button
            onClick={() => setShowApproveNoteDialog(true)}
            variant="contained"
            size="small"
            className={classes.rightCardActionButton}
            startIcon={<CheckIcon />}>
            Approve
          </Button>
        )}
      </CardActions>
      <Menu id="note-more-menu"
        anchorEl={moreMenuAnchor?.anchor}
        keepMounted
        open={Boolean(moreMenuAnchor)}
        onClose={() => setMoreMenuAnchor(null)}>
        {note.status === NoteStatus.Draft && (
          <MenuItem onClick={selectDiscardDraftNote}>
            <ListItemText primary="Discard draft note" />
          </MenuItem>
        )}
      </Menu>
      {(showDiscardNoteDialog && <DiscardNoteDialog familyId={familyId} note={note}
        onClose={() => setShowDiscardNoteDialog(false)} />) || null}
      {(showApproveNoteDialog && <ApproveNoteDialog familyId={familyId} note={note}
        onClose={() => setShowApproveNoteDialog(false)} />) || null}
      {(showEditNoteDialog && <AddEditNoteDialog familyId={familyId} note={note}
        onClose={() => setShowEditNoteDialog(false)} />) || null}
    </Card>
  );
}

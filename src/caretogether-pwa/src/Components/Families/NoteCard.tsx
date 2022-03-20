import {
  Card,
  CardContent,
  CardHeader,
  CardActions,
  Button,
  Typography,
} from '@mui/material';
import makeStyles from '@mui/styles/makeStyles';
import React, { useState } from 'react';
import { Note, NoteStatus } from '../../GeneratedClient';
import { useUserLookup } from '../../Model/DirectoryModel';
import { PersonName } from './PersonName';
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';
import CheckIcon from '@mui/icons-material/Check';
import EditIcon from '@mui/icons-material/Edit';
import { AddEditNoteDialog } from './AddEditNoteDialog';
import { ApproveNoteDialog } from './ApproveNoteDialog';
import { DiscardNoteDialog } from './DiscardNoteDialog';

const useStyles = makeStyles((theme) => ({
  card: {
    margin: 0
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

  const [showDiscardNoteDialog, setShowDiscardNoteDialog] = useState(false);
  const [showApproveNoteDialog, setShowApproveNoteDialog] = useState(false);
  const [showEditNoteDialog, setShowEditNoteDialog] = useState(false);

  return (
    <Card className={classes.card} variant="outlined">
      <CardHeader className={classes.cardHeader}
        subheader={<>
          <PersonName person={userLookup(note.authorId)} />
          {note.status === NoteStatus.Draft ? " - DRAFT" : ""}
        </>} />
      <CardContent className={classes.cardContent}>
        <Typography variant="body2" component="p">
          {note.contents}
        </Typography>
      </CardContent>
      {note.status === NoteStatus.Draft &&
        <CardActions className={classes.cardActions}>
          <Button
            onClick={() => setShowDiscardNoteDialog(true)}
            variant="contained"
            size="small"
            color='secondary'
            className={classes.rightCardActionButton}
            startIcon={<DeleteForeverIcon />}>
            Discard
          </Button>
          <Button
            onClick={() => setShowEditNoteDialog(true)}
            variant="contained"
            size="small"
            className={classes.rightCardActionButton}
            startIcon={<EditIcon />}>
            Edit
          </Button>
          <Button
            onClick={() => setShowApproveNoteDialog(true)}
            variant="contained"
            size="small"
            className={classes.rightCardActionButton}
            startIcon={<CheckIcon />}>
            Approve
          </Button>
        </CardActions>}
      {(showDiscardNoteDialog && <DiscardNoteDialog familyId={familyId} note={note}
        onClose={() => setShowDiscardNoteDialog(false)} />) || null}
      {(showApproveNoteDialog && <ApproveNoteDialog familyId={familyId} note={note}
        onClose={() => setShowApproveNoteDialog(false)} />) || null}
      {(showEditNoteDialog && <AddEditNoteDialog familyId={familyId} note={note}
        onClose={() => setShowEditNoteDialog(false)} />) || null}
    </Card>
  );
}

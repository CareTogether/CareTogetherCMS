import { Card, CardContent, CardHeader, makeStyles, Typography } from '@material-ui/core';
import { format } from 'date-fns';
import React from 'react';
import { Note } from '../../GeneratedClient';
import { useUserLookup } from '../../Model/DirectoryModel';
import { PersonName } from './PersonName';

const useStyles = makeStyles((theme) => ({
  card: {
    minWidth: 275,
  },
  cardHeader: {
    paddingBottom: 0
  },
  cardContent: {
    paddingTop: 8,
    paddingBottom: 8
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
  rightCardAction: {
    marginLeft: 'auto !important'
  }
}));

type NoteCardProps = {
  note: Note;
};

export function NoteCard({ note }: NoteCardProps) {
  const classes = useStyles();

  const userLookup = useUserLookup();

  return (
    <Card>
      <CardHeader className={classes.cardHeader}
        subheader={<>
          <PersonName person={userLookup(note.authorId)} /> -&nbsp;
          {format(note.timestampUtc!, "MM/dd/yyyy hh:mm aa")}
        </>} />
      <CardContent className={classes.cardContent}>
        <Typography variant="body2" component="p">
          {note.contents}
        </Typography>
      </CardContent>
    </Card>
  );
}

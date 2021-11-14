import { Card, CardContent, CardHeader, makeStyles, Typography } from '@material-ui/core';
import React from 'react';
import { ArrangementState, Arrangement, CombinedFamilyInfo } from '../../GeneratedClient';
import { useFamilyLookup, usePersonLookup } from '../../Model/DirectoryModel';
import { PersonName } from '../Families/PersonName';
import { FamilyName } from '../Families/FamilyName';

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

type ArrangementCardProps = {
  partneringFamily: CombinedFamilyInfo;
  arrangement: Arrangement;
};

export function ArrangementCard({ partneringFamily, arrangement }: ArrangementCardProps) {
  const classes = useStyles();

  const familyLookup = useFamilyLookup();
  const personLookup = usePersonLookup();

  return (
    <Card>
      <CardHeader className={classes.cardHeader}
        subheader={<>
          {arrangement.arrangementType} -&nbsp;
          {ArrangementState[arrangement.state!]}
        </>} />
      <CardContent className={classes.cardContent}>
        <Typography variant="body2" component="div">
          <ul className={classes.cardList}>
            {/* TODO: Partnering family **individual adult** assignments (e.g., friending) */}
            {arrangement.partneringFamilyChildAssignments?.map(x => (
              <li><strong><PersonName person={personLookup(partneringFamily.family!.id, x.personId)} /></strong> - Child</li>
            ))}
            {arrangement.familyVolunteerAssignments?.map(x => (
              <li><FamilyName family={familyLookup(x.familyId)} /> - {x.arrangementFunction}</li>
            ))}
            {arrangement.individualVolunteerAssignments?.map(x => (
              <li><PersonName person={personLookup(x.familyId, x.personId)} /> - {x.arrangementFunction}</li>
            ))}
          </ul>
        </Typography>
      </CardContent>
    </Card>
  );
}

import { Card, CardActions, CardContent, CardHeader, Divider, IconButton, ListItemText, makeStyles, Menu, MenuItem, MenuList, Typography, useMediaQuery, useTheme } from '@material-ui/core';
import React, { useState } from 'react';
import { ArrangementPhase, Arrangement, CombinedFamilyInfo, ActionRequirement, Person } from '../../GeneratedClient';
import { useFamilyLookup, usePersonLookup } from '../../Model/DirectoryModel';
import { PersonName } from '../Families/PersonName';
import { FamilyName } from '../Families/FamilyName';
import { format } from 'date-fns';
import { CardInfoRow } from '../CardInfoRow';
import { useRecoilValue } from 'recoil';
import { policyData } from '../../Model/ConfigurationModel';
import AssignmentTurnedInIcon from '@material-ui/icons/AssignmentTurnedIn';
import { RecordArrangementStepDialog } from './RecordArrangementStepDialog';

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
  referralId: string;
  arrangement: Arrangement;
  summaryOnly?: boolean;
};

export function ArrangementCard({ partneringFamily, referralId, arrangement, summaryOnly }: ArrangementCardProps) {
  const classes = useStyles();

  const policy = useRecoilValue(policyData);
  
  const familyLookup = useFamilyLookup();
  const personLookup = usePersonLookup();
  
  const [arrangementRecordMenuAnchor, setArrangementRecordMenuAnchor] = useState<{anchor: Element, arrangement: Arrangement} | null>(null);
  const [recordArrangementStepParameter, setRecordArrangementStepParameter] = useState<{requirementName: string, requirementInfo: ActionRequirement, arrangement: Person} | null>(null);
  function selectRecordArrangementStep(requirementName: string) {
    setArrangementRecordMenuAnchor(null);
    const requirementInfo = policy.actionDefinitions![requirementName];
    setRecordArrangementStepParameter({requirementName, requirementInfo, arrangement});
  }
  const [showStartArrangementDialog, setShowStartArrangementDialog] = useState(false);
  const [showEndArrangementDialog, setShowEndArrangementDialog] = useState(false);

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.up('sm'));

  return (
    <Card>
      <CardHeader className={classes.cardHeader}
        subheader={<>
          {arrangement.arrangementType} -&nbsp;
          {ArrangementPhase[arrangement.phase!]}
        </>} />
      <CardContent className={classes.cardContent}>
        <Typography variant="body2" component="div">
          <ul className={classes.cardList}>
            <li><strong><PersonName person={personLookup(partneringFamily.family!.id, arrangement.partneringFamilyPersonId)} /></strong></li>
            {arrangement.familyVolunteerAssignments?.map(x => (
              <li key={`famVol-${x.familyId}`}><FamilyName family={familyLookup(x.familyId)} /> - {x.arrangementFunction}</li>
            ))}
            {arrangement.individualVolunteerAssignments?.map(x => (
              <li key={`indVol-${x.personId}`}><PersonName person={personLookup(x.familyId, x.personId)} /> - {x.arrangementFunction}</li>
            ))}
          </ul>
        </Typography>
        {!summaryOnly && (
          <>
            <Divider />
            <Typography variant="body2" component="div">
              <ul className={classes.cardList}>
                {arrangement.completedRequirements?.map((completed, i) => (
                  <li key={i}>
                    <CardInfoRow icon='✅'>
                      {completed.requirementName}&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                      {completed.completedAtUtc && <span style={{float:'right'}}>{format(completed.completedAtUtc, "MM/dd/yyyy hh:mm aa")}</span>}
                    </CardInfoRow>
                  </li>
                ))}
              </ul>
              <ul className={classes.cardList}>
                {arrangement.missingRequirements?.map((missingRequirementName, i) => (
                  <li key={i}>
                  <CardInfoRow icon='❌'>
                    {missingRequirementName}
                  </CardInfoRow>
                </li>
                ))}
              </ul>
            </Typography>
          </>
        )}
      </CardContent>
      {!summaryOnly && (
        <CardActions>
          <IconButton size="small" className={classes.rightCardAction}
            onClick={(event) => setArrangementRecordMenuAnchor({anchor: event.currentTarget, arrangement: arrangement})}>
            <AssignmentTurnedInIcon />
          </IconButton>
        </CardActions>
      )}
      <Menu id="arrangement-record-menu"
        anchorEl={arrangementRecordMenuAnchor?.anchor}
        keepMounted
        open={Boolean(arrangementRecordMenuAnchor)}
        onClose={() => setArrangementRecordMenuAnchor(null)}>
        <MenuList dense={isMobile}>
          {arrangement.missingRequirements?.map(missingRequirementName =>
            <MenuItem key={missingRequirementName} onClick={() => selectRecordArrangementStep(missingRequirementName)}>
              <ListItemText primary={missingRequirementName} />
            </MenuItem>
          )}
          {arrangement.phase === ArrangementPhase.ReadyToStart && (
            <MenuItem onClick={() => setShowStartArrangementDialog(true)}>
              <ListItemText primary="Start" />
            </MenuItem>
          )}
          {arrangement.phase === ArrangementPhase.Started && (
            <MenuItem onClick={() => setShowEndArrangementDialog(true)}>
              <ListItemText primary="End" />
            </MenuItem>
          )}
        </MenuList>
      </Menu>
      {(recordArrangementStepParameter && <RecordArrangementStepDialog partneringFamily={partneringFamily} referralId={referralId} arrangementId={arrangement.id!}
        requirementName={recordArrangementStepParameter.requirementName} stepActionRequirement={recordArrangementStepParameter.requirementInfo}
        onClose={() => setRecordArrangementStepParameter(null)} />) || null}
    </Card>
  );
}

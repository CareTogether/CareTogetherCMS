import { Card, CardActions, CardContent, CardHeader, Divider, IconButton, ListItemText, makeStyles, Menu, MenuItem, MenuList, Typography, useMediaQuery, useTheme } from '@material-ui/core';
import React, { useState } from 'react';
import { ArrangementPhase, Arrangement, CombinedFamilyInfo, ActionRequirement, Person, FunctionRequirement, VolunteerFunction, ChildInvolvement } from '../../GeneratedClient';
import { useFamilyLookup, usePersonLookup } from '../../Model/DirectoryModel';
import { PersonName } from '../Families/PersonName';
import { FamilyName } from '../Families/FamilyName';
import { format } from 'date-fns';
import { CardInfoRow } from '../CardInfoRow';
import { useRecoilValue } from 'recoil';
import { policyData } from '../../Model/ConfigurationModel';
import AssignmentTurnedInIcon from '@material-ui/icons/AssignmentTurnedIn';
import PersonPinCircleIcon from '@material-ui/icons/PersonPinCircle';
import { RecordArrangementStepDialog } from './RecordArrangementStepDialog';
import { StartArrangementDialog } from './StartArrangementDialog';
import { EndArrangementDialog } from './EndArrangementDialog';
import { AssignVolunteerFunctionDialog } from './AssignVolunteerFunctionDialog';
import { TrackChildLocationDialog } from './TrackChildLocationDialog';

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
  function closeStartArrangementDialog() {
    setArrangementRecordMenuAnchor(null);
    setShowStartArrangementDialog(false);
  }
  const [showEndArrangementDialog, setShowEndArrangementDialog] = useState(false);
  function closeEndArrangementDialog() {
    setArrangementRecordMenuAnchor(null);
    setShowEndArrangementDialog(false);
  }
  const [assignVolunteerFunctionParameter, setAssignVolunteerFunctionParameter] = useState<VolunteerFunction | null>(null);
  function selectAssignVolunteerFunction(volunteerFunction: VolunteerFunction | null) {
    setArrangementRecordMenuAnchor(null);
    setAssignVolunteerFunctionParameter(volunteerFunction);
  }
  const [showTrackChildLocationDialog, setShowTrackChildLocationDialog] = useState(false);

  const arrangementPolicy = policy.referralPolicy?.arrangementPolicies?.find(a => a.arrangementType === arrangement.arrangementType);
  const missingVolunteerFunctions = arrangementPolicy?.volunteerFunctions?.filter(volunteerFunction =>
    !arrangement.familyVolunteerAssignments?.some(x => x.arrangementFunction === volunteerFunction.arrangementFunction) &&
    !arrangement.individualVolunteerAssignments?.some(x => x.arrangementFunction === volunteerFunction.arrangementFunction));

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.up('sm'));

  return (
    <Card>
      <CardHeader className={classes.cardHeader}
        subheader={<>
          {arrangement.arrangementType} -&nbsp;
          {ArrangementPhase[arrangement.phase!]}
          {arrangement.phase === ArrangementPhase.Started && (<span> -&nbsp;{format(arrangement.startedAtUtc!, "MM/dd/yyyy hh:mm aa")}</span>)}
          {arrangement.phase === ArrangementPhase.Ended && (<span> -&nbsp;{format(arrangement.endedAtUtc!, "MM/dd/yyyy hh:mm aa")}</span>)}
        </>} />
      <CardContent className={classes.cardContent}>
        <Typography variant="body2" component="div">
          <ul className={classes.cardList}>
            <li style={{paddingBottom: 12}}>
              <strong><PersonName person={personLookup(partneringFamily.family!.id, arrangement.partneringFamilyPersonId)} /></strong>
              {arrangement.phase === ArrangementPhase.Started &&
                (arrangementPolicy?.childInvolvement === ChildInvolvement.ChildHousing || arrangementPolicy?.childInvolvement === ChildInvolvement.DaytimeChildCareOnly) && (
                <>
                  {summaryOnly
                    ? <PersonPinCircleIcon color='disabled' style={{float: 'right', marginLeft: 2, marginTop: 2}} />
                    : <IconButton size="small" style={{float: 'right', marginLeft: 2}}
                        onClick={(event) => setShowTrackChildLocationDialog(true)}>
                        <PersonPinCircleIcon />
                      </IconButton>}
                  <span style={{float: 'right', paddingTop: 4}}>{
                    (arrangement.childrenLocationHistory && arrangement.childrenLocationHistory.length > 0)
                    ? <FamilyName family={familyLookup(arrangement.childrenLocationHistory[arrangement.childrenLocationHistory.length - 1].childLocationFamilyId)} />
                    : <strong>Location unspecified</strong>
                  }</span>
                </>
              )}
            </li>
            <Divider style={{marginBottom: 10}} />
            {arrangement.familyVolunteerAssignments?.map(x => (
              <li key={`famVol-${x.arrangementFunction}-${x.familyId}`}><FamilyName family={familyLookup(x.familyId)} /> - {x.arrangementFunction}</li>
            ))}
            {arrangement.individualVolunteerAssignments?.map(x => (
              <li key={`indVol-${x.arrangementFunction}-${x.personId}`}><PersonName person={personLookup(x.familyId, x.personId)} /> - {x.arrangementFunction}</li>
            ))}
            {arrangement.phase !== ArrangementPhase.Ended && missingVolunteerFunctions?.map(x => (
              <li key={`missing-${x.arrangementFunction}`}>
                <CardInfoRow icon={x.requirement === FunctionRequirement.ZeroOrMore ? '⚠' : '❌'}>
                  {x.arrangementFunction}
                </CardInfoRow>
              </li>
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
                {arrangement.missingRequirements?.map((missingRequirement, i) => (
                  <li key={i}>
                    {missingRequirement.dueBy
                      ? <CardInfoRow icon='📅'>
                          {missingRequirement.actionName}&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                          <span style={{float:'right'}}>{format(missingRequirement.dueBy, "MM/dd/yyyy hh:mm aa")}</span>
                        </CardInfoRow>
                      : <CardInfoRow icon='❌'>
                          {missingRequirement.actionName}&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                          {missingRequirement.pastDueSince && <span style={{float:'right'}}>{format(missingRequirement.pastDueSince, "MM/dd/yyyy hh:mm aa")}</span>}
                        </CardInfoRow>}
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
          {arrangement.missingRequirements?.map(missingRequirement =>
            <MenuItem key={missingRequirement.actionName} onClick={() => selectRecordArrangementStep(missingRequirement.actionName!)}>
              <ListItemText primary={missingRequirement.actionName} />
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
          {arrangement.phase !== ArrangementPhase.Ended && <Divider />}
          {arrangement.phase !== ArrangementPhase.Ended && arrangementPolicy?.volunteerFunctions?.map(volunteerFunction => (
            <MenuItem key={volunteerFunction.arrangementFunction}
              onClick={() => selectAssignVolunteerFunction(volunteerFunction)}>
              <ListItemText primary={`Assign ${volunteerFunction.arrangementFunction}`} />
            </MenuItem>
          ))}
        </MenuList>
      </Menu>
      {showTrackChildLocationDialog && <TrackChildLocationDialog partneringFamily={partneringFamily} referralId={referralId} arrangement={arrangement}
        onClose={() => setShowTrackChildLocationDialog(false)} />}
      {(recordArrangementStepParameter && <RecordArrangementStepDialog partneringFamily={partneringFamily} referralId={referralId} arrangementId={arrangement.id!}
        requirementName={recordArrangementStepParameter.requirementName} stepActionRequirement={recordArrangementStepParameter.requirementInfo}
        onClose={() => setRecordArrangementStepParameter(null)} />) || null}
      {(showStartArrangementDialog && <StartArrangementDialog referralId={referralId} arrangement={arrangement}
        onClose={() => closeStartArrangementDialog()} />) || null}
      {(showEndArrangementDialog && <EndArrangementDialog referralId={referralId} arrangement={arrangement}
        onClose={() => closeEndArrangementDialog()} />) || null}
      {(assignVolunteerFunctionParameter && <AssignVolunteerFunctionDialog referralId={referralId} arrangement={arrangement} arrangementPolicy={arrangementPolicy!}
        volunteerFunction={assignVolunteerFunctionParameter}
        onClose={() => selectAssignVolunteerFunction(null)} />) || null}
    </Card>
  );
}

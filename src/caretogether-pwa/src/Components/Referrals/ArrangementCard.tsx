import { Card, CardActions, CardContent, CardHeader, Divider, IconButton, ListItemText, makeStyles, Menu, MenuItem, MenuList, Tooltip, Typography, useMediaQuery, useTheme } from '@material-ui/core';
import React, { useState } from 'react';
import { ArrangementPhase, Arrangement, CombinedFamilyInfo, ActionRequirement, Person, FunctionRequirement, ArrangementFunction, ChildInvolvement, CompletedRequirementInfo, ExemptedRequirementInfo, MissingArrangementRequirement } from '../../GeneratedClient';
import { useFamilyLookup, usePersonLookup, useUserLookup } from '../../Model/DirectoryModel';
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
import { AssignArrangementFunctionDialog } from './AssignArrangementFunctionDialog';
import { TrackChildLocationDialog } from './TrackChildLocationDialog';
import { ExemptArrangementRequirementDialog } from './ExemptArrangementRequirementDialog';
import { UnexemptArrangementRequirementDialog } from './UnexemptArrangementRequirementDialog';

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
  const userLookup = useUserLookup();
  
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
  const [assignArrangementFunctionParameter, setAssignArrangementFunctionParameter] = useState<ArrangementFunction | null>(null);
  function selectAssignArrangementFunction(arrangementFunction: ArrangementFunction | null) {
    setArrangementRecordMenuAnchor(null);
    setAssignArrangementFunctionParameter(arrangementFunction);
  }
  const [showTrackChildLocationDialog, setShowTrackChildLocationDialog] = useState(false);

  const [requirementMoreMenuAnchor, setRequirementMoreMenuAnchor] = useState<{anchor: Element, requirement: MissingArrangementRequirement | CompletedRequirementInfo | ExemptedRequirementInfo} | null>(null);
  const [exemptParameter, setExemptParameter] = useState<{requirement: MissingArrangementRequirement} | null>(null);
  function selectExempt(requirement: MissingArrangementRequirement) {
    setRequirementMoreMenuAnchor(null);
    setExemptParameter({requirement: requirement});
  }
  // const [markIncompleteParameter, setMarkIncompleteParameter] = useState<{completedRequirement: CompletedRequirementInfo} | null>(null);
  // function selectMarkIncomplete(completedRequirement: CompletedRequirementInfo) {
  //   setRequirementMoreMenuAnchor(null);
  //   setMarkIncompleteParameter({completedRequirement: completedRequirement});
  // }
  const [unexemptParameter, setUnexemptParameter] = useState<{exemptedRequirement: ExemptedRequirementInfo} | null>(null);
  function selectUnexempt(exemptedRequirement: ExemptedRequirementInfo) {
    setRequirementMoreMenuAnchor(null);
    setUnexemptParameter({exemptedRequirement: exemptedRequirement});
  }
  
  const arrangementPolicy = policy.referralPolicy?.arrangementPolicies?.find(a => a.arrangementType === arrangement.arrangementType);
  const missingVolunteerFunctions = arrangementPolicy?.arrangementFunctions?.filter(arrangementFunction =>
    !arrangement.familyVolunteerAssignments?.some(x => x.arrangementFunction === arrangementFunction.functionName) &&
    !arrangement.individualVolunteerAssignments?.some(x => x.arrangementFunction === arrangementFunction.functionName));

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
              <li key={`missing-${x.functionName}`}>
                <CardInfoRow icon={x.requirement === FunctionRequirement.ZeroOrMore ? '⚠' : '❌'}>
                  {x.functionName}
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
                  <li key={i}
                    onContextMenu={(e) => { e.preventDefault(); setRequirementMoreMenuAnchor({ anchor: e.currentTarget, requirement: completed }); }}>
                    <CardInfoRow icon='✅'>
                      <Tooltip title={<PersonName person={userLookup(completed.userId)} />}>
                        <span>
                          {completed.requirementName}&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                          {completed.completedAtUtc && <span style={{float:'right'}}>{format(completed.completedAtUtc, "MM/dd/yyyy hh:mm aa")}</span>}
                        </span>
                      </Tooltip>
                    </CardInfoRow>
                  </li>
                ))}
                {arrangement.exemptedRequirements?.map((exempted, i) => (
                  <li key={i}
                    onContextMenu={(e) => { e.preventDefault(); setRequirementMoreMenuAnchor({ anchor: e.currentTarget, requirement: exempted }); }}>
                    <CardInfoRow icon='🚫'>
                      <>
                        <span>{exempted.requirementName}&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span>
                        {exempted.exemptionExpiresAtUtc && <span style={{float:'right',marginRight:20}}>until {format(exempted.exemptionExpiresAtUtc, "MM/dd/yyyy")}</span>}
                        <br />
                        <span style={{lineHeight: '1.5em', paddingLeft:30, fontStyle: 'italic'}}>{exempted.additionalComments}</span>
                      </>
                    </CardInfoRow>
                  </li>
                ))}
              </ul>
              <ul className={classes.cardList}>
                {arrangement.missingRequirements?.map((missingRequirement, i) => (
                  <li key={i}
                    onContextMenu={(e) => { e.preventDefault(); setRequirementMoreMenuAnchor({ anchor: e.currentTarget, requirement: missingRequirement }); }}>
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
              <Menu id="arrangement-requirement-more-menu"
                anchorEl={requirementMoreMenuAnchor?.anchor}
                keepMounted
                open={Boolean(requirementMoreMenuAnchor)}
                onClose={() => setRequirementMoreMenuAnchor(null)}>
                { (requirementMoreMenuAnchor?.requirement instanceof MissingArrangementRequirement) &&
                  <MenuItem onClick={() => selectExempt(requirementMoreMenuAnchor?.requirement as MissingArrangementRequirement)}>Exempt</MenuItem>
                  }
                {/* { (requirementMoreMenuAnchor?.requirement instanceof CompletedRequirementInfo) &&
                  <MenuItem onClick={() => selectMarkIncomplete(requirementMoreMenuAnchor?.requirement as CompletedRequirementInfo)}>Mark Incomplete</MenuItem>
                  } */}
                { (requirementMoreMenuAnchor?.requirement instanceof ExemptedRequirementInfo) &&
                  <MenuItem onClick={() => selectUnexempt(requirementMoreMenuAnchor?.requirement as ExemptedRequirementInfo)}>Unexempt</MenuItem>
                  }
              </Menu>
              {(exemptParameter && <ExemptArrangementRequirementDialog partneringFamilyId={partneringFamily.family!.id!} referralId={referralId} arrangementId={arrangement.id!} requirement={exemptParameter.requirement}
                onClose={() => setExemptParameter(null)} />) || null}
              {/* {(markIncompleteParameter && <MarkArrangementStepIncompleteDialog partneringFamily={partneringFamily} referralId={referralId} arrangementId={arrangement.id!} completedRequirement={markIncompleteParameter.completedRequirement}
                onClose={() => setMarkIncompleteParameter(null)} />) || null} */}
              {(unexemptParameter && <UnexemptArrangementRequirementDialog partneringFamilyId={partneringFamily.family!.id!} referralId={referralId} arrangementId={arrangement.id!} exemptedRequirement={unexemptParameter.exemptedRequirement}
                onClose={() => setUnexemptParameter(null)} />) || null}
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
          {arrangement.missingRequirements
            ?.map(missingRequirement => missingRequirement.actionName!)
            ?.filter((value, index, self) => self.indexOf(value) === index)
            ?.map(missingRequirementActionName => (
            <MenuItem key={missingRequirementActionName} onClick={() => selectRecordArrangementStep(missingRequirementActionName)}>
              <ListItemText primary={missingRequirementActionName} />
            </MenuItem>
          ))}
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
          {arrangement.phase !== ArrangementPhase.Ended && arrangementPolicy?.arrangementFunctions?.map(arrangementFunction => (
            <MenuItem key={arrangementFunction.functionName}
              onClick={() => selectAssignArrangementFunction(arrangementFunction)}>
              <ListItemText primary={`Assign ${arrangementFunction.functionName}`} />
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
      {(assignArrangementFunctionParameter && <AssignArrangementFunctionDialog referralId={referralId} arrangement={arrangement} arrangementPolicy={arrangementPolicy!}
        arrangementFunction={assignArrangementFunctionParameter}
        onClose={() => selectAssignArrangementFunction(null)} />) || null}
    </Card>
  );
}

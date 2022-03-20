import {
  Button,
  Card,
  CardActions,
  CardContent,
  CardHeader,
  Divider,
  IconButton,
  ListItemText,
  Menu,
  MenuItem,
  MenuList,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import makeStyles from '@mui/styles/makeStyles';
import React, { useState } from 'react';
import { ArrangementPhase, Arrangement, CombinedFamilyInfo, FunctionRequirement, ArrangementFunction, ChildInvolvement } from '../../GeneratedClient';
import { useFamilyLookup, usePersonLookup } from '../../Model/DirectoryModel';
import { PersonName } from '../Families/PersonName';
import { FamilyName } from '../Families/FamilyName';
import { format, formatRelative } from 'date-fns';
import { IconRow } from '../IconRow';
import { useRecoilValue } from 'recoil';
import { policyData } from '../../Model/ConfigurationModel';
import AssignmentTurnedInIcon from '@mui/icons-material/AssignmentTurnedIn';
import PersonPinCircleIcon from '@mui/icons-material/PersonPinCircle';
import { StartArrangementDialog } from './StartArrangementDialog';
import { EndArrangementDialog } from './EndArrangementDialog';
import { AssignArrangementFunctionDialog } from './AssignArrangementFunctionDialog';
import { TrackChildLocationDialog } from './TrackChildLocationDialog';
import { MissingArrangementRequirementRow } from "../Requirements/MissingArrangementRequirementRow";
import { ExemptedRequirementRow } from "../Requirements/ExemptedRequirementRow";
import { CompletedRequirementRow } from "../Requirements/CompletedRequirementRow";
import { ArrangementContext } from "../Requirements/RequirementContext";
import { CancelArrangementDialog } from './CancelArrangementDialog';

type ArrangementPhaseSummaryProps = {
  phase: ArrangementPhase,
  requestedAtUtc: Date,
  startedAtUtc?: Date,
  endedAtUtc?: Date
}

function ArrangementPhaseSummary({ phase, requestedAtUtc, startedAtUtc, endedAtUtc }: ArrangementPhaseSummaryProps) {
  const completedPhaseColor = "#00838f";
  const currentPhaseColor = "#ffc400";
  const futurePhaseColor = "#ddd";
  return (
    <Tooltip title={<>
      <p>Requested at {format(requestedAtUtc, "M/d/yy h:mm a")}</p>
      {startedAtUtc && <p>Started at {format(startedAtUtc, "M/d/yy h:mm a")}</p>}
      {endedAtUtc && <p>Ended at {format(endedAtUtc, "M/d/yy h:mm a")}</p>}
    </>}>
      <div style={{display: "flex", height: 8, backgroundColor: "red"}}>
        <div style={{flexGrow: 1,
          backgroundColor:
            phase === ArrangementPhase.SettingUp ? currentPhaseColor
            : phase === ArrangementPhase.ReadyToStart ? completedPhaseColor
            : phase === ArrangementPhase.Started ? completedPhaseColor
            : completedPhaseColor}}>
        </div>
        <div style={{flexGrow: 1,
          backgroundColor:
            phase === ArrangementPhase.SettingUp ? futurePhaseColor
            : phase === ArrangementPhase.ReadyToStart ? futurePhaseColor
            : phase === ArrangementPhase.Started ? currentPhaseColor
            : completedPhaseColor}}>
        </div>
        <div style={{flexGrow: 1,
          backgroundColor:
            phase === ArrangementPhase.SettingUp ? futurePhaseColor
            : phase === ArrangementPhase.ReadyToStart ? futurePhaseColor
            : phase === ArrangementPhase.Started ? futurePhaseColor
            : completedPhaseColor /* TODO: Show as currentPhaseColor if any closeout requirements are missing */}}>
        </div>
      </div>
    </Tooltip>
  );
}

const useStyles = makeStyles((theme) => ({
  card: {
    minWidth: 275,
  },
  cardHeader: {
    paddingTop: 4,
    paddingBottom: 0,
    '& .MuiCardHeader-title': {
      fontSize: "16px"
    }
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
  const [showStartArrangementDialog, setShowStartArrangementDialog] = useState(false);
  const [showEndArrangementDialog, setShowEndArrangementDialog] = useState(false);
  const [showCancelArrangementDialog, setShowCancelArrangementDialog] = useState(false);
  const [assignArrangementFunctionParameter, setAssignArrangementFunctionParameter] = useState<ArrangementFunction | null>(null);
  function selectAssignArrangementFunction(arrangementFunction: ArrangementFunction | null) {
    setArrangementRecordMenuAnchor(null);
    setAssignArrangementFunctionParameter(arrangementFunction);
  }
  const [showTrackChildLocationDialog, setShowTrackChildLocationDialog] = useState(false);

  const requirementContext: ArrangementContext = {
    kind: "Arrangement",
    partneringFamilyId: partneringFamily.family!.id!,
    referralId: referralId,
    arrangementId: arrangement.id!
  };
  
  const arrangementPolicy = policy.referralPolicy?.arrangementPolicies?.find(a => a.arrangementType === arrangement.arrangementType);
  const missingVolunteerFunctions = arrangementPolicy?.arrangementFunctions?.filter(arrangementFunction =>
    !arrangement.familyVolunteerAssignments?.some(x => x.arrangementFunction === arrangementFunction.functionName) &&
    !arrangement.individualVolunteerAssignments?.some(x => x.arrangementFunction === arrangementFunction.functionName));

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.up('sm'));

  const now = new Date();

  return (
    <Card variant="outlined">
      <ArrangementPhaseSummary phase={arrangement.phase!}
        requestedAtUtc={arrangement.requestedAtUtc!} startedAtUtc={arrangement.startedAtUtc} endedAtUtc={arrangement.endedAtUtc} />
      <CardHeader className={classes.cardHeader}
        title={<>
          <span style={{fontWeight: "bold"}}>{arrangement.arrangementType}</span>
          {summaryOnly &&
            <span style={{marginLeft: 40, float: "right"}}>
              {arrangement.phase === ArrangementPhase.SettingUp ? "Setting up"
                : arrangement.phase === ArrangementPhase.ReadyToStart ? "Ready to start"
                : arrangement.phase === ArrangementPhase.Started ? `Started ${formatRelative(arrangement.startedAtUtc!, now)}`
                : `Ended ${formatRelative(arrangement.endedAtUtc!, now)}`}
            </span>}
          {!summaryOnly &&
            <span style={{marginLeft: 0, float: "right"}}>
              {arrangement.phase === ArrangementPhase.SettingUp ? "Setting up"
                : arrangement.phase === ArrangementPhase.ReadyToStart ?
                  <Button variant="contained" size="small"
                    onClick={() => setShowStartArrangementDialog(true)}>
                    Start
                  </Button>
                : arrangement.phase === ArrangementPhase.Started ?
                  <>
                    <span>Started {formatRelative(arrangement.startedAtUtc!, now)}</span>
                    <Button variant="outlined" size="small"
                      style={{marginLeft: 10}}
                      onClick={() => setShowEndArrangementDialog(true)}>
                      End
                    </Button>
                  </>
                : `Ended ${formatRelative(arrangement.endedAtUtc!, now)}`}
          </span>}
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
                    ? <>
                        <PersonPinCircleIcon color='disabled' style={{float: 'right', marginLeft: 2, marginTop: 2}} />
                        <span style={{float: 'right', paddingTop: 4}}>{
                          (arrangement.childrenLocationHistory && arrangement.childrenLocationHistory.length > 0)
                          ? <FamilyName family={familyLookup(arrangement.childrenLocationHistory[arrangement.childrenLocationHistory.length - 1].childLocationFamilyId)} />
                          : <strong>Location unspecified</strong>
                        }</span>
                      </>
                    : <Button size="large" variant="text"
                        style={{float: 'right', marginTop: -10, marginRight: -10, textTransform: "initial"}}
                        endIcon={<PersonPinCircleIcon />}
                        onClick={(event) => setShowTrackChildLocationDialog(true)}>
                        {(arrangement.childrenLocationHistory && arrangement.childrenLocationHistory.length > 0)
                          ? <FamilyName family={familyLookup(arrangement.childrenLocationHistory[arrangement.childrenLocationHistory.length - 1].childLocationFamilyId)} />
                          : <strong>Location unspecified</strong>}
                      </Button>}
                </>
              )}
            </li>
            <Divider style={{marginBottom: 10, marginTop: 2}} />
            {arrangement.familyVolunteerAssignments?.map(x => (
              <li key={`famVol-${x.arrangementFunction}-${x.familyId}`}><FamilyName family={familyLookup(x.familyId)} /> - {x.arrangementFunction}</li>
            ))}
            {arrangement.individualVolunteerAssignments?.map(x => (
              <li key={`indVol-${x.arrangementFunction}-${x.personId}`}><PersonName person={personLookup(x.familyId, x.personId)} /> - {x.arrangementFunction}</li>
            ))}
            {arrangement.phase !== ArrangementPhase.Ended && missingVolunteerFunctions?.map(x => (
              <li key={`missing-${x.functionName}`}>
                <IconRow icon={x.requirement === FunctionRequirement.ZeroOrMore ? '⚠' : '❌'}>
                  {x.functionName}
                </IconRow>
              </li>
            ))}
          </ul>
        </Typography>
        {!summaryOnly && (
          <>
            <Divider />
            <Typography variant="body2" component="div">
              {arrangement.completedRequirements?.map((completed, i) =>
                <CompletedRequirementRow key={`${completed.completedRequirementId}:${i}`} requirement={completed} context={requirementContext} />
              )}
              {arrangement.exemptedRequirements?.map((exempted, i) =>
                <ExemptedRequirementRow key={`${exempted.requirementName}:${i}`} requirement={exempted} context={requirementContext} />
              )}
              {arrangement.missingRequirements?.map((missing, i) =>
                <MissingArrangementRequirementRow key={`${missing}:${i}`} requirement={missing} context={requirementContext} />
              )}
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
      {(showStartArrangementDialog && <StartArrangementDialog referralId={referralId} arrangement={arrangement}
        onClose={() => setShowStartArrangementDialog(false)} />) || null}
      {(showEndArrangementDialog && <EndArrangementDialog referralId={referralId} arrangement={arrangement}
        onClose={() => setShowEndArrangementDialog(false)} />) || null}
      {(showCancelArrangementDialog && <CancelArrangementDialog referralId={referralId} arrangement={arrangement}
        onClose={() => setShowCancelArrangementDialog(false)} />) || null}
      {(assignArrangementFunctionParameter && <AssignArrangementFunctionDialog referralId={referralId} arrangement={arrangement} arrangementPolicy={arrangementPolicy!}
        arrangementFunction={assignArrangementFunctionParameter}
        onClose={() => selectAssignArrangementFunction(null)} />) || null}
    </Card>
  );
}

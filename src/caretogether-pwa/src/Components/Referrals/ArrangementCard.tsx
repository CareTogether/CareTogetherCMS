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
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import makeStyles from '@mui/styles/makeStyles';
import { useState } from 'react';
import { ArrangementPhase, Arrangement, CombinedFamilyInfo, FunctionRequirement, ArrangementFunction, ChildInvolvement } from '../../GeneratedClient';
import { useFamilyLookup, usePersonLookup } from '../../Model/DirectoryModel';
import { PersonName } from '../Families/PersonName';
import { FamilyName } from '../Families/FamilyName';
import { IconRow } from '../IconRow';
import { useRecoilValue } from 'recoil';
import { policyData } from '../../Model/ConfigurationModel';
import AssignmentTurnedInIcon from '@mui/icons-material/AssignmentTurnedIn';
import PersonPinCircleIcon from '@mui/icons-material/PersonPinCircle';
import { AssignArrangementFunctionDialog } from './AssignArrangementFunctionDialog';
import { TrackChildLocationDialog } from './TrackChildLocationDialog';
import { MissingArrangementRequirementRow } from "../Requirements/MissingArrangementRequirementRow";
import { ExemptedRequirementRow } from "../Requirements/ExemptedRequirementRow";
import { CompletedRequirementRow } from "../Requirements/CompletedRequirementRow";
import { ArrangementContext } from "../Requirements/RequirementContext";
import { ArrangementPhaseSummary } from './ArrangementPhaseSummary';
import { ArrangementCardTitle } from './ArrangementCardTitle';

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

  return (
    <Card variant="outlined">
      <ArrangementPhaseSummary phase={arrangement.phase!}
        requestedAtUtc={arrangement.requestedAtUtc!} startedAtUtc={arrangement.startedAtUtc} endedAtUtc={arrangement.endedAtUtc} />
      <CardHeader className={classes.cardHeader}
        title={<ArrangementCardTitle summaryOnly={summaryOnly} referralId={referralId} arrangement={arrangement} />} />
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
            {arrangement.phase !== ArrangementPhase.Cancelled &&
              <>
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
              </>}
          </ul>
        </Typography>
        {!summaryOnly && arrangement.phase !== ArrangementPhase.Cancelled && (
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
      {!summaryOnly && arrangement.phase !== ArrangementPhase.Cancelled && (
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
      {(assignArrangementFunctionParameter && <AssignArrangementFunctionDialog referralId={referralId} arrangement={arrangement} arrangementPolicy={arrangementPolicy!}
        arrangementFunction={assignArrangementFunctionParameter}
        onClose={() => selectAssignArrangementFunction(null)} />) || null}
    </Card>
  );
}

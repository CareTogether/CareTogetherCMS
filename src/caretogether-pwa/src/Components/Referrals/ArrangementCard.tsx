import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  Grid,
  Table,
  TableBody,
  TableContainer,
  Typography,
} from '@mui/material';
import makeStyles from '@mui/styles/makeStyles';
import { useState } from 'react';
import { ArrangementPhase, Arrangement, CombinedFamilyInfo, ChildInvolvement, FunctionRequirement } from '../../GeneratedClient';
import { useFamilyLookup, usePersonLookup } from '../../Model/DirectoryModel';
import { PersonName } from '../Families/PersonName';
import { FamilyName } from '../Families/FamilyName';
import { useRecoilValue } from 'recoil';
import { policyData } from '../../Model/ConfigurationModel';
import PersonPinCircleIcon from '@mui/icons-material/PersonPinCircle';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { TrackChildLocationDialog } from './TrackChildLocationDialog';
import { MissingArrangementRequirementRow } from "../Requirements/MissingArrangementRequirementRow";
import { ExemptedRequirementRow } from "../Requirements/ExemptedRequirementRow";
import { CompletedRequirementRow } from "../Requirements/CompletedRequirementRow";
import { ArrangementContext } from "../Requirements/RequirementContext";
import { ArrangementPhaseSummary } from './ArrangementPhaseSummary';
import { ArrangementCardTitle } from './ArrangementCardTitle';
import { ArrangementFunctionRow } from './ArrangementFunctionRow';
import { useCollapsed } from '../../useCollapsed';

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
    paddingBottom: 8,
    '&:last-child': {
      paddingBottom: 0
    }
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
  
  const [showTrackChildLocationDialog, setShowTrackChildLocationDialog] = useState(false);

  const [collapsed, setCollapsed] = useCollapsed(`arrangement-${referralId}-${arrangement.id}`, false);

  const requirementContext: ArrangementContext = {
    kind: "Arrangement",
    partneringFamilyId: partneringFamily.family!.id!,
    referralId: referralId,
    arrangementId: arrangement.id!
  };
  
  const arrangementPolicy = policy.referralPolicy?.arrangementPolicies?.find(a => a.arrangementType === arrangement.arrangementType);

  const missingAssignmentFunctions = arrangementPolicy?.arrangementFunctions?.filter(functionPolicy =>
    (functionPolicy.requirement === FunctionRequirement.ExactlyOne || functionPolicy.requirement === FunctionRequirement.OneOrMore) &&
    !arrangement.familyVolunteerAssignments?.some(x => x.arrangementFunction === functionPolicy.functionName) &&
    !arrangement.individualVolunteerAssignments?.some(x => x.arrangementFunction === functionPolicy.functionName))?.length || 0;

  return (
    <Card variant="outlined">
      <ArrangementPhaseSummary phase={arrangement.phase!}
        requestedAtUtc={arrangement.requestedAtUtc!} startedAtUtc={arrangement.startedAtUtc} endedAtUtc={arrangement.endedAtUtc} />
      <CardHeader className={classes.cardHeader}
        title={<ArrangementCardTitle summaryOnly={summaryOnly} referralId={referralId} arrangement={arrangement} />} />
      <CardContent className={classes.cardContent}>
        <Typography variant="body2" component="div">
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
                : <>
                    <Button size="large" variant="text"
                      style={{float: 'right', marginTop: -10, marginRight: -10, textTransform: "initial"}}
                      endIcon={<PersonPinCircleIcon />}
                      onClick={(event) => setShowTrackChildLocationDialog(true)}>
                      {(arrangement.childrenLocationHistory && arrangement.childrenLocationHistory.length > 0)
                        ? <FamilyName family={familyLookup(arrangement.childrenLocationHistory[arrangement.childrenLocationHistory.length - 1].childLocationFamilyId)} />
                        : <strong>Location unspecified</strong>}
                    </Button>
                    {showTrackChildLocationDialog && <TrackChildLocationDialog
                      partneringFamily={partneringFamily} referralId={referralId} arrangement={arrangement}
                      onClose={() => setShowTrackChildLocationDialog(false)} />}
                  </>}
            </>
          )}
        </Typography>
        {!summaryOnly && (
          <Accordion expanded={!collapsed} onChange={(event, isExpanded) => setCollapsed(!isExpanded)}
            variant="outlined" square disableGutters sx={{marginLeft:-2, marginRight:-2, border: 'none'}}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ marginTop:1, paddingTop:1, backgroundColor: "#0000000a" }}>
              <Grid container>
                <Grid item xs={4}>
                  <Badge color="success"
                    badgeContent={arrangement.completedRequirements?.length}>
                    ✅
                  </Badge>
                </Grid>
                <Grid item xs={4}>
                  <Badge color="warning"
                    badgeContent={arrangement.exemptedRequirements?.length}>
                    🚫
                  </Badge>
                </Grid>
                <Grid item xs={4}>
                  <Badge color="error"
                    badgeContent={missingAssignmentFunctions + (arrangement.missingRequirements?.length || 0)}>
                    ❌
                  </Badge>
                </Grid>
              </Grid>
            </AccordionSummary>
            <AccordionDetails>
              <TableContainer>
                <Table size="small">
                  <TableBody>
                    {arrangementPolicy?.arrangementFunctions?.map(functionPolicy =>
                      <ArrangementFunctionRow key={functionPolicy.functionName} summaryOnly={summaryOnly}
                        partneringFamilyId={partneringFamily.family!.id!} referralId={referralId} arrangement={arrangement}
                        arrangementPolicy={arrangementPolicy} functionPolicy={functionPolicy} />)}
                  </TableBody>
                </Table>
              </TableContainer>
              {arrangement.phase !== ArrangementPhase.Cancelled && (
                <>
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
            </AccordionDetails>
          </Accordion>
        )}
      </CardContent>
    </Card>
  );
}

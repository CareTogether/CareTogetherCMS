import {
  Button,
  Card,
  CardContent,
  CardHeader,
  Divider,
  Table,
  TableBody,
  TableContainer,
  Typography,
} from '@mui/material';
import makeStyles from '@mui/styles/makeStyles';
import { useState } from 'react';
import { ArrangementPhase, Arrangement, CombinedFamilyInfo, FunctionRequirement, ChildInvolvement } from '../../GeneratedClient';
import { useFamilyLookup, usePersonLookup } from '../../Model/DirectoryModel';
import { PersonName } from '../Families/PersonName';
import { FamilyName } from '../Families/FamilyName';
import { IconRow } from '../IconRow';
import { useRecoilValue } from 'recoil';
import { policyData } from '../../Model/ConfigurationModel';
import PersonPinCircleIcon from '@mui/icons-material/PersonPinCircle';
import { TrackChildLocationDialog } from './TrackChildLocationDialog';
import { MissingArrangementRequirementRow } from "../Requirements/MissingArrangementRequirementRow";
import { ExemptedRequirementRow } from "../Requirements/ExemptedRequirementRow";
import { CompletedRequirementRow } from "../Requirements/CompletedRequirementRow";
import { ArrangementContext } from "../Requirements/RequirementContext";
import { ArrangementPhaseSummary } from './ArrangementPhaseSummary';
import { ArrangementCardTitle } from './ArrangementCardTitle';
import { ArrangementFunctionRow } from './ArrangementFunctionRow';

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
        <TableContainer>
          <Table size="small">
            <TableBody>
              {arrangementPolicy?.arrangementFunctions?.map(functionPolicy =>
                <ArrangementFunctionRow key={functionPolicy.functionName}
                  partneringFamilyId={partneringFamily.family!.id!} referralId={referralId} arrangement={arrangement}
                  arrangementPolicy={arrangementPolicy} functionPolicy={functionPolicy} />)}
            </TableBody>
          </Table>
        </TableContainer>
        {!summaryOnly && arrangement.phase !== ArrangementPhase.Cancelled && (
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
      </CardContent>
    </Card>
  );
}

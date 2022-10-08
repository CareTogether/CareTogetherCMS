import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Badge,
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Grid,
  Table,
  TableBody,
  TableContainer,
  TextField,
  Typography,
} from '@mui/material';
import { useState } from 'react';
import { ArrangementPhase, Arrangement, CombinedFamilyInfo, ChildInvolvement, FunctionRequirement, Permission } from '../GeneratedClient';
import { useFamilyLookup, usePersonLookup } from '../Model/DirectoryModel';
import { PersonName } from '../Families/PersonName';
import { FamilyName } from '../Families/FamilyName';
import { useRecoilValue } from 'recoil';
import { policyData } from '../Model/ConfigurationModel';
import PersonPinCircleIcon from '@mui/icons-material/PersonPinCircle';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { TrackChildLocationDialog } from './TrackChildLocationDialog';
import { MissingArrangementRequirementRow } from "../Requirements/MissingArrangementRequirementRow";
import { ExemptedRequirementRow } from "../Requirements/ExemptedRequirementRow";
import { CompletedRequirementRow } from "../Requirements/CompletedRequirementRow";
import { ArrangementContext, RequirementContext } from "../Requirements/RequirementContext";
import { ArrangementPhaseSummary } from './ArrangementPhaseSummary';
import { ArrangementCardTitle } from './ArrangementCardTitle';
import { ArrangementFunctionRow } from './ArrangementFunctionRow';
import { useCollapsed } from '../Hooks/useCollapsed';
import { ArrangementComments } from './ArrangementComments';
import { useInlineEditor } from '../Hooks/useInlineEditor';
import { useReferralsModel } from '../Model/ReferralsModel';
import { useFamilyIdPermissions } from '../Model/SessionModel';
import { format } from 'date-fns';
import { DatePicker } from '@mui/x-date-pickers';

type ArrangementCardProps = {
  partneringFamily: CombinedFamilyInfo;
  referralId: string;
  arrangement: Arrangement;
  summaryOnly?: boolean;
};

export function ArrangementCard({ partneringFamily, referralId, arrangement, summaryOnly }: ArrangementCardProps) {
  const policy = useRecoilValue(policyData);
  const referralsModel = useReferralsModel();

  const familyLookup = useFamilyLookup();
  const personLookup = usePersonLookup();
  
  const [showTrackChildLocationDialog, setShowTrackChildLocationDialog] = useState(false);

  const [collapsed, setCollapsed] = useCollapsed(`arrangement-${referralId}-${arrangement.id}`, false);

  const partneringFamilyId = partneringFamily.family!.id!;
  const permissions = useFamilyIdPermissions(partneringFamilyId);

  const arrangementRequirementContext: ArrangementContext = {
    kind: "Arrangement",
    partneringFamilyId: partneringFamilyId,
    referralId: referralId,
    arrangementId: arrangement.id!
  };
  
  const arrangementPolicy = policy.referralPolicy?.arrangementPolicies?.find(a => a.arrangementType === arrangement.arrangementType);

  const plannedStartEditor = useInlineEditor(async value => {
    await referralsModel.planArrangementStart(partneringFamilyId, referralId, arrangement.id!, value);
  }, arrangement.plannedStartUtc || null);
  
  const plannedEndEditor = useInlineEditor(async value => {
    await referralsModel.planArrangementEnd(partneringFamilyId, referralId, arrangement.id!, value);
  }, arrangement.plannedEndUtc || null);

  function ArrangementPlanDates() {
    return (
      <Box>
        <span>Planned duration:&nbsp;</span>
        {(!summaryOnly && permissions(Permission.EditArrangement))
          ? <>
              {plannedStartEditor.editing
                ? <>
                    <DatePicker
                      label="Planned start"
                      value={plannedStartEditor.value}
                      onChange={(value: any) => plannedStartEditor.setValue(value)}
                      renderInput={(params: any) => <TextField size='small' margin='dense' {...params} />} />
                    {plannedStartEditor.cancelButton}
                    {plannedStartEditor.saveButton}
                  </>
                : <>
                    {plannedStartEditor.value ? format(plannedStartEditor.value, "M/d/yyyy") : "________"}
                    {plannedStartEditor.editButton}
                  </>}
              <span>&nbsp;to&nbsp;</span>
              {plannedEndEditor.editing
                ? <>
                    <DatePicker
                      label="Planned end"
                      value={plannedEndEditor.value}
                      onChange={(value: any) => plannedEndEditor.setValue(value)}
                      renderInput={(params: any) => <TextField size='small' margin='dense' {...params} />} />
                    {plannedEndEditor.cancelButton}
                    {plannedEndEditor.saveButton}
                  </>
                : <>
                    {plannedEndEditor.value ? format(plannedEndEditor.value, "M/d/yyyy") : "________"}
                    {plannedEndEditor.editButton}
                  </>}
            </>
          : <>
              {plannedStartEditor.value ? format(plannedStartEditor.value, "M/d/yyyy") : "________"}
              <span>&nbsp;to&nbsp;</span>
              {plannedEndEditor.value ? format(plannedEndEditor.value, "M/d/yyyy") : "________"}
            </>}
      </Box>
    )
  }
  
  const missingAssignmentFunctions = arrangementPolicy?.arrangementFunctions?.filter(functionPolicy =>
    (functionPolicy.requirement === FunctionRequirement.ExactlyOne || functionPolicy.requirement === FunctionRequirement.OneOrMore) &&
    !arrangement.familyVolunteerAssignments?.some(x => x.arrangementFunction === functionPolicy.functionName) &&
    !arrangement.individualVolunteerAssignments?.some(x => x.arrangementFunction === functionPolicy.functionName))?.length || 0;

  const assignmentsMissingVariants = arrangementPolicy?.arrangementFunctions?.filter(functionPolicy =>
    functionPolicy.variants && functionPolicy.variants.length > 0).map(functionPolicy =>
    (arrangement.familyVolunteerAssignments?.filter(fva =>
      fva.arrangementFunction === functionPolicy.functionName && !fva.arrangementFunctionVariant)?.length || 0) +
    (arrangement.individualVolunteerAssignments?.filter(iva =>
      iva.arrangementFunction === functionPolicy.functionName && !iva.arrangementFunctionVariant)?.length || 0)).reduce(
    (prev, curr) => prev + curr, 0) || 0;
  
  const completedRequirementsWithContext =
    (arrangement.completedRequirements || []).map(cr =>
      ({ completed: cr, context: arrangementRequirementContext as RequirementContext })).concat(
    (arrangement.familyVolunteerAssignments || []).flatMap(fva => (fva.completedRequirements || []).map(cr =>
      ({ completed: cr, context: {
        kind: "Family Volunteer Assignment",
        partneringFamilyId: partneringFamily.family!.id!,
        referralId: referralId,
        arrangementId: arrangement.id!,
        assignment: fva } as RequirementContext})))).concat(
    (arrangement.individualVolunteerAssignments || []).flatMap(iva => (iva.completedRequirements || []).map(cr =>
      ({ completed: cr, context: {
        kind: "Individual Volunteer Assignment",
        partneringFamilyId: partneringFamily.family!.id!,
        referralId: referralId,
        arrangementId: arrangement.id!,
        assignment: iva }}))));
  
  const exemptedRequirementsWithContext =
    (arrangement.exemptedRequirements || []).map(er =>
      ({ exempted: er, context: arrangementRequirementContext as RequirementContext })).concat(
    (arrangement.familyVolunteerAssignments || []).flatMap(fva => (fva.exemptedRequirements || []).map(er =>
      ({ exempted: er, context: {
        kind: "Family Volunteer Assignment",
        partneringFamilyId: partneringFamily.family!.id!,
        referralId: referralId,
        arrangementId: arrangement.id!,
        assignment: fva } as RequirementContext})))).concat(
    (arrangement.individualVolunteerAssignments || []).flatMap(iva => (iva.exemptedRequirements || []).map(er =>
      ({ exempted: er, context: {
        kind: "Individual Volunteer Assignment",
        partneringFamilyId: partneringFamily.family!.id!,
        referralId: referralId,
        arrangementId: arrangement.id!,
        assignment: iva }}))));

  const missingRequirementsWithContext = (arrangement.missingRequirements || []).map(requirement => {
    if (requirement.personId) {
      return { missing: requirement, context: {
        kind: "Individual Volunteer Assignment",
        partneringFamilyId: partneringFamily.family!.id!,
        referralId: referralId,
        arrangementId: arrangement.id!,
        assignment: arrangement.individualVolunteerAssignments!.find(iva =>
          iva.arrangementFunction === requirement.arrangementFunction &&
          iva.arrangementFunctionVariant === requirement.arrangementFunctionVariant &&
          iva.familyId === requirement.volunteerFamilyId &&
          iva.personId === requirement.personId)!
      } as RequirementContext };
    } else if (requirement.volunteerFamilyId) {
      return { missing: requirement, context: {
        kind: "Family Volunteer Assignment",
        partneringFamilyId: partneringFamily.family!.id!,
        referralId: referralId,
        arrangementId: arrangement.id!,
        assignment: arrangement.familyVolunteerAssignments!.find(iva =>
          iva.arrangementFunction === requirement.arrangementFunction &&
          iva.arrangementFunctionVariant === requirement.arrangementFunctionVariant &&
          iva.familyId === requirement.volunteerFamilyId)!
      } as RequirementContext };
    } else {
      return { missing: requirement, context: arrangementRequirementContext };
    }
  });
  
  return (
    <Card variant="outlined">
      <ArrangementPhaseSummary phase={arrangement.phase!}
        requestedAtUtc={arrangement.requestedAtUtc!} startedAtUtc={arrangement.startedAtUtc} endedAtUtc={arrangement.endedAtUtc} />
      <CardHeader sx={{
        paddingTop: 0.5,
        paddingBottom: 0,
        '& .MuiCardHeader-title': {
          fontSize: "16px"
        }
      }}
        title={<ArrangementCardTitle summaryOnly={summaryOnly}
        partneringFamilyId={partneringFamily.family!.id!} referralId={referralId} arrangement={arrangement} />} />
      <CardContent sx={{
        paddingTop: 1,
        paddingBottom: 1,
        '&:last-child': {
          paddingBottom: 0
        }
      }}>
        <Typography variant="body2" component="div">
          <strong><PersonName person={personLookup(partneringFamily.family!.id, arrangement.partneringFamilyPersonId)} /></strong>
          {(arrangement.phase === ArrangementPhase.Started || arrangement.phase === ArrangementPhase.Ended) &&
            (arrangementPolicy?.childInvolvement === ChildInvolvement.ChildHousing || arrangementPolicy?.childInvolvement === ChildInvolvement.DaytimeChildCareOnly) && (
            <>
              {summaryOnly
                ? <>
                    <PersonPinCircleIcon color='disabled' style={{float: 'right', marginLeft: 2, marginTop: 2}} />
                    <span style={{float: 'right', paddingTop: 4}}>{
                      (arrangement.childLocationHistory && arrangement.childLocationHistory.length > 0)
                      ? <FamilyName family={familyLookup(arrangement.childLocationHistory[arrangement.childLocationHistory.length - 1].childLocationFamilyId)} />
                      : <strong>Location unspecified</strong>
                    }</span>
                  </>
                : <>
                    <Button size="large" variant="text"
                      style={{float: 'right', marginTop: -10, marginRight: -10, textTransform: "initial"}}
                      endIcon={<PersonPinCircleIcon />}
                      onClick={(event) => setShowTrackChildLocationDialog(true)}>
                      {(arrangement.childLocationHistory && arrangement.childLocationHistory.length > 0)
                        ? <FamilyName family={familyLookup(arrangement.childLocationHistory[arrangement.childLocationHistory.length - 1].childLocationFamilyId)} />
                        : <strong>Location unspecified</strong>}
                    </Button>
                    {showTrackChildLocationDialog && <TrackChildLocationDialog
                      partneringFamily={partneringFamily} referralId={referralId} arrangement={arrangement}
                      onClose={() => setShowTrackChildLocationDialog(false)} />}
                  </>}
            </>
          )}
        </Typography>
        {(arrangement.phase === ArrangementPhase.SettingUp ||
          arrangement.phase === ArrangementPhase.ReadyToStart ||
          arrangement.phase === ArrangementPhase.Started) &&
          ArrangementPlanDates()}
        {!summaryOnly && (<>
          <ArrangementComments partneringFamily={partneringFamily} referralId={referralId} arrangement={arrangement} />
          <Accordion expanded={!collapsed} onChange={(event, isExpanded) => setCollapsed(!isExpanded)}
            variant="outlined" square disableGutters sx={{marginLeft:-2, marginRight:-2, border: 'none' }}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}
              sx={{ marginTop:1, paddingTop:1, backgroundColor: "#0000000a" }}>
              <Grid container>
                <Grid item xs={4}>
                  <Badge color="success"
                    badgeContent={completedRequirementsWithContext.length}>
                    ✅
                  </Badge>
                </Grid>
                <Grid item xs={4}>
                  <Badge color="warning"
                    badgeContent={exemptedRequirementsWithContext.length}>
                    🚫
                  </Badge>
                </Grid>
                <Grid item xs={4}>
                  <Badge color="error"
                    badgeContent={missingAssignmentFunctions + assignmentsMissingVariants + missingRequirementsWithContext.length}>
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
                    {completedRequirementsWithContext.map((x, i) =>
                      <CompletedRequirementRow key={`${x.completed.completedRequirementId}:${i}`} requirement={x.completed} context={x.context} />
                    )}
                    {exemptedRequirementsWithContext.map((x, i) =>
                      <ExemptedRequirementRow key={`${x.exempted.requirementName}:${i}`} requirement={x.exempted} context={x.context} />
                    )}
                    {missingRequirementsWithContext.map((x, i) =>
                      <MissingArrangementRequirementRow key={`${x.missing.actionName}:${i}`} requirement={x.missing} context={x.context} />
                    )}
                  </Typography>
                </>
              )}
            </AccordionDetails>
          </Accordion>
          </>
        )}
      </CardContent>
    </Card>
  );
}

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
  Divider,
  Grid,
  Stack,
  Table,
  TableBody,
  TableContainer,
  Typography,
} from '@mui/material';
import { useState } from 'react';
import { ArrangementPhase, Arrangement, CombinedFamilyInfo, ChildInvolvement, FunctionRequirement, Permission, ArrangementPolicy } from '../../GeneratedClient';
import { useFamilyLookup, usePersonLookup } from '../../Model/DirectoryModel';
import { PersonName } from '../../Families/PersonName';
import { FamilyName } from '../../Families/FamilyName';
import { useRecoilValue } from 'recoil';
import { policyData } from '../../Model/ConfigurationModel';
import PersonPinCircleIcon from '@mui/icons-material/PersonPinCircle';
import EventIcon from '@mui/icons-material/Event';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { TrackChildLocationDialog } from './TrackChildLocationDialog';
import { MissingArrangementRequirementRow } from "../../Requirements/MissingArrangementRequirementRow";
import { ExemptedRequirementRow } from "../../Requirements/ExemptedRequirementRow";
import { CompletedRequirementRow } from "../../Requirements/CompletedRequirementRow";
import { ArrangementContext, RequirementContext } from "../../Requirements/RequirementContext";
import { ArrangementPhaseSummary } from './ArrangementPhaseSummary';
import { ArrangementCardTitle } from './ArrangementCardTitle';
import { ArrangementFunctionRow } from './ArrangementFunctionRow';
import { useCollapsed } from '../../Hooks/useCollapsed';
import { ArrangementComments } from './ArrangementComments';
import { useInlineEditor } from '../../Hooks/useInlineEditor';
import { useReferralsModel } from '../../Model/ReferralsModel';
import { useFamilyIdPermissions } from '../../Model/SessionModel';
import { format } from 'date-fns';
import { DatePicker } from '@mui/x-date-pickers';
import { ArrangementReason } from './ArrangementReason';

interface ChildLocationIndicatorProps {
  partneringFamily: CombinedFamilyInfo
  referralId: string
  arrangement: Arrangement
  arrangementPolicy: ArrangementPolicy
  summaryOnly?: boolean
}
function ChildLocationIndicator({ partneringFamily, referralId, arrangement, summaryOnly }: ChildLocationIndicatorProps) {
  const familyLookup = useFamilyLookup();
  const [showTrackChildLocationDialog, setShowTrackChildLocationDialog] = useState(false);

  const currentLocation = arrangement.childLocationHistory && arrangement.childLocationHistory.length > 0
    ? arrangement.childLocationHistory[arrangement.childLocationHistory.length - 1]
    : null;

  // The planned location that is of interest is always the next one after the stay with the current family.
  // This means that, whether the current location change happened before, on, or after the corresponding planned change,
  // the next planned location to display will always be whatever other family the child is set to go to next.
  // The only times when this would not return a result would be when there are no further plans (result is null),
  // or when the only remaining planned change is already past-due. In that case, we need to instead find the
  // most recently missed planned change.
  const nextPlannedLocation = arrangement.childLocationPlan && arrangement.childLocationPlan.length > 0
    ? arrangement.childLocationPlan.find(entry =>
      currentLocation == null ||
      (entry.timestampUtc! > currentLocation.timestampUtc! &&
        entry.childLocationFamilyId !== currentLocation.childLocationFamilyId)) ||
    arrangement.childLocationPlan.slice().reverse().find(entry =>
      entry.childLocationFamilyId !== currentLocation?.childLocationFamilyId) ||
    null
    : null;

  const nextPlanIsPastDue = nextPlannedLocation && nextPlannedLocation.timestampUtc! < new Date();

  return (
    <>
      {summaryOnly
        ? <>
          <PersonPinCircleIcon color='disabled' style={{ float: 'right', marginLeft: 2, marginTop: 2 }} />
          <span style={{ float: 'right', paddingTop: 4 }}>{
            currentLocation
              ? <FamilyName family={familyLookup(currentLocation.childLocationFamilyId)} />
              : <strong>Location unspecified</strong>
          }</span>
        </>
        : <>
          <Button size="large" variant="text"
            style={{ float: 'right', marginTop: -10, marginRight: -10, textTransform: "initial" }}
            endIcon={<PersonPinCircleIcon />}
            onClick={() => setShowTrackChildLocationDialog(true)}>
            {currentLocation
              ? <FamilyName family={familyLookup(currentLocation.childLocationFamilyId)} />
              : <strong>Location unspecified</strong>}
          </Button>
          {showTrackChildLocationDialog && <TrackChildLocationDialog
            partneringFamily={partneringFamily} referralId={referralId} arrangement={arrangement}
            onClose={() => setShowTrackChildLocationDialog(false)} />}
        </>}
      <Typography variant={summaryOnly ? 'body2' : 'body1'} style={{ float: 'right', clear: 'right' }}>
        {nextPlannedLocation == null
          ? <span>No upcoming plans</span>
          : <span style={nextPlanIsPastDue ? { fontWeight: 'bold', color: 'red' } : {}}>
            {nextPlanIsPastDue && "PAST DUE - "}
            <FamilyName family={familyLookup(nextPlannedLocation.childLocationFamilyId)} />
            &nbsp;on {format(nextPlannedLocation.timestampUtc!, 'M/d/yyyy')}
          </span>}
        <EventIcon sx={{
          position: 'relative', top: 7,
          marginTop: summaryOnly ? -0.5 : -1, marginRight: summaryOnly ? 0 : -0.5, marginLeft: summaryOnly ? 0.25 : 1,
          color: nextPlanIsPastDue ? 'red' : summaryOnly ? '#00000042' : null
        }} />
      </Typography>
    </>
  );
}

interface ArrangementPlannedDurationProps {
  partneringFamily: CombinedFamilyInfo
  referralId: string
  arrangement: Arrangement
  summaryOnly?: boolean
}
function ArrangementPlannedDuration({ partneringFamily, referralId, arrangement, summaryOnly }: ArrangementPlannedDurationProps) {
  const referralsModel = useReferralsModel();

  const partneringFamilyId = partneringFamily.family!.id!;
  const permissions = useFamilyIdPermissions(partneringFamilyId);

  const plannedStartEditor = useInlineEditor(async value => {
    await referralsModel.planArrangementStart(partneringFamilyId, referralId, arrangement.id!, value);
  }, arrangement.plannedStartUtc || null);

  const plannedEndEditor = useInlineEditor(async value => {
    await referralsModel.planArrangementEnd(partneringFamilyId, referralId, arrangement.id!, value);
  }, arrangement.plannedEndUtc || null);

  return (
    <Stack direction='column' sx={{ clear: 'both' }}>
      <Box>
        <span>Planned start:&nbsp;</span>
        {(!summaryOnly && permissions(Permission.EditArrangement))
          ? plannedStartEditor.editing
            ? <>
              <DatePicker
                label="Planned start"
                value={plannedStartEditor.value}
                onChange={(value: Date | null) => plannedStartEditor.setValue(value)}
                slotProps={{ textField: { size: 'small', margin: 'dense' } }} />
              {plannedStartEditor.cancelButton}
              {plannedStartEditor.saveButton}
            </>
            : <>
              {plannedStartEditor.value ? format(plannedStartEditor.value, "M/d/yyyy") : "-"}
              {plannedStartEditor.editButton}
            </>
          : <>
            {plannedStartEditor.value ? format(plannedStartEditor.value, "M/d/yyyy") : "-"}
          </>
        }
      </Box>
      <Box>
        <span>Planned end:&nbsp;</span>
        {(!summaryOnly && permissions(Permission.EditArrangement))
          ? plannedEndEditor.editing
            ? <>
              <DatePicker
                label="Planned end"
                value={plannedEndEditor.value}
                onChange={(value: Date | null) => plannedEndEditor.setValue(value)}
                slotProps={{ textField: { size: 'small', margin: 'dense' } }} />
              {plannedEndEditor.cancelButton}
              {plannedEndEditor.saveButton}
            </>
            : <>
              {plannedEndEditor.value ? format(plannedEndEditor.value, "M/d/yyyy") : "-"}
              {plannedEndEditor.editButton}
            </>
          : <>
            {plannedEndEditor.value ? format(plannedEndEditor.value, "M/d/yyyy") : "-"}
          </>}
      </Box>
    </Stack>
  );
}

type ArrangementCardProps = {
  partneringFamily: CombinedFamilyInfo;
  referralId: string;
  arrangement: Arrangement;
  summaryOnly?: boolean;
};

export function ArrangementCard({ partneringFamily, referralId, arrangement, summaryOnly }: ArrangementCardProps) {
  const policy = useRecoilValue(policyData);
  const personLookup = usePersonLookup();

  const [collapsed, setCollapsed] = useCollapsed(`arrangement-${referralId}-${arrangement.id}`, false);

  const partneringFamilyId = partneringFamily.family!.id!;

  const arrangementRequirementContext: ArrangementContext = {
    kind: "Arrangement",
    partneringFamilyId: partneringFamilyId,
    referralId: referralId,
    arrangementId: arrangement.id!
  };

  const arrangementPolicy = policy.referralPolicy?.arrangementPolicies?.find(a => a.arrangementType === arrangement.arrangementType);

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
        ({
          completed: cr, context: {
            kind: "Family Volunteer Assignment",
            partneringFamilyId: partneringFamily.family!.id!,
            referralId: referralId,
            arrangementId: arrangement.id!,
            assignment: fva
          } as RequirementContext
        })))).concat(
          (arrangement.individualVolunteerAssignments || []).flatMap(iva => (iva.completedRequirements || []).map(cr =>
          ({
            completed: cr, context: {
              kind: "Individual Volunteer Assignment",
              partneringFamilyId: partneringFamily.family!.id!,
              referralId: referralId,
              arrangementId: arrangement.id!,
              assignment: iva
            }
          }))));

  const exemptedRequirementsWithContext =
    (arrangement.exemptedRequirements || []).map(er =>
      ({ exempted: er, context: arrangementRequirementContext as RequirementContext })).concat(
        (arrangement.familyVolunteerAssignments || []).flatMap(fva => (fva.exemptedRequirements || []).map(er =>
        ({
          exempted: er, context: {
            kind: "Family Volunteer Assignment",
            partneringFamilyId: partneringFamily.family!.id!,
            referralId: referralId,
            arrangementId: arrangement.id!,
            assignment: fva
          } as RequirementContext
        })))).concat(
          (arrangement.individualVolunteerAssignments || []).flatMap(iva => (iva.exemptedRequirements || []).map(er =>
          ({
            exempted: er, context: {
              kind: "Individual Volunteer Assignment",
              partneringFamilyId: partneringFamily.family!.id!,
              referralId: referralId,
              arrangementId: arrangement.id!,
              assignment: iva
            }
          }))));

  const missingRequirementsWithContext = (arrangement.missingRequirements || []).map(requirement => {
    if (requirement.personId) {
      return {
        missing: requirement, context: {
          kind: "Individual Volunteer Assignment",
          partneringFamilyId: partneringFamily.family!.id!,
          referralId: referralId,
          arrangementId: arrangement.id!,
          assignment: arrangement.individualVolunteerAssignments!.find(iva =>
            iva.arrangementFunction === requirement.arrangementFunction &&
            iva.arrangementFunctionVariant === requirement.arrangementFunctionVariant &&
            iva.familyId === requirement.volunteerFamilyId &&
            iva.personId === requirement.personId)!
        } as RequirementContext
      };
    } else if (requirement.volunteerFamilyId) {
      return {
        missing: requirement, context: {
          kind: "Family Volunteer Assignment",
          partneringFamilyId: partneringFamily.family!.id!,
          referralId: referralId,
          arrangementId: arrangement.id!,
          assignment: arrangement.familyVolunteerAssignments!.find(iva =>
            iva.arrangementFunction === requirement.arrangementFunction &&
            iva.arrangementFunctionVariant === requirement.arrangementFunctionVariant &&
            iva.familyId === requirement.volunteerFamilyId)!
        } as RequirementContext
      };
    } else {
      return { missing: requirement, context: arrangementRequirementContext };
    }
  });

  // Sort the missing requirements so that all the items with due dates are shown after
  // the items without due dates, and so that all items with due dates are shown in
  // chronological order by due date.

  const itemsWithoutDueDates = missingRequirementsWithContext.filter(item =>
    !item.missing.dueBy &&
    !item.missing.pastDueSince
  );

  const itemsWithDueDates = missingRequirementsWithContext.filter(item =>
    item.missing.dueBy || item.missing.pastDueSince
  );
  
  itemsWithDueDates.sort((a, b) => {
    const dateA = a.missing.pastDueSince || a.missing.dueBy || '2000-01-01T00:00:00Z';
    const dateB = b.missing.pastDueSince || b.missing.dueBy || '2000-01-01T00:00:00Z';
    return new Date(dateA).getTime() - new Date(dateB).getTime()
  });

  const mergedArray = [...itemsWithoutDueDates, ...itemsWithDueDates];

  const upcomingRequirementsCount = arrangement.missingRequirements?.filter(missingRequirement =>
    missingRequirement.dueBy /* Determine if this is an "upcoming" requirement */).length || 0;

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
        <Typography variant="body2" component="div" sx={{ mb: 1 }}>
          <strong><PersonName person={personLookup(partneringFamily.family!.id, arrangement.partneringFamilyPersonId)} /></strong>
          {(arrangementPolicy?.childInvolvement === ChildInvolvement.ChildHousing || arrangementPolicy?.childInvolvement === ChildInvolvement.DaytimeChildCareOnly) &&
            <ChildLocationIndicator partneringFamily={partneringFamily} referralId={referralId} arrangement={arrangement}
              arrangementPolicy={arrangementPolicy} summaryOnly={summaryOnly} />}
        </Typography>
        {(arrangement.phase === ArrangementPhase.SettingUp ||
          arrangement.phase === ArrangementPhase.ReadyToStart ||
          arrangement.phase === ArrangementPhase.Started) &&
          <ArrangementPlannedDuration partneringFamily={partneringFamily} referralId={referralId} arrangement={arrangement}
            summaryOnly={summaryOnly} />}
        {!summaryOnly && (<>
          <ArrangementReason partneringFamily={partneringFamily} referralId={referralId} arrangement={arrangement} />
          <Divider />
          <ArrangementComments partneringFamily={partneringFamily} referralId={referralId} arrangement={arrangement} />
          <Accordion expanded={!collapsed} onChange={(_event, isExpanded) => setCollapsed(!isExpanded)}
            variant="outlined" square disableGutters sx={{ marginLeft: -2, marginRight: -2, border: 'none' }}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}
              sx={{ marginTop: 1, paddingTop: 1, backgroundColor: "#0000000a" }}>
              <Grid container>
                <Grid item xs={3}>
                  <Badge color="success"
                    badgeContent={completedRequirementsWithContext.length}>
                    ✅
                  </Badge>
                </Grid>
                <Grid item xs={3}>
                  <Badge color="warning"
                    badgeContent={exemptedRequirementsWithContext.length}>
                    🚫
                  </Badge>
                </Grid>
                <Grid item xs={3}>
                  <Badge color="error"
                    badgeContent={missingAssignmentFunctions + assignmentsMissingVariants + missingRequirementsWithContext.length - upcomingRequirementsCount}>
                    ❌
                  </Badge>
                </Grid>
                <Grid item xs={3}>
                  <Badge color="info"
                    badgeContent={upcomingRequirementsCount}>
                    📅
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
                    
                    {mergedArray.map((x, i) =>
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

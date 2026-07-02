import {
  AddCircle as AddCircleIcon,
  ExpandLess,
  ExpandMore,
} from '@mui/icons-material';
import Grid from '../../../Generic/GridLegacyCompat';
import {
  Box,
  Button,
  Chip,
  Collapse,
  IconButton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material';
import {
  Arrangement,
  ArrangementFunction,
  ArrangementPhase,
  ArrangementPolicy,
  ChildInvolvement,
  CombinedFamilyInfo,
  FamilyVolunteerAssignment,
  FunctionRequirement,
  IndividualVolunteerAssignment,
  Permission,
  V1Case,
} from '../../../GeneratedClient';
import { CreateArrangementDialog } from '../CreateArrangementDialog';
import { Fragment, useMemo, useRef, useState } from 'react';
import { useRecoilValue } from 'recoil';
import { policyData } from '../../../Model/ConfigurationModel';
import { getFilteredArrangements } from './getFilteredArrangements';
import { useScrollToArrangement } from './useScrollToArrangement';
import { WideTableContainer } from '../../../Utilities/WideTableContainer';
import { containedStickyHeaderTableSx } from '../../../Utilities/stickyHeaderTableSx';
import { ArrangementPhaseSummary } from '../ArrangementPhaseSummary';
import { PersonName, personNameString } from '../../../Families/PersonName';
import { FamilyName } from '../../../Families/FamilyName';
import {
  useFamilyLookup,
  usePersonLookup,
} from '../../../Model/DirectoryModel';
import { StartArrangementDialog } from '../StartArrangementDialog';
import { EndArrangementDialog } from '../EndArrangementDialog';
import { CancelArrangementDialog } from '../CancelArrangementDialog';
import { ReopenArrangementDialog } from '../ReopenArrangementDialog';
import { DeleteArrangementDialog } from '../DeleteArrangementDialog';
import { format } from 'date-fns';
import {
  ArrangementRowV2,
  buildArrangementRowsV2,
} from '../arrangementViewModel';
import { ArrangementDetailsDrawerV2 } from '../ArrangementDetailsDrawerV2';
import { useRequirementContextData } from '../useRequirementContextData';
import { MissingArrangementRequirementRow } from '../../../Requirements/MissingArrangementRequirementRow';
import { CompletedRequirementRow } from '../../../Requirements/CompletedRequirementRow';
import { ExemptedRequirementRow } from '../../../Requirements/ExemptedRequirementRow';
import { AssignArrangementFunctionDialog } from '../AssignArrangementFunctionDialog';
import { UnassignArrangementFunctionDialog } from '../UnassignArrangementFunctionDialog';
import { useDialogHandle } from '../../../Hooks/useDialogHandle';
import { useFamilyIdPermissions } from '../../../Model/SessionModel';

type ArrangementSectionProps = {
  v1Case: V1Case;
  family: CombinedFamilyInfo;
  permissions: (permission: Permission) => boolean;
  hideTitle?: boolean;
  scrollToArrangementId?: string;
};

type ArrangementTableRowProps = {
  arrangement: Arrangement;
  arrangementRow: ArrangementRowV2;
  arrangementPolicy?: ArrangementPolicy;
  family: CombinedFamilyInfo;
  permissions: (permission: Permission) => boolean;
  rowRef: (element: HTMLTableRowElement | null) => void;
  v1CaseId: string;
  expanded: boolean;
  onOpenDetails: (row: ArrangementRowV2) => void;
  onToggleExpanded: () => void;
};

function arrangementPhaseLabel(phase?: ArrangementPhase) {
  if (phase === ArrangementPhase.SettingUp) return 'Setting up';
  if (phase === ArrangementPhase.ReadyToStart) return 'Ready to start';
  if (phase === ArrangementPhase.Started) return 'Started';
  if (phase === ArrangementPhase.Ended) return 'Ended';
  if (phase === ArrangementPhase.Cancelled) return 'Cancelled';
  return 'Unknown';
}

function arrangementPhaseColor(phase?: ArrangementPhase) {
  if (phase === ArrangementPhase.Ended) return 'success';
  if (phase === ArrangementPhase.Cancelled) return 'default';
  if (phase === ArrangementPhase.Started) return 'info';
  return 'warning';
}

function usesChildLocation(arrangementPolicy?: ArrangementPolicy) {
  return (
    arrangementPolicy?.childInvolvement === ChildInvolvement.ChildHousing ||
    arrangementPolicy?.childInvolvement === ChildInvolvement.DaytimeChildCareOnly
  );
}

function formatArrangementDate(date?: Date) {
  return date ? format(date, 'M/d/yyyy') : '-';
}

function ArrangementDurationSummary({
  arrangement,
}: {
  arrangement: Arrangement;
}) {
  const startLabel = arrangement.startedAtUtc ? 'Started' : 'Planned start';
  const startDate = arrangement.startedAtUtc ?? arrangement.plannedStartUtc;
  const endLabel = arrangement.endedAtUtc ? 'Ended' : 'Planned end';
  const endDate = arrangement.endedAtUtc ?? arrangement.plannedEndUtc;

  return (
    <Stack className="ph-unmask" spacing={0.5}>
      <Box>
        <Typography
          component="span"
          variant="caption"
          color="text.secondary"
        >
          {startLabel}:&nbsp;
        </Typography>
        <Typography component="span" variant="body2">
          {formatArrangementDate(startDate)}
        </Typography>
      </Box>
      <Box>
        <Typography
          component="span"
          variant="caption"
          color="text.secondary"
        >
          {endLabel}:&nbsp;
        </Typography>
        <Typography component="span" variant="body2">
          {formatArrangementDate(endDate)}
        </Typography>
      </Box>
    </Stack>
  );
}

function ArrangementLocationSummary({
  arrangement,
}: {
  arrangement: Arrangement;
}) {
  const familyLookup = useFamilyLookup();
  const currentLocation =
    arrangement.childLocationHistory &&
    arrangement.childLocationHistory.length > 0
      ? arrangement.childLocationHistory[
          arrangement.childLocationHistory.length - 1
        ]
      : null;
  const nextPlannedLocation =
    arrangement.childLocationPlan && arrangement.childLocationPlan.length > 0
      ? arrangement.childLocationPlan.find(
          (entry) =>
            currentLocation == null ||
            (entry.timestampUtc! > currentLocation.timestampUtc! &&
              entry.childLocationFamilyId !==
                currentLocation.childLocationFamilyId)
        ) ||
        arrangement.childLocationPlan
          .slice()
          .reverse()
          .find(
            (entry) =>
              entry.childLocationFamilyId !== currentLocation?.childLocationFamilyId
          ) ||
        null
      : null;
  const nextPlanIsPastDue =
    nextPlannedLocation && nextPlannedLocation.timestampUtc! < new Date();

  return (
    <Stack spacing={1}>
      <Box>
        <Typography variant="caption" color="text.secondary">
          Current Location
        </Typography>
        <Typography variant="body2">
          {currentLocation ? (
            <FamilyName
              family={familyLookup(currentLocation.childLocationFamilyId)}
            />
          ) : (
            <strong>Location unspecified</strong>
          )}
        </Typography>
      </Box>
      {nextPlannedLocation && (
        <Box>
          <Typography variant="caption" color="text.secondary">
            Next Planned Location
          </Typography>
          <Typography
            variant="body2"
            sx={{
              color: nextPlanIsPastDue ? 'error.main' : undefined,
              fontWeight: nextPlanIsPastDue ? 600 : undefined,
            }}
          >
            {nextPlanIsPastDue && 'PAST DUE - '}
            <FamilyName
              family={familyLookup(nextPlannedLocation.childLocationFamilyId)}
            />
            &nbsp;on {format(nextPlannedLocation.timestampUtc!, 'M/d/yyyy')}
          </Typography>
        </Box>
      )}
    </Stack>
  );
}

function ArrangementActions({
  arrangement,
  permissions,
  v1CaseId,
}: {
  arrangement: Arrangement;
  permissions: (permission: Permission) => boolean;
  v1CaseId: string;
}) {
  const [showStartArrangementDialog, setShowStartArrangementDialog] =
    useState(false);
  const [showEndArrangementDialog, setShowEndArrangementDialog] =
    useState(false);
  const [showCancelArrangementDialog, setShowCancelArrangementDialog] =
    useState(false);
  const [showReopenArrangementDialog, setShowReopenArrangementDialog] =
    useState(false);
  const [showDeleteArrangementDialog, setShowDeleteArrangementDialog] =
    useState(false);

  const canEdit = permissions(Permission.EditArrangement);
  const canDelete = permissions(Permission.DeleteArrangement);

  return (
    <>
      <Stack
        direction="row"
        spacing={1}
        sx={{ justifyContent: 'flex-end' }}
        onClick={(event) => event.stopPropagation()}
      >
        {arrangement.phase === ArrangementPhase.SettingUp && canEdit && (
          <Button
            variant="outlined"
            size="small"
            onClick={() => setShowCancelArrangementDialog(true)}
          >
            Cancel
          </Button>
        )}
        {arrangement.phase === ArrangementPhase.ReadyToStart && canEdit && (
          <>
            <Button
              variant="outlined"
              size="small"
              onClick={() => setShowCancelArrangementDialog(true)}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              size="small"
              onClick={() => setShowStartArrangementDialog(true)}
            >
              Start
            </Button>
          </>
        )}
        {arrangement.phase === ArrangementPhase.Started && canEdit && (
          <Button
            variant="outlined"
            size="small"
            onClick={() => setShowEndArrangementDialog(true)}
          >
            End
          </Button>
        )}
        {arrangement.phase === ArrangementPhase.Ended && canEdit && (
          <Button
            variant="outlined"
            size="small"
            onClick={() => setShowReopenArrangementDialog(true)}
          >
            Reopen
          </Button>
        )}
        {canDelete && (
          <Button
            variant="outlined"
            size="small"
            color="warning"
            onClick={() => setShowDeleteArrangementDialog(true)}
          >
            Delete
          </Button>
        )}
      </Stack>
      {showStartArrangementDialog && (
        <StartArrangementDialog
          v1CaseId={v1CaseId}
          arrangement={arrangement}
          onClose={() => setShowStartArrangementDialog(false)}
        />
      )}
      {showEndArrangementDialog && (
        <EndArrangementDialog
          v1CaseId={v1CaseId}
          arrangement={arrangement}
          onClose={() => setShowEndArrangementDialog(false)}
        />
      )}
      {showCancelArrangementDialog && (
        <CancelArrangementDialog
          v1CaseId={v1CaseId}
          arrangement={arrangement}
          onClose={() => setShowCancelArrangementDialog(false)}
        />
      )}
      {showReopenArrangementDialog && (
        <ReopenArrangementDialog
          v1CaseId={v1CaseId}
          arrangement={arrangement}
          onClose={() => setShowReopenArrangementDialog(false)}
        />
      )}
      {showDeleteArrangementDialog && (
        <DeleteArrangementDialog
          v1CaseId={v1CaseId}
          arrangement={arrangement}
          onClose={() => setShowDeleteArrangementDialog(false)}
        />
      )}
    </>
  );
}

function ArrangementRequirementsChecklist({
  row,
}: {
  row: ArrangementRowV2;
}) {
  const {
    completedRequirementsWithContext,
    exemptedRequirementsWithContext,
    mergedArray,
  } = useRequirementContextData(
    row.source,
    row.arrangementPolicy,
    row.partneringFamily,
    row.v1Case.id!
  );
  const hasRequirements =
    mergedArray.length > 0 ||
    completedRequirementsWithContext.length > 0 ||
    exemptedRequirementsWithContext.length > 0;

  if (!hasRequirements) {
    return (
      <Typography color="text.secondary" variant="body2">
        No arrangement requirements.
      </Typography>
    );
  }

  return (
    <Typography className="ph-unmask" variant="body2" component="div">
      {completedRequirementsWithContext.map(({ completed, context }, index) => (
        <CompletedRequirementRow
          key={`${completed.requirementName}:${index}`}
          context={context}
          requirement={completed}
        />
      ))}
      {exemptedRequirementsWithContext.map(({ context, exempted }, index) => (
        <ExemptedRequirementRow
          key={`${exempted.requirementName}:${index}`}
          context={context}
          requirement={exempted}
        />
      ))}
      {mergedArray.map(({ context, missing }, index) => (
        <MissingArrangementRequirementRow
          key={`${missing.action?.actionName}:${index}`}
          context={context}
          requirement={missing}
        />
      ))}
    </Typography>
  );
}

function ArrangementFunctionsChecklist({ row }: { row: ArrangementRowV2 }) {
  const arrangementFunctions = row.arrangementPolicy?.arrangementFunctions ?? [];

  if (arrangementFunctions.length === 0) {
    return (
      <Typography color="text.secondary" variant="body2">
        No functions configured.
      </Typography>
    );
  }

  return (
    <Stack spacing={0}>
      {arrangementFunctions.map((functionPolicy) => (
        <ArrangementFunctionAssignmentList
          key={functionPolicy.functionName}
          row={row}
          functionPolicy={functionPolicy}
        />
      ))}
    </Stack>
  );
}

function ArrangementFunctionAssignmentList({
  row,
  functionPolicy,
}: {
  row: ArrangementRowV2;
  functionPolicy: ArrangementFunction;
}) {
  const assignments = [
    ...(row.source.familyVolunteerAssignments ?? []),
    ...(row.source.individualVolunteerAssignments ?? []),
  ].filter(
    (assignment) =>
      assignment.arrangementFunction === functionPolicy.functionName
  ) as Array<FamilyVolunteerAssignment | IndividualVolunteerAssignment>;

  if (assignments.length === 0) {
    return (
      <ArrangementFunctionAssignmentRow
        row={row}
        functionPolicy={functionPolicy}
      />
    );
  }

  return (
    <>
      {assignments.map((assignment) => (
        <ArrangementFunctionAssignmentRow
          key={JSON.stringify(assignment)}
          row={row}
          functionPolicy={functionPolicy}
          assignment={assignment}
        />
      ))}
    </>
  );
}

function ArrangementFunctionAssignmentRow({
  row,
  functionPolicy,
  assignment,
}: {
  row: ArrangementRowV2;
  functionPolicy: ArrangementFunction;
  assignment?: FamilyVolunteerAssignment | IndividualVolunteerAssignment;
}) {
  const addAssignmentDialogHandle = useDialogHandle();
  const removeAssignmentDialogHandle = useDialogHandle();
  const partneringFamilyId = row.partneringFamily.family!.id!;
  const permissions = useFamilyIdPermissions(partneringFamilyId);
  const canEditAssignments = permissions(Permission.EditAssignments);
  const isAssigned = assignment !== undefined;
  const missingRequiredAssignment =
    !isAssigned &&
    functionPolicy.requirement !== FunctionRequirement.ZeroOrMore;
  const isMissingVariant =
    isAssigned &&
    functionPolicy.variants &&
    functionPolicy.variants.length > 0 &&
    !assignment.arrangementFunctionVariant;

  const openAssignmentWorkflow = () => {
    if (!canEditAssignments) return;

    if (assignment) {
      removeAssignmentDialogHandle.openDialog();
      return;
    }

    addAssignmentDialogHandle.openDialog();
  };

  return (
    <>
      <Box
        className="ph-unmask"
        onClick={(event) => {
          event.stopPropagation();
          openAssignmentWorkflow();
        }}
        sx={{
          borderBottom: 1,
          borderColor: 'divider',
          cursor: canEditAssignments ? 'pointer' : 'default',
          display: 'grid',
          gap: { xs: 0.25, sm: 2 },
          gridTemplateColumns: { xs: '1fr', sm: '220px minmax(0, 1fr)' },
          px: 0.5,
          py: 0.75,
          '&:hover': canEditAssignments
            ? { backgroundColor: 'action.hover' }
            : undefined,
          '&:last-of-type': { borderBottom: 0 },
        }}
      >
        <Typography variant="body2" sx={{ fontWeight: 600 }}>
          {functionPolicy.functionName}
        </Typography>
        <Box>
          {assignment ? (
            <AssignmentLabel assignment={assignment} />
          ) : (
            <Typography
              color={missingRequiredAssignment ? 'error.main' : 'text.secondary'}
              variant="body2"
            >
              Not assigned
            </Typography>
          )}
          {assignment?.arrangementFunctionVariant && (
            <Typography
              color="text.secondary"
              variant="caption"
              sx={{ display: 'block' }}
            >
              {assignment.arrangementFunctionVariant}
            </Typography>
          )}
          {isMissingVariant && (
            <Typography
              color="error.main"
              variant="caption"
              sx={{ display: 'block' }}
            >
              This assignment is missing a variant. Requirements for this
              assignment will not be calculated.
            </Typography>
          )}
        </Box>
      </Box>

      {row.arrangementPolicy && addAssignmentDialogHandle.open && (
        <AssignArrangementFunctionDialog
          handle={addAssignmentDialogHandle}
          v1CaseId={row.v1Case.id!}
          arrangement={row.source}
          arrangementPolicy={row.arrangementPolicy}
          arrangementFunction={functionPolicy}
        />
      )}
      {row.arrangementPolicy && assignment && removeAssignmentDialogHandle.open && (
        <UnassignArrangementFunctionDialog
          handle={removeAssignmentDialogHandle}
          partneringFamilyId={partneringFamilyId}
          v1CaseId={row.v1Case.id!}
          arrangement={row.source}
          arrangementPolicy={row.arrangementPolicy}
          arrangementFunction={functionPolicy}
          assignment={assignment}
        />
      )}
    </>
  );
}

function AssignmentLabel({
  assignment,
}: {
  assignment: FamilyVolunteerAssignment | IndividualVolunteerAssignment;
}) {
  const familyLookup = useFamilyLookup();
  const personLookup = usePersonLookup();

  if (assignment instanceof IndividualVolunteerAssignment) {
    return (
      <Typography variant="body2" component="div">
        <PersonName
          person={personLookup(assignment.familyId, assignment.personId)}
        />
      </Typography>
    );
  }

  return (
    <Typography variant="body2" component="div">
      <FamilyName family={familyLookup(assignment.familyId)} />
    </Typography>
  );
}

function ArrangementTableRow({
  arrangement,
  arrangementRow,
  arrangementPolicy,
  expanded,
  family,
  onOpenDetails,
  onToggleExpanded,
  permissions,
  rowRef,
  v1CaseId,
}: ArrangementTableRowProps) {
  const personLookup = usePersonLookup();

  return (
    <TableRow
      hover
      ref={rowRef}
      onClick={onToggleExpanded}
      sx={{ cursor: 'pointer' }}
    >
      <TableCell padding="checkbox">
        <IconButton
          aria-label={
            expanded
              ? 'hide arrangement requirements'
              : 'show arrangement requirements'
          }
          size="small"
        >
          {expanded ? <ExpandLess /> : <ExpandMore />}
        </IconButton>
      </TableCell>
      <TableCell className="ph-unmask">
        {arrangement.arrangementType || '-'}
      </TableCell>
      <TableCell className="ph-unmask">
        <Typography variant="body2">{arrangementRow.caseLabel ?? '-'}</Typography>
      </TableCell>
      <TableCell>
        <Stack spacing={0.75}>
          <Chip
            label={arrangementPhaseLabel(arrangement.phase)}
            color={arrangementPhaseColor(arrangement.phase)}
            size="small"
            sx={{ alignSelf: 'flex-start' }}
          />
          {arrangement.phase !== undefined && arrangement.requestedAtUtc && (
            <ArrangementPhaseSummary
              phase={arrangement.phase}
              requestedAtUtc={arrangement.requestedAtUtc}
              startedAtUtc={arrangement.startedAtUtc}
              endedAtUtc={arrangement.endedAtUtc}
            />
          )}
        </Stack>
      </TableCell>
      <TableCell className="ph-unmask">
        <PersonName
          person={personLookup(
            family.family!.id,
            arrangement.partneringFamilyPersonId
          )}
        />
      </TableCell>
      <TableCell>
        <ArrangementDurationSummary arrangement={arrangement} />
      </TableCell>
      <TableCell className="ph-unmask">
        {usesChildLocation(arrangementPolicy) ? (
          <ArrangementLocationSummary arrangement={arrangement} />
        ) : (
          '-'
        )}
      </TableCell>
      <TableCell align="right">
        <Stack direction="row" spacing={1} sx={{ justifyContent: 'flex-end' }}>
          <Button
            onClick={(event) => {
              event.stopPropagation();
              onOpenDetails(arrangementRow);
            }}
            size="small"
            variant="contained"
          >
            Edit
          </Button>
          <ArrangementActions
            arrangement={arrangement}
            permissions={permissions}
            v1CaseId={v1CaseId}
          />
        </Stack>
      </TableCell>
    </TableRow>
  );
}

export function ArrangementsSection({
  v1Case,
  family,
  permissions,
  hideTitle = false,
  scrollToArrangementId,
}: ArrangementSectionProps) {
  const [selectedFilters, setSelectedFilters] = useState<string[]>([
    'Active',
    'Ended',
    'Cancelled',
  ]);
  const [selectedArrangementRowId, setSelectedArrangementRowId] = useState<
    string | null
  >(null);
  const [expandedArrangementIds, setExpandedArrangementIds] = useState<
    string[]
  >([]);

  const policy = useRecoilValue(policyData);
  const personLookup = usePersonLookup();
  const familyLookup = useFamilyLookup();
  const [
    createArrangementDialogParameter,
    setCreateArrangementDialogParameter,
  ] = useState<ArrangementPolicy | null>(null);

  const filteredArrangements = getFilteredArrangements(v1Case, selectedFilters);
  const arrangementRows = useMemo(
    () =>
      buildArrangementRowsV2({
        arrangements: filteredArrangements,
        arrangementPolicies: policy.referralPolicy?.arrangementPolicies,
        family,
        v1Case,
        personLabel: (familyId, personId) =>
          personNameString(personLookup(familyId, personId)),
        familyLabel: (familyId) => {
          const matchedFamily = familyLookup(familyId);
          const primaryContactPerson = matchedFamily?.family?.adults?.find(
            (adult) =>
              adult.item1?.id ===
              matchedFamily.family?.primaryFamilyContactPersonId
          )?.item1;

          return primaryContactPerson
            ? `${personNameString(primaryContactPerson)} Family`
            : 'Family';
        },
      }),
    [family, familyLookup, filteredArrangements, personLookup, policy, v1Case]
  );
  const selectedArrangementRow = useMemo(
    () =>
      arrangementRows.find((row) => row.id === selectedArrangementRowId) ?? null,
    [arrangementRows, selectedArrangementRowId]
  );
  const arrangementRefs = useRef<Record<string, HTMLDivElement | null>>({});

  useScrollToArrangement(arrangementRefs, scrollToArrangementId);

  const toggleExpandedArrangement = (arrangementId: string) => {
    setExpandedArrangementIds((currentIds) =>
      currentIds.includes(arrangementId)
        ? currentIds.filter((id) => id !== arrangementId)
        : [...currentIds, arrangementId]
    );
  };

  return (
    <Grid item xs={12} sx={{ mb: 3 }}>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          maxWidth: '100%',
          flexWrap: 'wrap',
          gap: 2,
          mb: 2,
        }}
      >
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'flex-start',
            maxWidth: '100%',
            flexWrap: 'wrap',
          }}
        >
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 2,
              mb: 2,
            }}
          >
            {!hideTitle && (
              <Typography
                className="ph-unmask"
                variant="h3"
                sx={{ m: 0, display: 'flex', alignItems: 'center' }}
              >
                Arrangements
              </Typography>
            )}

            <ToggleButtonGroup
              value={selectedFilters}
              onChange={(_e, newFilters) => {
                if (newFilters.length > 0) setSelectedFilters(newFilters);
              }}
              aria-label="Arrangement Status Filter"
              size="small"
            >
              <ToggleButton value="Active">Active</ToggleButton>
              <ToggleButton value="Ended">Ended</ToggleButton>
              <ToggleButton value="Cancelled">Cancelled</ToggleButton>
            </ToggleButtonGroup>
          </Box>
        </Box>
        {permissions(Permission.CreateArrangement) && (
          <Box
            sx={{
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'row',
              justifyContent: 'flex-end',
              maxWidth: '100%',
              flexWrap: 'wrap',
              gap: 1,
            }}
          >
            {v1Case &&
              policy.referralPolicy?.arrangementPolicies
                ?.filter(
                  (arrangementPolicy) =>
                    !arrangementPolicy.supersededAtUtc ||
                    new Date(arrangementPolicy.supersededAtUtc) > new Date()
                )
                .map((arrangementPolicy) => (
                  <Box key={arrangementPolicy.arrangementType}>
                    <Button
                      className="ph-unmask"
                      onClick={() =>
                        setCreateArrangementDialogParameter(arrangementPolicy)
                      }
                      variant="contained"
                      size="small"
                      startIcon={<AddCircleIcon />}
                    >
                      {arrangementPolicy.arrangementType}
                    </Button>
                  </Box>
                ))}
          </Box>
        )}
      </Box>
      {filteredArrangements.length > 0 && (
        <WideTableContainer>
          <Table
            aria-label="Arrangements"
            stickyHeader
            size="small"
            sx={{ ...containedStickyHeaderTableSx, minWidth: 1100 }}
          >
            <TableHead>
              <TableRow>
                <TableCell />
                <TableCell>Type</TableCell>
                <TableCell>Case</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Child / Person</TableCell>
                <TableCell>Duration</TableCell>
                <TableCell>Location</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {arrangementRows.map((arrangementRow) => {
                const arrangement = arrangementRow.source;
                const arrangementPolicy = arrangementRow.arrangementPolicy;
                const arrangementId = arrangement.id!;
                const expanded = expandedArrangementIds.includes(arrangementId);

                return (
                  <Fragment key={arrangementId}>
                    <ArrangementTableRow
                      arrangement={arrangement}
                      arrangementRow={arrangementRow}
                      arrangementPolicy={arrangementPolicy}
                      expanded={expanded}
                      family={family}
                      permissions={permissions}
                      v1CaseId={v1Case.id!}
                      onOpenDetails={(row) =>
                        setSelectedArrangementRowId(row.id)
                      }
                      onToggleExpanded={() =>
                        toggleExpandedArrangement(arrangementId)
                      }
                      rowRef={(el) => {
                        arrangementRefs.current[arrangementId] =
                          el as unknown as HTMLDivElement | null;
                      }}
                    />
                    <TableRow>
                      <TableCell
                        colSpan={8}
                        sx={{ borderBottom: expanded ? undefined : 0, p: 0 }}
                      >
                        <Collapse in={expanded} timeout="auto" unmountOnExit>
                          <Box sx={{ p: 2 }}>
                            <Stack spacing={1}>
                              <ArrangementFunctionsChecklist
                                row={arrangementRow}
                              />
                              <ArrangementRequirementsChecklist
                                row={arrangementRow}
                              />
                            </Stack>
                          </Box>
                        </Collapse>
                      </TableCell>
                    </TableRow>
                  </Fragment>
                );
              })}
            </TableBody>
          </Table>
        </WideTableContainer>
      )}

      {createArrangementDialogParameter && (
        <CreateArrangementDialog
          v1CaseId={`${v1Case!.id}`}
          arrangementPolicy={createArrangementDialogParameter}
          onClose={() => setCreateArrangementDialogParameter(null)}
        />
      )}
      <ArrangementDetailsDrawerV2
        row={selectedArrangementRow}
        open={selectedArrangementRow !== null}
        onClose={() => setSelectedArrangementRowId(null)}
      />
    </Grid>
  );
}

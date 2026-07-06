import CloseIcon from '@mui/icons-material/Close';
import {
  Box,
  Button,
  Chip,
  Drawer,
  IconButton,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material';
import { type ReactNode, useState } from 'react';
import {
  ArrangementPhase,
  ChildInvolvement,
  ChildLocationHistoryEntry,
  ChildLocationPlan,
  CompletedRequirementInfo,
  ExemptedRequirementInfo,
  FunctionRequirement,
  MissingArrangementRequirement,
  Permission,
} from '../../GeneratedClient';
import { useBackdrop } from '../../Hooks/useBackdrop';
import { WorkspaceSectionV2 } from '../../Generic/WorkspaceSectionV2';
import { FamilyName } from '../../Families/FamilyName';
import { PersonName } from '../../Families/PersonName';
import {
  useFamilyLookup,
  usePersonLookup,
  useUserLookup,
} from '../../Model/DirectoryModel';
import { useFamilyIdPermissions } from '../../Model/SessionModel';
import { useV1CasesModel } from '../../Model/V1CasesModel';
import { ArrangementComments } from './ArrangementComments';
import { ArrangementParticipantManagementDrawerV2 } from './ArrangementParticipantManagementDrawerV2';
import {
  ArrangementRequirementManagementDrawerV2,
  ArrangementRequirementWorkflowV2,
} from './ArrangementRequirementManagementDrawerV2';
import { ArrangementReason } from './ArrangementReason';
import {
  ArrangementFunctionSummaryV2,
  ArrangementRowV2,
} from './arrangementViewModel';
import { DateDisplayEditor } from './DateDisplayEditor';
import {
  ChildLocationTimeline,
  TrackChildLocationDialog,
} from './TrackChildLocationDialog';
import { format } from 'date-fns';
import { useRequirementContextData } from './useRequirementContextData';
import {
  ArrangementManagementDrawerV2,
  ArrangementManagementMode,
} from './ArrangementManagementDrawerV2';
import { RequirementContext } from '../../Requirements/RequirementContext';
import { formatUtcDateOnly } from '../../Utilities/dateUtils';
import { IconRow } from '../../Generic/IconRow';

type ArrangementDetailsDrawerV2Props = {
  row: ArrangementRowV2 | null;
  open: boolean;
  onClose: () => void;
};

function DetailField({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <Box>
      <Typography color="text.secondary" variant="caption">
        {label}
      </Typography>
      <Typography
        className="ph-unmask"
        variant="body2"
        sx={{ fontWeight: 600 }}
      >
        {children || '-'}
      </Typography>
    </Box>
  );
}

type DateCommand = (
  aggregateId: string,
  v1CaseId: string,
  arrangementId: string,
  date: Date
) => Promise<void>;

const EXPIRING_REQUIREMENT_DAYS = 30;

function TimelineHeaderCell({ children }: { children: ReactNode }) {
  return (
    <Typography
      color="text.secondary"
      variant="caption"
      sx={{ fontWeight: 600 }}
    >
      {children}
    </Typography>
  );
}

function TimelineRowLabel({ children }: { children: ReactNode }) {
  return (
    <Box
      sx={{
        alignSelf: 'stretch',
        borderTop: 1,
        borderColor: 'divider',
        display: 'flex',
        alignItems: 'center',
        py: 0.75,
      }}
    >
      <Typography variant="body2" sx={{ fontWeight: 600 }}>
        {children}
      </Typography>
    </Box>
  );
}

function TimelineValueCell({ children }: { children?: ReactNode }) {
  return (
    <Box
      sx={{
        alignSelf: 'stretch',
        borderTop: 1,
        borderColor: 'divider',
        display: 'flex',
        alignItems: 'center',
        minWidth: 0,
        py: 0.75,
        '& > div': {
          minWidth: 0,
        },
        '& .MuiTypography-root': {
          fontSize: '0.875rem',
          lineHeight: 1.35,
        },
      }}
    >
      {children ?? (
        <Typography color="text.disabled" variant="body2">
          -
        </Typography>
      )}
    </Box>
  );
}

function ArrangementTimelineSectionV2({ row }: { row: ArrangementRowV2 }) {
  const arrangement = row.source;
  const partneringFamilyId = row.partneringFamily.family!.id!;
  const v1CaseId = row.v1Case.id!;
  const permissions = useFamilyIdPermissions(partneringFamilyId);
  const v1CasesModel = useV1CasesModel();
  const withBackdrop = useBackdrop();
  const canEdit = permissions(Permission.EditArrangement);

  const onDateChange = async (callback: DateCommand, newDate: Date) => {
    await withBackdrop(async () => {
      await callback(partneringFamilyId, v1CaseId, arrangement.id!, newDate);
    });
  };

  return (
    <Box
      className="ph-unmask"
      sx={{
        display: 'grid',
        gridTemplateColumns: {
          xs: '84px minmax(0, 1fr) minmax(0, 1fr)',
          sm: '112px minmax(0, 1fr) minmax(0, 1fr)',
        },
        columnGap: { xs: 1, sm: 1.5 },
        alignItems: 'stretch',
      }}
    >
      <Box />
      <TimelineHeaderCell>Planned</TimelineHeaderCell>
      <TimelineHeaderCell>Actual</TimelineHeaderCell>

      <TimelineRowLabel>Requested</TimelineRowLabel>
      <TimelineValueCell />
      <TimelineValueCell>
        <DateDisplayEditor
          label="Requested"
          hideDisplayLabel
          initialValue={arrangement.requestedAtUtc}
          canEdit={canEdit}
          availableInCurrentPhase
          onChange={(newDate) =>
            onDateChange(v1CasesModel.editArrangementRequestedAt, newDate)
          }
        />
      </TimelineValueCell>

      <TimelineRowLabel>Start</TimelineRowLabel>
      <TimelineValueCell>
        <DateDisplayEditor
          label="Planned start"
          hideDisplayLabel
          initialValue={arrangement.plannedStartUtc}
          disableFuture={false}
          canEdit={canEdit}
          availableInCurrentPhase
          onChange={(newDate) =>
            onDateChange(v1CasesModel.planArrangementStart, newDate)
          }
        />
      </TimelineValueCell>
      <TimelineValueCell>
        <DateDisplayEditor
          label="Started"
          hideDisplayLabel
          initialValue={arrangement.startedAtUtc}
          canEdit={canEdit}
          availableInCurrentPhase={
            (arrangement.phase || 0) >= ArrangementPhase.Started
          }
          unavailableTooltip="Only available when the arrangement is started"
          onChange={(newDate) =>
            onDateChange(v1CasesModel.editArrangementStartTime, newDate)
          }
        />
      </TimelineValueCell>

      <TimelineRowLabel>End</TimelineRowLabel>
      <TimelineValueCell>
        <DateDisplayEditor
          label="Planned end"
          hideDisplayLabel
          initialValue={arrangement.plannedEndUtc}
          disableFuture={false}
          canEdit={canEdit}
          availableInCurrentPhase
          onChange={(newDate) =>
            onDateChange(v1CasesModel.planArrangementEnd, newDate)
          }
        />
      </TimelineValueCell>
      <TimelineValueCell>
        <DateDisplayEditor
          label="Ended"
          hideDisplayLabel
          initialValue={arrangement.endedAtUtc}
          canEdit={canEdit}
          availableInCurrentPhase={arrangement.phase === ArrangementPhase.Ended}
          unavailableTooltip="Only available when the arrangement is ended"
          onChange={(newDate) =>
            onDateChange(v1CasesModel.editArrangementEndTime, newDate)
          }
        />
      </TimelineValueCell>

      <TimelineRowLabel>Cancelled</TimelineRowLabel>
      <TimelineValueCell />
      <TimelineValueCell>
        <DateDisplayEditor
          label="Cancelled"
          hideDisplayLabel
          initialValue={arrangement.cancelledAtUtc}
          canEdit={canEdit}
          availableInCurrentPhase={
            arrangement.phase === ArrangementPhase.Cancelled
          }
          unavailableTooltip="Only available when the arrangement is cancelled"
          onChange={(newDate) =>
            onDateChange(v1CasesModel.editArrangementCancelledAt, newDate)
          }
        />
      </TimelineValueCell>
    </Box>
  );
}

function ArrangementOverviewSectionV2({ row }: { row: ArrangementRowV2 }) {
  return (
    <Stack spacing={1.25}>
      <DetailField label="Case">{row.caseLabel}</DetailField>
      <DetailField label="Child / Person">{row.childOrPersonLabel}</DetailField>
      <DetailField label="Family">{row.familyLabel}</DetailField>
      <Box>
        <Typography color="text.secondary" variant="caption">
          Arrangement Reason
        </Typography>
        <Typography
          className="ph-unmask"
          component="div"
          variant="body2"
          sx={{ fontWeight: 600 }}
        >
        <ArrangementReason
          arrangement={row.source}
          hideLabel
          partneringFamily={row.partneringFamily}
          v1CaseId={row.v1Case.id!}
        />
        </Typography>
      </Box>
      <Box>
        <Typography color="text.secondary" variant="caption">
          Arrangement Comments
        </Typography>
        <Typography
          className="ph-unmask"
          component="div"
          variant="body2"
          sx={{ fontWeight: 600 }}
        >
        <ArrangementComments
          arrangement={row.source}
          partneringFamily={row.partneringFamily}
          v1CaseId={row.v1Case.id!}
        />
        </Typography>
      </Box>
    </Stack>
  );
}

function usesChildLocation(row: ArrangementRowV2) {
  return (
    row.arrangementPolicy?.childInvolvement ===
      ChildInvolvement.ChildHousing ||
    row.arrangementPolicy?.childInvolvement ===
      ChildInvolvement.DaytimeChildCareOnly
  );
}

function childLocationPlanLabel(plan?: ChildLocationPlan) {
  if (plan === ChildLocationPlan.DaytimeChildCare) return 'Daytime child care';
  if (plan === ChildLocationPlan.OvernightHousing) return 'Overnight housing';
  if (plan === ChildLocationPlan.WithParent) return 'With parent';
  return '-';
}

function currentLocationEntry(row: ArrangementRowV2) {
  return row.source.childLocationHistory &&
    row.source.childLocationHistory.length > 0
    ? row.source.childLocationHistory[row.source.childLocationHistory.length - 1]
    : undefined;
}

function nextPlannedLocationEntry(row: ArrangementRowV2) {
  const currentLocation = currentLocationEntry(row);

  return row.source.childLocationPlan && row.source.childLocationPlan.length > 0
    ? row.source.childLocationPlan.find(
        (entry) =>
          currentLocation == null ||
          (entry.timestampUtc! > currentLocation.timestampUtc! &&
            entry.childLocationFamilyId !==
              currentLocation.childLocationFamilyId)
      ) ||
        row.source.childLocationPlan
          .slice()
          .reverse()
          .find(
            (entry) =>
              entry.childLocationFamilyId !==
              currentLocation?.childLocationFamilyId
          )
    : undefined;
}

function ChildLocationEntryDetails({
  entry,
  emptyText,
}: {
  entry?: ChildLocationHistoryEntry;
  emptyText: string;
}) {
  const familyLookup = useFamilyLookup();
  const personLookup = usePersonLookup();

  if (!entry) {
    return <EmptyText>{emptyText}</EmptyText>;
  }

  return (
    <Stack spacing={1}>
      <DetailField label="Family">
        <FamilyName family={familyLookup(entry.childLocationFamilyId)} />
      </DetailField>
      <DetailField label="Receiving Adult">
        <PersonName
          person={personLookup(
            entry.childLocationFamilyId,
            entry.childLocationReceivingAdultId
          )}
        />
      </DetailField>
      <DetailField label="Plan Type">
        {childLocationPlanLabel(entry.plan)}
      </DetailField>
      {entry.timestampUtc && (
        <DetailField label="Timestamp">
          {format(entry.timestampUtc, 'M/d/yyyy h:mm a')}
        </DetailField>
      )}
    </Stack>
  );
}

function ArrangementChildLocationSectionV2({ row }: { row: ArrangementRowV2 }) {
  const [trackingMode, setTrackingMode] = useState<'record' | 'plan' | null>(
    null
  );
  const [plannedEntryToRecord, setPlannedEntryToRecord] =
    useState<ChildLocationHistoryEntry | null>(null);
  const arrangementHasNotStartedYet =
    row.source.phase === ArrangementPhase.SettingUp ||
    row.source.phase === ArrangementPhase.ReadyToStart ||
    row.source.phase === ArrangementPhase.Cancelled;
  const hasTimelineEntries =
    (row.source.childLocationHistory?.length ?? 0) > 0 ||
    (row.source.childLocationPlan?.length ?? 0) > 0;
  const currentEntry = currentLocationEntry(row);
  const nextPlanEntry = nextPlannedLocationEntry(row);

  const closeTrackingDialog = () => {
    setTrackingMode(null);
    setPlannedEntryToRecord(null);
  };

  if (!usesChildLocation(row)) {
    return (
      <EmptyText>
        Child location tracking is not configured for this arrangement type.
      </EmptyText>
    );
  }

  return (
    <Stack spacing={2.25}>
      <Box>
        <Typography variant="subtitle2" sx={{ mb: 1 }}>
          Current Location
        </Typography>
        <ChildLocationEntryDetails
          entry={currentEntry}
          emptyText="No current location has been recorded yet."
        />
      </Box>

      <Box>
        <Typography variant="subtitle2" sx={{ mb: 1 }}>
          Upcoming Plan
        </Typography>
        <ChildLocationEntryDetails
          entry={nextPlanEntry}
          emptyText="No upcoming move is planned."
        />
      </Box>

      <Box>
        <Typography variant="subtitle2" sx={{ mb: 1 }}>
          Location Timeline
        </Typography>
        {hasTimelineEntries ? (
          <ChildLocationTimeline
            partneringFamily={row.partneringFamily}
            v1CaseId={row.v1Case.id!}
            arrangement={row.source}
            presentation="drawer"
            recordChildLocationPlan={(entry) => {
              setPlannedEntryToRecord(entry);
              setTrackingMode('record');
            }}
          />
        ) : (
          <EmptyText>
            No location history or planned moves have been recorded yet.
          </EmptyText>
        )}
      </Box>

      <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', rowGap: 1 }}>
        <Button
          disabled={arrangementHasNotStartedYet}
          onClick={() => setTrackingMode('record')}
          size="small"
          variant="contained"
        >
          Record Location Change
        </Button>
        <Button
          onClick={() => setTrackingMode('plan')}
          size="small"
          variant="contained"
        >
          Plan Future Change
        </Button>
      </Stack>

      {(trackingMode || plannedEntryToRecord) && (
        <TrackChildLocationDialog
          partneringFamily={row.partneringFamily}
          v1CaseId={row.v1Case.id!}
          arrangement={row.source}
          initialMode={trackingMode ?? undefined}
          initialPlannedEntry={plannedEntryToRecord ?? undefined}
          onClose={closeTrackingDialog}
        />
      )}
    </Stack>
  );
}

function EmptyText({ children }: { children: ReactNode }) {
  return (
    <Typography color="text.secondary" variant="body2">
      {children}
    </Typography>
  );
}

function ArrangementWorkspaceHeaderV2({
  onClose,
  onManage,
  row,
}: {
  onClose: () => void;
  onManage: (mode: ArrangementManagementMode) => void;
  row: ArrangementRowV2;
}) {
  const arrangement = row.source;
  const permissions = useFamilyIdPermissions(row.partneringFamily.family!.id!);
  const canEdit = permissions(Permission.EditArrangement);
  const canDelete = permissions(Permission.DeleteArrangement);

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        gap: 1,
      }}
    >
      <Box sx={{ minWidth: 0, flex: 1 }}>
        <Typography
          color="text.secondary"
          sx={{ textTransform: 'uppercase' }}
          variant="caption"
        >
          Arrangement
        </Typography>
        <Typography
          id="arrangement-details-title"
          className="ph-unmask"
          variant="h5"
        >
          {row.arrangementType}
        </Typography>
        <Box
          sx={{
            alignItems: { xs: 'flex-start', sm: 'center' },
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
            gap: 1,
            justifyContent: 'space-between',
            mt: 1,
          }}
        >
          <Stack
            direction="row"
            spacing={1}
            sx={{ alignItems: 'center', flexWrap: 'wrap' }}
          >
            <Chip label={row.statusLabel} size="small" />
            <Typography
              className="ph-unmask"
              color="text.secondary"
              variant="body2"
            >
              {row.childOrPersonLabel}
            </Typography>
          </Stack>
          <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap' }}>
            {arrangement.phase === ArrangementPhase.SettingUp && canEdit && (
              <Button
                variant="outlined"
                size="small"
                onClick={() => onManage('cancel')}
              >
                Cancel
              </Button>
            )}
            {arrangement.phase === ArrangementPhase.ReadyToStart && canEdit && (
              <>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => onManage('cancel')}
                >
                  Cancel
                </Button>
                <Button
                  variant="contained"
                  size="small"
                  onClick={() => onManage('start')}
                >
                  Start
                </Button>
              </>
            )}
            {arrangement.phase === ArrangementPhase.Started && canEdit && (
              <Button
                variant="outlined"
                size="small"
                onClick={() => onManage('end')}
              >
                End
              </Button>
            )}
            {arrangement.phase === ArrangementPhase.Ended && canEdit && (
              <Button
                variant="outlined"
                size="small"
                onClick={() => onManage('reopen')}
              >
                Reopen
              </Button>
            )}
            {canDelete && (
              <Button
                variant="outlined"
                size="small"
                color="warning"
                onClick={() => onManage('delete')}
              >
                Delete
              </Button>
            )}
          </Stack>
        </Box>
      </Box>
      <IconButton aria-label="close arrangement details" onClick={onClose}>
        <CloseIcon />
      </IconButton>
    </Box>
  );
}

function ArrangementAssignmentsSectionV2({
  onManage,
  row,
}: {
  onManage: () => void;
  row: ArrangementRowV2;
}) {
  if (row.functionSummaries.length === 0) {
    return <EmptyText>No functions configured for this arrangement.</EmptyText>;
  }

  const missingRequiredSummaries = row.functionSummaries.filter(
    (summary) =>
      summary.functionPolicy.requirement !== FunctionRequirement.ZeroOrMore &&
      summary.assignments.length === 0
  );
  const missingVariantSummaries = row.functionSummaries.filter(
    (summary) => summary.missingVariantLabels.length > 0
  );
  const hasAssignmentIssues =
    missingRequiredSummaries.length > 0 || missingVariantSummaries.length > 0;

  return (
    <Stack spacing={1.5}>
      {hasAssignmentIssues ? (
        <Stack spacing={0.5}>
          {missingRequiredSummaries.map((summary) => (
            <AssignmentIssueRowV2
              key={`${summary.functionName}:missing`}
              icon="❌"
              label={summary.functionName}
            />
          ))}
          {missingVariantSummaries.map((summary) => (
            <AssignmentIssueRowV2
              key={`${summary.functionName}:variant`}
              icon="⚠"
              label={`${summary.functionName} requires variant`}
            />
          ))}
        </Stack>
      ) : (
        <Typography className="ph-unmask" variant="body2">
          ✓ All required assignments complete
        </Typography>
      )}
      <Button
        onClick={onManage}
        size="small"
        sx={{ alignSelf: 'flex-start' }}
        variant="text"
      >
        Manage Assignments →
      </Button>
    </Stack>
  );
}

function AssignmentIssueRowV2({
  icon,
  label,
}: {
  icon: string;
  label: string;
}) {
  return (
    <Stack direction="row" spacing={1} sx={{ alignItems: 'baseline' }}>
      <Typography variant="body2" sx={{ width: 20, textAlign: 'center' }}>
        {icon}
      </Typography>
      <Typography className="ph-unmask" variant="body2">
        {label}
      </Typography>
    </Stack>
  );
}

function isExpired(date?: Date, now = new Date()) {
  return date !== undefined && date < now;
}

function isExpiring(date?: Date, now = new Date()) {
  if (!date || isExpired(date, now)) {
    return false;
  }

  const cutoff = new Date(now);
  cutoff.setDate(cutoff.getDate() + EXPIRING_REQUIREMENT_DAYS);

  return date <= cutoff;
}

function requiresAttention(requirement: CompletedRequirementInfo): boolean;
function requiresAttention(requirement: ExemptedRequirementInfo): boolean;
function requiresAttention(
  requirement: CompletedRequirementInfo | ExemptedRequirementInfo
) {
  const expirationDate =
    requirement instanceof CompletedRequirementInfo
      ? requirement.expiresAtUtc
      : requirement.exemptionExpiresAtUtc;

  return isExpired(expirationDate) || isExpiring(expirationDate);
}

function isUpcomingRequirement(requirement: MissingArrangementRequirement) {
  if (!requirement.action?.isRequired) {
    return true;
  }

  return requirement.dueBy !== undefined && requirement.pastDueSince === undefined;
}

function RequirementGroupV2({
  children,
  count,
  title,
}: {
  children: ReactNode;
  count: number;
  title: string;
}) {
  if (count === 0) {
    return null;
  }

  return (
    <Stack spacing={0.75}>
      <Typography
        color="text.secondary"
        variant="caption"
        sx={{ fontWeight: 700, textTransform: 'uppercase' }}
      >
        {title}
      </Typography>
      <Box
        sx={{
          '& > * + *': {
            mt: 0.25,
          },
        }}
      >
        {children}
      </Box>
    </Stack>
  );
}

function contextFamilyId(context: RequirementContext) {
  if (
    context.kind === 'Arrangement' ||
    context.kind === 'Family Volunteer Assignment' ||
    context.kind === 'Individual Volunteer Assignment'
  ) {
    return context.partneringFamilyId;
  }

  if (
    context.kind === 'Volunteer Family' ||
    context.kind === 'Individual Volunteer'
  ) {
    return context.volunteerFamilyId;
  }

  return '';
}

function MissingRequirementActionRowV2({
  context,
  missing,
  onOpen,
}: {
  context: RequirementContext;
  missing: MissingArrangementRequirement;
  onOpen: () => void;
}) {
  const permissions = useFamilyIdPermissions(contextFamilyId(context));
  const canManage =
    permissions(Permission.EditArrangementRequirementCompletion) ||
    permissions(Permission.EditArrangementRequirementExemption);
  const familyLookup = useFamilyLookup();
  const personLookup = usePersonLookup();
  const icon = missing.dueBy ? '📅' : missing.action?.isRequired ? '❌' : '🔲';

  return (
    <IconRow icon={icon} onClick={canManage ? onOpen : undefined}>
      {missing.action?.actionName}&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
      {missing.dueBy && (
        <span style={{ float: 'right' }}>{formatUtcDateOnly(missing.dueBy)}</span>
      )}
      {!missing.dueBy && missing.pastDueSince && (
        <span style={{ float: 'right' }}>
          {formatUtcDateOnly(missing.pastDueSince)}
        </span>
      )}
      {missing.volunteerFamilyId && !missing.personId && (
        <>
          <br />
          <span style={{ paddingLeft: '30px' }}>
            <FamilyName family={familyLookup(missing.volunteerFamilyId)} />
          </span>
        </>
      )}
      {missing.volunteerFamilyId && missing.personId && (
        <>
          <br />
          <span style={{ paddingLeft: '30px' }}>
            <PersonName
              person={personLookup(missing.volunteerFamilyId, missing.personId)}
            />
          </span>
        </>
      )}
    </IconRow>
  );
}

function CompletedRequirementActionRowV2({
  completed,
  context,
  onOpen,
}: {
  completed: CompletedRequirementInfo;
  context: RequirementContext;
  onOpen: () => void;
}) {
  const permissions = useFamilyIdPermissions(contextFamilyId(context));
  const canMarkIncomplete = permissions(
    Permission.EditArrangementRequirementCompletion
  );
  const userLookup = useUserLookup();
  const familyLookup = useFamilyLookup();
  const personLookup = usePersonLookup();

  return (
    <IconRow icon="✅" onClick={canMarkIncomplete ? onOpen : undefined}>
      <Tooltip
        title={
          <>
            Completed by <PersonName person={userLookup(completed.userId)} />
          </>
        }
      >
        <>
          <span className="ph-unmask">
            {completed.requirementName}&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
            {completed.completedAtUtc && (
              <span style={{ float: 'right' }}>
                {formatUtcDateOnly(completed.completedAtUtc)}
              </span>
            )}
          </span>
          {completed.expiresAtUtc && (
            <>
              <br />
              <span style={{ paddingLeft: '30px' }}>
                {completed.expiresAtUtc > new Date() ? (
                  `⏰ Expires ${formatUtcDateOnly(completed.expiresAtUtc)}`
                ) : (
                  <span style={{ fontWeight: 'bold' }}>
                    ⚠ Expired {formatUtcDateOnly(completed.expiresAtUtc)}
                  </span>
                )}
              </span>
            </>
          )}
          {context.kind === 'Family Volunteer Assignment' && (
            <>
              <br />
              <span style={{ paddingLeft: '30px' }}>
                <FamilyName family={familyLookup(context.assignment.familyId)} />
              </span>
            </>
          )}
          {context.kind === 'Individual Volunteer Assignment' && (
            <>
              <br />
              <span style={{ paddingLeft: '30px' }}>
                <PersonName
                  person={personLookup(
                    context.assignment.familyId,
                    context.assignment.personId
                  )}
                />
              </span>
            </>
          )}
        </>
      </Tooltip>
    </IconRow>
  );
}

function ExemptedRequirementActionRowV2({
  context,
  exempted,
  onOpen,
  row,
}: {
  context: RequirementContext;
  exempted: ExemptedRequirementInfo;
  onOpen: () => void;
  row: ArrangementRowV2;
}) {
  const permissions = useFamilyIdPermissions(contextFamilyId(context));
  const canRemoveExemption = permissions(
    Permission.EditArrangementRequirementExemption
  );
  const userLookup = useUserLookup();
  const familyLookup = useFamilyLookup();
  const personLookup = usePersonLookup();
  const allMonitoringRequirements =
    row.arrangementPolicy?.requiredMonitoringActions_PRE_MIGRATION?.concat(
      row.arrangementPolicy.arrangementFunctions?.flatMap(
        (arrangementFunction) =>
          arrangementFunction.variants?.flatMap(
            (variant) => variant.requiredMonitoringActions_PRE_MIGRATION || []
          ) || []
      ) || []
    );
  const isArrangementMonitoringRequirement = allMonitoringRequirements?.some(
    (requirement) => requirement.action?.actionName === exempted.requirementName
  );

  return (
    <IconRow icon="🚫" onClick={canRemoveExemption ? onOpen : undefined}>
      <Tooltip
        title={
          <>
            Granted by <PersonName person={userLookup(exempted.userId)} />{' '}
            {format(exempted.timestampUtc!, 'M/d/yy h:mm a')}
          </>
        }
      >
        <>
          <span>
            {isArrangementMonitoringRequirement && !exempted.dueDate && (
              <span style={{ fontWeight: 'bold' }}>All&nbsp;</span>
            )}
            {exempted.requirementName}&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
            {exempted.dueDate && (
              <span style={{ float: 'right' }}>
                {formatUtcDateOnly(exempted.dueDate)}
              </span>
            )}
            {exempted.exemptionExpiresAtUtc && (
              <span style={{ float: 'right' }}>
                until {format(exempted.exemptionExpiresAtUtc, 'M/d/yy')}
              </span>
            )}
          </span>
          {context.kind === 'Family Volunteer Assignment' && (
            <>
              <br />
              <span style={{ paddingLeft: '30px' }}>
                <FamilyName family={familyLookup(context.assignment.familyId)} />
              </span>
            </>
          )}
          {context.kind === 'Individual Volunteer Assignment' && (
            <>
              <br />
              <span style={{ paddingLeft: '30px' }}>
                <PersonName
                  person={personLookup(
                    context.assignment.familyId,
                    context.assignment.personId
                  )}
                />
              </span>
            </>
          )}
          <br />
          <span
            style={{
              lineHeight: '1.5em',
              paddingLeft: 30,
              fontStyle: 'italic',
              display: 'inline-block',
            }}
          >
            {exempted.additionalComments}
          </span>
        </>
      </Tooltip>
    </IconRow>
  );
}
function ArrangementRequirementsSectionV2({ row }: { row: ArrangementRowV2 }) {
  const [selectedWorkflow, setSelectedWorkflow] =
    useState<ArrangementRequirementWorkflowV2 | null>(null);
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
    return <EmptyText>No arrangement requirements.</EmptyText>;
  }

  const missingNeedsAttention = mergedArray.filter(
    ({ missing }) => !isUpcomingRequirement(missing)
  );
  const missingUpcoming = mergedArray.filter(({ missing }) =>
    isUpcomingRequirement(missing)
  );
  const completedNeedsAttention = completedRequirementsWithContext.filter(
    ({ completed }) => requiresAttention(completed)
  );
  const completedStable = completedRequirementsWithContext.filter(
    ({ completed }) => !requiresAttention(completed)
  );
  const exemptedNeedsAttention = exemptedRequirementsWithContext.filter(
    ({ exempted }) => requiresAttention(exempted)
  );
  const exemptedStable = exemptedRequirementsWithContext.filter(
    ({ exempted }) => !requiresAttention(exempted)
  );
  const needsAttentionCount =
    missingNeedsAttention.length +
    completedNeedsAttention.length +
    exemptedNeedsAttention.length;
  const completedCount = completedStable.length + exemptedStable.length;

  return (
    <Stack className="ph-unmask" spacing={1.5}>
      <RequirementGroupV2 title="Needs Attention" count={needsAttentionCount}>
        {missingNeedsAttention.map(({ context, missing }, index) => (
          <MissingRequirementActionRowV2
            key={`${missing.action?.actionName}:attention:${index}`}
            context={context}
            missing={missing}
            onOpen={() =>
              setSelectedWorkflow({
                context,
                kind: 'missing',
                requirement: missing,
              })
            }
          />
        ))}
        {completedNeedsAttention.map(({ completed, context }, index) => (
          <CompletedRequirementActionRowV2
            key={`${completed.requirementName}:attention:${index}`}
            context={context}
            completed={completed}
            onOpen={() =>
              setSelectedWorkflow({
                context,
                kind: 'completed',
                requirement: completed,
              })
            }
          />
        ))}
        {exemptedNeedsAttention.map(({ context, exempted }, index) => (
          <ExemptedRequirementActionRowV2
            key={`${exempted.requirementName}:attention:${index}`}
            context={context}
            exempted={exempted}
            row={row}
            onOpen={() =>
              setSelectedWorkflow({
                context,
                kind: 'exempted',
                requirement: exempted,
              })
            }
          />
        ))}
      </RequirementGroupV2>

      <RequirementGroupV2 title="Upcoming" count={missingUpcoming.length}>
        {missingUpcoming.map(({ context, missing }, index) => (
          <MissingRequirementActionRowV2
            key={`${missing.action?.actionName}:upcoming:${index}`}
            context={context}
            missing={missing}
            onOpen={() =>
              setSelectedWorkflow({
                context,
                kind: 'missing',
                requirement: missing,
              })
            }
          />
        ))}
      </RequirementGroupV2>

      <RequirementGroupV2 title="Completed" count={completedCount}>
        {completedStable.map(({ completed, context }, index) => (
          <CompletedRequirementActionRowV2
            key={`${completed.requirementName}:completed:${index}`}
            context={context}
            completed={completed}
            onOpen={() =>
              setSelectedWorkflow({
                context,
                kind: 'completed',
                requirement: completed,
              })
            }
          />
        ))}
        {exemptedStable.map(({ context, exempted }, index) => (
          <ExemptedRequirementActionRowV2
            key={`${exempted.requirementName}:completed:${index}`}
            context={context}
            exempted={exempted}
            row={row}
            onOpen={() =>
              setSelectedWorkflow({
                context,
                kind: 'exempted',
                requirement: exempted,
              })
            }
          />
        ))}
      </RequirementGroupV2>
      <ArrangementRequirementManagementDrawerV2
        onClose={() => setSelectedWorkflow(null)}
        open={selectedWorkflow !== null}
        workflow={selectedWorkflow}
      />
    </Stack>
  );
}

function ArrangementWorkspaceLayoutV2({ row }: { row: ArrangementRowV2 }) {
  const [selectedFunctionSummary, setSelectedFunctionSummary] =
    useState<ArrangementFunctionSummaryV2 | null>(null);
  const defaultFunctionSummary =
    row.functionSummaries.find(
      (summary) =>
        summary.functionPolicy.requirement !== FunctionRequirement.ZeroOrMore &&
        summary.assignments.length === 0
    ) ??
    row.functionSummaries.find((summary) => summary.assignments.length === 0) ??
    row.functionSummaries[0] ??
    null;

  return (
    <>
      <Box
        sx={{
          display: 'grid',
          gap: { xs: 2, md: 2.5 },
          gridTemplateColumns: {
            xs: '1fr',
            md: 'minmax(0, 0.95fr) minmax(0, 1.05fr) minmax(0, 1fr)',
          },
          alignItems: 'start',
        }}
      >
        <Stack spacing={1.5}>
          <WorkspaceSectionV2 title="Overview">
            <ArrangementOverviewSectionV2 row={row} />
          </WorkspaceSectionV2>

          <WorkspaceSectionV2 title="Timeline">
            <ArrangementTimelineSectionV2 row={row} />
          </WorkspaceSectionV2>

          <WorkspaceSectionV2 title="Assignments">
            <ArrangementAssignmentsSectionV2
              onManage={() => setSelectedFunctionSummary(defaultFunctionSummary)}
              row={row}
            />
          </WorkspaceSectionV2>
        </Stack>

        <Stack spacing={1.5}>
          <WorkspaceSectionV2 title="Requirements">
            <ArrangementRequirementsSectionV2 row={row} />
          </WorkspaceSectionV2>
        </Stack>

        <Stack spacing={1.5}>
          <WorkspaceSectionV2 title="Child Care">
            <ArrangementChildLocationSectionV2 row={row} />
          </WorkspaceSectionV2>
        </Stack>
      </Box>

      <ArrangementParticipantManagementDrawerV2
        functionSummary={selectedFunctionSummary}
        functionSummaries={row.functionSummaries}
        row={row}
        open={selectedFunctionSummary !== null}
        onClose={() => setSelectedFunctionSummary(null)}
      />
    </>
  );
}

export function ArrangementDetailsDrawerV2({
  row,
  open,
  onClose,
}: ArrangementDetailsDrawerV2Props) {
  const [managementMode, setManagementMode] =
    useState<ArrangementManagementMode | null>(null);

  return (
    <>
      <Drawer
        anchor="right"
        aria-labelledby="arrangement-details-title"
        open={open}
        onClose={onClose}
        slotProps={{
          paper: {
            sx: {
              width: { xs: '100%', sm: 720, md: 1280 },
              p: 2,
              pt: { xs: 7, sm: 8, md: 6 },
            },
          },
        }}
      >
        {row && (
          <Stack spacing={2}>
            <ArrangementWorkspaceHeaderV2
              row={row}
              onClose={onClose}
              onManage={setManagementMode}
            />
            <ArrangementWorkspaceLayoutV2 row={row} />
          </Stack>
        )}
      </Drawer>
      <ArrangementManagementDrawerV2
        mode={managementMode}
        row={row}
        open={managementMode !== null}
        onClose={() => setManagementMode(null)}
      />
    </>
  );
}

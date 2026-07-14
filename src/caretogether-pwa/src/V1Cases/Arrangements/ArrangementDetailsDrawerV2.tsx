import {
  Box,
  Button,
  Drawer,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material';
import { type ReactNode, useState } from 'react';
import {
  CompletedRequirementInfo,
  ExemptedRequirementInfo,
  FunctionRequirement,
  MissingArrangementRequirement,
  Permission,
} from '../../GeneratedClient';
import { WorkspaceSectionV2 } from '../../Generic/WorkspaceSectionV2';
import { FamilyName } from '../../Families/FamilyName';
import { PersonName } from '../../Families/PersonName';
import { v2Typography } from '../../Families/v2Typography';
import {
  useFamilyLookup,
  usePersonLookup,
  useUserLookup,
} from '../../Model/DirectoryModel';
import { useFamilyIdPermissions } from '../../Model/SessionModel';
import { ArrangementParticipantManagementDrawerV2 } from './ArrangementParticipantManagementDrawerV2';
import {
  ArrangementRequirementManagementDrawerV2,
  ArrangementRequirementWorkflowV2,
} from './ArrangementRequirementManagementDrawerV2';
import { ArrangementOverviewSectionV2 } from './ArrangementOverviewSectionV2';
import { ArrangementTimelineSectionV2 } from './ArrangementTimelineSectionV2';
import { ArrangementWorkspaceHeaderV2 } from './ArrangementWorkspaceHeaderV2';
import {
  ArrangementFunctionSummaryV2,
  ArrangementRowV2,
} from './arrangementViewModel';
import { format } from 'date-fns';
import { useRequirementContextData } from './useRequirementContextData';
import {
  ArrangementManagementDrawerV2,
  ArrangementManagementMode,
} from './ArrangementManagementDrawerV2';
import { RequirementContext } from '../../Requirements/RequirementContext';
import { formatUtcDateOnly } from '../../Utilities/dateUtils';
import { IconRow } from '../../Generic/IconRow';
import { resolveArrangementWorkspaceModuleV2 } from './ArrangementWorkspaceModuleV2';

type ArrangementDetailsDrawerV2Props = {
  row: ArrangementRowV2 | null;
  open: boolean;
  onClose: () => void;
};

const EXPIRING_REQUIREMENT_DAYS = 30;

function EmptyText({ children }: { children: ReactNode }) {
  return (
    <Typography color="text.secondary" variant="body2">
      {children}
    </Typography>
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
        <Typography className="ph-unmask" {...v2Typography.browserCell}>
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
      <Typography
        {...v2Typography.browserCell}
        sx={{ width: 20, textAlign: 'center' }}
      >
        {icon}
      </Typography>
      <Typography className="ph-unmask" {...v2Typography.browserCell}>
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
          <span>
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
    <Stack spacing={1.5}>
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
  const workspaceModule = resolveArrangementWorkspaceModuleV2(row);
  const WorkspaceModuleComponent = workspaceModule?.Component;
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

        {workspaceModule && WorkspaceModuleComponent && (
          <Stack spacing={1.5}>
            <WorkspaceSectionV2 title={workspaceModule.title}>
              <WorkspaceModuleComponent row={row} />
            </WorkspaceSectionV2>
          </Stack>
        )}
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

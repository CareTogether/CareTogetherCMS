import {
  Chip,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material';
import { alpha, darken } from '@mui/material/styles';
import { useMemo, useState } from 'react';
import { ArrangementPhase } from '../GeneratedClient';
import { useAppNavigate } from '../Hooks/useAppNavigate';
import {
  useCurrentLocation,
  useVisibleCommunities,
  useVisibleFamilies,
} from '../Model/Data';
import { useFamilyLookup } from '../Model/DirectoryModel';
import { arrangementPhaseColor } from '../V1Cases/Arrangements/arrangementPresentationV2';
import {
  DashboardQueueRow,
  DashboardRequirementPanel,
} from './DashboardRequirementPanel';
import { selectMyAssignments, type MyAssignments } from './myAssignments';

import { disclosedFamilyName } from './dashboardFamilyName';
import { myAssignmentsPanel } from './dashboardPanels';

type AssignmentView = keyof MyAssignments;

const assignmentViews = {
  cases: { label: 'Cases', empty: 'No cases assigned to you' },
  arrangements: {
    label: 'Arrangements',
    empty: 'No active arrangements assigned to you',
  },
  roles: { label: 'Roles', empty: 'No organization roles assigned to you' },
} satisfies Record<AssignmentView, { label: string; empty: string }>;

// My assignments only lists active arrangements, so `Started` is the normal
// state; only phases that still need attention get a chip.
const attentionPhaseLabels: Partial<Record<ArrangementPhase, string>> = {
  [ArrangementPhase.SettingUp]: 'Setting up',
  [ArrangementPhase.ReadyToStart]: 'Ready to start',
};

function ArrangementAssignmentStatus({
  phase,
  assignedToFamily,
}: {
  phase: ArrangementPhase;
  assignedToFamily: boolean;
}) {
  const label = attentionPhaseLabels[phase];
  if (!label && !assignedToFamily) return null;

  return (
    <Stack
      component="span"
      direction="row"
      spacing={1}
      useFlexGap
      sx={{ alignItems: 'center', flexWrap: 'wrap' }}
    >
      {label && <ArrangementPhaseChip phase={phase} label={label} />}
      {assignedToFamily && (
        <Typography
          className="ph-unmask"
          component="span"
          variant="caption"
          color="text.secondary"
        >
          Assigned to your family
        </Typography>
      )}
    </Stack>
  );
}

function ArrangementPhaseChip({
  phase,
  label,
}: {
  phase: ArrangementPhase;
  label: string;
}) {
  const color = arrangementPhaseColor(phase) ?? 'default';

  return (
    <Chip
      // Rendered inside the row's <button>, so it must be phrasing content.
      component="span"
      className="ph-unmask"
      size="small"
      variant="outlined"
      label={label}
      sx={{
        height: 22,
        fontSize: 'caption.fontSize',
        fontWeight: 500,
        // The palette `main` shades fall below 4.5:1 on white at this size,
        // so text and border use a darkened `dark` shade instead.
        ...(color !== 'default' && {
          color: (theme) => darken(theme.palette[color].dark, 0.2),
          borderColor: (theme) => alpha(theme.palette[color].dark, 0.5),
        }),
      }}
    />
  );
}

export function DashboardMyAssignments({ familyV2 }: { familyV2: boolean }) {
  const personId = useCurrentLocation()?.personId;
  const families = useVisibleFamilies();
  const communities = useVisibleCommunities();
  const familyLookup = useFamilyLookup();
  const navigate = useAppNavigate();
  const assignments = useMemo(
    () => selectMyAssignments(personId, families, communities),
    [personId, families, communities]
  );
  const [selectedView, setSelectedView] = useState<AssignmentView>();
  const view =
    selectedView ??
    (Object.keys(assignmentViews) as AssignmentView[]).find(
      (key) => assignments[key].length > 0
    ) ??
    'cases';
  const total =
    assignments.cases.length +
    assignments.arrangements.length +
    assignments.roles.length;

  function familyName(familyId: string) {
    return disclosedFamilyName(familyLookup(familyId)) ?? 'Family';
  }

  return (
    <DashboardRequirementPanel
      {...myAssignmentsPanel}
      compact
      count={assignments[view].length}
      {...(!personId
        ? {
            emptyTitle: 'No linked person record',
            emptyMessage:
              'Your account is not linked to a person in this location.',
          }
        : total > 0 && {
            emptyTitle: assignmentViews[view].empty,
            emptyMessage: 'Choose another assignment type.',
          })}
      headerAction={
        <ToggleButtonGroup
          exclusive
          value={view}
          aria-label="Assignment type"
          size="small"
          sx={{
            flexWrap: 'wrap',
            '& .MuiToggleButton-root': {
              textTransform: 'none',
              minHeight: 32,
              color: 'text.secondary',
              fontVariantNumeric: 'tabular-nums',
            },
          }}
          onChange={(_, value: AssignmentView | null) => {
            if (value) setSelectedView(value);
          }}
        >
          {(Object.keys(assignmentViews) as AssignmentView[]).map((key) => (
            <ToggleButton key={key} value={key}>
              <span className="ph-unmask">{assignmentViews[key].label}</span>
              &nbsp;({assignments[key].length})
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
      }
    >
      {view === 'cases' &&
        assignments.cases.map((assignment) => (
          <DashboardQueueRow
            key={assignment.key}
            title={assignment.role}
            context={familyName(assignment.familyId)}
            onOpen={() =>
              navigate.family(assignment.familyId, {
                v1CaseId: assignment.v1CaseId,
              })
            }
          >
            <Typography
              className="ph-unmask"
              component="span"
              variant="caption"
              color="text.secondary"
            >
              Open case
            </Typography>
          </DashboardQueueRow>
        ))}
      {view === 'arrangements' &&
        assignments.arrangements.map((assignment) => (
          <DashboardQueueRow
            key={assignment.key}
            title={[
              assignment.arrangementFunction,
              assignment.arrangementFunctionVariant,
            ]
              .filter(Boolean)
              .join(' · ')}
            context={[
              familyName(assignment.familyId),
              assignment.arrangementType || 'Arrangement',
            ].join(' · ')}
            onOpen={() =>
              navigate.family(
                assignment.familyId,
                familyV2
                  ? {
                      v1CaseId: assignment.v1CaseId,
                      arrangementId: assignment.arrangementId,
                    }
                  : { v1CaseId: assignment.v1CaseId }
              )
            }
          >
            <ArrangementAssignmentStatus
              phase={assignment.phase}
              assignedToFamily={assignment.assignee === 'family'}
            />
          </DashboardQueueRow>
        ))}
      {view === 'roles' &&
        assignments.roles.map((assignment) => (
          <DashboardQueueRow
            key={assignment.key}
            title={assignment.role}
            context={assignment.communityName || 'Organization'}
            onOpen={() => navigate.organization(assignment.communityId)}
          >
            {null}
          </DashboardQueueRow>
        ))}
    </DashboardRequirementPanel>
  );
}

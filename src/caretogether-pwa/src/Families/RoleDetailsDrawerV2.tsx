import CloseIcon from '@mui/icons-material/Close';
import {
  Box,
  ButtonBase,
  Chip,
  Collapse,
  Divider,
  Drawer,
  IconButton,
  LinearProgress,
  List,
  ListItemButton,
  ListItemText,
  Stack,
  Typography,
} from '@mui/material';
import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';
import { Permission, Person, RoleApprovalStatus } from '../GeneratedClient';
import { useFamilyLookup } from '../Model/DirectoryModel';
import { useFamilyIdPermissions } from '../Model/SessionModel';
import { formatUtcDateOnly } from '../Utilities/dateUtils';
import { ApprovalRequirementWorkflowV2 } from './ApprovalRequirementWorkflowV2';
import { ApprovalWorkflowLauncherV2 } from './ApprovalWorkflowLauncherV2';
import type { ApprovalLedgerStatus } from './approvalLedgerViewModel';
import { RoleRemovalSectionV2 } from './RoleRemovalSectionV2';
import { RoleResetSectionV2 } from './RoleResetSectionV2';
import type {
  RemovedRoleSummary,
  RoleSummaryCard,
  RoleSummaryRequirement,
} from './roleSummaryViewModel';

type RoleDetailsDrawerV2Props = {
  card: RoleSummaryCard | null;
  removedRole?: RemovedRoleSummary | null;
  open: boolean;
  onClose: () => void;
};

type ExpandedRoleAction = 'reset' | 'remove' | 'launcher' | null;

function statusLabel(status: RoleApprovalStatus) {
  return RoleApprovalStatus[status];
}

function roleStatusColor(status: RoleApprovalStatus) {
  switch (status) {
    case RoleApprovalStatus.Prospective:
      return 'secondary';
    case RoleApprovalStatus.Approved:
      return 'success';
    case RoleApprovalStatus.Onboarded:
      return 'primary';
    default:
      return 'default';
  }
}

const requirementStatusLabels: Record<ApprovalLedgerStatus, string> = {
  missing: 'Missing',
  completed: 'Completed',
  exempted: 'Exempted',
  expiring: 'Expiring',
  expired: 'Expired',
  availableApplication: 'Application',
};

function requirementStatusColor(status: ApprovalLedgerStatus) {
  switch (status) {
    case 'missing':
    case 'expired':
      return 'error';
    case 'expiring':
      return 'warning';
    case 'availableApplication':
      return 'info';
    case 'completed':
      return 'success';
    case 'exempted':
    default:
      return 'default';
  }
}

function formattedEffectiveDate(card: RoleSummaryCard) {
  return card.effectiveDate ? formatUtcDateOnly(card.effectiveDate) : undefined;
}

function formatDate(date?: Date) {
  return date ? formatUtcDateOnly(date) : undefined;
}

// function SummaryMetric({ label, value }: { label: string; value: number }) {
//   return (
//     <Box
//       sx={{
//         border: 1,
//         borderColor: 'divider',
//         borderRadius: 1,
//         p: 1,
//       }}
//     >
//       <Typography color="text.secondary" variant="caption">
//         {label}
//       </Typography>
//       <Typography className="ph-unmask" variant="h6">
//         {value}
//       </Typography>
//     </Box>
//   );
// }

function RoleActionContainer({
  children,
  disabled,
  expanded,
  label,
  onToggle,
}: {
  children: ReactNode;
  disabled?: boolean;
  expanded: boolean;
  label: string;
  onToggle: () => void;
}) {
  const isExpanded = !disabled && expanded;

  return (
    <Box
      sx={{
        border: 1,
        borderColor: 'divider',
        borderRadius: 1,
        mb: 1,
      }}
    >
      <ListItemButton
        aria-expanded={isExpanded}
        disabled={disabled}
        onClick={onToggle}
      >
        <ListItemText
          primary={label}
          slotProps={{
            primary: { variant: 'body2' },
          }}
        />
      </ListItemButton>
      <Collapse in={isExpanded} unmountOnExit>
        <Box
          sx={{
            borderTop: 1,
            borderColor: 'divider',
            bgcolor: 'background.default',
            p: 1.5,
          }}
        >
          {children}
        </Box>
      </Collapse>
    </Box>
  );
}

function RequirementSummaryRow({
  expanded,
  onSuccess,
  onToggle,
  requirement,
}: {
  expanded: boolean;
  onSuccess: () => void;
  onToggle: () => void;
  requirement: RoleSummaryRequirement;
}) {
  const completedOrExemptedOn = formatDate(requirement.completedOrExemptedOn);
  const validUntil = formatDate(requirement.validUntil);
  const occurrence = requirement.occurrences[0];

  return (
    <Box
      sx={{
        border: 1,
        borderColor: 'divider',
        borderRadius: 1
      }}
    >
      <ButtonBase
        aria-expanded={expanded}
        onClick={onToggle}
        sx={{
          borderRadius: 1,
          display: 'block',
          textAlign: 'left',
          width: '100%',
        }}
      >
        <Box sx={{ p: 1 }}>
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={1}
            sx={{ alignItems: { xs: 'flex-start', sm: 'center' } }}
          >
            <Chip
              color={requirementStatusColor(requirement.status)}
              label={requirementStatusLabels[requirement.status]}
              size="small"
              sx={{ flex: '0 0 auto' }}
            />
            <Box sx={{ minWidth: 0, flex: 1 }}>
              <Typography
                className="ph-unmask"
                variant="body2"
                sx={{ fontWeight: 600 }}
              >
                {requirement.requirementName}
              </Typography>
              {(completedOrExemptedOn || validUntil) && (
                <Typography color="text.secondary" variant="caption">
                  {[
                    completedOrExemptedOn
                      ? `Completed/Exempted ${completedOrExemptedOn}`
                      : null,
                    validUntil ? `Valid until ${validUntil}` : null,
                  ]
                    .filter(Boolean)
                    .join(' · ')}
                </Typography>
              )}
            </Box>
          </Stack>
        </Box>
      </ButtonBase>
      <Collapse in={expanded} unmountOnExit>
        <Box
          sx={{
            borderTop: 1,
            borderColor: 'divider',
            bgcolor: 'background.default',
            p: 1.5,
          }}
        >
          <ApprovalRequirementWorkflowV2
            occurrence={occurrence}
            onSuccess={onSuccess}
          />
        </Box>
      </Collapse>
    </Box>
  );
}

function familyIdFromContext(
  context: RoleSummaryCard['context'] | RemovedRoleSummary['context'] | undefined
) {
  if (
    context?.kind === 'Volunteer Family' ||
    context?.kind === 'Individual Volunteer'
  ) {
    return context.volunteerFamilyId;
  }

  return '';
}

function personForSubject(
  context: RoleSummaryCard['context'] | RemovedRoleSummary['context'] | undefined,
  subject: RoleSummaryCard['subject'] | RemovedRoleSummary['subject'] | undefined
) {
  if (!context || subject?.scope !== 'person') {
    return undefined;
  }

  return context.kind === 'Individual Volunteer'
    ? ({
        id: context.personId,
        firstName: subject.label.split(' ')[0],
        lastName: subject.label.split(' ').slice(1).join(' '),
      } as Person)
    : undefined;
}

export function RoleDetailsDrawerV2({
  card,
  removedRole,
  open,
  onClose,
}: RoleDetailsDrawerV2Props) {
  const familyLookup = useFamilyLookup();
  const [selectedRequirementId, setSelectedRequirementId] = useState<
    string | null
  >(null);
  const [expandedRoleAction, setExpandedRoleAction] =
    useState<ExpandedRoleAction>(null);
  const role = card ?? removedRole;
  const familyId = familyIdFromContext(role?.context);
  const family = familyLookup(familyId);
  const permissions = useFamilyIdPermissions(familyId);
  const canEditRoleParticipation = permissions(
    Permission.EditVolunteerRoleParticipation
  );
  const person =
    role?.subject.scope === 'person'
      ? family?.family?.adults?.find((adult) => adult.item1?.id === role.subject.id)
          ?.item1 ?? personForSubject(role.context, role.subject)
      : undefined;
  const canRemoveRole =
    canEditRoleParticipation &&
    card !== null &&
    (card.subject.scope === 'family' || person !== undefined);
  const canResetRole =
    canEditRoleParticipation &&
    role?.roleRemoval !== undefined &&
    !role.roleRemoval.effectiveUntil &&
    (role.subject.scope === 'family' || person !== undefined);
  const effectiveDate = card ? formattedEffectiveDate(card) : undefined;
  const removedDate = removedRole?.roleRemoval.effectiveSince
    ? formatUtcDateOnly(removedRole.roleRemoval.effectiveSince)
    : undefined;

  useEffect(() => {
    setSelectedRequirementId(null);
    setExpandedRoleAction(null);
  }, [card?.id, open, removedRole?.id]);

  const requirements = card?.requirements.sort((a, b) =>
    b.status.localeCompare(a.status)
    //TODO: Then sort by completed/exempted-on date (descending) within the same status
  ) ?? [];

  return (
    <Drawer
      anchor="right"
      aria-labelledby="role-details-title"
      open={open}
      onClose={onClose}
      slotProps={{
        paper: {
          sx: {
            width: { xs: '100%', sm: 500, md: 560 },
            p: 2,
            pt: { xs: 7, sm: 8, md: 6 },
          },
        },
      }}
    >
      {role && (
        <Stack spacing={2}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'space-between',
              gap: 1,
            }}
          >
            <Box sx={{ minWidth: 0 }}>
              <Typography
                color="text.secondary"
                sx={{ textTransform: 'uppercase' }}
                variant="caption"
              >
                Role Details
              </Typography>
              <Typography
                id="role-details-title"
                className="ph-unmask"
                variant="h5"
              >
                {role.roleName}
              </Typography>
              <Typography
                className="ph-unmask"
                color="text.secondary"
                variant="body2"
              >
                {role.subject.label}
              </Typography>
              {card ? (
                <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                  <Chip
                    color={roleStatusColor(card.status)}
                    label={statusLabel(card.status)}
                    size="small"
                  />
                  {effectiveDate && (
                    <Chip
                      className="ph-unmask"
                      label={effectiveDate}
                      size="small"
                      variant="outlined"
                    />
                  )}
                </Stack>
              ) : (
                <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                  <Chip color="default" label="Removed" size="small" />
                  {removedDate && (
                    <Chip
                      className="ph-unmask"
                      label={removedDate}
                      size="small"
                      variant="outlined"
                    />
                  )}
                </Stack>
              )}
            </Box>
            <IconButton aria-label="close role details" onClick={onClose}>
              <CloseIcon />
            </IconButton>
          </Box>

          {card && (
            <>
              <Typography variant="subtitle2">Requirements</Typography>
              
              <Stack spacing={1}>
                <LinearProgress
                  aria-label={`${card.completionPercentage}% complete`}
                  variant="determinate"
                  value={card.completionPercentage}
                  sx={{ height: 6, borderRadius: 999 }}
                />
              </Stack>
{/* 
              <Stack spacing={1}>
                <Box
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: {
                      xs: 'repeat(2, minmax(0, 1fr))',
                      sm: 'repeat(4, minmax(0, 1fr))',
                    },
                    gap: 1,
                  }}
                >
                  <SummaryMetric
                    label="Completed"
                    value={card.completedCount}
                  />
                  <SummaryMetric
                    label="Missing"
                    value={card.missingCount}
                  />
                  <SummaryMetric
                    label="Expired"
                    value={card.expiredCount}
                  />
                  <SummaryMetric
                    label="Exempted"
                    value={card.exemptedCount}
                  />
                </Box>
              </Stack> */}

              <Stack spacing={1}>
                {requirements.length === 0 ? (
                  <Typography color="text.secondary" variant="body2">
                    No requirements for this role.
                  </Typography>
                ) : (
                  <Stack spacing={1}>
                    {requirements.map((requirement) => (
                      <RequirementSummaryRow
                        key={requirement.id}
                        expanded={selectedRequirementId === requirement.id}
                        onSuccess={() => setSelectedRequirementId(null)}
                        onToggle={() =>
                          setSelectedRequirementId((currentRequirementId) =>
                            currentRequirementId === requirement.id
                              ? null
                              : requirement.id
                          )
                        }
                        requirement={requirement}
                      />
                    ))}
                  </Stack>
                )}
              </Stack>
            </>
          )}

          <Divider />

          <Stack spacing={1}>
            <Typography variant="subtitle2">Role Actions</Typography>
            <List disablePadding>
              {(canResetRole || removedRole) && (
                <RoleActionContainer
                  disabled={!canResetRole}
                  expanded={expandedRoleAction === 'reset'}
                  label="Reset Participation"
                  onToggle={() =>
                    setExpandedRoleAction((currentAction) =>
                      currentAction === 'reset' ? null : 'reset'
                    )
                  }
                >
                  {canResetRole && role.roleRemoval && (
                    <RoleResetSectionV2
                      volunteerFamilyId={familyId}
                      person={person}
                      role={role.roleName}
                      roleRemoval={role.roleRemoval}
                      onCancel={() => setExpandedRoleAction(null)}
                      onSuccess={() => setExpandedRoleAction(null)}
                    />
                  )}
                </RoleActionContainer>
              )}
              {card && (
                <>
                  {/* Make this a button, at the top of the drawer, and use the modal dialog from V1 instead of an expanding section. You can use a superseding drawer instead. :) */}
                  <RoleActionContainer
                    disabled={!canRemoveRole}
                    expanded={expandedRoleAction === 'remove'}
                    label="Remove Role"
                    onToggle={() =>
                      setExpandedRoleAction((currentAction) =>
                        currentAction === 'remove' ? null : 'remove'
                      )
                    }
                  >
                    {canRemoveRole && (
                      <RoleRemovalSectionV2
                        volunteerFamilyId={familyId}
                        person={person}
                        role={card.roleName}
                        onCancel={() => setExpandedRoleAction(null)}
                        onSuccess={() => setExpandedRoleAction(null)}
                      />
                    )}
                  </RoleActionContainer>
                  {/* TODO: Remove the 'Complete other' action from here -- it doesn't work at a role-specific level. */}
                  <RoleActionContainer
                    expanded={expandedRoleAction === 'launcher'}
                    label="Complete Other"
                    onToggle={() =>
                      setExpandedRoleAction((currentAction) =>
                        currentAction === 'launcher' ? null : 'launcher'
                      )
                    }
                  >
                    <ApprovalWorkflowLauncherV2
                      subject={card.subject}
                      context={card.context}
                      onSuccess={() => setExpandedRoleAction(null)}
                    />
                  </RoleActionContainer>
                </>
              )}
            </List>
          </Stack>
        </Stack>
      )}
    </Drawer>
  );
}

import CloseIcon from '@mui/icons-material/Close';
import {
  Box,
  Button,
  ButtonBase,
  Chip,
  Drawer,
  IconButton,
  LinearProgress,
  Stack,
  Typography,
} from '@mui/material';
import { Fragment, useEffect, useState } from 'react';
import {
  CombinedFamilyInfo,
  Permission,
  Person,
  RoleApprovalStatus,
  RoleRemoval,
  RoleRemovalReason,
} from '../GeneratedClient';
import { useFamilyLookup } from '../Model/DirectoryModel';
import { useFamilyIdPermissions } from '../Model/SessionModel';
import { formatUtcDateOnly } from '../Utilities/dateUtils';
import type {
  ApprovalLedgerRow,
  ApprovalLedgerStatus,
} from './approvalLedgerViewModel';
import { ApprovalDetailsDrawerV2 } from './ApprovalDetailsDrawerV2';
import {
  RoleManagementDrawerV2,
  type RoleManagementMode,
} from './RoleManagementDrawerV2';
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

type ParticipantState = 'active' | 'inactive' | 'optedOut' | 'denied';
type RoleParticipant = {
  id: string;
  label: string;
  state: ParticipantState;
};

const participantStateLabels: Record<ParticipantState, string> = {
  active: 'Active',
  inactive: 'Inactive',
  optedOut: 'Opted Out',
  denied: 'Denied',
};

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

function roleKey(role: string | undefined) {
  return (role ?? '').trim().replace(/\s+/g, ' ').toLocaleLowerCase();
}

function activeRoleRemoval(
  roleRemovals: RoleRemoval[] | undefined,
  roleName: string
) {
  const now = new Date();
  const key = roleKey(roleName);

  return roleRemovals
    ?.filter(
      (removal) =>
        roleKey(removal.roleName) === key &&
        (!removal.effectiveUntil || removal.effectiveUntil > now)
    )
    .sort(
      (a, b) =>
        (b.effectiveSince?.getTime() ?? 0) - (a.effectiveSince?.getTime() ?? 0)
    )[0];
}

function stateFromRoleRemoval(removal: RoleRemoval): ParticipantState {
  switch (removal.reason) {
    case RoleRemovalReason.OptOut:
      return 'optedOut';
    case RoleRemovalReason.Denied:
      return 'denied';
    case RoleRemovalReason.Inactive:
    default:
      return 'inactive';
  }
}

function participantStatusColor(state: ParticipantState) {
  switch (state) {
    case 'active':
      return 'success';
    case 'optedOut':
      return 'warning';
    case 'denied':
      return 'error';
    case 'inactive':
    default:
      return 'default';
  }
}

function roleApprovalIsActive(
  approval: { currentStatus?: RoleApprovalStatus } | undefined
) {
  return approval?.currentStatus !== undefined;
}

function personLabel(person: Person | undefined) {
  return [person?.firstName, person?.lastName].filter(Boolean).join(' ') || 'Adult';
}

function adultPerson(
  family: CombinedFamilyInfo | undefined,
  personId: string | undefined
) {
  return family?.family?.adults?.find((adult) => adult.item1?.id === personId)?.item1;
}

function buildRoleParticipants(
  family: CombinedFamilyInfo | undefined,
  role: RoleSummaryCard | RemovedRoleSummary
) {
  const volunteerInfo = family?.volunteerFamilyInfo;
  const roleName = role.roleName;

  if (!volunteerInfo) {
    return [];
  }

  if (role.subject.scope === 'person') {
    return [];
  }

  const participants: RoleParticipant[] = [];

  Object.entries(volunteerInfo.individualVolunteers ?? {}).forEach(
    ([personId, individualVolunteer]) => {
      const removal = activeRoleRemoval(
        individualVolunteer.roleRemovals,
        roleName
      );
      const person = adultPerson(family, personId);
      const participatesInFamilyRole =
        person?.active &&
        roleApprovalIsActive(volunteerInfo.familyRoleApprovals?.[roleName]);

      if (!removal && !participatesInFamilyRole) {
        return;
      }

      participants.push({
        id: personId,
        label: personLabel(person),
        state: removal ? stateFromRoleRemoval(removal) : 'active',
      });
    }
  );

  return participants; // Maintain the standard order of family members
}

function ParticipantsSection({
  participants,
}: {
  participants: RoleParticipant[];
}) {
  if (participants.length === 0) {
    return null;
  }

  return (
    <Stack spacing={1}>
      <Typography variant="subtitle2">Participants</Typography>
      {participants.map((participant) => (
        <Box
          key={participant.id}
          sx={{
            alignItems: 'center',
            display: 'flex',
            gap: 1,
            justifyContent: 'space-between',
          }}
        >
          <Typography className="ph-unmask" variant="body2">
            {participant.label}
          </Typography>
          <Chip
            color={participantStatusColor(participant.state)}
            label={participantStateLabels[participant.state]}
            size="small"
          />
        </Box>
      ))}
    </Stack>
  );
}

function RoleActionButton({
  disabled,
  label,
  onClick,
}: {
  disabled?: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <Button disabled={disabled} onClick={onClick} variant="contained">
      {label}
    </Button>
  );
}

function RequirementSummaryRow({
  onClick,
  requirement,
}: {
  onClick: () => void;
  requirement: RoleSummaryRequirement;
}) {
  const completedOrExemptedOn = formatDate(requirement.completedOrExemptedOn);
  const validUntil = formatDate(requirement.validUntil);

  return (
    <Box
      sx={{
        border: 1,
        borderColor: 'divider',
        borderRadius: 1,
      }}
    >
      <ButtonBase
        onClick={onClick}
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
            sx={{ alignItems: { xs: 'flex-start', sm: 'flex-start' } }}
          >
            <Stack
              direction={{ xs: 'row', sm: 'column' }}
              spacing={0.5}
              sx={{ alignItems: { xs: 'center', sm: 'center' }, width: 80 }}
            >
              <Chip
                color={requirementStatusColor(requirement.status)}
                label={requirementStatusLabels[requirement.status]}
                size="small"
                sx={{ flex: '0 0 auto' }}
              />
              <Typography
                variant="caption"
              >
                {completedOrExemptedOn}
              </Typography>
            </Stack>
            <Stack
              direction="column"
              spacing={1}
              sx={{ alignItems: { xs: 'flex-start', sm: 'flex-start' } }}
            >
              <Typography
                className="ph-unmask"
                variant="body2"
                sx={{ fontWeight: 600 }}
              >
                {requirement.requirementName}
                {requirement.occurrences.flatMap(occurrence => occurrence.policyVersions).filter(version => version).map(version =>
                  <Fragment key={`${version?.roleName}-${version?.version}`}>
                    &nbsp;
                    <Chip color='default' variant='outlined' size='small'
                      label={`${version?.version}`}
                      />
                  </Fragment>
                )}
              </Typography>
              {(completedOrExemptedOn || validUntil) && (
                <Typography color="text.secondary" variant="caption">
                  {[
                    requirement.subject.label ?? null,
                    validUntil ? `Valid until ${validUntil}` : null,
                  ]
                    .filter(Boolean)
                    .join(' · ')}
                </Typography>
              )}
            </Stack>
          </Stack>
        </Box>
      </ButtonBase>
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
  const [selectedRequirementRow, setSelectedRequirementRow] =
    useState<ApprovalLedgerRow | null>(null);
  const [selectedRoleAction, setSelectedRoleAction] =
    useState<RoleManagementMode | null>(null);
  const role = card ?? removedRole ?? null;
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
  const effectiveDate = card ? formattedEffectiveDate(card) : undefined;
  const removedDate = removedRole?.roleRemoval.effectiveSince
    ? formatUtcDateOnly(removedRole.roleRemoval.effectiveSince)
    : undefined;
  const participants = role ? buildRoleParticipants(family, role) : [];
  const headerActions = (() => {
    if (card) {
      return (
        <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1 }}>
          <RoleActionButton
            disabled={!canRemoveRole}
            label="Remove Role"
            onClick={() => setSelectedRoleAction('remove')}
          />
          <RoleActionButton
            label="Complete Other"
            onClick={() => setSelectedRoleAction('completeOther')}
          />
        </Stack>
      );
    }

    if (removedRole) {
      return (
        <RoleActionButton
          disabled={!canEditRoleParticipation}
          label="Reset Participation"
          onClick={() => setSelectedRoleAction('resetParticipation')}
        />
      );
    }

    return null;
  })();

  useEffect(() => {
    setSelectedRequirementRow(null);
    setSelectedRoleAction(null);
  }, [card?.id, open, removedRole?.id]);

  const requirements = [...(card?.requirements ?? [])].sort((a, b) =>
    b.status.localeCompare(a.status)
  );

  return (
    <>
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
              <Box sx={{ minWidth: 0, flex: 1 }}>
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
                <Box
                  sx={{
                    alignItems: 'center',
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: 1,
                    justifyContent: 'space-between',
                    mt: 1,
                  }}
                >
                  {card ? (
                    <Stack direction="row" spacing={1}>
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
                    <Stack direction="row" spacing={1}>
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
                  {headerActions}
                </Box>
              </Box>
              <IconButton aria-label="close role details" onClick={onClose}>
                <CloseIcon />
              </IconButton>
            </Box>

            <ParticipantsSection participants={participants} />

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
                          onClick={() =>
                            setSelectedRequirementRow(requirement.ledgerRow)
                          }
                          requirement={requirement}
                        />
                      ))}
                    </Stack>
                  )}
                </Stack>
              </>
            )}

          </Stack>
        )}
      </Drawer>
      <ApprovalDetailsDrawerV2
        row={selectedRequirementRow}
        open={selectedRequirementRow !== null}
        onClose={() => setSelectedRequirementRow(null)}
      />
      <RoleManagementDrawerV2
        mode={selectedRoleAction}
        person={person}
        role={role}
        volunteerFamilyId={familyId}
        open={selectedRoleAction !== null}
        onClose={() => setSelectedRoleAction(null)}
      />
    </>
  );
}

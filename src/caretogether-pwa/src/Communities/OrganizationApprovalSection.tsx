import {
  AssignmentTurnedInOutlined,
  Close as CloseIcon,
} from '@mui/icons-material';
import {
  Alert,
  Box,
  Button,
  Card,
  CardActionArea,
  Chip,
  Drawer,
  IconButton,
  LinearProgress,
  Paper,
  Stack,
  Typography,
} from '@mui/material';
import { alpha, Theme } from '@mui/material/styles';
import { format } from 'date-fns';
import { useState } from 'react';
import {
  CommunityInfo,
  EffectiveLocationPolicy,
  Permission,
  RoleRemovalReason,
} from '../GeneratedClient';
import { ApprovalLedgerSection } from '../Families/ApprovalLedgerSection';
import type {
  ApprovalLedgerRow,
  ApprovalLedgerStatus,
} from '../Families/approvalLedgerViewModel';
import { v2Typography } from '../Families/v2Typography';
import { useBackdrop } from '../Hooks/useBackdrop';
import { useOrganizationApprovalsModel } from '../Model/OrganizationApprovalsModel';
import { useCommunityPermissions } from '../Model/SessionModel';
import {
  roleApprovalStatusChipColor,
  roleApprovalStatusLabel,
} from '../Volunteers/roleApprovalStatusPresentation';
import { OrganizationApprovalDetailsDrawerV2 } from './OrganizationApprovalDetailsDrawerV2';
import {
  OrganizationRoleSummaryCard,
  RemovedOrganizationRoleSummary,
  useOrganizationApprovalViewModel,
} from './useOrganizationApprovalViewModel';

type SelectedRole =
  | { kind: 'active'; card: OrganizationRoleSummaryCard }
  | { kind: 'removed'; card: RemovedOrganizationRoleSummary };

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

function activeCardSx(status: OrganizationRoleSummaryCard['status']) {
  return (theme: Theme) => {
    const color = roleApprovalStatusChipColor(status);
    if (color === 'default') {
      return {
        backgroundColor: theme.palette.action.hover,
        borderColor: theme.palette.divider,
      };
    }
    return {
      backgroundColor: alpha(theme.palette[color].main, 0.06),
      borderColor: alpha(theme.palette[color].main, 0.28),
    };
  };
}

function OrganizationRoleCard({
  card,
  organizationName,
  onClick,
}: {
  card: OrganizationRoleSummaryCard | RemovedOrganizationRoleSummary;
  organizationName: string;
  onClick: () => void;
}) {
  const removed = 'roleRemoval' in card;
  const statusLabel = removed
    ? card.roleRemoval.effectiveSince
      ? `Removed • ${format(card.roleRemoval.effectiveSince, 'MMM d, yyyy')}`
      : 'Removed'
    : [
        roleApprovalStatusLabel(card.status),
        card.effectiveDate
          ? format(card.effectiveDate, 'MMM d, yyyy')
          : undefined,
      ]
        .filter(Boolean)
        .join(' • ');

  return (
    <Card
      variant="outlined"
      sx={[
        {
          width: 240,
          flex: '0 0 auto',
          transition: (theme) =>
            theme.transitions.create(['box-shadow', 'transform'], {
              duration: theme.transitions.duration.shortest,
            }),
          '&:hover': { boxShadow: 2, transform: 'translateY(-1px)' },
          '&:focus-within': { boxShadow: 2 },
        },
        removed
          ? { bgcolor: 'action.hover', borderColor: 'divider' }
          : activeCardSx(card.status),
      ]}
    >
      <CardActionArea onClick={onClick} sx={{ height: '100%', p: 1.5 }}>
        <Stack spacing={1}>
          <Stack spacing={0.25}>
            <Typography color="text.secondary" variant="body2">
              {organizationName}
            </Typography>
            <Typography
              className="ph-unmask"
              color={removed ? 'text.secondary' : 'text.primary'}
              variant="body2"
              sx={{ fontWeight: 600 }}
            >
              {card.roleName}
            </Typography>
            <Typography
              className="ph-unmask"
              color="text.secondary"
              variant="caption"
            >
              {statusLabel}
            </Typography>
          </Stack>
          {removed ? (
            <Box
              sx={{
                height: 5,
                borderRadius: 999,
                bgcolor: 'action.disabledBackground',
              }}
            />
          ) : (
            <LinearProgress
              aria-label={`${card.completionPercentage}% complete`}
              variant="determinate"
              value={card.completionPercentage}
              sx={{ height: 5, borderRadius: 999 }}
            />
          )}
        </Stack>
      </CardActionArea>
    </Card>
  );
}

function OrganizationRoleDetailsDrawer({
  communityInfo,
  selectedRole,
  onClose,
}: {
  communityInfo: CommunityInfo;
  selectedRole: SelectedRole | null;
  onClose: () => void;
}) {
  const permissions = useCommunityPermissions(communityInfo);
  const model = useOrganizationApprovalsModel();
  const withBackdrop = useBackdrop();
  const card = selectedRole?.card;
  const activeCard =
    selectedRole?.kind === 'active' ? selectedRole.card : undefined;
  const removed = selectedRole?.kind === 'removed';
  const requirements = activeCard?.requirements ?? [];

  async function updateParticipation() {
    if (!card) return;
    await withBackdrop(() =>
      removed
        ? model.resetRole(communityInfo.community.id, card.roleName)
        : model.removeRole(
            communityInfo.community.id,
            card.roleName,
            RoleRemovalReason.OptOut
          )
    );
    onClose();
  }

  return (
    <Drawer
      anchor="right"
      aria-labelledby="organization-role-details-title"
      open={selectedRole !== null}
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
      {card && (
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
                {...v2Typography.fieldLabel}
                sx={[
                  v2Typography.fieldLabel.sx,
                  { textTransform: 'uppercase' },
                ]}
              >
                Organization Role
              </Typography>
              <Typography
                className="ph-unmask"
                id="organization-role-details-title"
                {...v2Typography.workspaceTitle}
              >
                {card.roleName}
              </Typography>
              {activeCard && (
                <Chip
                  className="ph-unmask"
                  color={roleApprovalStatusChipColor(activeCard.status)}
                  label={roleApprovalStatusLabel(activeCard.status)}
                  size="small"
                  sx={{ mt: 1 }}
                />
              )}
              {removed && (
                <Chip
                  className="ph-unmask"
                  label="Removed"
                  size="small"
                  sx={{ mt: 1 }}
                />
              )}
            </Box>
            <IconButton aria-label="close role details" onClick={onClose}>
              <CloseIcon />
            </IconButton>
          </Box>

          {activeCard && (
            <Stack spacing={1}>
              <Typography {...v2Typography.sectionTitle}>
                Requirements
              </Typography>
              {requirements.length === 0 ? (
                <Typography {...v2Typography.secondaryValue}>
                  No requirements to display.
                </Typography>
              ) : (
                requirements.map((requirement: ApprovalLedgerRow) => (
                  <Box
                    key={requirement.id}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 1,
                      borderBottom: 1,
                      borderColor: 'divider',
                      py: 1,
                    }}
                  >
                    <Typography
                      className="ph-unmask"
                      {...v2Typography.browserCell}
                    >
                      {requirement.requirementName}
                    </Typography>
                    <Chip
                      className="ph-unmask"
                      color={requirementStatusColor(requirement.status)}
                      label={requirementStatusLabels[requirement.status]}
                      size="small"
                    />
                  </Box>
                ))
              )}
            </Stack>
          )}

          {permissions(Permission.EditOrganizationRoleParticipation) && (
            <Button
              color={removed ? 'primary' : 'error'}
              variant="contained"
              onClick={() => void updateParticipation()}
            >
              {removed ? 'Restore Role' : 'Opt Out'}
            </Button>
          )}
        </Stack>
      )}
    </Drawer>
  );
}

export function OrganizationApprovalSection({
  communityInfo,
  policy,
}: {
  communityInfo: CommunityInfo;
  policy: EffectiveLocationPolicy;
}) {
  const organization = communityInfo.community;
  const approval = communityInfo.approvalInfo;
  const permissions = useCommunityPermissions(communityInfo);
  const model = useOrganizationApprovalsModel();
  const withBackdrop = useBackdrop();
  const { approvalLedgerRows } =
    useOrganizationApprovalViewModel(communityInfo);
  const configuredRoles = Object.keys(
    policy.organizationApprovalPolicy?.organizationRoles ?? {}
  );

  if (configuredRoles.length === 0) return null;

  async function activate() {
    await withBackdrop(() => model.activate(organization.id));
  }

  if (!approval) {
    return (
      <Paper
        variant="outlined"
        sx={{
          p: { xs: 2, md: 3 },
          borderStyle: 'dashed',
          background: (theme) =>
            `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.04)}, transparent 70%)`,
        }}
      >
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={2}
          sx={{
            alignItems: { sm: 'center' },
            justifyContent: 'space-between',
          }}
        >
          <Box>
            <Typography className="ph-unmask" variant="h5">
              Approval roles
            </Typography>
            <Typography color="text.secondary" variant="body2" sx={{ mt: 0.5 }}>
              Start an approval process to view available Organization role
              applications.
            </Typography>
          </Box>
          {permissions(Permission.ActivateOrganizationApprovals) && (
            <Button
              className="ph-unmask"
              variant="contained"
              startIcon={<AssignmentTurnedInOutlined />}
              onClick={() => void activate()}
            >
              Start approval process
            </Button>
          )}
        </Stack>
      </Paper>
    );
  }

  const canViewStatus = permissions(Permission.ViewApprovalStatus);
  const canViewProgress = permissions(Permission.ViewApprovalProgress);
  if (!canViewStatus && !canViewProgress) return null;

  return (
    <Stack spacing={2}>
      {canViewProgress && (
        <ApprovalLedgerSection
          rows={approvalLedgerRows}
          renderDetailsDrawer={(row, open, onClose) => (
            <OrganizationApprovalDetailsDrawerV2
              communityInfo={communityInfo}
              policy={policy}
              row={row}
              open={open}
              onClose={onClose}
            />
          )}
        />
      )}

      {canViewProgress && approvalLedgerRows.length === 0 && (
        <Alert severity="info">
          There are no approval requirements to display yet.
        </Alert>
      )}
    </Stack>
  );
}

export function OrganizationApprovalRoleSummaryCards({
  communityInfo,
}: {
  communityInfo: CommunityInfo;
}) {
  const permissions = useCommunityPermissions(communityInfo);
  const [selectedRole, setSelectedRole] = useState<SelectedRole | null>(null);
  const { removedRoleSummaries, roleSummaryCards } =
    useOrganizationApprovalViewModel(communityInfo);

  if (
    !communityInfo.approvalInfo ||
    !permissions(Permission.ViewApprovalStatus) ||
    (roleSummaryCards.length === 0 && removedRoleSummaries.length === 0)
  ) {
    return null;
  }

  return (
    <Box sx={{ mb: 2 }}>
      <Box sx={{ overflowX: 'auto', pb: 0.5 }}>
        <Stack
          direction="row"
          spacing={1}
          sx={{ width: 'max-content', minWidth: '100%' }}
        >
          {roleSummaryCards.map((card) => (
            <OrganizationRoleCard
              key={card.id}
              card={card}
              organizationName={communityInfo.community.name}
              onClick={() => setSelectedRole({ kind: 'active', card })}
            />
          ))}
          {removedRoleSummaries.map((card) => (
            <OrganizationRoleCard
              key={card.id}
              card={card}
              organizationName={communityInfo.community.name}
              onClick={() => setSelectedRole({ kind: 'removed', card })}
            />
          ))}
        </Stack>
      </Box>
      <OrganizationRoleDetailsDrawer
        communityInfo={communityInfo}
        selectedRole={selectedRole}
        onClose={() => setSelectedRole(null)}
      />
    </Box>
  );
}

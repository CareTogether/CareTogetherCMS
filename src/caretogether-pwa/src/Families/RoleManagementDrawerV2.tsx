import CloseIcon from '@mui/icons-material/Close';
import { Box, Drawer, IconButton, Stack, Typography } from '@mui/material';
import type { Person } from '../GeneratedClient';
import { ApprovalWorkflowLauncherV2 } from './ApprovalWorkflowLauncherV2';
import { RoleRemovalSectionV2 } from './RoleRemovalSectionV2';
import { RoleResetSectionV2 } from './RoleResetSectionV2';
import type {
  RemovedRoleSummary,
  RoleSummaryCard,
} from './roleSummaryViewModel';

export type RoleManagementMode =
  | 'remove'
  | 'resetParticipation'
  | 'completeOther';

type RoleManagementDrawerV2Props = {
  mode: RoleManagementMode | null;
  role: RoleSummaryCard | RemovedRoleSummary | null;
  person?: Person;
  volunteerFamilyId: string;
  open: boolean;
  onClose: () => void;
};

const roleManagementContent: Record<
  RoleManagementMode,
  { title: string }
> = {
  remove: {
    title: 'Remove Role',
  },
  resetParticipation: {
    title: 'Reset Participation',
  },
  completeOther: {
    title: 'Complete Other',
  },
};

function RoleManagementBody({
  mode,
  onClose,
  person,
  role,
  volunteerFamilyId,
}: {
  mode: RoleManagementMode;
  onClose: () => void;
  person?: Person;
  role: RoleSummaryCard | RemovedRoleSummary;
  volunteerFamilyId: string;
}) {
  if (mode === 'remove' && 'roleApproval' in role) {
    return (
      <RoleRemovalSectionV2
        volunteerFamilyId={volunteerFamilyId}
        person={person}
        role={role.roleName}
        onCancel={onClose}
        onSuccess={onClose}
      />
    );
  }

  if (
    mode === 'resetParticipation' &&
    'roleRemoval' in role &&
    role.roleRemoval
  ) {
    return (
      <RoleResetSectionV2
        volunteerFamilyId={volunteerFamilyId}
        person={person}
        role={role.roleName}
        roleRemoval={role.roleRemoval}
        onCancel={onClose}
        onSuccess={onClose}
      />
    );
  }

  if (mode === 'completeOther') {
    return (
      <ApprovalWorkflowLauncherV2
        subject={role.subject}
        context={role.context}
        onSuccess={onClose}
      />
    );
  }

  return null;
}

export function RoleManagementDrawerV2({
  mode,
  person,
  role,
  volunteerFamilyId,
  open,
  onClose,
}: RoleManagementDrawerV2Props) {
  const content = mode ? roleManagementContent[mode] : undefined;

  return (
    <Drawer
      anchor="right"
      aria-labelledby="role-management-title"
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
      {role && content && mode && (
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
                Role Management
              </Typography>
              <Typography id="role-management-title" variant="h5">
                {content.title}
              </Typography>
              <Typography
                color="text.secondary"
                variant="body2"
              >
                {role.roleName} for {role.subject.label}
              </Typography>
            </Box>
            <IconButton aria-label="close role management" onClick={onClose}>
              <CloseIcon />
            </IconButton>
          </Box>

          <RoleManagementBody
            mode={mode}
            onClose={onClose}
            person={person}
            role={role}
            volunteerFamilyId={volunteerFamilyId}
          />
        </Stack>
      )}
    </Drawer>
  );
}

import { Box, Stack, Typography } from '@mui/material';
import { VolunteerRoleApprovalStatusChip } from './VolunteerRoleApprovalStatusChip';
import { VolunteerApprovalRolesPresentation } from './VolunteerApprovalTab/volunteerApprovalRolePresentation';

type Props = {
  roles: VolunteerApprovalRolesPresentation;
};

function RoleChipList({
  roles,
}: {
  roles: VolunteerApprovalRolesPresentation['familyRoles'];
}) {
  return (
    <Box sx={{ display: 'flex', flexWrap: 'wrap' }}>
      {roles.map((role) => (
        <VolunteerRoleApprovalStatusChip
          key={role.roleName}
          sx={{ margin: '.125rem .25rem .125rem 0' }}
          roleName={role.roleName}
          status={role.status}
        />
      ))}
    </Box>
  );
}

export function VolunteerApprovalRolesCellV2({ roles }: Props) {
  return (
    <Stack spacing={0.5} sx={{ minWidth: 0, py: 0.5, width: '100%' }}>
      <Box
        sx={{
          alignItems: 'flex-start',
          display: 'grid',
          gap: 1,
          gridTemplateColumns: '80px minmax(0, 1fr)',
        }}
      >
        <Typography sx={{ minWidth: 'max-content' }}>Family:</Typography>
        <RoleChipList roles={roles.familyRoles} />
      </Box>
      <Box
        sx={{
          alignItems: 'flex-start',
          display: 'grid',
          gap: 1,
          gridTemplateColumns: '80px minmax(0, 1fr)',
        }}
      >
        <Typography sx={{ minWidth: 'max-content' }}>Individual:</Typography>
        <RoleChipList roles={roles.individualRoles} />
      </Box>
    </Stack>
  );
}

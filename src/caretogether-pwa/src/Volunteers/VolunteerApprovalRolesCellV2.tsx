import { Box } from '@mui/material';
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
          key={`${role.personId ?? 'family'}:${role.roleName}`}
          sx={{ margin: '.125rem .25rem .125rem 0' }}
          currentStatus={role.currentStatus}
          personName={role.personName}
          roleName={role.roleName}
          statusLabel={role.statusLabel}
          status={role.status}
        />
      ))}
    </Box>
  );
}

export function VolunteerApprovalRolesCellV2({ roles }: Props) {
  return (
    <Box sx={{ display: 'flex', flexWrap: 'wrap', minWidth: 0, py: 0.5 }}>
      <RoleChipList roles={[...roles.familyRoles, ...roles.individualRoles]} />
    </Box>
  );
}

import { Box, Chip, Tooltip } from '@mui/material';
import { RoleRemoval } from '../GeneratedClient';
import { VolunteerRoleApprovalStatusChip } from '../Volunteers/VolunteerRoleApprovalStatusChip';
import {
  qualifyingRoleApprovals,
  RoleApproval,
} from './roleApprovalStatusBadgeUtils';

type RoleApprovalStatusBadgesProps = {
  roleApprovals?: Record<string, RoleApproval>;
  roleRemovals?: RoleRemoval[];
  maxVisible?: number;
};

export function RoleApprovalStatusBadges({
  roleApprovals,
  roleRemovals,
  maxVisible = 2,
}: RoleApprovalStatusBadgesProps) {
  const approvals = qualifyingRoleApprovals(roleApprovals, roleRemovals);
  const visibleApprovals = approvals.slice(0, maxVisible);
  const hiddenApprovals = approvals.slice(maxVisible);

  if (approvals.length === 0) {
    return null;
  }

  return (
    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
      {visibleApprovals.map(([role, approval]) => (
        <VolunteerRoleApprovalStatusChip
          key={role}
          roleName={role}
          status={approval?.effectiveRoleApprovalStatus}
        />
      ))}
      {hiddenApprovals.length > 0 && (
        <Tooltip
          arrow
          title={
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
              {hiddenApprovals.map(([role, approval]) => (
                <VolunteerRoleApprovalStatusChip
                  key={role}
                  roleName={role}
                  status={approval?.effectiveRoleApprovalStatus}
                />
              ))}
            </Box>
          }
        >
          <Chip
            size="small"
            variant="outlined"
            label={`+${hiddenApprovals.length} more`}
          />
        </Tooltip>
      )}
    </Box>
  );
}

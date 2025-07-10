import { Box, Typography } from '@mui/material';
import { useRecoilValue } from 'recoil';
import { policyData } from '../../../../Model/ConfigurationModel';
import { Table } from './Table';

export default function ApprovalPolicies() {
  const effectiveLocationPolicy = useRecoilValue(policyData);
  const volunteerRoles =
    effectiveLocationPolicy.volunteerPolicy?.volunteerRoles;

  return (
    <Box>
      <Typography variant="h2">Individual Volunteer Policies</Typography>

      {volunteerRoles &&
        Object.entries(volunteerRoles).map(([key, policy]) => (
          <Box key={key} sx={{ mb: 5 }}>
            <Typography variant="h3" mb={1}>
              {policy.volunteerRoleType}
            </Typography>

            {/* <pre>{JSON.stringify(policy, null, 2)}</pre> */}
            <Table
              rows={[...policy.policyVersions!].sort(
                (a, b) =>
                  (a.supersededAtUtc?.getTime() || 0) -
                  (b.supersededAtUtc?.getTime() || 0)
              )}
            />
          </Box>
        ))}
    </Box>
  );
}

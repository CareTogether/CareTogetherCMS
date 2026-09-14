import { useCallback, useEffect, useState } from 'react';
import { Add as AddIcon } from '@mui/icons-material';
import { Box, Button, Paper, Stack, Typography } from '@mui/material';
import { useScreenTitle } from '../Shell/ShellScreenTitle';
import { AddNewReferralDrawer } from './AddNewReferralDrawer';
import { useRequiredSelectedLocationContext } from '../Model/Data';
import { Permission } from '../GeneratedClient';
import { useAppNavigate } from '../Hooks/useAppNavigate';
import { ProgressBackdrop } from '../Shell/ProgressBackdrop';
import { useGlobalPermissions } from '../Model/SessionModel';
import { wideTablePageSx } from '../Utilities/wideTablePageSx';
import { useReferralsBrowserViewModel } from './useReferralsBrowserViewModel';
import { ReferralsDataGridV2 } from './ReferralsDataGridV2';
import type { ReferralBrowserRowV2 } from './referralBrowserTypes';
import { v2Typography } from '../Families/v2Typography';
import { useReferralsAccessGate } from './useReferralsAccessGate';

export function ReferralsScreenV2() {
  useScreenTitle('Referrals');

  const appNavigate = useAppNavigate();
  const {
    shouldRedirect,
    shouldShowLoading,
    shouldShowReferrals,
  } = useReferralsAccessGate();

  useEffect(() => {
    if (shouldRedirect) {
      appNavigate.dashboard();
    }
  }, [appNavigate, shouldRedirect]);

  if (shouldShowLoading) {
    return (
      <ProgressBackdrop opaque>
        <p>Loading...</p>
      </ProgressBackdrop>
    );
  }

  if (!shouldShowReferrals) {
    return null;
  }

  return <ReferralsScreenV2Content />;
}

function ReferralsScreenV2Content() {
  const permissions = useGlobalPermissions();
  const { organizationId, locationId } = useRequiredSelectedLocationContext();

  const [openNewReferral, setOpenNewReferral] = useState(false);

  const {
    assignmentRoleOptions,
    canViewFunctionAssignments,
    counties,
    customFields,
    rows,
  } = useReferralsBrowserViewModel();
  const hasFeaturebaseChat = permissions(Permission.AccessSupportScreen);
  const appNavigate = useAppNavigate();
  const handleRowClick = useCallback(
    (row: ReferralBrowserRowV2) => appNavigate.referral(row.id),
    [appNavigate]
  );

  return (
    <Box
      sx={{
        ...wideTablePageSx(hasFeaturebaseChat),
        boxSizing: 'border-box',
        px: { xs: 2, md: 3 },
        py: { xs: 2, md: 3 },
      }}
    >
      <Stack spacing={2} sx={{ flex: 1, minHeight: 0 }}>
        <Box>
          <Typography className="ph-unmask" {...v2Typography.pageTitle}>
            Referrals
          </Typography>
          <Typography
            className="ph-unmask"
            {...v2Typography.secondaryValue}
            sx={{ ...v2Typography.secondaryValue.sx, mt: 0.5 }}
          >
            Browse and manage referrals.
          </Typography>
        </Box>

        {permissions(Permission.CreateV1Referral) && (
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'flex-end',
            }}
          >
            <Button
              size="small"
              variant="contained"
              startIcon={<AddIcon />}
              sx={{
                alignSelf: { xs: 'stretch', md: 'center' },
                flexShrink: 0,
                whiteSpace: 'nowrap',
              }}
              onClick={() => setOpenNewReferral(true)}
            >
              Add new referral
            </Button>
          </Box>
        )}

        <Paper
          variant="outlined"
          sx={{
            borderRadius: 1,
            display: 'flex',
            flex: 1,
            flexDirection: 'column',
            minHeight: 0,
            overflow: 'hidden',
          }}
        >
          <ReferralsDataGridV2
            key={`${organizationId}:${locationId}`}
            assignmentRoles={
              canViewFunctionAssignments ? assignmentRoleOptions : []
            }
            counties={counties}
            customFields={customFields}
            expanded
            rows={rows}
            onRowClick={handleRowClick}
          />
        </Paper>
      </Stack>

      {openNewReferral && (
        <AddNewReferralDrawer onClose={() => setOpenNewReferral(false)} />
      )}
    </Box>
  );
}

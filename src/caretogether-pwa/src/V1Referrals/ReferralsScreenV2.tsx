import { useCallback, useEffect, useState } from 'react';
import { Box, Drawer, Paper, Stack, Typography } from '@mui/material';
import { useRecoilValueLoadable } from 'recoil';
import { useScreenTitle } from '../Shell/ShellScreenTitle';
import { AddNewReferralDrawer } from './AddNewReferralDrawer';
import { currentLocationQuery } from '../Model/Data';
import { Permission } from '../GeneratedClient';
import { useAppNavigate } from '../Hooks/useAppNavigate';
import { ProgressBackdrop } from '../Shell/ProgressBackdrop';
import { useGlobalPermissions } from '../Model/SessionModel';
import {
  useFeatureFlagEnabledWithLocalOverride,
  useFeatureFlagsLoadedWithLocalOverride,
} from '../Utilities/Instrumentation/useFeatureFlagWithLocalOverride';
import { AssignmentFilterSelectionsByRole } from '../FunctionAssignments/assignmentRoleColumns';
import { wideTablePageSx } from '../Utilities/wideTablePageSx';
import { useReferralsBrowserViewModel } from './useReferralsBrowserViewModel';
import { ReferralsDataGridV2 } from './ReferralsDataGridV2';
import type { ReferralRowModel } from './referralBrowserTypes';
import { ReferralsToolbarV2 } from './ReferralsToolbarV2';
import type { ReferralStatusFilter } from './referralStatusFilter';
import { v2Typography } from '../Families/v2Typography';

const REFERRALS_FEATURE_FLAG = 'referrals';

export function ReferralsScreenV2() {
  useScreenTitle('Referrals');

  const referralsEnabled = useFeatureFlagEnabledWithLocalOverride(
    REFERRALS_FEATURE_FLAG
  );
  const featureFlagsLoaded = useFeatureFlagsLoadedWithLocalOverride(
    REFERRALS_FEATURE_FLAG
  );
  const appNavigate = useAppNavigate();
  const permissions = useGlobalPermissions();
  const currentLocationLoadable = useRecoilValueLoadable(currentLocationQuery);

  const permissionsLoaded = currentLocationLoadable.state === 'hasValue';
  const canViewReferrals = permissions(Permission.ViewV1Referral);

  useEffect(() => {
    if (
      permissionsLoaded &&
      (!canViewReferrals || (featureFlagsLoaded && referralsEnabled !== true))
    ) {
      appNavigate.dashboard();
    }
  }, [
    canViewReferrals,
    featureFlagsLoaded,
    permissionsLoaded,
    referralsEnabled,
    appNavigate,
  ]);

  if (currentLocationLoadable.state === 'hasError') {
    throw currentLocationLoadable.contents;
  }

  if (!permissionsLoaded || !featureFlagsLoaded) {
    return (
      <ProgressBackdrop opaque>
        <p>Loading...</p>
      </ProgressBackdrop>
    );
  }

  if (!canViewReferrals) {
    return null;
  }

  if (referralsEnabled !== true) {
    return null;
  }

  return <ReferralsScreenV2Content />;
}

function ReferralsScreenV2Content() {
  const permissions = useGlobalPermissions();

  const [filterText, setFilterText] = useState('');
  const [statusFilter, setStatusFilter] = useState<ReferralStatusFilter>('ALL');
  const [openNewReferral, setOpenNewReferral] = useState(false);
  const [countyFilter, setCountyFilter] = useState<(string | null)[]>([]);
  const [assignmentFilters, setAssignmentFilters] =
    useState<AssignmentFilterSelectionsByRole>({});

  const {
    assignmentFilterAssignments,
    assignmentPersonLookup,
    assignmentRoles,
    canViewFunctionAssignments,
    familiesForCountyFilter,
    filteredRows,
    isLoading,
  } = useReferralsBrowserViewModel({
    assignmentFilters,
    countyFilter,
    filterText,
    statusFilter,
  });
  const hasFeaturebaseChat = permissions(Permission.AccessSupportScreen);
  const appNavigate = useAppNavigate();
  const handleRowClick = useCallback(
    (row: ReferralRowModel) => appNavigate.referral(row.id),
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

        <Paper variant="outlined" sx={{ borderRadius: 1, p: 2 }}>
          <ReferralsToolbarV2
            filterText={filterText}
            setFilterText={setFilterText}
            canAddNewReferral={permissions(Permission.CreateV1Referral)}
            onAddNewReferral={() => setOpenNewReferral(true)}
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
            countyFilter={countyFilter}
            setCountyFilter={setCountyFilter}
            assignmentRoles={canViewFunctionAssignments ? assignmentRoles : []}
            assignmentsForAssignmentFilter={
              canViewFunctionAssignments ? assignmentFilterAssignments : []
            }
            assignmentFilters={assignmentFilters}
            setAssignmentFilter={(assignmentRole, selectedValues) =>
              setAssignmentFilters((current) => ({
                ...current,
                [assignmentRole]: selectedValues,
              }))
            }
            assignmentPersonLookup={assignmentPersonLookup}
            familiesForCountyFilter={familiesForCountyFilter}
          />
        </Paper>

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
            assignmentRoles={canViewFunctionAssignments ? assignmentRoles : []}
            expanded
            loading={isLoading}
            rows={filteredRows}
            onRowClick={handleRowClick}
          />
        </Paper>
      </Stack>

      <Drawer
        anchor="right"
        open={openNewReferral}
        onClose={() => setOpenNewReferral(false)}
        slotProps={{ paper: { sx: { width: 500, p: 3 } } }}
      >
        <AddNewReferralDrawer onClose={() => setOpenNewReferral(false)} />
      </Drawer>
    </Box>
  );
}

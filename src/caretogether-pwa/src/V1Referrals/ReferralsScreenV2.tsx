import { useCallback, useEffect, useMemo, useState } from 'react';
import { Add as AddIcon } from '@mui/icons-material';
import { Box, Button, Paper, Stack, Typography } from '@mui/material';
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
import { wideTablePageSx } from '../Utilities/wideTablePageSx';
import { useReferralsBrowserViewModel } from './useReferralsBrowserViewModel';
import { ReferralsDataGridV2 } from './ReferralsDataGridV2';
import type { ReferralRowModel } from './referralBrowserTypes';
import type { ReferralStatusFilter } from './referralStatusFilter';
import { v2Typography } from '../Families/v2Typography';
import { getFamilyCounty } from '../Utilities/getFamilyCounty';
import {
  REFERRAL_COUNTY_BLANK_FILTER_VALUE,
  type ReferralAssignmentGridFilter,
  type ReferralsGridFilterLogicOperator,
} from './referralsGridFilterAdapter';

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
  const [assignmentFilters, setAssignmentFilters] = useState<
    ReferralAssignmentGridFilter[]
  >([]);
  const [assignmentFilterLogicOperator, setAssignmentFilterLogicOperator] =
    useState<ReferralsGridFilterLogicOperator>('and');

  const {
    assignmentRoles,
    canViewFunctionAssignments,
    familiesForCountyFilter,
    filteredRows,
    isLoading,
  } = useReferralsBrowserViewModel({
    assignmentFilterLogicOperator,
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
  const countyValueOptions = useMemo(() => {
    const counties = Array.from(
      new Set(
        familiesForCountyFilter
          .map(getFamilyCounty)
          .filter((county): county is string => Boolean(county))
      )
    ).sort((a, b) => a.localeCompare(b));

    return [
      { label: 'Unspecified', value: REFERRAL_COUNTY_BLANK_FILTER_VALUE },
      ...counties.map((county) => ({ label: county, value: county })),
    ];
  }, [familiesForCountyFilter]);

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
            assignmentRoles={canViewFunctionAssignments ? assignmentRoles : []}
            countyFilter={countyFilter}
            countyValueOptions={countyValueOptions}
            expanded
            filterText={filterText}
            loading={isLoading}
            rows={filteredRows}
            statusFilter={statusFilter}
            assignmentFilters={assignmentFilters}
            assignmentFilterLogicOperator={assignmentFilterLogicOperator}
            onAssignmentFiltersChange={setAssignmentFilters}
            onAssignmentFilterLogicOperatorChange={
              setAssignmentFilterLogicOperator
            }
            onCountyFilterChange={setCountyFilter}
            onFilterTextChange={setFilterText}
            onRowClick={handleRowClick}
            onStatusFilterChange={setStatusFilter}
          />
        </Paper>
      </Stack>

      {openNewReferral && (
        <AddNewReferralDrawer onClose={() => setOpenNewReferral(false)} />
      )}
    </Box>
  );
}

import { useEffect, useState } from 'react';
import {
  Grid,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TableContainer,
  Drawer,
} from '@mui/material';
import { Routes, Route } from 'react-router-dom';
import { useRecoilValueLoadable } from 'recoil';

import { useScreenTitle } from '../Shell/ShellScreenTitle';
import { ReferralRow } from './ReferralRow';
import { ReferralsFilters } from './ReferralsFilters';
import { AddNewReferralDrawer } from './AddNewReferralDrawer';
import { ReferralDetailsPage } from './ReferralDetailsPage';
import { useFamilyLookup } from '../Model/DirectoryModel';
import { familyNameString } from '../Families/FamilyName';
import { currentLocationQuery, visibleReferralsQuery } from '../Model/Data';
import { Permission, V1ReferralStatus } from '../GeneratedClient';
import { getFamilyCounty } from '../Utilities/getFamilyCounty';
import { ReferralStatusFilter } from './ReferralsFilters';
import { useFeatureFlagEnabled, usePostHog } from 'posthog-js/react';
import { useAppNavigate } from '../Hooks/useAppNavigate';
import { ProgressBackdrop } from '../Shell/ProgressBackdrop';
import { useGlobalPermissions } from '../Model/SessionModel';

const REFERRALS_FEATURE_FLAG = 'referrals';

function statusToUi(status: V1ReferralStatus): 'OPEN' | 'ACCEPTED' | 'CLOSED' {
  switch (status) {
    case V1ReferralStatus.Open:
      return 'OPEN';
    case V1ReferralStatus.Accepted:
      return 'ACCEPTED';
    case V1ReferralStatus.Closed:
      return 'CLOSED';
  }
}

export function V1Referrals() {
  useScreenTitle('Referrals');

  const posthog = usePostHog();
  const referralsEnabled = useFeatureFlagEnabled(REFERRALS_FEATURE_FLAG);
  const featureFlagsLoaded = posthog.featureFlags.hasLoadedFlags;
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

  return <V1ReferralsContent />;
}

function V1ReferralsContent() {
  const referralsLoadable = useRecoilValueLoadable(visibleReferralsQuery);
  const familyLookup = useFamilyLookup();
  const permissions = useGlobalPermissions();

  const [filterText, setFilterText] = useState('');
  const [statusFilter, setStatusFilter] = useState<ReferralStatusFilter>('ALL');
  const [expandedView, setExpandedView] = useState(true);
  const [openNewReferral, setOpenNewReferral] = useState(false);
  const [countyFilter, setCountyFilter] = useState<(string | null)[]>([]);

  const referrals =
    referralsLoadable.state === 'hasValue' ? referralsLoadable.contents : [];

  const rows = referrals.map((r) => {
    const family = r.familyId ? familyLookup(r.familyId) : null;

    return {
      id: r.referralId,
      title: r.title,
      status: statusToUi(r.status),
      openedAtUtc: r.createdAtUtc,
      acceptedAtUtc: r.acceptedAtUtc,
      closedAtUtc: r.closedAtUtc,
      clientFamilyName: family ? familyNameString(family) : null,
      county: family ? getFamilyCounty(family) : null,
      comments: r.comment ?? '',
    };
  });

  const normalizedFilterText = filterText.trim().toLowerCase();

  const filteredRows = rows.filter((r) => {
    const matchesText =
      normalizedFilterText === '' ||
      r.title.toLowerCase().includes(normalizedFilterText) ||
      (r.clientFamilyName?.toLowerCase().includes(normalizedFilterText) ??
        false) ||
      r.comments.toLowerCase().includes(normalizedFilterText);

    const matchesStatus = statusFilter === 'ALL' || r.status === statusFilter;

    const matchesCounty =
      countyFilter.length === 0
        ? true
        : r.county === null
          ? countyFilter.includes(null)
          : countyFilter.includes(r.county);

    return matchesText && matchesStatus && matchesCounty;
  });

  return (
    <Routes>
      <Route
        path=""
        element={
          <Grid container>
            <Grid item xs={12}>
              <ReferralsFilters
                filterText={filterText}
                setFilterText={setFilterText}
                expandedView={expandedView}
                setExpandedView={setExpandedView}
                canAddNewReferral={permissions(Permission.CreateV1Referral)}
                onAddNewReferral={() => setOpenNewReferral(true)}
                statusFilter={statusFilter}
                setStatusFilter={setStatusFilter}
                countyFilter={countyFilter}
                setCountyFilter={setCountyFilter}
                familiesForCountyFilter={referrals
                  .map((r) => (r.familyId ? familyLookup(r.familyId) : null))
                  .filter(
                    (family): family is NonNullable<typeof family> =>
                      family != null
                  )}
              />
            </Grid>

            <Grid item xs={12}>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Referral Title</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Client Family</TableCell>
                      <TableCell>County</TableCell>
                    </TableRow>
                  </TableHead>

                  <TableBody>
                    {filteredRows.map((ref) => (
                      <ReferralRow
                        key={ref.id}
                        referral={ref}
                        expanded={expandedView}
                      />
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Grid>

            <Drawer
              anchor="right"
              open={openNewReferral}
              onClose={() => setOpenNewReferral(false)}
              PaperProps={{ sx: { width: 500, p: 3 } }}
            >
              <AddNewReferralDrawer onClose={() => setOpenNewReferral(false)} />
            </Drawer>
          </Grid>
        }
      />

      <Route path=":referralId" element={<ReferralDetailsPage />} />
    </Routes>
  );
}

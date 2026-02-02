import { useState } from 'react';
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
import { visibleReferralsQuery } from '../Model/Data';
import { V1ReferralStatus } from '../GeneratedClient';
import { getFamilyCounty } from '../Utilities/getFamilyCounty';
import { ReferralStatusFilter } from './ReferralsFilters';

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

  const referralsLoadable = useRecoilValueLoadable(visibleReferralsQuery);
  const familyLookup = useFamilyLookup();

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

  const filteredRows = rows.filter((r) => {
    const matchesText =
      r.title.toLowerCase().includes(filterText.toLowerCase()) ||
      (r.clientFamilyName?.toLowerCase().includes(filterText.toLowerCase()) ??
        false);

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

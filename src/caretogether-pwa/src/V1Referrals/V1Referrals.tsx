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

function statusToUi(status: V1ReferralStatus): 'OPEN' | 'CLOSED' {
  return status === V1ReferralStatus.Open ? 'OPEN' : 'CLOSED';
}

export function V1Referrals() {
  useScreenTitle('Referrals');

  const referralsLoadable = useRecoilValueLoadable(visibleReferralsQuery);
  const familyLookup = useFamilyLookup();

  const [filterText, setFilterText] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'OPEN' | 'CLOSED'>(
    'ALL'
  );
  const [expandedView, setExpandedView] = useState(true);
  const [openNewReferral, setOpenNewReferral] = useState(false);

  const referrals =
    referralsLoadable.state === 'hasValue' ? referralsLoadable.contents : [];

  const rows = referrals.map((r) => ({
    id: r.referralId,
    title: r.title,
    status: statusToUi(r.status),

    openedAtUtc: r.createdAtUtc,
    closedAtUtc: r.closedAtUtc,

    clientFamilyName: r.familyId
      ? (() => {
          const family = familyLookup(r.familyId);
          return family ? familyNameString(family) : '-';
        })()
      : '-',

    comments: r.comment ?? '',
  }));

  const filteredRows = rows.filter((r) => {
    const matchesText =
      r.title.toLowerCase().includes(filterText.toLowerCase()) ||
      r.clientFamilyName.toLowerCase().includes(filterText.toLowerCase());

    const matchesStatus = statusFilter === 'ALL' || r.status === statusFilter;

    return matchesText && matchesStatus;
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

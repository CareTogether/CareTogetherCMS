import { useEffect, useState } from 'react';
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
} from '@mui/material';
import { Routes, Route } from 'react-router-dom';

import { useScreenTitle } from '../Shell/ShellScreenTitle';
import { ReferralRow } from './ReferralRow';
import { ReferralsFilters } from './ReferralsFilters';
import { AddNewReferralDrawer } from './AddNewReferralDrawer';
import { ReferralDetailsPage } from './ReferralDetailsPage';
import { Permission } from '../GeneratedClient';
import { ReferralStatusFilter } from './ReferralsFilters';
import { useAppNavigate } from '../Hooks/useAppNavigate';
import { ProgressBackdrop } from '../Shell/ProgressBackdrop';
import { useGlobalPermissions } from '../Model/SessionModel';
import { AssignmentFilterSelectionsByRole } from '../FunctionAssignments/assignmentRoleColumns';
import { containedStickyHeaderTableSx } from '../Utilities/stickyHeaderTableSx';
import { WideTableContainer } from '../Utilities/WideTableContainer';
import { wideTablePageSx } from '../Utilities/wideTablePageSx';
import { useReferralsBrowserViewModel } from './useReferralsBrowserViewModel';
import { useReferralsAccessGate } from './useReferralsAccessGate';

export function V1Referrals() {
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

  return <V1ReferralsContent />;
}

function V1ReferralsContent() {
  const permissions = useGlobalPermissions();

  const [filterText, setFilterText] = useState('');
  const [statusFilter, setStatusFilter] = useState<ReferralStatusFilter>('ALL');
  const [expandedView, setExpandedView] = useState(true);
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
    tableMinWidth,
  } = useReferralsBrowserViewModel({
    countyFilter,
    filterText,
    legacyAssignmentFilters: assignmentFilters,
    statusFilter,
  });
  const hasFeaturebaseChat = permissions(Permission.AccessSupportScreen);

  return (
    <Routes>
      <Route
        path=""
        element={
          <Box sx={wideTablePageSx(hasFeaturebaseChat)}>
            <Box sx={{ flex: '0 0 auto' }}>
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
                assignmentRoles={
                  canViewFunctionAssignments ? assignmentRoles : []
                }
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
            </Box>

            <Box
              sx={{
                display: 'flex',
                flex: 1,
                flexDirection: 'column',
                minHeight: 0,
              }}
            >
              <WideTableContainer>
                <Table
                  stickyHeader
                  size="small"
                  sx={{
                    ...containedStickyHeaderTableSx,
                    minWidth: tableMinWidth,
                  }}
                >
                  <TableHead>
                    <TableRow>
                      <TableCell>Referral Title</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Client Family</TableCell>
                      <TableCell>County</TableCell>
                      {canViewFunctionAssignments &&
                        assignmentRoles.map((assignmentRole) => (
                          <TableCell key={assignmentRole}>
                            {assignmentRole}
                          </TableCell>
                        ))}
                    </TableRow>
                  </TableHead>

                  <TableBody>
                    {filteredRows.map((ref) => (
                      <ReferralRow
                        key={ref.id}
                        referral={ref}
                        assignmentRoles={
                          canViewFunctionAssignments ? assignmentRoles : []
                        }
                        expanded={expandedView}
                      />
                    ))}
                  </TableBody>
                </Table>
              </WideTableContainer>
            </Box>

            {openNewReferral && (
              <AddNewReferralDrawer onClose={() => setOpenNewReferral(false)} />
            )}
          </Box>
        }
      />

      <Route path=":referralId" element={<ReferralDetailsPage />} />
    </Routes>
  );
}

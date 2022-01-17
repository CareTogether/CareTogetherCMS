import { makeStyles } from '@material-ui/core/styles';
import { Fab, Grid, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, useMediaQuery, useTheme } from '@material-ui/core';
import { useRecoilValue } from 'recoil';
import { partneringFamiliesData } from '../../Model/ReferralsModel';
import { format } from 'date-fns';
import React, { useState } from 'react';
import AddIcon from '@material-ui/icons/Add';
import { ReferralCloseReason, PartneringFamilyInfo, Arrangement } from '../../GeneratedClient';
import { useNavigate } from 'react-router-dom';
import { FamilyName } from '../Families/FamilyName';
import { ArrangementCard } from './ArrangementCard';
import { CreatePartneringFamilyDialog } from './CreatePartneringFamilyDialog';
import { HeaderContent, HeaderTitle } from '../Header';

export const useStyles = makeStyles((theme) => ({
  paper: {
    padding: theme.spacing(2),
    display: 'flex',
    overflow: 'auto',
    flexDirection: 'column',
  },
  fixedHeight: {
    height: 240,
  },
  table: {
    minWidth: 700,
  },
  familyRow: {
    backgroundColor: '#eef'
  },
  arrangementsRow: {
  },
  drawerPaper: {
  },
  fabAdd: {
    position: 'fixed',
    right: '30px',
    bottom: '70px'
  }
}));

function allArrangements(partneringFamilyInfo: PartneringFamilyInfo) {
  const results = [] as { referralId: string, arrangement: Arrangement }[];
  partneringFamilyInfo.closedReferrals?.forEach(x => x.arrangements?.forEach(y => results.push({ referralId: x.id!, arrangement: y })));
  partneringFamilyInfo.openReferral?.arrangements?.forEach(x => results.push({ referralId: partneringFamilyInfo.openReferral!.id!, arrangement: x }));
  return results;
}

function PartneringFamilies() {
  const classes = useStyles();
  const navigate = useNavigate();

  const partneringFamilies = useRecoilValue(partneringFamiliesData);

  function openPartneringFamily(partneringFamilyId: string) {
    navigate(`/referrals/family/${partneringFamilyId}`);
  }
  const [createPartneringFamilyDialogOpen, setCreatePartneringFamilyDialogOpen] = useState(false);

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  return (
    <Grid container spacing={3}>
      <HeaderContent>
        {!isMobile && <HeaderTitle>Referrals</HeaderTitle>}
      </HeaderContent>
      <Grid item xs={12}>
        <TableContainer component={Paper}>
          <Table className={classes.table} size="small">
            <TableHead>
              <TableRow>
                <TableCell>Partnering Family</TableCell>
                <TableCell>Referral Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {partneringFamilies.map((partneringFamily) => (
                <React.Fragment key={partneringFamily.family?.id}>
                  <TableRow className={classes.familyRow} onClick={() => openPartneringFamily(partneringFamily.family!.id!)}>
                    <TableCell><FamilyName family={partneringFamily} /></TableCell>
                    <TableCell>{
                      partneringFamily.partneringFamilyInfo?.openReferral
                      ? "Open since " + format(partneringFamily.partneringFamilyInfo.openReferral.openedAtUtc!, "MM/dd/yyyy")
                      : "Closed - " + ReferralCloseReason[partneringFamily.partneringFamilyInfo?.closedReferrals?.[partneringFamily.partneringFamilyInfo.closedReferrals.length-1]?.closeReason!]
                      //TODO: "Closed on " + format(partneringFamily.partneringFamilyInfo?.closedReferrals?.[0]?.closedUtc) -- needs a new calculated property
                      }</TableCell>
                  </TableRow>
                  <TableRow onClick={() => openPartneringFamily(partneringFamily.family!.id!)}
                    className={classes.arrangementsRow}>
                    <TableCell colSpan={2}>
                      <Grid container spacing={2}>
                        {allArrangements(partneringFamily.partneringFamilyInfo!).map(arrangementEntry => (
                          <Grid item key={arrangementEntry.arrangement.id}>
                            <ArrangementCard summaryOnly
                              partneringFamily={partneringFamily} referralId={arrangementEntry.referralId} arrangement={arrangementEntry.arrangement} />
                          </Grid>
                        ))}
                      </Grid>
                    </TableCell>
                  </TableRow>
                </React.Fragment>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        <Fab color="primary" aria-label="add" className={classes.fabAdd}
          onClick={() => setCreatePartneringFamilyDialogOpen(true)}>
          <AddIcon />
        </Fab>
        {createPartneringFamilyDialogOpen && <CreatePartneringFamilyDialog onClose={(partneringFamilyId) => {
          setCreatePartneringFamilyDialogOpen(false);
          partneringFamilyId && navigate(`/referrals/family/${partneringFamilyId}`);
        }} />}
      </Grid>
    </Grid>
  );
}

export { PartneringFamilies };

import { makeStyles } from '@material-ui/core/styles';
import { Fab, Grid, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@material-ui/core';
import { useRecoilValue } from 'recoil';
import { partneringFamiliesData } from '../../Model/ReferralsModel';
import { format } from 'date-fns';
import React, { useState } from 'react';
import AddIcon from '@material-ui/icons/Add';
import { ReferralCloseReason, PartneringFamilyInfo, Arrangement } from '../../GeneratedClient';
import { useHistory } from 'react-router-dom';
import { FamilyName } from '../Families/FamilyName';
import { ArrangementCard } from './ArrangementCard';
import { CreatePartneringFamilyDialog } from './CreatePartneringFamilyDialog';

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
  const results = [] as Arrangement[];
  partneringFamilyInfo.closedReferrals?.forEach(x => x.arrangements?.forEach(y => results.push(y)));
  partneringFamilyInfo.openReferral?.arrangements?.forEach(x => results.push(x));
  return results;
}

function PartneringFamilies() {
  const classes = useStyles();
  const history = useHistory();

  const partneringFamilies = useRecoilValue(partneringFamiliesData);

  function openPartneringFamily(partneringFamilyId: string) {
    history.push(`/referrals/family/${partneringFamilyId}`);
  }
  const [createPartneringFamilyDialogOpen, setCreatePartneringFamilyDialogOpen] = useState(false);

  return (
    <Grid container spacing={3}>
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
                      ? "Open since " + format(partneringFamily.partneringFamilyInfo.openReferral.createdUtc!, "MM/dd/yyyy")
                      : "Closed - " + ReferralCloseReason[partneringFamily.partneringFamilyInfo?.closedReferrals?.[0]?.closeReason!]
                      //TODO: "Closed on " + format(partneringFamily.partneringFamilyInfo?.closedReferrals?.[0]?.closedUtc) -- needs a new calculated property
                      }</TableCell>
                  </TableRow>
                  <TableRow onClick={() => openPartneringFamily(partneringFamily.family!.id!)}
                    className={classes.arrangementsRow}>
                    <TableCell colSpan={2}>
                      <Grid container spacing={2}>
                        {allArrangements(partneringFamily.partneringFamilyInfo!).map(arrangement => (
                          <Grid item key={arrangement.id}>
                            <ArrangementCard partneringFamily={partneringFamily} arrangement={arrangement} />
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
          partneringFamilyId && history.push(`/referrals/family/${partneringFamilyId}`);
        }} />}
      </Grid>
    </Grid>
  );
}

export { PartneringFamilies };

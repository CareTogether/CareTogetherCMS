import { makeStyles } from '@material-ui/core/styles';
import { Card, CardActions, CardContent, CardHeader, Grid, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from '@material-ui/core';
import { useRecoilValue } from 'recoil';
import { partneringFamiliesData } from '../../Model/ReferralsModel';
import { differenceInYears, format } from 'date-fns';
import React from 'react';
import { CombinedFamilyInfo, Gender, ExactAge, AgeInYears, ReferralCloseReason, ArrangementState, PartneringFamilyInfo, Arrangement } from '../../GeneratedClient';
import { useHistory } from 'react-router-dom';
import { AgeText } from '../AgeText';

const useStyles = makeStyles((theme) => ({
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
  referralRow: {
  },
  drawerPaper: {
  },
  fabAdd: {
    position: 'fixed',
    right: '30px',
    bottom: '70px'
  }
}));

function familyLastName(family: CombinedFamilyInfo) {
  return family.family!.adults?.filter(adult => family.family!.primaryFamilyContactPersonId === adult.item1?.id)[0]?.item1?.lastName || "";
}

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
                    <TableCell>{familyLastName(partneringFamily) + " Family"}</TableCell>
                    <TableCell>{
                      partneringFamily.partneringFamilyInfo?.openReferral
                      ? "Open since " + format(partneringFamily.partneringFamilyInfo.openReferral.createdUtc!, "MM/dd/yyyy")
                      : "Closed - " + ReferralCloseReason[partneringFamily.partneringFamilyInfo?.closedReferrals?.[0]?.closeReason!]
                      //TODO: "Closed on " + format(partneringFamily.partneringFamilyInfo?.closedReferrals?.[0]?.closedUtc) -- needs a new calculated property
                      }</TableCell>
                  </TableRow>
                  <TableRow onClick={() => openPartneringFamily(partneringFamily.family!.id!)}
                    className={classes.referralRow}>
                    <TableCell colSpan={2}>
                      <Grid container spacing={2}>
                        {allArrangements(partneringFamily.partneringFamilyInfo!).map(arrangement => (
                          <Grid item key={arrangement!.id}>
                            <Card /*className={classes.card}*/>
                              <CardHeader /*className={classes.cardHeader*/
                                title={arrangement!.arrangementType}
                                subheader={<>
                                  {ArrangementState[arrangement!.state!]}
                                  {/* TODO: Partnering family **individual** assignments (e.g., friending) */}
                                </>}/>
                              <CardContent /*className={classes.cardContent}*/>
                                {/* <Divider />
                                <Typography variant="body2" component="div">
                                  <ContactDisplay person={adult.item1} />
                                </Typography> */}
                              </CardContent>
                            </Card>
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
        {/* <Fab color="primary" aria-label="add" className={classes.fabAdd}
          onClick={() => setCreatePartneringFamilyDialogOpen(true)}>
          <AddIcon />
        </Fab> */}
        {/* {createPartneringFamilyDialogOpen && <CreatePartneringFamilyDialog onClose={(partneringFamilyId) => {
          setCreatePartneringFamilyDialogOpen(false);
          partneringFamilyId && history.push(`/referrals/family/${partneringFamilyId}`);
        }} />} */}
      </Grid>
    </Grid>
  );
}

export { PartneringFamilies };

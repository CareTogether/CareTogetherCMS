import { makeStyles } from '@material-ui/core/styles';
import { Card, CardContent, CardHeader, Grid, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from '@material-ui/core';
import { useRecoilValue } from 'recoil';
import { partneringFamiliesData } from '../../Model/ReferralsModel';
import { format } from 'date-fns';
import React from 'react';
import { ReferralCloseReason, ArrangementState, PartneringFamilyInfo, Arrangement } from '../../GeneratedClient';
import { useHistory } from 'react-router-dom';
import { useFamilyLookup, usePersonLookup } from '../../Model/DirectoryModel';
import { PersonName } from '../Families/PersonName';
import { FamilyName } from '../Families/FamilyName';

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
  arrangementsRow: {
  },
  card: {
    minWidth: 275,
  },
  cardHeader: {
    paddingBottom: 0
  },
  cardContent: {
    paddingTop: 8,
    paddingBottom: 8,
    maxWidth: 500
  },
  cardList: {
    padding: 0,
    margin: 0,
    marginTop: 8,
    listStyle: 'none',
    '& > li': {
      marginTop: 4
    }
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
  const familyLookup = useFamilyLookup();
  const personLookup = usePersonLookup();

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
                          <Grid item key={arrangement!.id}>
                            <Card /*className={classes.card}*/>
                              <CardHeader className={classes.cardHeader}
                                subheader={<>
                                  {arrangement.arrangementType} -&nbsp;
                                  {ArrangementState[arrangement.state!]}
                                </>}/>
                              <CardContent className={classes.cardContent}>
                                <Typography variant="body2" component="div">
                                  <ul className={classes.cardList}>
                                    {/* TODO: Partnering family **individual adult** assignments (e.g., friending) */}
                                    {arrangement.partneringFamilyChildAssignments?.map(x => (
                                      <li><strong><PersonName person={personLookup(partneringFamily.family!.id, x.personId)} /></strong> - Child</li>
                                    ))}
                                    {arrangement.familyVolunteerAssignments?.map(x => (
                                      <li><FamilyName family={familyLookup(x.familyId)} /> - {x.arrangementFunction}</li>
                                    ))}
                                    {arrangement.individualVolunteerAssignments?.map(x => (
                                      <li><PersonName person={personLookup(x.familyId, x.personId)} /> - {x.arrangementFunction}</li>
                                    ))}
                                  </ul>
                                </Typography>
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

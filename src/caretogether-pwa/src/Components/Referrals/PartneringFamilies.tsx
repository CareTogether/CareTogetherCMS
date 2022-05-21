import makeStyles from '@mui/styles/makeStyles';
import { Fab, FormControlLabel, Grid, Switch, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Tooltip, useMediaQuery, useTheme } from '@mui/material';
import CircleOutlinedIcon from '@mui/icons-material/CircleOutlined';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import SyncIcon from '@mui/icons-material/Sync';
import { useRecoilValue } from 'recoil';
import { partneringFamiliesData } from '../../Model/ReferralsModel';
import { format } from 'date-fns';
import React, { useState } from 'react';
import AddIcon from '@mui/icons-material/Add';
import { ReferralCloseReason, PartneringFamilyInfo, Arrangement, CombinedFamilyInfo, ArrangementPhase } from '../../GeneratedClient';
import { useNavigate } from 'react-router-dom';
import { FamilyName } from '../Families/FamilyName';
import { ArrangementCard } from './ArrangementCard';
import { CreatePartneringFamilyDialog } from './CreatePartneringFamilyDialog';
import { HeaderContent, HeaderTitle } from '../Header';
import { useScrollMemory } from '../../useScrollMemory';
import { useLocalStorage } from '../../useLocalStorage';

const useStyles = makeStyles((theme) => ({
  table: {
    minWidth: 700,
  },
  familyRow: {
    backgroundColor: '#eef'
  },
  arrangementIcon: {
    verticalAlign: 'middle',
  },
  arrangementSettingUp: {
    verticalAlign: 'middle',
    marginLeft: '5px',
    color: 'darkGrey',
  },
  arrangementReady: {
    verticalAlign: 'middle',
    marginLeft: '5px',
    color: '#FDD735',
  },
  arrangementStarted: {
    verticalAlign: 'middle',
    marginLeft: '5px',
    color: '#01ACFB',
  },
  arrangementEnded: {
    verticalAlign: 'middle',
    marginLeft: '5px',
    color: 'green',
  },
  arrangementChip: {
    marginRight: '25px',
  },
  arrangementsRow: {
    color: 'green',
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

function familyLastName(family: CombinedFamilyInfo) {
  return family.family!.adults?.filter(adult =>
    family.family!.primaryFamilyContactPersonId === adult.item1?.id)[0]?.item1?.lastName || "";
}

function PartneringFamilies() {
  const classes = useStyles();
  const navigate = useNavigate();

  // The array object returned by Recoil is read-only. We need to copy it before we can do an in-place sort.
  const partneringFamilies = useRecoilValue(partneringFamiliesData).map(x => x).sort((a, b) =>
    familyLastName(a) < familyLastName(b) ? -1 : familyLastName(a) > familyLastName(b) ? 1 : 0);

  useScrollMemory();

  function openPartneringFamily(partneringFamilyId: string) {
    navigate(`/referrals/family/${partneringFamilyId}`);
  }

  function arrangementCountByStatus(partneringFamily: PartneringFamilyInfo, phase: ArrangementPhase) {
    return allArrangements(partneringFamily).filter((a) => a.arrangement.phase === phase).length
  }

  const [createPartneringFamilyDialogOpen, setCreatePartneringFamilyDialogOpen] = useState(false);
  const [expandedView, setExpandedView] = useLocalStorage('partnering-families-expanded', true);

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  return (
    <Grid container spacing={3}>
      <HeaderContent>
        {!isMobile && <HeaderTitle>Referrals</HeaderTitle>}
        <FormControlLabel
          control={<Switch checked={expandedView} onChange={(e) => setExpandedView(e.target.checked)} name="expandedView" />}
          label={isMobile ? "" : expandedView ? "Collapse" : "Expand" }
        />
      </HeaderContent>
      <Grid item xs={12}>
        <TableContainer>
          <Table className={classes.table} size="small">
            <TableHead>
              <TableRow>
                <TableCell>Partnering Family</TableCell>
                <TableCell>Referral Status</TableCell>
                { !expandedView ? (<TableCell>Arrangements</TableCell>) : <></>}
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
                      {!expandedView ? (
                        <TableCell>
                          <TableRow>
                          {arrangementCountByStatus(partneringFamily.partneringFamilyInfo!,ArrangementPhase.SettingUp) > 0 ?
                            <>
                            <TableCell padding='none' sx={{borderBottom:"0px", paddingRight:"25px"}}>
                              <Tooltip title="Setting Up">
                                <CircleOutlinedIcon className={classes.arrangementIcon}  sx={{color:"lightGrey"}}/>
                              </Tooltip>
                              <b className={classes.arrangementSettingUp}>{arrangementCountByStatus(partneringFamily.partneringFamilyInfo!,ArrangementPhase.SettingUp)}</b>
                            </TableCell>
                            </>
                          : ""}
                          {arrangementCountByStatus(partneringFamily.partneringFamilyInfo!,ArrangementPhase.ReadyToStart) > 0 ?
                            <>
                            <TableCell padding='none' sx={{borderBottom:"0px", paddingRight:"25px"}}>
                              <Tooltip title="Ready To Start">
                                <AccessTimeIcon className={classes.arrangementIcon}sx={{color:"#FDD735"}}/>
                              </Tooltip>
                              <b className={classes.arrangementReady}>{arrangementCountByStatus(partneringFamily.partneringFamilyInfo!,ArrangementPhase.ReadyToStart)}</b>
                            </TableCell>              
                            </>
                          : ""}
                          {arrangementCountByStatus(partneringFamily.partneringFamilyInfo!,ArrangementPhase.Started) > 0 ?
                            <>
                            <TableCell padding='none' sx={{borderBottom:"0px", paddingRight:"25px"}}>
                              <Tooltip title="Started">
                                <SyncIcon className={classes.arrangementIcon}sx={{color:"#01ACFB"}}/>
                              </Tooltip>
                              <b className={classes.arrangementStarted}>{arrangementCountByStatus(partneringFamily.partneringFamilyInfo!,ArrangementPhase.Started)}</b>
                            </TableCell>              
                            </>
                          : ""}
                          {arrangementCountByStatus(partneringFamily.partneringFamilyInfo!,ArrangementPhase.Ended) > 0 ?
                            <>
                            <TableCell padding='none' sx={{borderBottom:"0px", paddingRight:"25px"}}>
                              <Tooltip title="Ended">
                                <CheckCircleIcon className={classes.arrangementIcon}sx={{color:"green"}}/>
                              </Tooltip>
                              <b className={classes.arrangementEnded}>{arrangementCountByStatus(partneringFamily.partneringFamilyInfo!,ArrangementPhase.Ended)}</b>
                            </TableCell>              
                            </>
                          : ""}
                          </TableRow>
                        </TableCell>) : <></> }
                  </TableRow>
                  { expandedView
                    ? (<TableRow onClick={() => openPartneringFamily(partneringFamily.family!.id!)}
                    className={classes.arrangementsRow}>
                    <TableCell sx={{maxWidth: '400px'}}>
                      {partneringFamily.partneringFamilyInfo?.openReferral?.comments}
                    </TableCell>
                    <TableCell>
                      <Grid container spacing={2}>
                        {allArrangements(partneringFamily.partneringFamilyInfo!).map(arrangementEntry => (
                          <Grid item key={arrangementEntry.arrangement.id}>
                            <ArrangementCard summaryOnly
                              partneringFamily={partneringFamily} referralId={arrangementEntry.referralId} arrangement={arrangementEntry.arrangement} />
                          </Grid>
                        ))}
                      </Grid>
                    </TableCell>
                  </TableRow> ) : <></> }
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
          partneringFamilyId && openPartneringFamily(partneringFamilyId);
        }} />}
      </Grid>
    </Grid>
  );
}

export { PartneringFamilies };

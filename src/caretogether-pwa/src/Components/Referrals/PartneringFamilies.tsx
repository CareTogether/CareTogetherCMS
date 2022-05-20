import makeStyles from '@mui/styles/makeStyles';
import { Avatar, Chip, Fab, FormControlLabel, Grid, Switch, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, useMediaQuery, useTheme } from '@mui/material';
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
  arrangementChip: {
    marginRight: '25px',
  },
  arrangementsRow: {
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
                          <Chip className={classes.arrangementChip} size="medium" color="default" label="Setting Up" avatar=
                            {<Avatar sx={{ bgcolor: "darkGrey" }}>
                              {allArrangements(partneringFamily.partneringFamilyInfo!).filter((a) => a.arrangement.phase === ArrangementPhase.SettingUp).length}
                            </Avatar>}/>
                          <Chip className={classes.arrangementChip} size="medium" color="primary" label="Ready To Start" avatar=
                            {<Avatar>
                              {allArrangements(partneringFamily.partneringFamilyInfo!).filter((a) => a.arrangement.phase === ArrangementPhase.ReadyToStart).length}
                            </Avatar>}/>
                          <Chip className={classes.arrangementChip} size="medium" color="secondary" label="Started" avatar=
                            {<Avatar>
                              {allArrangements(partneringFamily.partneringFamilyInfo!).filter((a) => a.arrangement.phase === ArrangementPhase.Started).length}
                            </Avatar>}/>
                          <Chip className={classes.arrangementChip} size="medium" color="success" label="Ended" avatar=
                            {<Avatar sx={{ bgcolor: "white" }}>
                              {allArrangements(partneringFamily.partneringFamilyInfo!).filter((a) => a.arrangement.phase === ArrangementPhase.Ended).length}
                            </Avatar>}/>
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

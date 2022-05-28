import makeStyles from '@mui/styles/makeStyles';
import { Fab, FormControlLabel, Grid, Switch, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Tooltip, useMediaQuery, useTheme } from '@mui/material';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import PendingOutlinedIcon from '@mui/icons-material/PendingOutlined';
import PlayCircleFilledIcon from '@mui/icons-material/PlayCircleFilled';
import CheckCircleOutlinedIcon from '@mui/icons-material/CheckCircleOutlined';
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
import { policyData } from '../../Model/ConfigurationModel';
import { SearchBar } from '../SearchBar';
import { filterFamiliesByText, sortFamiliesByLastNameDesc } from '../Families/FamilyUtils';

const useStyles = makeStyles((theme) => ({
  table: {
    minWidth: 700,
  },
  familyRow: {
    backgroundColor: '#eef'
  },
  arrangementIconContainer: {
    display: 'flex',
    rowGap: '5px',
    columnGap: '8px',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    alignItems: 'center',
  },
  iconTextSpace: {
    marginRight: '3px',
  },
  arrangementIcon: {
    display: 'inline-block',
    verticalAlign: 'middle',
  },
  arrangementZero: {
    color: 'lightGrey',
  },
  arrangementSettingUp: {
    color: 'grey',
  },
  arrangementReady: {
    color: '#E3AE01',
  },
  arrangementStarted: {
    color: '#01ACFB',
  },
  arrangementEnded: {
    color: 'green',
  },
  fabAdd: {
    position: 'fixed',
    right: '30px',
    bottom: '70px'
  }
}));

const arrangementPhaseText = new Map<number, string>([
  [ArrangementPhase.SettingUp, 'Setting Up'],
  [ArrangementPhase.ReadyToStart, 'Ready To Start'],
  [ArrangementPhase.Started, 'Started'],
  [ArrangementPhase.Ended, 'Ended'],
]);


function allArrangements(partneringFamilyInfo: PartneringFamilyInfo) {
  const results = [] as { referralId: string, arrangement: Arrangement }[];
  partneringFamilyInfo.closedReferrals?.forEach(x => x.arrangements?.forEach(y => results.push({ referralId: x.id!, arrangement: y })));
  partneringFamilyInfo.openReferral?.arrangements?.forEach(x => results.push({ referralId: partneringFamilyInfo.openReferral!.id!, arrangement: x }));
  return results;
}

function PartneringFamilies() {
  const classes = useStyles();
  const navigate = useNavigate();

  // The array object returned by Recoil is read-only. We need to copy it before we can do an in-place sort.
  const partneringFamilies = sortFamiliesByLastNameDesc(useRecoilValue(partneringFamiliesData));

  const arrangementTypes = useRecoilValue(policyData).referralPolicy?.arrangementPolicies?.map((a) => {
    return a.arrangementType;
  });

  const [filterText, setFilterText] = useState("");
  const filteredPartneringFamilies = filterFamiliesByText(partneringFamilies, filterText);
    
  useScrollMemory();

  function openPartneringFamily(partneringFamilyId: string) {
    navigate(`/referrals/family/${partneringFamilyId}`);
  }

  function arrangementStatusSummary(partneringFamily: PartneringFamilyInfo, phase: ArrangementPhase, type: string) {
    const phaseText = arrangementPhaseText.get(phase);

    const statusCount = allArrangements(partneringFamily).filter((a) => (a.arrangement.phase === phase 
      && a.arrangement.arrangementType === type)).length;

    let statusCountDiv;

    if(statusCount > 0) {
      statusCountDiv = <b className={`${statusCount===0 ? classes.arrangementZero 
        : phase===ArrangementPhase.SettingUp ? classes.arrangementSettingUp 
        : phase===ArrangementPhase.ReadyToStart ? classes.arrangementReady 
        : phase===ArrangementPhase.Started ? classes.arrangementStarted 
        : classes.arrangementEnded} ${classes.arrangementIcon}`}>{statusCount}</b>
    }
    
    return (
      <div>
        <Tooltip title={phaseText!}>
          {phase===ArrangementPhase.SettingUp ? 
              <PendingOutlinedIcon className={`${classes.arrangementIcon} ${statusCount===0 ? 
                classes.arrangementZero : classes.arrangementSettingUp} ${classes.iconTextSpace}`} 
              />
          : phase===ArrangementPhase.ReadyToStart ? 
              <AccessTimeIcon className={`${classes.arrangementIcon} ${statusCount===0 ? 
                classes.arrangementZero : classes.arrangementReady} ${classes.iconTextSpace}`}
              />
          : phase===ArrangementPhase.Started ? 
              <PlayCircleFilledIcon className={`${classes.arrangementIcon} ${statusCount===0 ? 
                classes.arrangementZero : classes.arrangementStarted} ${classes.iconTextSpace}`}
              />
          : <CheckCircleOutlinedIcon className={`${classes.arrangementIcon} ${statusCount===0 ? 
              classes.arrangementZero : classes.arrangementEnded} ${classes.iconTextSpace}`} 
            />}
        </Tooltip>
        {statusCountDiv}
      </div>)
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
        <SearchBar value={filterText} onChange={setFilterText} />
      </HeaderContent>
      <Grid item xs={12}>
        <TableContainer>
          <Table className={classes.table} size="small">
            <TableHead>
              <TableRow>
                <TableCell>Partnering Family</TableCell>
                <TableCell>Referral Status</TableCell>
                { !expandedView ? arrangementTypes?.map((arrangementType) => 
                  (<TableCell>{arrangementType}</TableCell>)) : <></>}
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredPartneringFamilies.map((partneringFamily) => (
                <React.Fragment key={partneringFamily.family?.id}>
                  <TableRow className={classes.familyRow} onClick={() => openPartneringFamily(partneringFamily.family!.id!)}>
                    <TableCell><FamilyName family={partneringFamily} /></TableCell>
                    <TableCell>{
                      partneringFamily.partneringFamilyInfo?.openReferral
                      ? "Open since " + format(partneringFamily.partneringFamilyInfo.openReferral.openedAtUtc!, "MM/dd/yyyy")
                      : "Closed - " + ReferralCloseReason[partneringFamily.partneringFamilyInfo?.closedReferrals?.[partneringFamily.partneringFamilyInfo.closedReferrals.length-1]?.closeReason!]
                      //TODO: "Closed on " + format(partneringFamily.partneringFamilyInfo?.closedReferrals?.[0]?.closedUtc) -- needs a new calculated property
                      }</TableCell>
                      {!expandedView ? arrangementTypes?.map((arrangementType) => (
                        <TableCell>
                          <div className={classes.arrangementIconContainer}>
                            {arrangementStatusSummary(partneringFamily.partneringFamilyInfo!,ArrangementPhase.SettingUp, arrangementType!)}
                          <div>
                            {arrangementStatusSummary(partneringFamily.partneringFamilyInfo!,ArrangementPhase.ReadyToStart, arrangementType!)}
                          </div>
                          <div>
                            {arrangementStatusSummary(partneringFamily.partneringFamilyInfo!,ArrangementPhase.Started, arrangementType!)}
                          </div>
                          <div>
                            {arrangementStatusSummary(partneringFamily.partneringFamilyInfo!,ArrangementPhase.Ended, arrangementType!)}
                          </div>
                          </div>
                        </TableCell>)) : <></> }
                  </TableRow>
                  { expandedView
                    ? (<TableRow onClick={() => openPartneringFamily(partneringFamily.family!.id!)}>
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

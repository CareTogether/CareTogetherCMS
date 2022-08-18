import { Fab, Grid, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, ToggleButton, ToggleButtonGroup, Tooltip, useMediaQuery, useTheme } from '@mui/material';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import PendingOutlinedIcon from '@mui/icons-material/PendingOutlined';
import PlayCircleFilledIcon from '@mui/icons-material/PlayCircleFilled';
import CheckCircleOutlinedIcon from '@mui/icons-material/CheckCircleOutlined';
import { useRecoilValue } from 'recoil';
import { partneringFamiliesData } from '../Model/ReferralsModel';
import { format } from 'date-fns';
import React, { useState } from 'react';
import AddIcon from '@mui/icons-material/Add';
import { ReferralCloseReason, PartneringFamilyInfo, Arrangement, ArrangementPhase, Permission } from '../GeneratedClient';
import { useNavigate } from 'react-router-dom';
import { FamilyName } from '../Families/FamilyName';
import { ArrangementCard } from './ArrangementCard';
import { CreatePartneringFamilyDialog } from './CreatePartneringFamilyDialog';
import { useScrollMemory } from '../Hooks/useScrollMemory';
import { useLocalStorage } from '../Hooks/useLocalStorage';
import { policyData } from '../Model/ConfigurationModel';
import { SearchBar } from '../SearchBar';
import { filterFamiliesByText, sortFamiliesByLastNameDesc } from '../Families/FamilyUtils';
import { usePermissions } from '../Model/SessionModel';
import useScreenTitle from '../Shell/ShellScreenTitle';
import UnfoldLessIcon from '@mui/icons-material/UnfoldLess';
import UnfoldMoreIcon from '@mui/icons-material/UnfoldMore';

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

    const arrangementZero = 'lightGrey';
    const arrangementSettingUp = 'grey';
    const arrangementReady = '#E3AE01';
    const arrangementStarted = '#01ACFB';
    const arrangementEnded = 'green';

    if(statusCount > 0) {
      statusCountDiv = <b style={{display: 'inline-block', verticalAlign: 'middle', color:
        statusCount===0 ? arrangementZero 
        : phase===ArrangementPhase.SettingUp ? arrangementSettingUp 
        : phase===ArrangementPhase.ReadyToStart ? arrangementReady 
        : phase===ArrangementPhase.Started ? arrangementStarted 
        : arrangementEnded}}>{statusCount}</b>
    }
    
    return (
      <div style={{width: 36}}>
        <Tooltip title={phaseText!}>
          {phase===ArrangementPhase.SettingUp ? 
            <PendingOutlinedIcon sx={{
              display: 'inline-block', verticalAlign: 'middle', marginRight: '3px', color:
              statusCount===0 ? 
              arrangementZero : arrangementSettingUp}}
            />
          : phase===ArrangementPhase.ReadyToStart ? 
            <AccessTimeIcon sx={{
              display: 'inline-block', verticalAlign: 'middle', marginRight: '3px', color:
              statusCount===0 ? 
              arrangementZero : arrangementReady}}
            />
          : phase===ArrangementPhase.Started ? 
            <PlayCircleFilledIcon sx={{
              display: 'inline-block', verticalAlign: 'middle', marginRight: '3px', color:
              statusCount===0 ? 
              arrangementZero : arrangementStarted}}
            />
          : <CheckCircleOutlinedIcon sx={{
              display: 'inline-block', verticalAlign: 'middle', marginRight: '3px', color:
              statusCount===0 ? 
              arrangementZero : arrangementEnded}} 
            />}
        </Tooltip>
        {statusCountDiv}
      </div>)
  }

  const [createPartneringFamilyDialogOpen, setCreatePartneringFamilyDialogOpen] = useState(false);
  const [expandedView, setExpandedView] = useLocalStorage('partnering-families-expanded', true);
  
  const handleExpandCollapse = (
    event: React.MouseEvent<HTMLElement>,
    newExpandedView: boolean | null,
  ) => {
    if (newExpandedView !== null) {
      setExpandedView(newExpandedView);
    }
  };

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const permissions = usePermissions();

  useScreenTitle("Referrals");

  return (
    <Grid container>
      <Grid item xs={12}>
        <Stack direction='row-reverse' sx={{marginTop: 1}}>
          <ToggleButtonGroup value={expandedView} exclusive onChange={handleExpandCollapse}
            size={isMobile ? 'medium' : 'small'} aria-label="row expansion">
            <ToggleButton value={true} aria-label="expanded"><UnfoldMoreIcon /></ToggleButton>
            <ToggleButton value={false} aria-label="collapsed"><UnfoldLessIcon /></ToggleButton>
          </ToggleButtonGroup>
          <SearchBar value={filterText} onChange={setFilterText} />
        </Stack>
      </Grid>
      <Grid item xs={12}>
        <TableContainer>
          <Table sx={{minWidth: '700px'}} size="small">
            <TableHead>
              <TableRow>
                <TableCell>Partnering Family</TableCell>
                <TableCell>Referral Status</TableCell>
                { !expandedView ? arrangementTypes?.map((arrangementType) => 
                  (<TableCell key={arrangementType}>{arrangementType}</TableCell>)) : <></>}
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredPartneringFamilies.map((partneringFamily) => (
                <React.Fragment key={partneringFamily.family?.id}>
                  <TableRow sx={{backgroundColor: '#eef'}} onClick={() => openPartneringFamily(partneringFamily.family!.id!)}>
                    <TableCell><FamilyName family={partneringFamily} /></TableCell>
                    <TableCell>{
                      partneringFamily.partneringFamilyInfo?.openReferral
                      ? "Open since " + format(partneringFamily.partneringFamilyInfo.openReferral.openedAtUtc!, "MM/dd/yyyy")
                      : "Closed - " + ReferralCloseReason[partneringFamily.partneringFamilyInfo?.closedReferrals?.[partneringFamily.partneringFamilyInfo.closedReferrals.length-1]?.closeReason!]
                      //TODO: "Closed on " + format(partneringFamily.partneringFamilyInfo?.closedReferrals?.[0]?.closedUtc) -- needs a new calculated property
                      }</TableCell>
                      {!expandedView ? arrangementTypes?.map((arrangementType) => (
                        <TableCell key={arrangementType}>
                          <div style={{
                            display: 'flex',
                            rowGap: '5px',
                            columnGap: '8px',
                            flexWrap: 'wrap',
                            justifyContent: 'flex-start',
                            alignItems: 'center',
                          }}>
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
                    <TableCell sx={{maxWidth: '400px', paddingLeft: 3}}>
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
        {permissions(Permission.EditFamilyInfo) && <Fab color="primary" aria-label="add"
          sx={{position: 'fixed', right: '30px', bottom: '70px'}}
          onClick={() => setCreatePartneringFamilyDialogOpen(true)}>
          <AddIcon />
        </Fab>}
        {createPartneringFamilyDialogOpen && <CreatePartneringFamilyDialog onClose={(partneringFamilyId) => {
          setCreatePartneringFamilyDialogOpen(false);
          partneringFamilyId && openPartneringFamily(partneringFamilyId);
        }} />}
      </Grid>
    </Grid>
  );
}

export { PartneringFamilies };

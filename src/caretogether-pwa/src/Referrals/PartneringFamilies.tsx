import {
  Fab,
  Grid,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import PendingOutlinedIcon from '@mui/icons-material/PendingOutlined';
import PlayCircleFilledIcon from '@mui/icons-material/PlayCircleFilled';
import CheckCircleOutlinedIcon from '@mui/icons-material/CheckCircleOutlined';
import { partneringFamiliesData } from '../Model/ReferralsModel';
import { format } from 'date-fns';
import React, { useState } from 'react';
import AddIcon from '@mui/icons-material/Add';
import {
  ReferralCloseReason,
  PartneringFamilyInfo,
  Arrangement,
  ArrangementPhase,
  Permission,
} from '../GeneratedClient';
import { FamilyName } from '../Families/FamilyName';
import { ArrangementCard } from './Arrangements/ArrangementCard';
import { CreatePartneringFamilyDialog } from './CreatePartneringFamilyDialog';
import { useScrollMemory } from '../Hooks/useScrollMemory';
import { useLocalStorage } from '../Hooks/useLocalStorage';
import { policyData } from '../Model/ConfigurationModel';
import { SearchBar } from '../Shell/SearchBar';
import {
  filterFamiliesByText,
  sortFamiliesByLastNameDesc,
} from '../Families/FamilyUtils';
import { useAllPartneringFamiliesPermissions } from '../Model/SessionModel';
import useScreenTitle from '../Shell/ShellScreenTitle';
import UnfoldLessIcon from '@mui/icons-material/UnfoldLess';
import UnfoldMoreIcon from '@mui/icons-material/UnfoldMore';
import { useLoadable } from '../Hooks/useLoadable';
import { ProgressBackdrop } from '../Shell/ProgressBackdrop';
import { useAppNavigate } from '../Hooks/useAppNavigate';
import PhoneIcon from '@mui/icons-material/Phone';

const arrangementPhaseText = new Map<number, string>([
  [ArrangementPhase.SettingUp, 'Setting Up'],
  [ArrangementPhase.ReadyToStart, 'Ready To Start'],
  [ArrangementPhase.Started, 'Started'],
  [ArrangementPhase.Ended, 'Ended'],
]);

function allArrangements(partneringFamilyInfo: PartneringFamilyInfo) {
  const results = [] as { referralId: string; arrangement: Arrangement }[];
  partneringFamilyInfo.closedReferrals?.forEach((x) =>
    x.arrangements?.forEach((y) =>
      results.push({ referralId: x.id!, arrangement: y })
    )
  );
  partneringFamilyInfo.openReferral?.arrangements?.forEach((x) =>
    results.push({
      referralId: partneringFamilyInfo.openReferral!.id!,
      arrangement: x,
    })
  );
  return results;
}

function matchingArrangements(
  partneringFamilyInfo: PartneringFamilyInfo,
  arrangementsFilter: 'All' | 'Active' | 'Setup' | 'Active + Setup'
) {
  const results = [] as { referralId: string; arrangement: Arrangement }[];
  if (arrangementsFilter === 'All') {
    partneringFamilyInfo.closedReferrals?.forEach((x) =>
      x.arrangements?.forEach((y) =>
        results.push({ referralId: x.id!, arrangement: y })
      )
    );
    partneringFamilyInfo.openReferral?.arrangements?.forEach((x) =>
      results.push({
        referralId: partneringFamilyInfo.openReferral!.id!,
        arrangement: x,
      })
    );
  } else {
    if (
      arrangementsFilter === 'Active' ||
      arrangementsFilter === 'Active + Setup'
    ) {
      partneringFamilyInfo.openReferral?.arrangements
        ?.filter(
          (arrangement) => arrangement.phase === ArrangementPhase.Started
        )
        .forEach((x) =>
          results.push({
            referralId: partneringFamilyInfo.openReferral!.id!,
            arrangement: x,
          })
        );
    }
    if (
      arrangementsFilter === 'Setup' ||
      arrangementsFilter === 'Active + Setup'
    ) {
      partneringFamilyInfo.openReferral?.arrangements
        ?.filter(
          (arrangement) =>
            arrangement.phase === ArrangementPhase.SettingUp ||
            arrangement.phase === ArrangementPhase.ReadyToStart
        )
        .forEach((x) =>
          results.push({
            referralId: partneringFamilyInfo.openReferral!.id!,
            arrangement: x,
          })
        );
    }
  }
  return results;
}

function PartneringFamilies() {
  const appNavigate = useAppNavigate();

  // The array object returned by Recoil is read-only. We need to copy it before we can do an in-place sort.
  const partneringFamiliesLoadable = useLoadable(partneringFamiliesData);
  const partneringFamilies = sortFamiliesByLastNameDesc(
    partneringFamiliesLoadable || []
  );

  const arrangementTypes = useLoadable(
    policyData
  )?.referralPolicy?.arrangementPolicies?.map((a) => {
    return a.arrangementType!;
  });

  const [filterText, setFilterText] = useState('');
  const filteredPartneringFamilies = filterFamiliesByText(
    partneringFamilies,
    filterText
  );

  useScrollMemory();

  function openFamily(familyId: string) {
    appNavigate.family(familyId);
  }

  function arrangementStatusSummary(
    partneringFamily: PartneringFamilyInfo,
    phase: ArrangementPhase,
    type: string
  ) {
    const phaseText = arrangementPhaseText.get(phase);

    const statusCount = allArrangements(partneringFamily).filter(
      (a) =>
        a.arrangement.phase === phase && a.arrangement.arrangementType === type
    ).length;

    let statusCountDiv;

    const arrangementZero = 'lightGrey';
    const arrangementSettingUp = 'grey';
    const arrangementReady = '#E3AE01';
    const arrangementStarted = '#01ACFB';
    const arrangementEnded = 'green';

    if (statusCount > 0) {
      statusCountDiv = (
        <b
          style={{
            display: 'inline-block',
            verticalAlign: 'middle',
            color:
              statusCount === 0
                ? arrangementZero
                : phase === ArrangementPhase.SettingUp
                  ? arrangementSettingUp
                  : phase === ArrangementPhase.ReadyToStart
                    ? arrangementReady
                    : phase === ArrangementPhase.Started
                      ? arrangementStarted
                      : arrangementEnded,
          }}
        >
          {statusCount}
        </b>
      );
    }

    return (
      <div style={{ width: 36 }}>
        <Tooltip title={phaseText!}>
          {phase === ArrangementPhase.SettingUp ? (
            <PendingOutlinedIcon
              sx={{
                display: 'inline-block',
                verticalAlign: 'middle',
                marginRight: '3px',
                color:
                  statusCount === 0 ? arrangementZero : arrangementSettingUp,
              }}
            />
          ) : phase === ArrangementPhase.ReadyToStart ? (
            <AccessTimeIcon
              sx={{
                display: 'inline-block',
                verticalAlign: 'middle',
                marginRight: '3px',
                color: statusCount === 0 ? arrangementZero : arrangementReady,
              }}
            />
          ) : phase === ArrangementPhase.Started ? (
            <PlayCircleFilledIcon
              sx={{
                display: 'inline-block',
                verticalAlign: 'middle',
                marginRight: '3px',
                color: statusCount === 0 ? arrangementZero : arrangementStarted,
              }}
            />
          ) : (
            <CheckCircleOutlinedIcon
              sx={{
                display: 'inline-block',
                verticalAlign: 'middle',
                marginRight: '3px',
                color: statusCount === 0 ? arrangementZero : arrangementEnded,
              }}
            />
          )}
        </Tooltip>
        {statusCountDiv}
      </div>
    );
  }

  const [
    createPartneringFamilyDialogOpen,
    setCreatePartneringFamilyDialogOpen,
  ] = useState(false);
  const [expandedView, setExpandedView] = useLocalStorage(
    'partnering-families-expanded',
    true
  );

  const handleExpandCollapse = (
    _event: React.MouseEvent<HTMLElement>,
    newExpandedView: boolean | null
  ) => {
    if (newExpandedView !== null) {
      setExpandedView(newExpandedView);
    }
  };

  const [arrangementsFilter, setArrangementsFilter] = useLocalStorage<
    'All' | 'Active' | 'Setup' | 'Active + Setup'
  >('partnering-families-arrangementsFilter', 'All');
  const filteredPartneringFamiliesWithActiveOrAllFilter =
    filteredPartneringFamilies.filter((family) =>
      arrangementsFilter === 'All'
        ? true
        : arrangementsFilter === 'Active'
          ? family.partneringFamilyInfo?.openReferral?.arrangements?.some(
              (arrangement) => arrangement.phase === ArrangementPhase.Started
            )
          : arrangementsFilter === 'Setup'
            ? family.partneringFamilyInfo?.openReferral?.arrangements?.some(
                (arrangement) =>
                  arrangement.phase === ArrangementPhase.SettingUp ||
                  arrangement.phase === ArrangementPhase.ReadyToStart
              )
            : family.partneringFamilyInfo?.openReferral?.arrangements?.some(
                (arrangement) =>
                  arrangement.phase === ArrangementPhase.Started ||
                  arrangement.phase === ArrangementPhase.SettingUp ||
                  arrangement.phase === ArrangementPhase.ReadyToStart
              )
    );

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const permissions = useAllPartneringFamiliesPermissions();

  useScreenTitle('Referrals');

  return !partneringFamiliesLoadable || !arrangementTypes ? (
    <ProgressBackdrop>
      <p>Loading families...</p>
    </ProgressBackdrop>
  ) : (
    <Grid container>
      <Grid item xs={12}>
        <Stack direction="row-reverse" sx={{ marginTop: 1 }}>
          <ToggleButtonGroup
            value={expandedView}
            exclusive
            onChange={handleExpandCollapse}
            size={isMobile ? 'medium' : 'small'}
            aria-label="row expansion"
          >
            <ToggleButton value={true} aria-label="expanded">
              <UnfoldMoreIcon />
            </ToggleButton>
            <ToggleButton value={false} aria-label="collapsed">
              <UnfoldLessIcon />
            </ToggleButton>
          </ToggleButtonGroup>
          <SearchBar value={filterText} onChange={setFilterText} />
          <ToggleButtonGroup
            value={arrangementsFilter}
            exclusive
            onChange={(_, value) => setArrangementsFilter(value)}
            size={isMobile ? 'medium' : 'small'}
            aria-label="row expansion"
          >
            <ToggleButton value={'All'} aria-label="expanded">
              All
            </ToggleButton>
            <ToggleButton value={'Active'} aria-label="collapsed">
              Active
            </ToggleButton>
            <ToggleButton value={'Setup'} aria-label="collapsed">
              Setup
            </ToggleButton>
            <ToggleButton value={'Active + Setup'} aria-label="collapsed">
              Active + Setup
            </ToggleButton>
          </ToggleButtonGroup>
        </Stack>
      </Grid>
      <Grid item xs={12}>
        <TableContainer>
          <Table sx={{ minWidth: '700px' }} size="small">
            <TableHead>
              <TableRow>
                <TableCell>Partnering Family</TableCell>
                <TableCell>Referral Status</TableCell>
                {!expandedView ? (
                  arrangementTypes?.map((arrangementType) => (
                    <TableCell key={arrangementType}>
                      {arrangementType}
                    </TableCell>
                  ))
                ) : (
                  <></>
                )}
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredPartneringFamiliesWithActiveOrAllFilter.map(
                (partneringFamily) => {
                  const primaryFamilyContactPersonId =
                    partneringFamily.family?.primaryFamilyContactPersonId;
                  const primaryContactPerson =
                    partneringFamily.family?.adults?.find(
                      (adult) =>
                        adult.item1?.id === primaryFamilyContactPersonId
                    )?.item1;
                  const phoneNumber =
                    primaryContactPerson?.phoneNumbers?.[0]?.number;
                  return (
                    <React.Fragment key={partneringFamily.family?.id}>
                      <TableRow
                        sx={{ backgroundColor: '#eef', cursor: 'pointer' }}
                        onClick={() => openFamily(partneringFamily.family!.id!)}
                      >
                        <TableCell>
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '10px',
                            }}
                          >
                            <FamilyName family={partneringFamily} />
                            {phoneNumber && (
                              <>
                                <PhoneIcon
                                  sx={{
                                    color: '#8B0000',
                                    fontSize: 16,
                                    marginLeft: '5px',
                                  }}
                                />
                                <span style={{ color: 'black' }}>
                                  {phoneNumber}
                                </span>
                              </>
                            )}
                          </span>
                        </TableCell>
                        <TableCell>
                          {
                            partneringFamily.partneringFamilyInfo?.openReferral
                              ? 'Open since ' +
                                format(
                                  partneringFamily.partneringFamilyInfo
                                    .openReferral.openedAtUtc!,
                                  'MM/dd/yyyy'
                                )
                              : 'Closed - ' +
                                ReferralCloseReason[
                                  partneringFamily.partneringFamilyInfo!
                                    .closedReferrals![
                                    partneringFamily.partneringFamilyInfo!
                                      .closedReferrals!.length - 1
                                  ]!.closeReason!
                                ]
                            //TODO: "Closed on " + format(partneringFamily.partneringFamilyInfo?.closedReferrals?.[0]?.closedUtc) -- needs a new calculated property
                          }
                        </TableCell>
                        {!expandedView ? (
                          arrangementTypes?.map((arrangementType) => (
                            <TableCell key={arrangementType}>
                              <div
                                style={{
                                  display: 'flex',
                                  rowGap: '5px',
                                  columnGap: '8px',
                                  flexWrap: 'wrap',
                                  justifyContent: 'flex-start',
                                  alignItems: 'center',
                                }}
                              >
                                {arrangementStatusSummary(
                                  partneringFamily.partneringFamilyInfo!,
                                  ArrangementPhase.SettingUp,
                                  arrangementType!
                                )}
                                <div>
                                  {arrangementStatusSummary(
                                    partneringFamily.partneringFamilyInfo!,
                                    ArrangementPhase.ReadyToStart,
                                    arrangementType!
                                  )}
                                </div>
                                <div>
                                  {arrangementStatusSummary(
                                    partneringFamily.partneringFamilyInfo!,
                                    ArrangementPhase.Started,
                                    arrangementType!
                                  )}
                                </div>
                                <div>
                                  {arrangementStatusSummary(
                                    partneringFamily.partneringFamilyInfo!,
                                    ArrangementPhase.Ended,
                                    arrangementType!
                                  )}
                                </div>
                              </div>
                            </TableCell>
                          ))
                        ) : (
                          <></>
                        )}
                      </TableRow>
                      {expandedView ? (
                        <TableRow
                          onClick={() =>
                            openFamily(partneringFamily.family!.id!)
                          }
                        >
                          <TableCell sx={{ maxWidth: '400px', paddingLeft: 3 }}>
                            {
                              partneringFamily.partneringFamilyInfo
                                ?.openReferral?.comments
                            }
                          </TableCell>
                          <TableCell>
                            <Grid container spacing={2}>
                              {matchingArrangements(
                                partneringFamily.partneringFamilyInfo!,
                                arrangementsFilter
                              ).map((arrangementEntry) => (
                                <Grid
                                  item
                                  key={arrangementEntry.arrangement.id}
                                >
                                  <div
                                    style={{ cursor: 'pointer' }}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      appNavigate.family(
                                        partneringFamily.family!.id!,
                                        arrangementEntry.referralId,
                                        arrangementEntry.arrangement.id
                                      );
                                    }}
                                  >
                                    <ArrangementCard
                                      summaryOnly
                                      partneringFamily={partneringFamily}
                                      referralId={arrangementEntry.referralId}
                                      arrangement={arrangementEntry.arrangement}
                                    />
                                  </div>
                                </Grid>
                              ))}
                            </Grid>
                          </TableCell>
                        </TableRow>
                      ) : (
                        <></>
                      )}
                    </React.Fragment>
                  );
                }
              )}
            </TableBody>
          </Table>
        </TableContainer>
        {permissions(Permission.EditFamilyInfo) &&
          permissions(Permission.CreateReferral) && (
            <Fab
              color="primary"
              aria-label="add"
              sx={{ position: 'fixed', right: '30px', bottom: '70px' }}
              onClick={() => setCreatePartneringFamilyDialogOpen(true)}
            >
              <AddIcon />
            </Fab>
          )}
        {createPartneringFamilyDialogOpen && (
          <CreatePartneringFamilyDialog
            onClose={(partneringFamilyId) => {
              setCreatePartneringFamilyDialogOpen(false);
              partneringFamilyId && openFamily(partneringFamilyId);
            }}
          />
        )}
      </Grid>
    </Grid>
  );
}

export { PartneringFamilies };

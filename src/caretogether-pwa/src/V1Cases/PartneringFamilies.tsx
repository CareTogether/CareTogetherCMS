import {
  Button,
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
  Box,
} from '@mui/material';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import PendingOutlinedIcon from '@mui/icons-material/PendingOutlined';
import PlayCircleFilledIcon from '@mui/icons-material/PlayCircleFilled';
import CheckCircleOutlinedIcon from '@mui/icons-material/CheckCircleOutlined';
import { partneringFamiliesData } from '../Model/V1CasesModel';
import { format } from 'date-fns';
import React, { useState } from 'react';
import AddIcon from '@mui/icons-material/Add';
import {
  V1CaseCloseReason,
  PartneringFamilyInfo,
  Arrangement,
  ArrangementPhase,
  Permission,
  CompletedCustomFieldInfo,
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
import { useScreenTitle } from '../Shell/ShellScreenTitle';
import UnfoldLessIcon from '@mui/icons-material/UnfoldLess';
import UnfoldMoreIcon from '@mui/icons-material/UnfoldMore';
import { useLoadable } from '../Hooks/useLoadable';
import { ProgressBackdrop } from '../Shell/ProgressBackdrop';
import { useAppNavigate } from '../Hooks/useAppNavigate';
import PhoneIcon from '@mui/icons-material/Phone';
import { CustomFieldsFilter } from '../Generic/CustomFieldsFilter/CustomFieldsFilter';
import { useCustomFieldFilters } from '../Generic/CustomFieldsFilter/useCustomFieldFilters';
import { matchesCustomFieldFilters } from '../Generic/CustomFieldsFilter/matchesCustomFieldFilters';
import { TestFamilyBadge } from '../Families/TestFamilyBadge';
import { useFeatureFlagEnabled } from 'posthog-js/react';
import '../../../index.css';

const arrangementPhaseText = new Map<number, string>([
  [ArrangementPhase.SettingUp, 'Setting Up'],
  [ArrangementPhase.ReadyToStart, 'Ready To Start'],
  [ArrangementPhase.Started, 'Started'],
  [ArrangementPhase.Ended, 'Ended'],
]);

function allArrangements(partneringFamilyInfo: PartneringFamilyInfo) {
  const closed = (partneringFamilyInfo.closedV1Cases ?? []).flatMap((v1Case) =>
    (v1Case.arrangements ?? []).map((arrangement) => ({
      v1CaseId: v1Case.id!,
      arrangement,
    }))
  );

  const openV1Case = partneringFamilyInfo.openV1Case;
  const open = (openV1Case?.arrangements ?? []).map((arrangement) => ({
    v1CaseId: openV1Case!.id!,
    arrangement,
  }));

  return [...closed, ...open];
}

function matchingArrangements(
  partneringFamilyInfo: PartneringFamilyInfo,
  arrangementsFilter: 'All' | 'Intake' | 'Active' | 'Setup' | 'Active + Setup'
) {
  if (arrangementsFilter === 'Intake') {
    return [];
  }

  if (arrangementsFilter === 'All') {
    return allArrangements(partneringFamilyInfo);
  }

  const openV1Case = partneringFamilyInfo.openV1Case;
  const openArrangements = openV1Case?.arrangements ?? [];

  const matchesPhase = (arrangement: Arrangement) => {
    if (arrangementsFilter === 'Active') {
      return arrangement.phase === ArrangementPhase.Started;
    }

    if (arrangementsFilter === 'Setup') {
      return (
        arrangement.phase === ArrangementPhase.SettingUp ||
        arrangement.phase === ArrangementPhase.ReadyToStart
      );
    }

    return (
      arrangement.phase === ArrangementPhase.Started ||
      arrangement.phase === ArrangementPhase.SettingUp ||
      arrangement.phase === ArrangementPhase.ReadyToStart
    );
  };

  return openArrangements.filter(matchesPhase).map((arrangement) => ({
    v1CaseId: openV1Case!.id!,
    arrangement,
  }));
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

  const loadablePolicy = useLoadable(policyData);

  const referralCustomFields = React.useMemo(() => {
    return loadablePolicy?.referralPolicy?.customFields || [];
  }, [loadablePolicy]);

  const [filterText, setFilterText] = useState('');
  const filteredPartneringFamilies = filterFamiliesByText(
    partneringFamilies,
    filterText
  );

  const {
    selectedValuesByField: selectedCustomFieldValuesByField,
    setSelectedValuesForField: setSelectedCustomFieldValuesForField,
    optionsByField: customFieldFilterOptionsByField,
  } = useCustomFieldFilters({
    customFields: referralCustomFields,
    items: partneringFamilies,
    isBlank: (family, fieldName) =>
      family.partneringFamilyInfo?.openV1Case?.missingCustomFields?.includes(
        fieldName
      ) ?? false,
    getValue: (family, fieldName) =>
      family.partneringFamilyInfo?.openV1Case?.completedCustomFields?.find(
        (f) => f.customFieldName === fieldName
      )?.value,
  });

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
    'All' | 'Intake' | 'Active' | 'Setup' | 'Active + Setup'
  >('partnering-families-arrangementsFilter', 'All');
  const filteredPartneringFamiliesWithActiveOrAllFilter =
    filteredPartneringFamilies
      .filter((family) =>
        matchesCustomFieldFilters({
          item: family,
          customFields: referralCustomFields,
          selectedValuesByField: selectedCustomFieldValuesByField,
          isBlank: (f, fieldName) =>
            f.partneringFamilyInfo?.openV1Case?.missingCustomFields?.includes(
              fieldName
            ) ?? false,
          getValue: (f, fieldName) =>
            f.partneringFamilyInfo?.openV1Case?.completedCustomFields?.find(
              (x) => x.customFieldName === fieldName
            )?.value,
        })
      )
      .filter((family) => {
        const openCase = family.partneringFamilyInfo?.openV1Case;
        const arrangements = openCase?.arrangements ?? [];

        switch (arrangementsFilter) {
          case 'All':
            return true;

          case 'Intake':
            return !!openCase && arrangements.length === 0;

          case 'Active':
            return arrangements.some(
              (arrangement) => arrangement.phase === ArrangementPhase.Started
            );

          case 'Setup':
            return arrangements.some(
              (arrangement) =>
                arrangement.phase === ArrangementPhase.SettingUp ||
                arrangement.phase === ArrangementPhase.ReadyToStart
            );

          case 'Active + Setup':
            return arrangements.some(
              (arrangement) =>
                arrangement.phase === ArrangementPhase.Started ||
                arrangement.phase === ArrangementPhase.SettingUp ||
                arrangement.phase === ArrangementPhase.ReadyToStart
            );

          default:
            return true;
        }
      });

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const updateTestFamilyFlagEnabled = useFeatureFlagEnabled(
    'updateTestFamilyFlag'
  );

  const permissions = useAllPartneringFamiliesPermissions();

  useScreenTitle('Cases');

  return !partneringFamiliesLoadable || !arrangementTypes ? (
    <ProgressBackdrop>
      <p>Loading families...</p>
    </ProgressBackdrop>
  ) : (
    <Grid container>
      <Grid item xs={12}>
        <Stack
          direction="row"
          sx={{
            marginTop: 2,
            marginBottom: 2,
            flexWrap: 'wrap',
            alignItems: 'center',
            gap: 1,
          }}
        >
          {permissions(Permission.EditFamilyInfo) &&
            permissions(Permission.CreateV1Case) && (
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => setCreatePartneringFamilyDialogOpen(true)}
                sx={{ marginRight: 'auto' }}
              >
                Add new client family
              </Button>
            )}

          <ToggleButtonGroup
            value={arrangementsFilter}
            exclusive
            onChange={(_, value) => setArrangementsFilter(value)}
            size={isMobile ? 'medium' : 'small'}
            aria-label="row expansion"
          >
            <Tooltip title="Shows all cases" arrow>
              <ToggleButton value={'All'} aria-label="expanded">
                All
              </ToggleButton>
            </Tooltip>
            <Tooltip title="Shows open cases with no arrangements yet" arrow>
              <ToggleButton value={'Intake'}>Intake</ToggleButton>
            </Tooltip>
            <Tooltip
              title="Shows cases with at least one active arrangement"
              arrow
            >
              <ToggleButton value={'Active'} aria-label="collapsed">
                Active
              </ToggleButton>
            </Tooltip>
            <Tooltip
              title="Shows cases with arrangements in the setup phase"
              arrow
            >
              <ToggleButton value={'Setup'} aria-label="collapsed">
                Setup
              </ToggleButton>
            </Tooltip>
            <Tooltip
              title="Shows cases with arrangements that are either active or in setup"
              arrow
            >
              <ToggleButton value={'Active + Setup'} aria-label="collapsed">
                Active + Setup
              </ToggleButton>
            </Tooltip>
          </ToggleButtonGroup>

          <CustomFieldsFilter
            customFields={referralCustomFields}
            optionsByField={customFieldFilterOptionsByField}
            selectedValuesByField={selectedCustomFieldValuesByField}
            onFieldChange={setSelectedCustomFieldValuesForField}
          />

          <SearchBar value={filterText} onChange={setFilterText} />

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
        </Stack>
      </Grid>
      <Grid item xs={12} className="cases-table">
        <TableContainer
          sx={{
            borderBottom: '1px solid rgba(224, 224, 224, 1)',
            overflow: 'visible',
          }}
        >
          <Table sx={{ minWidth: '700px' }} size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 600 }}>Client Family</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Case Status</TableCell>
                {referralCustomFields.map((field) => (
                  <TableCell
                    key={field.name}
                    sx={{
                      fontWeight: 600,
                      textAlign: 'center',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {field.name}
                  </TableCell>
                ))}

                {!expandedView &&
                  arrangementTypes?.map((arrangementType) => (
                    <TableCell
                      key={arrangementType}
                      sx={{
                        fontWeight: 600,
                        textAlign: 'center',
                      }}
                    >
                      {arrangementType}
                    </TableCell>
                  ))}
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
                  const comments =
                    partneringFamily.partneringFamilyInfo?.openV1Case
                      ?.comments ?? '';

                  const preview =
                    comments.length > 500
                      ? comments.slice(0, 500) + '...'
                      : comments;

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
                            {updateTestFamilyFlagEnabled && (
                              <TestFamilyBadge family={partneringFamily} />
                            )}
                          </span>
                        </TableCell>
                        <TableCell>
                          {
                            partneringFamily.partneringFamilyInfo?.openV1Case
                              ? 'Open since ' +
                                format(
                                  partneringFamily.partneringFamilyInfo
                                    .openV1Case.openedAtUtc!,
                                  'MM/dd/yyyy'
                                )
                              : 'Closed - ' +
                                V1CaseCloseReason[
                                  partneringFamily.partneringFamilyInfo!
                                    .closedV1Cases![
                                    partneringFamily.partneringFamilyInfo!
                                      .closedV1Cases!.length - 1
                                  ]!.closeReason!
                                ]
                            //TODO: "Closed on " + format(partneringFamily.partneringFamilyInfo?.closedV1Cases?.[0]?.closedUtc) -- needs a new calculated property
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
                        {referralCustomFields.map((field) => {
                          const completedFields =
                            partneringFamily.partneringFamilyInfo?.openV1Case
                              ?.completedCustomFields ?? [];

                          const matchingField = completedFields.find(
                            (customField: CompletedCustomFieldInfo) =>
                              customField.customFieldName === field.name
                          );

                          const fieldValue = matchingField?.value;

                          const displayValue =
                            fieldValue === true
                              ? 'Yes'
                              : fieldValue === false
                                ? 'No'
                                : fieldValue === undefined ||
                                    fieldValue === null
                                  ? ''
                                  : fieldValue.toString();

                          return (
                            <TableCell
                              key={field.name}
                              sx={{ textAlign: 'center' }}
                            >
                              {displayValue}
                            </TableCell>
                          );
                        })}
                      </TableRow>
                      {expandedView ? (
                        <TableRow
                          onClick={() =>
                            openFamily(partneringFamily.family!.id!)
                          }
                        >
                          <TableCell sx={{ maxWidth: '400px', paddingLeft: 3 }}>
                            <Box
                              sx={{
                                whiteSpace: 'pre-wrap',
                                overflowWrap: 'break-word',
                              }}
                            >
                              {preview}
                            </Box>
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
                                        arrangementEntry.v1CaseId,
                                        arrangementEntry.arrangement.id
                                      );
                                    }}
                                  >
                                    <ArrangementCard
                                      summaryOnly
                                      partneringFamily={partneringFamily}
                                      v1CaseId={arrangementEntry.v1CaseId}
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

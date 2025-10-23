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
import useScreenTitle from '../Shell/ShellScreenTitle';
import UnfoldLessIcon from '@mui/icons-material/UnfoldLess';
import UnfoldMoreIcon from '@mui/icons-material/UnfoldMore';
import { useLoadable } from '../Hooks/useLoadable';
import { ProgressBackdrop } from '../Shell/ProgressBackdrop';
import { useAppNavigate } from '../Hooks/useAppNavigate';
import PhoneIcon from '@mui/icons-material/Phone';
import { ReferralCustomFieldFilter } from '../V1Cases/Arrangements/ReferralCustomFieldFilter';

const arrangementPhaseText = new Map<number, string>([
  [ArrangementPhase.SettingUp, 'Setting Up'],
  [ArrangementPhase.ReadyToStart, 'Ready To Start'],
  [ArrangementPhase.Started, 'Started'],
  [ArrangementPhase.Ended, 'Ended'],
]);

function allArrangements(partneringFamilyInfo: PartneringFamilyInfo) {
  const results: { v1CaseId: string; arrangement: Arrangement }[] = [];
  partneringFamilyInfo.closedV1Cases?.forEach((x) =>
    x.arrangements?.forEach((y) =>
      results.push({ v1CaseId: x.id!, arrangement: y })
    )
  );
  partneringFamilyInfo.openV1Case?.arrangements?.forEach((x) =>
    results.push({
      v1CaseId: partneringFamilyInfo.openV1Case!.id!,
      arrangement: x,
    })
  );
  return results;
}

function matchingArrangements(
  partneringFamilyInfo: PartneringFamilyInfo,
  arrangementsFilter: 'All' | 'Active' | 'Setup' | 'Active + Setup'
) {
  const results: { v1CaseId: string; arrangement: Arrangement }[] = [];
  if (arrangementsFilter === 'All') {
    partneringFamilyInfo.closedV1Cases?.forEach((x) =>
      x.arrangements?.forEach((y) =>
        results.push({ v1CaseId: x.id!, arrangement: y })
      )
    );
    partneringFamilyInfo.openV1Case?.arrangements?.forEach((x) =>
      results.push({
        v1CaseId: partneringFamilyInfo.openV1Case!.id!,
        arrangement: x,
      })
    );
  } else {
    if (
      arrangementsFilter === 'Active' ||
      arrangementsFilter === 'Active + Setup'
    ) {
      partneringFamilyInfo.openV1Case?.arrangements
        ?.filter(
          (arrangement) => arrangement.phase === ArrangementPhase.Started
        )
        .forEach((x) =>
          results.push({
            v1CaseId: partneringFamilyInfo.openV1Case!.id!,
            arrangement: x,
          })
        );
    }
    if (
      arrangementsFilter === 'Setup' ||
      arrangementsFilter === 'Active + Setup'
    ) {
      partneringFamilyInfo.openV1Case?.arrangements
        ?.filter(
          (arrangement) =>
            arrangement.phase === ArrangementPhase.SettingUp ||
            arrangement.phase === ArrangementPhase.ReadyToStart
        )
        .forEach((x) =>
          results.push({
            v1CaseId: partneringFamilyInfo.openV1Case!.id!,
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

  const loadablePolicy = useLoadable(policyData);

  const referralCustomFields = React.useMemo(() => {
    return loadablePolicy?.referralPolicy?.customFields || [];
  }, [loadablePolicy]);

  const [filterText, setFilterText] = useState('');
  const filteredPartneringFamilies = filterFamiliesByText(
    partneringFamilies,
    filterText
  );

  type FilterOption = { key: string; value?: string; selected: boolean };

  const [customFieldFilterOptions, setCustomFieldFilterOptions] = useState<
    Record<string, FilterOption[]>
  >({});

  React.useEffect(() => {
    setCustomFieldFilterOptions((prev) => {
      const optionsByField: Record<string, FilterOption[]> = { ...prev };

      referralCustomFields.forEach((field) => {
        const existing = prev[field.name] || [];

        const values = new Set(existing.map((o) => o.value ?? ''));

        partneringFamilies.forEach((family) => {
          const val =
            family.partneringFamilyInfo?.openV1Case?.completedCustomFields?.find(
              (f) => f.customFieldName === field.name
            )?.value;

          let normalized: string;
          if (val === true) normalized = 'Yes';
          else if (val === false) normalized = 'No';
          else if (val === undefined || val === null || val === '')
            normalized = 'Blank';
          else normalized = val.toString();

          values.add(normalized);
        });

        const updatedOptions = Array.from(values).map((v) => {
          const existingOption = existing.find((o) => o.value === v);
          return {
            key: v,
            value: v,
            selected: existingOption?.selected ?? false,
          };
        });

        optionsByField[field.name] = updatedOptions;
      });

      return optionsByField;
    });
  }, [partneringFamilies, referralCustomFields]);

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
    filteredPartneringFamilies
      .filter((family) => {
        return referralCustomFields.every((field) => {
          const options = customFieldFilterOptions[field.name];
          if (!options) return true;

          const selectedValues = options
            .filter((o) => o.selected)
            .map((o) => o.value);

          const rawVal =
            family.partneringFamilyInfo?.openV1Case?.completedCustomFields?.find(
              (f) => f.customFieldName === field.name
            )?.value;

          let value: string;
          if (rawVal === true) value = 'Yes';
          else if (rawVal === false) value = 'No';
          else if (rawVal === undefined || rawVal === null || rawVal === '')
            value = 'Blank';
          else value = rawVal.toString();

          return selectedValues.length === 0 || selectedValues.includes(value);
        });
      })
      .filter((family) =>
        arrangementsFilter === 'All'
          ? true
          : arrangementsFilter === 'Active'
            ? family.partneringFamilyInfo?.openV1Case?.arrangements?.some(
                (arrangement) => arrangement.phase === ArrangementPhase.Started
              )
            : arrangementsFilter === 'Setup'
              ? family.partneringFamilyInfo?.openV1Case?.arrangements?.some(
                  (arrangement) =>
                    arrangement.phase === ArrangementPhase.SettingUp ||
                    arrangement.phase === ArrangementPhase.ReadyToStart
                )
              : family.partneringFamilyInfo?.openV1Case?.arrangements?.some(
                  (arrangement) =>
                    arrangement.phase === ArrangementPhase.Started ||
                    arrangement.phase === ArrangementPhase.SettingUp ||
                    arrangement.phase === ArrangementPhase.ReadyToStart
                )
      );

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

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

          {referralCustomFields.map((field) => {
            const options = customFieldFilterOptions[field.name];
            if (!options) return null;

            const handleFilterChange = (selectedValues: string[]) => {
              setCustomFieldFilterOptions((prev) => {
                const fieldOptions = prev[field.name];
                if (!fieldOptions) return prev;
                return {
                  ...prev,
                  [field.name]: fieldOptions.map((opt) => ({
                    ...opt,
                    selected: selectedValues.includes(opt.value ?? 'Blank'),
                  })),
                };
              });
            };

            return (
              <ReferralCustomFieldFilter
                key={field.name}
                label={field.name}
                options={options}
                onChange={handleFilterChange}
              />
            );
          })}

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
      <Grid item xs={12}>
        <TableContainer
          sx={{ borderBottom: '1px solid rgba(224, 224, 224, 1)' }}
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

                          let displayValue = '';
                          if (fieldValue === true) displayValue = 'Yes';
                          else if (fieldValue === false) displayValue = 'No';
                          else if (
                            fieldValue === undefined ||
                            fieldValue === null
                          )
                            displayValue = '';
                          else displayValue = fieldValue.toString();

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
                            {
                              partneringFamily.partneringFamilyInfo?.openV1Case
                                ?.comments
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

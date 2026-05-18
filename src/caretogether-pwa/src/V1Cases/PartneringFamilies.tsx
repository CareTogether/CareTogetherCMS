import {
  Button,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  SelectChangeEvent,
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
import { partneringFamiliesData } from '../Model/V1CasesModel';
import React, { useState } from 'react';
import {
  Add as AddIcon,
  UnfoldLess as UnfoldLessIcon,
  UnfoldMore as UnfoldMoreIcon,
} from '@mui/icons-material';
import {
  ArrangementPhase,
  CombinedFamilyInfo,
  Permission,
  V1Referral,
  V1ReferralStatus,
} from '../GeneratedClient';
import { CreatePartneringFamilyDrawer } from './CreatePartneringFamilyDrawer';
import { useScrollMemory } from '../Hooks/useScrollMemory';
import { useLocalStorage } from '../Hooks/useLocalStorage';
import { policyData } from '../Model/ConfigurationModel';
import { SearchBar } from '../Shell/SearchBar';
import {
  filterFamiliesByText,
  familyLastName,
} from '../Families/FamilyUtils';
import { useAllPartneringFamiliesPermissions } from '../Model/SessionModel';
import { useScreenTitle } from '../Shell/ShellScreenTitle';
import { useLoadable } from '../Hooks/useLoadable';
import { ProgressBackdrop } from '../Shell/ProgressBackdrop';
import { useAppNavigate } from '../Hooks/useAppNavigate';
import { CustomFieldsFilter } from '../Generic/CustomFieldsFilter/CustomFieldsFilter';
import { useCustomFieldFilters } from '../Generic/CustomFieldsFilter/useCustomFieldFilters';
import { matchesCustomFieldFilters } from '../Generic/CustomFieldsFilter/matchesCustomFieldFilters';
import { useFeatureFlagEnabled } from 'posthog-js/react';
import { forceCheck } from '../Utilities/reactLazyLoadInterop';
import { PartneringFamilyTableItem } from './PartneringFamilies/PartneringFamilyTableItem';
import { arrangementStatusSummary } from './PartneringFamilies/arrangementStatusSummary';
import { ArrangementsFilter } from './PartneringFamilies/types';
import { stickyHeaderTableSx } from '../Utilities/stickyHeaderTableSx';
import { getFamilyCounty } from '../Utilities/getFamilyCounty';
import { CountyFilter } from '../V1Referrals/CountyFilter';
import { visibleReferralsQuery } from '../Model/Data';

const PARTNERING_FAMILIES_SORT_STORAGE_KEY = 'partnering-families-sortMode';

type PartneringFamiliesSortMode = 'familyName' | 'dateOpened';

function isPartneringFamiliesSortMode(
  value: unknown
): value is PartneringFamiliesSortMode {
  return value === 'familyName' || value === 'dateOpened';
}

function safeDateTime(value: Date | string | null | undefined) {
  if (!value) {
    return null;
  }

  const time = new Date(value).getTime();

  return Number.isNaN(time) ? null : time;
}

function compareByFamilyName(
  firstFamily: CombinedFamilyInfo,
  secondFamily: CombinedFamilyInfo
) {
  const firstLastName = familyLastName(firstFamily);
  const secondLastName = familyLastName(secondFamily);

  if (firstLastName < secondLastName) {
    return -1;
  }

  if (firstLastName > secondLastName) {
    return 1;
  }

  return (firstFamily.family?.id ?? '').localeCompare(
    secondFamily.family?.id ?? ''
  );
}

function openReferralByFamilyId(referrals: V1Referral[]) {
  return referrals.reduce((referralByFamilyId, referral) => {
    if (referral.status !== V1ReferralStatus.Open || !referral.familyId) {
      return referralByFamilyId;
    }

    const currentReferral = referralByFamilyId.get(referral.familyId);
    const currentReferralTime = safeDateTime(currentReferral?.createdAtUtc);
    const referralTime = safeDateTime(referral.createdAtUtc);

    if (currentReferral && (referralTime ?? 0) <= (currentReferralTime ?? 0)) {
      return referralByFamilyId;
    }

    referralByFamilyId.set(referral.familyId, referral);
    return referralByFamilyId;
  }, new Map<string, V1Referral>());
}

function getOpenedAtTime(
  family: CombinedFamilyInfo,
  openReferralByFamily: Map<string, V1Referral>
) {
  const caseOpenedAt = safeDateTime(
    family.partneringFamilyInfo?.openV1Case?.openedAtUtc
  );

  if (caseOpenedAt !== null) {
    return caseOpenedAt;
  }

  const familyId = family.family?.id;

  if (!familyId) {
    return null;
  }

  return safeDateTime(openReferralByFamily.get(familyId)?.createdAtUtc);
}

function compareByDateOpened(
  firstFamily: CombinedFamilyInfo,
  secondFamily: CombinedFamilyInfo,
  openReferralByFamily: Map<string, V1Referral>
) {
  const firstOpenedAt = getOpenedAtTime(firstFamily, openReferralByFamily);
  const secondOpenedAt = getOpenedAtTime(secondFamily, openReferralByFamily);

  if (firstOpenedAt === null && secondOpenedAt === null) {
    return compareByFamilyName(firstFamily, secondFamily);
  }

  if (firstOpenedAt === null) {
    return 1;
  }

  if (secondOpenedAt === null) {
    return -1;
  }

  if (firstOpenedAt === secondOpenedAt) {
    return compareByFamilyName(firstFamily, secondFamily);
  }

  return secondOpenedAt - firstOpenedAt;
}

function sortPartneringFamilies(
  families: CombinedFamilyInfo[],
  sortMode: PartneringFamiliesSortMode,
  openReferralByFamily: Map<string, V1Referral>
) {
  return families.map((family) => family).sort((firstFamily, secondFamily) => {
    if (sortMode === 'dateOpened') {
      return compareByDateOpened(
        firstFamily,
        secondFamily,
        openReferralByFamily
      );
    }

    return compareByFamilyName(firstFamily, secondFamily);
  });
}

function isSetupOrActiveArrangementPhase(phase: ArrangementPhase | undefined) {
  return (
    phase === ArrangementPhase.Started ||
    phase === ArrangementPhase.SettingUp ||
    phase === ArrangementPhase.ReadyToStart
  );
}

function PartneringFamilies() {
  const appNavigate = useAppNavigate();

  const partneringFamiliesLoadable = useLoadable(partneringFamiliesData);
  const partneringFamilies = React.useMemo(
    () => partneringFamiliesLoadable || [],
    [partneringFamiliesLoadable]
  );
  const visibleReferralsLoadable = useLoadable(visibleReferralsQuery);
  const visibleReferrals = React.useMemo(
    () => visibleReferralsLoadable || [],
    [visibleReferralsLoadable]
  );
  const openReferralByFamily = React.useMemo(
    () => openReferralByFamilyId(visibleReferrals),
    [visibleReferrals]
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
  const [countyFilter, setCountyFilter] = useState<(string | null)[]>([]);
  const [storedSortMode, setStoredSortMode] =
    useLocalStorage<PartneringFamiliesSortMode>(
      PARTNERING_FAMILIES_SORT_STORAGE_KEY,
      'familyName'
    );
  const sortMode = isPartneringFamiliesSortMode(storedSortMode)
    ? storedSortMode
    : 'familyName';

  function setSortMode(value: PartneringFamiliesSortMode) {
    setStoredSortMode(value);
  }

  const filteredPartneringFamilies = React.useMemo(
    () => filterFamiliesByText(partneringFamilies, filterText),
    [filterText, partneringFamilies]
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

  const [arrangementsFilter, setArrangementsFilter] =
    useLocalStorage<ArrangementsFilter>(
      'partnering-families-arrangementsFilter',
      'All'
    );
  const sortedPartneringFamilies = React.useMemo(
    () =>
      sortPartneringFamilies(
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
            if (countyFilter.length === 0) return true;

            const county = getFamilyCounty(family);
            return county === null
              ? countyFilter.includes(null)
              : countyFilter.includes(county);
          })
          .filter((family) => {
            const familyId = family.family?.id;
            const openCase = family.partneringFamilyInfo?.openV1Case;
            const arrangements = openCase?.arrangements ?? [];
            const hasOpenReferralWithoutCase =
              !openCase &&
              !!familyId &&
              openReferralByFamily.has(familyId);

            switch (arrangementsFilter) {
              case 'All':
                return true;

              case 'Intake':
                if (hasOpenReferralWithoutCase) return true;
                if (!openCase) return false;

                return arrangements.length === 0;

              case 'Active':
                return arrangements.some(
                  (arrangement) =>
                    arrangement.phase === ArrangementPhase.Started
                );

              case 'Setup':
                return arrangements.some(
                  (arrangement) =>
                    arrangement.phase === ArrangementPhase.SettingUp ||
                    arrangement.phase === ArrangementPhase.ReadyToStart
                );

              case 'Active + Setup':
                return arrangements.some((arrangement) =>
                  isSetupOrActiveArrangementPhase(arrangement.phase)
                );

              default:
                return true;
            }
          }),
        sortMode,
        openReferralByFamily
      ),
    [
      arrangementsFilter,
      countyFilter,
      filteredPartneringFamilies,
      openReferralByFamily,
      referralCustomFields,
      selectedCustomFieldValuesByField,
      sortMode,
    ]
  );

  React.useEffect(() => {
    forceCheck();
  }, [
    arrangementsFilter,
    filterText,
    selectedCustomFieldValuesByField,
    sortMode,
    openReferralByFamily,
  ]);

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const updateTestFamilyFlagEnabled = useFeatureFlagEnabled(
    'updateTestFamilyFlag'
  );

  const permissions = useAllPartneringFamiliesPermissions();

  const referralsEnabled = useFeatureFlagEnabled('referrals');

  const canCreateFamily =
    permissions(Permission.EditFamilyInfo) &&
    permissions(Permission.CreateV1Case);

  const showAddFamilyButton = !referralsEnabled && canCreateFamily;

  useScreenTitle('Clients');

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
          {canCreateFamily && (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setCreatePartneringFamilyDialogOpen(true)}
              sx={{
                marginRight: 'auto',
                visibility: showAddFamilyButton ? 'visible' : 'hidden',
                pointerEvents: showAddFamilyButton ? 'auto' : 'none',
              }}
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

          <CountyFilter
            families={partneringFamilies}
            value={countyFilter}
            onChange={setCountyFilter}
          />

          <FormControl size="small" sx={{ minWidth: 140 }}>
            <InputLabel id="partnering-families-sort-label">Sort by</InputLabel>
            <Select
              labelId="partnering-families-sort-label"
              value={sortMode}
              label="Sort by"
              onChange={(event: SelectChangeEvent) =>
                setSortMode(event.target.value as PartneringFamiliesSortMode)
              }
            >
              <MenuItem value="familyName">Family name</MenuItem>
              <MenuItem value="dateOpened">Date opened</MenuItem>
            </Select>
          </FormControl>

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
          <Table
            stickyHeader
            sx={{ ...stickyHeaderTableSx, minWidth: '700px' }}
            size="small"
          >
            <TableHead>
              <TableRow>
                <TableCell>Client Family</TableCell>
                <TableCell>Case Status</TableCell>
                <TableCell>County</TableCell>
                {referralCustomFields.map((field) => (
                  <TableCell
                    key={field.name}
                    sx={{
                      textAlign: 'center',
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
                        textAlign: 'center',
                      }}
                    >
                      {arrangementType}
                    </TableCell>
                  ))}
              </TableRow>
            </TableHead>

            <TableBody>
              {sortedPartneringFamilies.map((partneringFamily) => (
                <PartneringFamilyTableItem
                  key={partneringFamily.family?.id}
                  partneringFamily={partneringFamily}
                  arrangementTypes={arrangementTypes}
                  arrangementsFilter={arrangementsFilter}
                  expandedView={expandedView}
                  openArrangement={(familyId, v1CaseId, arrangementId) =>
                    appNavigate.family(familyId, v1CaseId, arrangementId)
                  }
                  openFamily={openFamily}
                  referralCustomFields={referralCustomFields}
                  arrangementStatusSummary={arrangementStatusSummary}
                  updateTestFamilyFlagEnabled={updateTestFamilyFlagEnabled}
                />
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        {createPartneringFamilyDialogOpen && (
          <CreatePartneringFamilyDrawer
            onClose={(partneringFamilyId) => {
              setCreatePartneringFamilyDialogOpen(false);

              if (!partneringFamilyId) {
                return;
              }

              openFamily(partneringFamilyId);
            }}
          />
        )}
      </Grid>
    </Grid>
  );
}

export { PartneringFamilies };

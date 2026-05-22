import {
  Button,
  FormControl,
  Grid,
  InputBase,
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
  FilterList as FilterListIcon,
  UnfoldLess as UnfoldLessIcon,
  UnfoldMore as UnfoldMoreIcon,
} from '@mui/icons-material';
import { ArrangementPhase, Permission } from '../GeneratedClient';
import { CreatePartneringFamilyDrawer } from './CreatePartneringFamilyDrawer';
import { useScrollMemory } from '../Hooks/useScrollMemory';
import { useLocalStorage } from '../Hooks/useLocalStorage';
import { policyData } from '../Model/ConfigurationModel';
import { SearchBar } from '../Shell/SearchBar';
import { filterFamiliesByText } from '../Families/FamilyUtils';
import { usePersonAndFamilyLookup } from '../Model/DirectoryModel';
import { useAllPartneringFamiliesPermissions } from '../Model/SessionModel';
import { useScreenTitle } from '../Shell/ShellScreenTitle';
import { useLoadable } from '../Hooks/useLoadable';
import { ProgressBackdrop } from '../Shell/ProgressBackdrop';
import { useAppNavigate } from '../Hooks/useAppNavigate';
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
import {
  normalizePartneringFamiliesSortMode,
  openReferralByFamilyId,
  PartneringFamiliesSortMode,
  sortPartneringFamilies,
} from './PartneringFamilies/sortPartneringFamilies';
import { useSidePanel } from '../Hooks/useSidePanel';
import { PartneringFamilyCustomFieldFiltersSidePanel } from './PartneringFamilies/PartneringFamilyCustomFieldFiltersSidePanel';
import { VOLUNTEER_ASSIGNMENTS_FEATURE_FLAG } from '../featureFlags';
import {
  AssignmentFilterSelectionsByRole,
  assignmentRolesForColumns,
  matchesAssignmentFilters,
} from '../VolunteerAssignments/assignmentRoleColumns';
import { AssignmentRoleFilters } from '../VolunteerAssignments/AssignmentRoleFilters';

const PARTNERING_FAMILIES_SORT_STORAGE_KEY = 'partnering-families-sortMode';

function isSetupOrActiveArrangementPhase(phase: ArrangementPhase | undefined) {
  return (
    phase === ArrangementPhase.Started ||
    phase === ArrangementPhase.SettingUp ||
    phase === ArrangementPhase.ReadyToStart
  );
}

function PartneringFamilies() {
  const appNavigate = useAppNavigate();
  const personAndFamilyLookup = usePersonAndFamilyLookup();
  const {
    SidePanel: CustomFieldFiltersSidePanel,
    openSidePanel: openCustomFieldFiltersSidePanel,
    closeSidePanel: closeCustomFieldFiltersSidePanel,
  } = useSidePanel();

  const partneringFamiliesLoadable = useLoadable(partneringFamiliesData);
  const partneringFamilies = React.useMemo(
    () => partneringFamiliesLoadable || [],
    [partneringFamiliesLoadable]
  );
  const visibleReferralsLoadable = useLoadable(visibleReferralsQuery);
  const visibleReferrals = React.useMemo(
    () =>
      (visibleReferralsLoadable || []).map(
        (referralInfo) => referralInfo.referral
      ),
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
  const customFieldCount = referralCustomFields.length;

  const [filterText, setFilterText] = useState('');
  const [countyFilter, setCountyFilter] = useState<(string | null)[]>([]);
  const [storedSortMode, setStoredSortMode] =
    useLocalStorage<PartneringFamiliesSortMode>(
      PARTNERING_FAMILIES_SORT_STORAGE_KEY,
      'lastNameAsc'
    );
  const sortMode = normalizePartneringFamiliesSortMode(storedSortMode);

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
  const activeCustomFieldFilterCount = Object.values(
    selectedCustomFieldValuesByField
  ).filter((selectedValues) => selectedValues.length > 0).length;
  const [assignmentFilters, setAssignmentFilters] =
    useState<AssignmentFilterSelectionsByRole>({});

  const permissions = useAllPartneringFamiliesPermissions();
  const volunteerAssignmentsEnabled = useFeatureFlagEnabled(
    VOLUNTEER_ASSIGNMENTS_FEATURE_FLAG
  );
  const canViewVolunteerAssignments =
    volunteerAssignmentsEnabled === true &&
    permissions(Permission.ViewV1CaseVolunteerAssignments);
  const assignmentRoles = canViewVolunteerAssignments
    ? assignmentRolesForColumns(
        loadablePolicy?.referralPolicy?.volunteerAssignmentPolicies?.map(
          (assignmentPolicy) => assignmentPolicy.assignmentRole
        ) ?? [],
        partneringFamilies.flatMap(
          (family) =>
            family.partneringFamilyInfo?.openV1Case
              ?.assignedIndividualVolunteers ?? []
        )
      )
    : [];

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
            if (!canViewVolunteerAssignments) return true;

            return matchesAssignmentFilters(
              family.partneringFamilyInfo?.openV1Case
                ?.assignedIndividualVolunteers ?? [],
              assignmentFilters
            );
          })
          .filter((family) => {
            const familyId = family.family?.id;
            const openCase = family.partneringFamilyInfo?.openV1Case;
            const arrangements = openCase?.arrangements ?? [];
            const hasOpenReferralWithoutCase =
              !openCase && !!familyId && openReferralByFamily.has(familyId);

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
      assignmentFilters,
      arrangementsFilter,
      canViewVolunteerAssignments,
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
    assignmentFilters,
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

  const canCreateFamily =
    permissions(Permission.EditFamilyInfo) &&
    permissions(Permission.CreateV1Case);

  // const showAddFamilyButton = !referralsEnabled && canCreateFamily;
  const showAddFamilyButton = true;

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
          <CountyFilter
            families={partneringFamilies}
            value={countyFilter}
            onChange={setCountyFilter}
          />
          {canViewVolunteerAssignments && (
            <AssignmentRoleFilters
              assignmentRoles={assignmentRoles}
              assignments={partneringFamilies.flatMap(
                (family) =>
                  family.partneringFamilyInfo?.openV1Case
                    ?.assignedIndividualVolunteers ?? []
              )}
              selectedValuesByRole={assignmentFilters}
              onChange={(assignmentRole, selectedValues) =>
                setAssignmentFilters((current) => ({
                  ...current,
                  [assignmentRole]: selectedValues,
                }))
              }
              personLookup={(personId) =>
                personAndFamilyLookup(personId).person
              }
            />
          )}
          {customFieldCount > 0 && (
            <FormControl
              sx={{
                position: 'relative',
                minWidth: { xs: '100%', sm: 0 },
                maxWidth: { xs: '100%', sm: '16rem' },
              }}
            >
              <Select
                labelId="partneringFamilyCustomFieldsFilter"
                displayEmpty
                value=""
                open={false}
                variant="standard"
                onClick={() => openCustomFieldFiltersSidePanel()}
                sx={{
                  minWidth: { xs: '100%', sm: 0 },
                  maxWidth: '100%',
                  '& .MuiSelect-iconOpen': { transform: 'none' },
                  '& .MuiSelect-select': {
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    cursor: 'pointer',
                  },
                }}
                input={<InputBase />}
                IconComponent={FilterListIcon}
                SelectDisplayProps={{
                  title: `Custom fields (${activeCustomFieldFilterCount}/${customFieldCount})`,
                }}
                renderValue={() =>
                  `Custom fields (${activeCustomFieldFilterCount}/${customFieldCount})`
                }
              >
                <MenuItem value="" sx={{ display: 'none' }} />
              </Select>
            </FormControl>
          )}

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

        <Stack my={2} direction="row" justifyContent="flex-end">
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
              <MenuItem value="lastNameAsc">Last name (ascending)</MenuItem>
              <MenuItem value="lastNameDesc">Last name (descending)</MenuItem>
              <MenuItem value="dateOpenedDesc">
                Date opened (descending)
              </MenuItem>
              <MenuItem value="dateOpenedAsc">Date opened (ascending)</MenuItem>
            </Select>
          </FormControl>
        </Stack>

        <CustomFieldFiltersSidePanel>
          <PartneringFamilyCustomFieldFiltersSidePanel
            customFields={referralCustomFields}
            optionsByField={customFieldFilterOptionsByField}
            selectedValuesByField={selectedCustomFieldValuesByField}
            onFieldChange={setSelectedCustomFieldValuesForField}
            onClose={closeCustomFieldFiltersSidePanel}
          />
        </CustomFieldFiltersSidePanel>
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
                {canViewVolunteerAssignments &&
                  assignmentRoles.map((assignmentRole) => (
                    <TableCell key={assignmentRole}>{assignmentRole}</TableCell>
                  ))}
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
                  assignmentRoles={
                    canViewVolunteerAssignments ? assignmentRoles : []
                  }
                  assignmentPersonLookup={(personId) =>
                    personAndFamilyLookup(personId).person
                  }
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

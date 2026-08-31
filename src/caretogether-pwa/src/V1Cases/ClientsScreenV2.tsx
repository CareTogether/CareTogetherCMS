import { Alert, Box, Button, Stack, Typography } from '@mui/material';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useFeatureFlagEnabled } from 'posthog-js/react';
import { useRecoilValue } from 'recoil';
import { accountInfoState } from '../Authentication/Auth';
import { Permission } from '../GeneratedClient';
import { useScreenTitle } from '../Shell/ShellScreenTitle';
import { v2Typography } from '../Families/v2Typography';
import { ClientsBrowserToolbarV2 } from './ClientsBrowserToolbarV2';
import { ClientsDataGridV2 } from './ClientsDataGridV2';
import {
  ClientBrowserRowV2,
  useClientsBrowserViewModel,
} from './useClientsBrowserViewModel';
import { useAppNavigate } from '../Hooks/useAppNavigate';
import { PartneringFamiliesSortMode } from './PartneringFamilies/sortPartneringFamilies';
import { ArrangementsFilter } from './PartneringFamilies/types';
import { FUNCTION_ASSIGNMENTS_FEATURE_FLAG } from '../featureFlags';
import {
  useAllPartneringFamiliesPermissions,
  useGlobalPermissions,
} from '../Model/SessionModel';
import { usePersonAndFamilyLookup } from '../Model/DirectoryModel';
import type { AssignmentFilterSelectionsByRole } from '../FunctionAssignments/assignmentRoleColumns';
import { useCustomFieldFilters } from '../Generic/CustomFieldsFilter/useCustomFieldFilters';
import { useSidePanel } from '../Hooks/useSidePanel';
import { PartneringFamilyCustomFieldFiltersSidePanel } from './PartneringFamilies/PartneringFamilyCustomFieldFiltersSidePanel';
import { useLoadable } from '../Hooks/useLoadable';
import { selectedLocationContextState } from '../Model/Data';
import { partneringFamiliesData } from '../Model/V1CasesModel';
import { policyData } from '../Model/ConfigurationModel';
import { wideTablePageSx } from '../Utilities/wideTablePageSx';
import {
  defaultClientsBrowserFilterState,
  sanitizeClientsBrowserFilterPreferences,
  useClientsBrowserFilterPreferences,
} from './useClientsBrowserFilterPreferences';

const CLIENT_SEARCH_DEBOUNCE_MS = 200;

function useDebouncedValue<T>(value: T, delayMs: number) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => setDebouncedValue(value), delayMs);

    return () => window.clearTimeout(timeoutId);
  }, [delayMs, value]);

  return debouncedValue;
}

function isSameJsonValue<T>(left: T, right: T) {
  return JSON.stringify(left) === JSON.stringify(right);
}

export function ClientsScreenV2() {
  useScreenTitle('Clients');
  const appNavigate = useAppNavigate();
  const accountInfo = useLoadable(accountInfoState);
  const { organizationId, locationId } = useRecoilValue(
    selectedLocationContextState
  );
  const personAndFamilyLookup = usePersonAndFamilyLookup();
  const globalPermissions = useGlobalPermissions();
  const permissions = useAllPartneringFamiliesPermissions();
  const functionAssignmentsEnabled = useFeatureFlagEnabled(
    FUNCTION_ASSIGNMENTS_FEATURE_FLAG
  );
  const {
    SidePanel: CustomFieldFiltersSidePanel,
    openSidePanel: openCustomFieldFiltersSidePanel,
    closeSidePanel: closeCustomFieldFiltersSidePanel,
  } = useSidePanel();
  const canViewFunctionAssignments =
    functionAssignmentsEnabled === true &&
    permissions(Permission.ViewV1CaseFunctionAssignments);
  const [searchValue, setSearchValue] = useState('');
  const debouncedSearchValue = useDebouncedValue(
    searchValue,
    CLIENT_SEARCH_DEBOUNCE_MS
  );
  const [countyFilter, setCountyFilter] = useState<(string | null)[]>([]);
  const [assignmentFilters, setAssignmentFilters] =
    useState<AssignmentFilterSelectionsByRole>({});
  const [arrangementsFilter, setArrangementsFilter] =
    useState<ArrangementsFilter>('All');
  const [sortMode, setSortMode] =
    useState<PartneringFamiliesSortMode>('lastNameAsc');
  const {
    canPersistFilters,
    clearSavedFilters,
    defaultFilters,
    preferencesLoaded: filterPreferencesLoaded,
    savedFilters,
    saveFilters,
    storageKey: filterPreferenceStorageKey,
  } = useClientsBrowserFilterPreferences({
    userId: accountInfo?.userId,
    organizationId,
    locationId,
  });
  const customFieldFilterItems = useLoadable(partneringFamiliesData) ?? [];
  const policy = useLoadable(policyData);
  const customFieldDefinitions = useMemo(
    () => policy?.referralPolicy?.customFields ?? [],
    [policy?.referralPolicy?.customFields]
  );
  const isBlankCustomFieldValue = useCallback(
    (family: (typeof customFieldFilterItems)[number], fieldName: string) =>
      family.partneringFamilyInfo?.openV1Case?.missingCustomFields?.includes(
        fieldName
      ) ?? false,
    []
  );
  const getCustomFieldValue = useCallback(
    (family: (typeof customFieldFilterItems)[number], fieldName: string) =>
      family.partneringFamilyInfo?.openV1Case?.completedCustomFields?.find(
        (field) => field.customFieldName === fieldName
      )?.value,
    []
  );
  const {
    selectedValuesByField: selectedCustomFieldValuesByField,
    setSelectedValuesByField: setSelectedCustomFieldValuesByField,
    setSelectedValuesForField: setSelectedCustomFieldValuesForField,
    getOptionsForField: getCustomFieldFilterOptionsForField,
  } = useCustomFieldFilters({
    customFields: customFieldDefinitions,
    items: customFieldFilterItems,
    isBlank: isBlankCustomFieldValue,
    getValue: getCustomFieldValue,
  });
  const activeCustomFieldFilterCount = Object.values(
    selectedCustomFieldValuesByField
  ).filter((selectedValues) => selectedValues.length > 0).length;
  const customFieldFilterValueOptionsByField = useMemo(
    () =>
      Object.fromEntries(
        customFieldDefinitions.map((field) => [
          field.name,
          getCustomFieldFilterOptionsForField(field).map(
            (option) => option.value
          ),
        ])
      ),
    [customFieldDefinitions, getCustomFieldFilterOptionsForField]
  );
  const assignmentPersonLookup = useCallback(
    (personId: string) => personAndFamilyLookup(personId).person,
    [personAndFamilyLookup]
  );
  const handleAssignmentFilterChange = useCallback(
    (assignmentRole: string, selectedValues: (string | null)[]) =>
      setAssignmentFilters((current) => ({
        ...current,
        [assignmentRole]: selectedValues,
      })),
    []
  );
  const handleRowClick = useCallback(
    (row: ClientBrowserRowV2) => appNavigate.family(row.familyId),
    [appNavigate]
  );
  const {
    assignmentFilterAssignments,
    assignmentColumnRoles,
    assignmentFilterOptions,
    customFieldDefinitions: clientFamilyCustomFieldDefinitions,
    counties,
    isLoading,
    rows,
  } = useClientsBrowserViewModel({
    arrangementsFilter,
    assignmentFilters,
    canViewFunctionAssignments,
    countyFilter,
    filterText: debouncedSearchValue,
    selectedCustomFieldValuesByField,
    sortMode,
  });
  const assignmentFilterValueOptionsByRole = useMemo(
    () =>
      Object.fromEntries(
        assignmentFilterOptions.map((assignmentRole) => [
          assignmentRole,
          [
            null,
            ...Array.from(
              new Set(
                assignmentFilterAssignments
                  .filter(
                    (assignment) =>
                      assignment.assignmentRole === assignmentRole
                  )
                  .map((assignment) => assignment.personId)
              )
            ),
          ],
        ])
      ),
    [assignmentFilterAssignments, assignmentFilterOptions]
  );
  const hasFeaturebaseChat = globalPermissions(Permission.AccessSupportScreen);
  const clientsFilterValidationOptions = useMemo(
    () => ({
      assignmentRoles: isLoading ? undefined : assignmentFilterOptions,
      assignmentValuesByRole: isLoading
        ? undefined
        : assignmentFilterValueOptionsByRole,
      counties: isLoading ? undefined : counties,
      customFields: policy ? customFieldDefinitions : undefined,
      customFieldValueOptionsByField: policy
        ? customFieldFilterValueOptionsByField
        : undefined,
    }),
    [
      assignmentFilterOptions,
      assignmentFilterValueOptionsByRole,
      counties,
      customFieldDefinitions,
      customFieldFilterValueOptionsByField,
      isLoading,
      policy,
    ]
  );
  const normalizedStructuredFilters = useMemo(
    () =>
      sanitizeClientsBrowserFilterPreferences(
        {
          version: 1,
          arrangementsFilter,
          assignmentFilters,
          countyFilter,
          customFieldFilters: selectedCustomFieldValuesByField,
        },
        clientsFilterValidationOptions
      ),
    [
      arrangementsFilter,
      assignmentFilters,
      clientsFilterValidationOptions,
      countyFilter,
      selectedCustomFieldValuesByField,
    ]
  );
  const structuredFiltersAtDefaults = useMemo(
    () => isSameJsonValue(normalizedStructuredFilters, defaultFilters),
    [defaultFilters, normalizedStructuredFilters]
  );
  const hasStructuredFilters =
    arrangementsFilter !== defaultFilters.arrangementsFilter ||
    countyFilter.length > 0 ||
    Object.values(assignmentFilters).some(
      (selectedValues) => selectedValues.length > 0
    ) ||
    Object.values(selectedCustomFieldValuesByField).some(
      (selectedValues) => selectedValues.length > 0
    );
  const hasActiveFilters =
    hasStructuredFilters || searchValue.trim().length > 0;
  const handleClearFilters = useCallback(() => {
    clearSavedFilters();
    setArrangementsFilter(defaultFilters.arrangementsFilter);
    setAssignmentFilters(defaultFilters.assignmentFilters);
    setCountyFilter(defaultFilters.countyFilter);
    setSelectedCustomFieldValuesByField(defaultFilters.customFieldFilters);
    setSearchValue('');
  }, [clearSavedFilters, defaultFilters, setSelectedCustomFieldValuesByField]);
  const restoredFilterPreferenceStorageKey = useRef<string | null>(null);

  useEffect(() => {
    if (restoredFilterPreferenceStorageKey.current === filterPreferenceStorageKey) {
      return;
    }

    setArrangementsFilter(defaultFilters.arrangementsFilter);
    setAssignmentFilters(defaultFilters.assignmentFilters);
    setCountyFilter(defaultFilters.countyFilter);
    setSelectedCustomFieldValuesByField(defaultFilters.customFieldFilters);
  }, [
    defaultFilters,
    filterPreferenceStorageKey,
    setSelectedCustomFieldValuesByField,
  ]);

  useEffect(() => {
    if (
      !filterPreferenceStorageKey ||
      !filterPreferencesLoaded ||
      restoredFilterPreferenceStorageKey.current === filterPreferenceStorageKey
    ) {
      return;
    }

    const restoredFilters = sanitizeClientsBrowserFilterPreferences(
      savedFilters ?? defaultClientsBrowserFilterState()
    );

    restoredFilterPreferenceStorageKey.current = filterPreferenceStorageKey;
    setArrangementsFilter(restoredFilters.arrangementsFilter);
    setAssignmentFilters(restoredFilters.assignmentFilters);
    setCountyFilter(restoredFilters.countyFilter);
    setSelectedCustomFieldValuesByField(restoredFilters.customFieldFilters);
  }, [
    filterPreferencesLoaded,
    filterPreferenceStorageKey,
    savedFilters,
    setSelectedCustomFieldValuesByField,
  ]);

  useEffect(() => {
    if (
      !canPersistFilters ||
      !filterPreferenceStorageKey ||
      !filterPreferencesLoaded ||
      restoredFilterPreferenceStorageKey.current !== filterPreferenceStorageKey
    ) {
      return;
    }

    if (structuredFiltersAtDefaults) {
      if (savedFilters) {
        clearSavedFilters();
      }

      return;
    }

    if (
      savedFilters &&
      isSameJsonValue(savedFilters, normalizedStructuredFilters)
    ) {
      return;
    }

    saveFilters({
      arrangementsFilter: normalizedStructuredFilters.arrangementsFilter,
      assignmentFilters: normalizedStructuredFilters.assignmentFilters,
      countyFilter: normalizedStructuredFilters.countyFilter,
      customFieldFilters: normalizedStructuredFilters.customFieldFilters,
    });
  }, [
    canPersistFilters,
    clearSavedFilters,
    filterPreferenceStorageKey,
    filterPreferencesLoaded,
    normalizedStructuredFilters,
    saveFilters,
    savedFilters,
    structuredFiltersAtDefaults,
  ]);

  useEffect(() => {
    if (isLoading) return;

    setAssignmentFilters((current) => {
      const next = sanitizeClientsBrowserFilterPreferences(
        {
          ...defaultFilters,
          assignmentFilters: current,
        },
        {
          assignmentRoles: assignmentFilterOptions,
          assignmentValuesByRole: assignmentFilterValueOptionsByRole,
        }
      ).assignmentFilters;

      return isSameJsonValue(current, next) ? current : next;
    });
    setCountyFilter((current) => {
      const next = sanitizeClientsBrowserFilterPreferences(
        {
          ...defaultFilters,
          countyFilter: current,
        },
        { counties }
      ).countyFilter;

      return isSameJsonValue(current, next) ? current : next;
    });
    setSelectedCustomFieldValuesByField((current) => {
      const next = sanitizeClientsBrowserFilterPreferences(
        {
          ...defaultFilters,
          customFieldFilters: current,
        },
        {
          customFields: customFieldDefinitions,
          customFieldValueOptionsByField:
            customFieldFilterValueOptionsByField,
        }
      ).customFieldFilters;

      return isSameJsonValue(current, next) ? current : next;
    });
  }, [
    assignmentFilterOptions,
    assignmentFilterValueOptionsByRole,
    counties,
    customFieldDefinitions,
    customFieldFilterValueOptionsByField,
    defaultFilters,
    isLoading,
    setSelectedCustomFieldValuesByField,
  ]);

  return (
    <Box
      sx={{
        ...wideTablePageSx(hasFeaturebaseChat),
      }}
    >
      <Stack spacing={2.5} sx={{ flex: 1, minHeight: 0 }}>
        <Box>
          <Typography
            className="ph-unmask"
            {...v2Typography.pageTitle}
            sx={{ mt: 2 }}
          >
            Clients
          </Typography>
          <Typography
            className="ph-unmask"
            {...v2Typography.secondaryValue}
            sx={{ ...v2Typography.secondaryValue.sx, mt: 0.5 }}
          >
            Browse client families, open cases, and arrangement summaries.
          </Typography>
        </Box>
        {hasActiveFilters && (
          <Alert
            action={
              <Button
                className="ph-unmask"
                color="inherit"
                onClick={handleClearFilters}
                size="small"
              >
                Clear filters
              </Button>
            }
            className="ph-unmask"
            severity="warning"
            sx={{ alignItems: 'center' }}
          >
            Filters are active
          </Alert>
        )}
        <ClientsBrowserToolbarV2
          searchValue={searchValue}
          statusValue={arrangementsFilter}
          countyOptions={counties}
          countyValue={countyFilter}
          sortValue={sortMode}
          assignmentFilterAssignments={assignmentFilterAssignments}
          assignmentFilters={assignmentFilters}
          assignmentPersonLookup={assignmentPersonLookup}
          assignmentRoles={
            canViewFunctionAssignments ? assignmentFilterOptions : []
          }
          activeCustomFieldFilterCount={activeCustomFieldFilterCount}
          customFieldCount={customFieldDefinitions.length}
          onAssignmentFilterChange={handleAssignmentFilterChange}
          onSearchChange={setSearchValue}
          onStatusChange={setArrangementsFilter}
          onCountyChange={setCountyFilter}
          onMoreFiltersClick={openCustomFieldFiltersSidePanel}
          onSortChange={setSortMode}
        />
        <Box sx={{ flex: 1, minHeight: 0 }}>
          <ClientsDataGridV2
            assignmentRoles={assignmentColumnRoles}
            customFields={clientFamilyCustomFieldDefinitions}
            loading={isLoading}
            rows={rows}
            onRowClick={handleRowClick}
          />
        </Box>
      </Stack>
      <CustomFieldFiltersSidePanel>
        <PartneringFamilyCustomFieldFiltersSidePanel
          customFields={customFieldDefinitions}
          getOptionsForField={getCustomFieldFilterOptionsForField}
          selectedValuesByField={selectedCustomFieldValuesByField}
          onFieldChange={setSelectedCustomFieldValuesForField}
          onClose={closeCustomFieldFiltersSidePanel}
        />
      </CustomFieldFiltersSidePanel>
    </Box>
  );
}

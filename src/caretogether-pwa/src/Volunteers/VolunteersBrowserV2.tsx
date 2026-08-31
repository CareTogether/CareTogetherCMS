import { Alert, Box, Button, Stack, Typography } from '@mui/material';
import type { GridFilterModel, GridRowSelectionModel } from '@mui/x-data-grid';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useFeatureFlagEnabled } from 'posthog-js/react';
import { EmailAddress, Permission } from '../GeneratedClient';
import { useAccountInfo } from '../Authentication/Auth';
import { useAppNavigate } from '../Hooks/useAppNavigate';
import { useGlobalSnackBar } from '../Hooks/useGlobalSnackBar';
import { useSidePanel } from '../Hooks/useSidePanel';
import { v2Typography } from '../Families/v2Typography';
import { useRequiredSelectedLocationContext } from '../Model/Data';
import { useOrganizationConfiguration } from '../Model/ConfigurationModel';
import { useAllVolunteerFamiliesPermissions } from '../Model/SessionModel';
import { BulkSmsSideSheet } from './BulkSmsSideSheet';
import { CreateVolunteerFamilyDrawer } from './CreateVolunteerFamilyDrawer';
import { VolunteerAssignmentFiltersSidePanel } from './VolunteerApprovalTab/VolunteerAssignmentFiltersSidePanel';
import { VolunteerCustomFieldFiltersSidePanel } from './VolunteerApprovalTab/VolunteerCustomFieldFiltersSidePanel';
import { VolunteersDataGridV2 } from './VolunteersDataGridV2';
import { VolunteersToolbarV2 } from './VolunteersToolbarV2';
import { useVolunteersBrowserViewModel } from './useVolunteersBrowserViewModel';
import { filterOption } from './VolunteerApprovalTab/filterOption';
import {
  gridFilterModelFromVolunteerFilters,
  volunteerFiltersFromGridFilterModel,
} from './volunteersGridFilterAdapter';
import { UPDATE_TEST_FAMILY_FEATURE_FLAG } from '../featureFlags';
import {
  completeRequirementFilterValue,
  missingRequirementFilterValue,
} from './VolunteerApprovalTab/volunteerMissingRequirementsPresentation';
import {
  defaultVolunteersBrowserFilterState,
  sanitizeVolunteersBrowserFilterPreferences,
  useVolunteersBrowserFilterPreferences,
} from './useVolunteersBrowserFilterPreferences';

function selectedFilterValues(filters: filterOption[]) {
  return filters
    .filter((filter) => filter.selected && filter.value !== undefined)
    .map((filter) => filter.value!);
}

function filterValues(filters: filterOption[]) {
  return filters
    .filter((filter) => filter.value !== undefined)
    .map((filter) => filter.value!);
}

function isSameJsonValue<T>(left: T, right: T) {
  return JSON.stringify(left) === JSON.stringify(right);
}

function filterByValidStrings(
  selectedValues: string[],
  validValues: string[]
) {
  const validValueSet = new Set(validValues);
  return selectedValues.filter((value) => validValueSet.has(value));
}

function hasIncompleteFilter(filterModel: GridFilterModel) {
  return filterModel.items.some(
    (item) =>
      item.value === undefined ||
      item.value === null ||
      item.value === '' ||
      (Array.isArray(item.value) && item.value.length === 0)
  );
}

export function VolunteersBrowserV2() {
  const appNavigate = useAppNavigate();
  const permissions = useAllVolunteerFamiliesPermissions();
  const updateTestFamilyFlagEnabled = useFeatureFlagEnabled(
    UPDATE_TEST_FAMILY_FEATURE_FLAG
  );
  const { setAndShowGlobalSnackBar } = useGlobalSnackBar();
  const accountInfo = useAccountInfo();
  const { organizationId, locationId } = useRequiredSelectedLocationContext();
  const organizationConfiguration = useOrganizationConfiguration();
  const [createVolunteerFamilyDrawerOpen, setCreateVolunteerFamilyDrawerOpen] =
    useState(false);
  const [smsMode, setSmsMode] = useState(false);
  const [selectedFamilyIds, setSelectedFamilyIds] = useState<string[]>([]);
  const {
    canPersistFilters,
    clearSavedFilters,
    defaultFilters,
    preferencesLoaded: filterPreferencesLoaded,
    savedFilters,
    saveFilters,
    storageKey: filterPreferenceStorageKey,
  } = useVolunteersBrowserFilterPreferences({
    userId: accountInfo?.userId,
    organizationId,
    locationId,
  });
  const restoredFilterPreferenceStorageKey = useRef<string | null>(null);
  const filtersBelongToCurrentScope =
    filterPreferenceStorageKey !== null &&
    restoredFilterPreferenceStorageKey.current === filterPreferenceStorageKey;

  const {
    activeAssignmentFilterCount,
    activeCustomFieldFilterCount,
    arrangementTypes,
    assignmentFilters,
    customFieldCount,
    customFieldFilters,
    customFields,
    getCustomFieldFilterOptionsForField,
    requirementFilter,
    requirementFilterOptionsLoaded,
    requirementFilterOptions,
    roleFilters,
    rows,
    searchValue,
    setAssignmentFilters,
    setAssignmentFilter,
    setCustomFieldFilters,
    setCustomFieldFilter,
    setRequirementFilter,
    setRoleFilterValues,
    setSearchValue,
    setStatusFilterValues,
    statusFilters,
    visibleVolunteerFamilies,
  } = useVolunteersBrowserViewModel({
    filtersEnabled: filtersBelongToCurrentScope,
  });
  const {
    SidePanel: AssignmentFiltersSidePanel,
    openSidePanel: openAssignmentFiltersSidePanel,
    closeSidePanel: closeAssignmentFiltersSidePanel,
  } = useSidePanel();
  const {
    SidePanel: CustomFieldFiltersSidePanel,
    openSidePanel: openCustomFieldFiltersSidePanel,
    closeSidePanel: closeCustomFieldFiltersSidePanel,
  } = useSidePanel();
  const canCreateVolunteerFamily =
    permissions(Permission.EditFamilyInfo) &&
    permissions(Permission.ActivateVolunteerFamily);
  const smsSourcePhoneNumbers = organizationConfiguration?.locations?.find(
    (location) => location.id === locationId
  )?.smsSourcePhoneNumbers;
  const canUseBulkEmail = permissions(Permission.SendBulkSms);
  const canUseBulkSms =
    permissions(Permission.SendBulkSms) &&
    Boolean(smsSourcePhoneNumbers && smsSourcePhoneNumbers.length > 0);
  const visibleRowIds = useMemo(() => rows.map((row) => row.id), [rows]);
  const rowSelectionModel = useMemo<GridRowSelectionModel>(
    () => ({
      type: 'include',
      ids: new Set(
        selectedFamilyIds.filter((id) => visibleRowIds.includes(id))
      ),
    }),
    [selectedFamilyIds, visibleRowIds]
  );
  const selectedVolunteerCount = rowSelectionModel.ids.size;
  const selectedVolunteerFamilies = useMemo(() => {
    const selectedFamilyIdSet = new Set(selectedFamilyIds);

    return visibleVolunteerFamilies.filter((family) =>
      selectedFamilyIdSet.has(family.family!.id!)
    );
  }, [selectedFamilyIds, visibleVolunteerFamilies]);
  const appliedFilterModel = useMemo(
    () =>
      gridFilterModelFromVolunteerFilters({
        logicOperator: 'and',
        requirementFilter,
        roleFilters: selectedFilterValues(roleFilters),
        statusFilters: selectedFilterValues(statusFilters),
      }),
    [requirementFilter, roleFilters, statusFilters]
  );
  const [pendingFilterModel, setPendingFilterModel] =
    useState<GridFilterModel | null>(null);
  const filterModel = filtersBelongToCurrentScope
    ? pendingFilterModel ?? appliedFilterModel
    : appliedFilterModel;
  const customFieldFilterValueOptionsByField = useMemo(
    () =>
      Object.fromEntries(
        customFields.map((field) => [
          field.name,
          getCustomFieldFilterOptionsForField(field).map(
            (option) => option.value
          ),
        ])
      ),
    [customFields, getCustomFieldFilterOptionsForField]
  );
  const requirementFilterValueOptions = useMemo(
    () => [
      missingRequirementFilterValue,
      completeRequirementFilterValue,
      ...requirementFilterOptions,
    ],
    [requirementFilterOptions]
  );
  const roleFilterValueOptions = useMemo(
    () => filterValues(roleFilters),
    [roleFilters]
  );
  const statusFilterValueOptions = useMemo(
    () => filterValues(statusFilters),
    [statusFilters]
  );
  const volunteersFilterValidationOptions = useMemo(
    () => ({
      arrangementTypes,
      customFields,
      customFieldValueOptionsByField: customFieldFilterValueOptionsByField,
      requirementFilterOptions: requirementFilterOptionsLoaded
        ? requirementFilterValueOptions
        : undefined,
      roleFilterValues: roleFilterValueOptions,
      statusFilterValues: statusFilterValueOptions,
    }),
    [
      arrangementTypes,
      customFieldFilterValueOptionsByField,
      customFields,
      requirementFilterOptionsLoaded,
      requirementFilterValueOptions,
      roleFilterValueOptions,
      statusFilterValueOptions,
    ]
  );
  const normalizedStructuredFilters = useMemo(
    () =>
      sanitizeVolunteersBrowserFilterPreferences(
        {
          version: 1,
          assignmentFilters,
          customFieldFilters,
          requirementFilter,
          roleFilterValues: selectedFilterValues(roleFilters),
          statusFilterValues: selectedFilterValues(statusFilters),
        },
        volunteersFilterValidationOptions
      ),
    [
      assignmentFilters,
      customFieldFilters,
      requirementFilter,
      roleFilters,
      statusFilters,
      volunteersFilterValidationOptions,
    ]
  );
  const structuredFiltersAtDefaults = useMemo(
    () => isSameJsonValue(normalizedStructuredFilters, defaultFilters),
    [defaultFilters, normalizedStructuredFilters]
  );
  const hasActiveRoleFilters = selectedFilterValues(roleFilters).length > 0;
  const hasActiveStatusFilters =
    selectedFilterValues(statusFilters).length > 0;
  const hasActiveFilters =
    activeAssignmentFilterCount > 0 ||
    activeCustomFieldFilterCount > 0 ||
    Boolean(requirementFilter) ||
    hasActiveRoleFilters ||
    hasActiveStatusFilters ||
    searchValue.trim().length > 0;
  const handleClearFilters = useCallback(() => {
    clearSavedFilters();
    setAssignmentFilters(defaultFilters.assignmentFilters);
    setCustomFieldFilters(defaultFilters.customFieldFilters);
    setRequirementFilter(defaultFilters.requirementFilter);
    setRoleFilterValues(defaultFilters.roleFilterValues);
    setStatusFilterValues(defaultFilters.statusFilterValues);
    setSearchValue('');
    setPendingFilterModel(null);
  }, [
    clearSavedFilters,
    defaultFilters,
    setAssignmentFilters,
    setCustomFieldFilters,
    setRequirementFilter,
    setRoleFilterValues,
    setSearchValue,
    setStatusFilterValues,
  ]);
  useEffect(() => {
    if (
      restoredFilterPreferenceStorageKey.current === filterPreferenceStorageKey
    ) {
      return;
    }

    setAssignmentFilters(defaultFilters.assignmentFilters);
    setCustomFieldFilters(defaultFilters.customFieldFilters);
    setRequirementFilter(defaultFilters.requirementFilter);
    setRoleFilterValues(defaultFilters.roleFilterValues);
    setStatusFilterValues(defaultFilters.statusFilterValues);
    setSearchValue('');
    setPendingFilterModel(null);
  }, [
    defaultFilters,
    filterPreferenceStorageKey,
    setAssignmentFilters,
    setCustomFieldFilters,
    setRequirementFilter,
    setRoleFilterValues,
    setSearchValue,
    setStatusFilterValues,
  ]);

  useEffect(() => {
    if (
      !filterPreferenceStorageKey ||
      !filterPreferencesLoaded ||
      restoredFilterPreferenceStorageKey.current === filterPreferenceStorageKey
    ) {
      return;
    }

    const restoredFilters = sanitizeVolunteersBrowserFilterPreferences(
      savedFilters ?? defaultVolunteersBrowserFilterState(),
      volunteersFilterValidationOptions
    );

    restoredFilterPreferenceStorageKey.current = filterPreferenceStorageKey;
    setAssignmentFilters(restoredFilters.assignmentFilters);
    setCustomFieldFilters(restoredFilters.customFieldFilters);
    setRequirementFilter(restoredFilters.requirementFilter);
    setRoleFilterValues(restoredFilters.roleFilterValues);
    setStatusFilterValues(restoredFilters.statusFilterValues);
    setSearchValue('');
    setPendingFilterModel(null);
  }, [
    filterPreferencesLoaded,
    filterPreferenceStorageKey,
    savedFilters,
    setAssignmentFilters,
    setCustomFieldFilters,
    setRequirementFilter,
    setRoleFilterValues,
    setSearchValue,
    setStatusFilterValues,
    volunteersFilterValidationOptions,
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
      assignmentFilters: normalizedStructuredFilters.assignmentFilters,
      customFieldFilters: normalizedStructuredFilters.customFieldFilters,
      requirementFilter: normalizedStructuredFilters.requirementFilter,
      roleFilterValues: normalizedStructuredFilters.roleFilterValues,
      statusFilterValues: normalizedStructuredFilters.statusFilterValues,
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
    setAssignmentFilters((current) => {
      const next = sanitizeVolunteersBrowserFilterPreferences(
        {
          ...defaultFilters,
          assignmentFilters: current,
        },
        { arrangementTypes }
      ).assignmentFilters;

      return isSameJsonValue(current, next) ? current : next;
    });
    setCustomFieldFilters((current) => {
      const next = sanitizeVolunteersBrowserFilterPreferences(
        {
          ...defaultFilters,
          customFieldFilters: current,
        },
        {
          customFields,
          customFieldValueOptionsByField:
            customFieldFilterValueOptionsByField,
        }
      ).customFieldFilters;

      return isSameJsonValue(current, next) ? current : next;
    });
    setRequirementFilter((current) => {
      const next = sanitizeVolunteersBrowserFilterPreferences(
        {
          ...defaultFilters,
          ...(current ? { requirementFilter: current } : {}),
        },
        { requirementFilterOptions: requirementFilterValueOptions }
      ).requirementFilter;

      return current === next ? current : next;
    });
    const currentRoleFilterValues = selectedFilterValues(roleFilters);
    const nextRoleFilterValues = filterByValidStrings(
      currentRoleFilterValues,
      roleFilterValueOptions
    );
    const currentStatusFilterValues = selectedFilterValues(statusFilters);
    const nextStatusFilterValues = filterByValidStrings(
      currentStatusFilterValues,
      statusFilterValueOptions
    );

    if (!isSameJsonValue(currentRoleFilterValues, nextRoleFilterValues)) {
      setRoleFilterValues(nextRoleFilterValues);
    }

    if (!isSameJsonValue(currentStatusFilterValues, nextStatusFilterValues)) {
      setStatusFilterValues(nextStatusFilterValues);
    }
  }, [
    arrangementTypes,
    customFields,
    customFieldFilterValueOptionsByField,
    defaultFilters,
    requirementFilterValueOptions,
    roleFilterValueOptions,
    roleFilters,
    setAssignmentFilters,
    setCustomFieldFilters,
    setRequirementFilter,
    setRoleFilterValues,
    setStatusFilterValues,
    statusFilterValueOptions,
    statusFilters,
  ]);

  function selectedFamilyContactEmails() {
    return selectedVolunteerFamilies
      .map((family) => {
        const primaryContactPerson = family.family?.adults?.find(
          (adult) =>
            adult.item1?.id === family.family?.primaryFamilyContactPersonId
        );
        const preferredEmailAddress =
          primaryContactPerson?.item1?.emailAddresses?.find(
            (email) =>
              email.id === primaryContactPerson.item1?.preferredEmailAddressId
          );
        return preferredEmailAddress;
      })
      .filter((email) => typeof email !== 'undefined') as EmailAddress[];
  }

  function copyEmailAddresses() {
    const emailAddresses = selectedFamilyContactEmails();
    navigator.clipboard.writeText(
      emailAddresses.map((email) => email.address).join('; ')
    );
    setAndShowGlobalSnackBar(
      `Found and copied ${emailAddresses.length} email addresses for ${selectedVolunteerFamilies.length} selected families to clipboard`
    );
  }

  function clearSelection() {
    setSelectedFamilyIds([]);
  }

  function handleRowSelectionModelChange(model: GridRowSelectionModel) {
    const visibleRowIdSet = new Set(visibleRowIds);

    if (model.type === 'exclude') {
      setSelectedFamilyIds(visibleRowIds.filter((id) => !model.ids.has(id)));
      return;
    }

    setSelectedFamilyIds(
      Array.from(model.ids)
        .map(String)
        .filter((id) => visibleRowIdSet.has(id))
    );
  }

  function handleAssignmentFilterChange(
    arrangementType: string,
    selectedValues: Parameters<typeof setAssignmentFilter>[1]
  ) {
    clearSelection();
    setAssignmentFilter(arrangementType, selectedValues);
  }

  function handleCustomFieldFilterChange(
    fieldName: string,
    selectedValues: Parameters<typeof setCustomFieldFilter>[1]
  ) {
    clearSelection();
    setCustomFieldFilter(fieldName, selectedValues);
  }

  function handleSearchChange(value: string) {
    clearSelection();
    setSearchValue(value);
  }

  function handleFilterModelChange(model: GridFilterModel) {
    const filters = volunteerFiltersFromGridFilterModel(model);

    setPendingFilterModel(hasIncompleteFilter(model) ? model : null);
    clearSelection();
    setRoleFilterValues(filters.roleFilters);
    setStatusFilterValues(filters.statusFilters);
    setRequirementFilter(
      filters.requirementFilter as Parameters<typeof setRequirementFilter>[0]
    );
  }

  return (
    <Stack spacing={2} sx={{ flex: 1, minHeight: 0 }}>
      <Box>
        <Typography
          className="ph-unmask"
          {...v2Typography.pageTitle}
          sx={{ mt: 2 }}
        >
          Volunteers
        </Typography>
        <Typography className="ph-unmask" {...v2Typography.secondaryValue}>
          Review volunteer families.
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
      <VolunteersToolbarV2
        activeAssignmentFilterCount={activeAssignmentFilterCount}
        activeCustomFieldFilterCount={activeCustomFieldFilterCount}
        arrangementTypeCount={arrangementTypes.length}
        canCreateVolunteerFamily={canCreateVolunteerFamily}
        canUseBulkEmail={canUseBulkEmail}
        canUseBulkSms={canUseBulkSms}
        customFieldCount={customFieldCount}
        searchValue={searchValue}
        selectedVolunteerCount={selectedVolunteerCount}
        smsMode={smsMode}
        onSearchChange={handleSearchChange}
        onAssignmentFiltersClick={openAssignmentFiltersSidePanel}
        onCopyEmailAddresses={copyEmailAddresses}
        onCreateVolunteerFamily={() => setCreateVolunteerFamilyDrawerOpen(true)}
        onCustomFieldFiltersClick={openCustomFieldFiltersSidePanel}
        onToggleBulkSms={() => setSmsMode(!smsMode)}
      />
      <AssignmentFiltersSidePanel>
        <VolunteerAssignmentFiltersSidePanel
          arrangementTypes={arrangementTypes}
          selectedValuesByArrangementType={assignmentFilters}
          onArrangementTypeChange={handleAssignmentFilterChange}
          onClose={closeAssignmentFiltersSidePanel}
        />
      </AssignmentFiltersSidePanel>
      <CustomFieldFiltersSidePanel>
        <VolunteerCustomFieldFiltersSidePanel
          customFields={customFields}
          getOptionsForField={getCustomFieldFilterOptionsForField}
          selectedValuesByField={customFieldFilters}
          onFieldChange={handleCustomFieldFilterChange}
          onClose={closeCustomFieldFiltersSidePanel}
        />
      </CustomFieldFiltersSidePanel>
      <Box sx={{ flex: 1, minHeight: 0 }}>
        <VolunteersDataGridV2
          customFields={customFields}
          filterModel={filterModel}
          onFilterModelChange={handleFilterModelChange}
          onRowClick={(row) => appNavigate.family(row.id)}
          onRowSelectionModelChange={handleRowSelectionModelChange}
          requirementFilterOptions={requirementFilterOptions}
          roleFilters={roleFilters}
          rowSelectionModel={rowSelectionModel}
          rows={rows}
          statusFilters={statusFilters}
          updateTestFamilyFlagEnabled={updateTestFamilyFlagEnabled}
        />
      </Box>
      {createVolunteerFamilyDrawerOpen && (
        <CreateVolunteerFamilyDrawer
          onClose={(volunteerFamilyId) => {
            setCreateVolunteerFamilyDrawerOpen(false);
            if (!volunteerFamilyId) return;
            appNavigate.family(volunteerFamilyId);
          }}
        />
      )}
      {smsMode && (
        <BulkSmsSideSheet
          selectedFamilies={selectedVolunteerFamilies}
          onClose={() => setSmsMode(false)}
        />
      )}
    </Stack>
  );
}

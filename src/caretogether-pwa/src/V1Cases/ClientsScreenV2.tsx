import { Box, Stack, Typography } from '@mui/material';
import { useState } from 'react';
import { useFeatureFlagEnabled } from 'posthog-js/react';
import { Permission } from '../GeneratedClient';
import { useScreenTitle } from '../Shell/ShellScreenTitle';
import { v2Typography } from '../Families/v2Typography';
import { useLocalStorage } from '../Hooks/useLocalStorage';
import { ClientsBrowserToolbarV2 } from './ClientsBrowserToolbarV2';
import { ClientsDataGridV2 } from './ClientsDataGridV2';
import { useClientsBrowserViewModel } from './useClientsBrowserViewModel';
import { useAppNavigate } from '../Hooks/useAppNavigate';
import {
  normalizePartneringFamiliesSortMode,
  PartneringFamiliesSortMode,
} from './PartneringFamilies/sortPartneringFamilies';
import {
  ArrangementsFilter,
  normalizeArrangementsFilter,
} from './PartneringFamilies/types';
import { FUNCTION_ASSIGNMENTS_FEATURE_FLAG } from '../featureFlags';
import { useAllPartneringFamiliesPermissions } from '../Model/SessionModel';
import { usePersonAndFamilyLookup } from '../Model/DirectoryModel';
import type { AssignmentFilterSelectionsByRole } from '../FunctionAssignments/assignmentRoleColumns';
import { useCustomFieldFilters } from '../Generic/CustomFieldsFilter/useCustomFieldFilters';
import { useSidePanel } from '../Hooks/useSidePanel';
import { PartneringFamilyCustomFieldFiltersSidePanel } from './PartneringFamilies/PartneringFamilyCustomFieldFiltersSidePanel';
import { useLoadable } from '../Hooks/useLoadable';
import { partneringFamiliesData } from '../Model/V1CasesModel';
import { policyData } from '../Model/ConfigurationModel';

const PARTNERING_FAMILIES_SORT_STORAGE_KEY = 'partnering-families-sortMode';
const ARRANGEMENTS_FILTER_STORAGE_KEY =
  'partnering-families-arrangementsFilter';

export function ClientsScreenV2() {
  useScreenTitle('Clients');
  const appNavigate = useAppNavigate();
  const personAndFamilyLookup = usePersonAndFamilyLookup();
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
  const [countyFilter, setCountyFilter] = useState<(string | null)[]>([]);
  const [assignmentFilters, setAssignmentFilters] =
    useState<AssignmentFilterSelectionsByRole>({});
  const [storedArrangementsFilter, setStoredArrangementsFilter] =
    useLocalStorage<ArrangementsFilter | null>(
      ARRANGEMENTS_FILTER_STORAGE_KEY,
      'All'
    );
  const arrangementsFilter = normalizeArrangementsFilter(
    storedArrangementsFilter
  );
  const [storedSortMode, setStoredSortMode] =
    useLocalStorage<PartneringFamiliesSortMode>(
      PARTNERING_FAMILIES_SORT_STORAGE_KEY,
      'lastNameAsc'
    );
  const sortMode = normalizePartneringFamiliesSortMode(storedSortMode);
  const customFieldFilterItems = useLoadable(partneringFamiliesData) ?? [];
  const customFieldDefinitions =
    useLoadable(policyData)?.referralPolicy?.customFields ?? [];
  const {
    selectedValuesByField: selectedCustomFieldValuesByField,
    setSelectedValuesForField: setSelectedCustomFieldValuesForField,
    optionsByField: customFieldFilterOptionsByField,
  } = useCustomFieldFilters({
    customFields: customFieldDefinitions,
    items: customFieldFilterItems,
    isBlank: (family, fieldName) =>
      family.partneringFamilyInfo?.openV1Case?.missingCustomFields?.includes(
        fieldName
      ) ?? false,
    getValue: (family, fieldName) =>
      family.partneringFamilyInfo?.openV1Case?.completedCustomFields?.find(
        (field) => field.customFieldName === fieldName
      )?.value,
  });
  const activeCustomFieldFilterCount = Object.values(
    selectedCustomFieldValuesByField
  ).filter((selectedValues) => selectedValues.length > 0).length;
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
    filterText: searchValue,
    selectedCustomFieldValuesByField,
    sortMode,
  });

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
        px: { xs: 2, md: 3 },
        py: { xs: 2, md: 3 },
      }}
    >
      <Stack spacing={2.5}>
        <Box>
          <Typography className="ph-unmask" {...v2Typography.pageTitle}>
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
        <ClientsBrowserToolbarV2
          searchValue={searchValue}
          statusValue={arrangementsFilter}
          countyOptions={counties}
          countyValue={countyFilter}
          sortValue={sortMode}
          assignmentFilterAssignments={assignmentFilterAssignments}
          assignmentFilters={assignmentFilters}
          assignmentPersonLookup={(personId) =>
            personAndFamilyLookup(personId).person
          }
          assignmentRoles={
            canViewFunctionAssignments ? assignmentFilterOptions : []
          }
          activeCustomFieldFilterCount={activeCustomFieldFilterCount}
          customFieldCount={customFieldDefinitions.length}
          onAssignmentFilterChange={(assignmentRole, selectedValues) =>
            setAssignmentFilters((current) => ({
              ...current,
              [assignmentRole]: selectedValues,
            }))
          }
          onSearchChange={setSearchValue}
          onStatusChange={setStoredArrangementsFilter}
          onCountyChange={setCountyFilter}
          onMoreFiltersClick={openCustomFieldFiltersSidePanel}
          onSortChange={setStoredSortMode}
        />
        <ClientsDataGridV2
          assignmentRoles={assignmentColumnRoles}
          customFields={clientFamilyCustomFieldDefinitions}
          loading={isLoading}
          rows={rows}
          onRowClick={(row) => appNavigate.family(row.familyId)}
        />
        <CustomFieldFiltersSidePanel>
          <PartneringFamilyCustomFieldFiltersSidePanel
            customFields={customFieldDefinitions}
            optionsByField={customFieldFilterOptionsByField}
            selectedValuesByField={selectedCustomFieldValuesByField}
            onFieldChange={setSelectedCustomFieldValuesForField}
            onClose={closeCustomFieldFiltersSidePanel}
          />
        </CustomFieldFiltersSidePanel>
      </Stack>
    </Box>
  );
}

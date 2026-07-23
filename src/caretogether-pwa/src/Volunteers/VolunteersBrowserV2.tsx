import { Box, Paper, Stack, Typography } from '@mui/material';
import type { GridRowSelectionModel } from '@mui/x-data-grid';
import { useMemo, useState } from 'react';
import { useFeatureFlagEnabled } from 'posthog-js/react';
import { useRecoilValue } from 'recoil';
import { EmailAddress, Permission } from '../GeneratedClient';
import { useAppNavigate } from '../Hooks/useAppNavigate';
import { useGlobalSnackBar } from '../Hooks/useGlobalSnackBar';
import { useLoadable } from '../Hooks/useLoadable';
import { useSidePanel } from '../Hooks/useSidePanel';
import { v2Typography } from '../Families/v2Typography';
import { selectedLocationContextState } from '../Model/Data';
import { organizationConfigurationQuery } from '../Model/ConfigurationModel';
import { useAllVolunteerFamiliesPermissions } from '../Model/SessionModel';
import { BulkSmsSideSheet } from './BulkSmsSideSheet';
import { CreateVolunteerFamilyDrawer } from './CreateVolunteerFamilyDrawer';
import { VolunteerAssignmentFiltersSidePanel } from './VolunteerApprovalTab/VolunteerAssignmentFiltersSidePanel';
import { VolunteerCustomFieldFiltersSidePanel } from './VolunteerApprovalTab/VolunteerCustomFieldFiltersSidePanel';
import { VolunteersDataGridV2 } from './VolunteersDataGridV2';
import { VolunteersToolbarV2 } from './VolunteersToolbarV2';
import { useVolunteersBrowserViewModel } from './useVolunteersBrowserViewModel';

export function VolunteersBrowserV2() {
  const appNavigate = useAppNavigate();
  const permissions = useAllVolunteerFamiliesPermissions();
  const updateTestFamilyFlagEnabled = useFeatureFlagEnabled(
    'updateTestFamilyFlag'
  );
  const { setAndShowGlobalSnackBar } = useGlobalSnackBar();
  const { locationId } = useRecoilValue(selectedLocationContextState);
  const organizationConfiguration = useLoadable(organizationConfigurationQuery);
  const [createVolunteerFamilyDrawerOpen, setCreateVolunteerFamilyDrawerOpen] =
    useState(false);
  const [smsMode, setSmsMode] = useState(false);
  const [selectedFamilyIds, setSelectedFamilyIds] = useState<string[]>([]);

  const {
    activeAssignmentFilterCount,
    activeCustomFieldFilterCount,
    arrangementTypes,
    assignmentFilters,
    customFieldCount,
    customFieldFilterOptionsByField,
    customFieldFilters,
    customFields,
    loading,
    requirementFilter,
    requirementFilterOptions,
    roleFilters,
    rows,
    searchValue,
    setAssignmentFilter,
    setCustomFieldFilter,
    setRequirementFilter,
    setRoleFilterSelection,
    setSearchValue,
    setSortMode,
    setStatusFilterSelection,
    sortMode,
    statusFilters,
    visibleVolunteerFamilies,
  } = useVolunteersBrowserViewModel();
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
  const selectedVolunteerFamilies = useMemo(
    () => {
      const selectedFamilyIdSet = new Set(selectedFamilyIds);

      return visibleVolunteerFamilies.filter((family) =>
        selectedFamilyIdSet.has(family.family!.id!)
      );
    },
    [selectedFamilyIds, visibleVolunteerFamilies]
  );

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
      setSelectedFamilyIds(
        visibleRowIds.filter((id) => !model.ids.has(id))
      );
      return;
    }

    setSelectedFamilyIds(
      Array.from(model.ids)
        .map(String)
        .filter((id) => visibleRowIdSet.has(id))
    );
  }

  function handleSearchChange(value: string) {
    clearSelection();
    setSearchValue(value);
  }

  function handleRoleChange(value: string | string[]) {
    clearSelection();
    setRoleFilterSelection(value);
  }

  function handleStatusChange(value: string | string[]) {
    clearSelection();
    setStatusFilterSelection(value);
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

  function handleRequirementFilterChange(
    value: Parameters<typeof setRequirementFilter>[0]
  ) {
    clearSelection();
    setRequirementFilter(value);
  }

  return (
    <Stack spacing={2}>
      <Box>
        <Typography className="ph-unmask" {...v2Typography.pageTitle}>
          Volunteers
        </Typography>
        <Typography className="ph-unmask" {...v2Typography.secondaryValue}>
          Review volunteer families.
        </Typography>
      </Box>
      <Paper
        variant="outlined"
        sx={{
          borderRadius: 1,
          p: 2,
        }}
      >
        <VolunteersToolbarV2
          activeAssignmentFilterCount={activeAssignmentFilterCount}
          activeCustomFieldFilterCount={activeCustomFieldFilterCount}
          arrangementTypeCount={arrangementTypes.length}
          canCreateVolunteerFamily={canCreateVolunteerFamily}
          canUseBulkEmail={canUseBulkEmail}
          canUseBulkSms={canUseBulkSms}
          customFieldCount={customFieldCount}
          requirementFilter={requirementFilter}
          requirementFilterOptions={requirementFilterOptions}
          searchValue={searchValue}
          roleFilters={roleFilters}
          selectedSort={sortMode}
          selectedVolunteerCount={selectedVolunteerCount}
          smsMode={smsMode}
          statusFilters={statusFilters}
          onSearchChange={handleSearchChange}
          onRoleChange={handleRoleChange}
          onSortChange={setSortMode}
          onStatusChange={handleStatusChange}
          onAssignmentFiltersClick={openAssignmentFiltersSidePanel}
          onCopyEmailAddresses={copyEmailAddresses}
          onCreateVolunteerFamily={() =>
            setCreateVolunteerFamilyDrawerOpen(true)
          }
          onCustomFieldFiltersClick={openCustomFieldFiltersSidePanel}
          onRequirementFilterChange={handleRequirementFilterChange}
          onToggleBulkSms={() => setSmsMode(!smsMode)}
        />
      </Paper>
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
          optionsByField={customFieldFilterOptionsByField}
          selectedValuesByField={customFieldFilters}
          onFieldChange={handleCustomFieldFilterChange}
          onClose={closeCustomFieldFiltersSidePanel}
        />
      </CustomFieldFiltersSidePanel>
      <VolunteersDataGridV2
        customFields={customFields}
        loading={loading}
        onRowClick={(row) => appNavigate.family(row.id)}
        onRowSelectionModelChange={handleRowSelectionModelChange}
        rowSelectionModel={rowSelectionModel}
        rows={rows}
        updateTestFamilyFlagEnabled={updateTestFamilyFlagEnabled}
      />
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

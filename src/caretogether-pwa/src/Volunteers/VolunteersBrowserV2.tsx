import { Add as AddIcon } from '@mui/icons-material';
import { Box, Button, Stack, Typography } from '@mui/material';
import type { GridRowSelectionModel } from '@mui/x-data-grid-premium';
import { useMemo, useState } from 'react';
import { useFeatureFlagEnabled } from 'posthog-js/react';
import { EmailAddress, Permission } from '../GeneratedClient';
import { useAppNavigate } from '../Hooks/useAppNavigate';
import { useGlobalSnackBar } from '../Hooks/useGlobalSnackBar';
import { v2Typography } from '../Families/v2Typography';
import { useRequiredSelectedLocationContext } from '../Model/Data';
import { useOrganizationConfiguration } from '../Model/ConfigurationModel';
import { useAllVolunteerFamiliesPermissions } from '../Model/SessionModel';
import { BulkSmsSideSheet } from './BulkSmsSideSheet';
import { CreateVolunteerFamilyDrawer } from './CreateVolunteerFamilyDrawer';
import { VolunteersDataGridV2 } from './VolunteersDataGridV2';
import { VolunteersToolbarV2 } from './VolunteersToolbarV2';
import { useVolunteersBrowserViewModel } from './useVolunteersBrowserViewModel';
import { UPDATE_TEST_FAMILY_FEATURE_FLAG } from '../featureFlags';

export function VolunteersBrowserV2() {
  const appNavigate = useAppNavigate();
  const permissions = useAllVolunteerFamiliesPermissions();
  const updateTestFamilyFlagEnabled = useFeatureFlagEnabled(
    UPDATE_TEST_FAMILY_FEATURE_FLAG
  );
  const { setAndShowGlobalSnackBar } = useGlobalSnackBar();
  const { locationId } = useRequiredSelectedLocationContext();
  const organizationConfiguration = useOrganizationConfiguration();
  const [createVolunteerFamilyDrawerOpen, setCreateVolunteerFamilyDrawerOpen] =
    useState(false);
  const [smsMode, setSmsMode] = useState(false);
  const [selectedFamilyIds, setSelectedFamilyIds] = useState<string[]>([]);
  const [pivotActive, setPivotActive] = useState(false);
  const {
    arrangementTypes,
    familyCustomFields,
    roleNames,
    rows,
    volunteerCustomFields,
  } = useVolunteersBrowserViewModel();
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

    return rows
      .map((row) => row.sourceFamily)
      .filter((family) => selectedFamilyIdSet.has(family.family!.id!));
  }, [rows, selectedFamilyIds]);

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
      <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          sx={{
            alignItems: { xs: 'flex-end', sm: 'center' },
            flexWrap: { xs: 'nowrap', sm: 'wrap' },
            gap: 1,
          }}
        >
          <VolunteersToolbarV2
            canUseBulkEmail={canUseBulkEmail}
            canUseBulkSms={canUseBulkSms}
            bulkActionsDisabled={pivotActive}
            selectedVolunteerCount={selectedVolunteerCount}
            smsMode={smsMode}
            onCopyEmailAddresses={copyEmailAddresses}
            onToggleBulkSms={() => setSmsMode(!smsMode)}
          />
          {canCreateVolunteerFamily && (
            <Button
              size="small"
              variant="contained"
              startIcon={<AddIcon />}
              sx={{
                alignSelf: { xs: 'stretch', md: 'center' },
                flexShrink: 0,
                whiteSpace: 'nowrap',
              }}
              onClick={() => setCreateVolunteerFamilyDrawerOpen(true)}
            >
              Add Volunteer Family
            </Button>
          )}
        </Stack>
      </Box>
      <Box sx={{ flex: 1, minHeight: 0 }}>
        <VolunteersDataGridV2
          arrangementTypes={arrangementTypes}
          familyCustomFields={familyCustomFields}
          onRowClick={(row) => appNavigate.family(row.id)}
          onPivotActiveChange={(active) => {
            setPivotActive(active);
            if (active) setSelectedFamilyIds([]);
          }}
          onRowSelectionModelChange={handleRowSelectionModelChange}
          roleNames={roleNames}
          rowSelectionModel={rowSelectionModel}
          rows={rows}
          volunteerCustomFields={volunteerCustomFields}
          updateTestFamilyFlagEnabled={updateTestFamilyFlagEnabled}
          pivotActive={pivotActive}
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

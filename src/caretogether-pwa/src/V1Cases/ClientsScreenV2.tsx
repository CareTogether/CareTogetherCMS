import { Box, Stack, Typography } from '@mui/material';
import { useCallback, useState } from 'react';
import type { GridSortModel } from '@mui/x-data-grid-premium';
import { useFeatureFlagEnabled } from 'posthog-js/react';
import { Permission } from '../GeneratedClient';
import { useScreenTitle } from '../Shell/ShellScreenTitle';
import { v2Typography } from '../Families/v2Typography';
import { ClientsDataGridV2 } from './ClientsDataGridV2';
import {
  type ClientBrowserRowV2,
  useClientsBrowserViewModel,
} from './useClientsBrowserViewModel';
import { useAppNavigate } from '../Hooks/useAppNavigate';
import { normalizePartneringFamiliesSortMode } from './PartneringFamilies/sortPartneringFamilies';
import {
  clientsSortPresets,
  clientsToolbarSortValue,
  normalizeClientsGridSortModel,
} from './clientsGridSorting';
import { FUNCTION_ASSIGNMENTS_FEATURE_FLAG } from '../featureFlags';
import {
  useAllPartneringFamiliesPermissions,
  useGlobalPermissions,
} from '../Model/SessionModel';
import { wideTablePageSx } from '../Utilities/wideTablePageSx';

const PARTNERING_FAMILIES_SORT_STORAGE_KEY = 'partnering-families-sortMode';

export function ClientsScreenV2() {
  useScreenTitle('Clients');
  const appNavigate = useAppNavigate();
  const globalPermissions = useGlobalPermissions();
  const permissions = useAllPartneringFamiliesPermissions();
  const functionAssignmentsEnabled = useFeatureFlagEnabled(
    FUNCTION_ASSIGNMENTS_FEATURE_FLAG
  );
  const canViewFunctionAssignments =
    functionAssignmentsEnabled === true &&
    permissions(Permission.ViewV1CaseFunctionAssignments);
  const [sortModel, setSortModel] = useState<GridSortModel>(() => {
    try {
      const stored = window.localStorage.getItem(
        PARTNERING_FAMILIES_SORT_STORAGE_KEY
      );
      return clientsSortPresets[
        normalizePartneringFamiliesSortMode(stored ? JSON.parse(stored) : null)
      ];
    } catch {
      return clientsSortPresets.lastNameAsc;
    }
  });

  const handleSortModelChange = useCallback((model: GridSortModel) => {
    const next = normalizeClientsGridSortModel(model);
    setSortModel(next);
    const preset = clientsToolbarSortValue(next);
    if (preset === 'custom' || preset === 'unsorted') return;
    try {
      window.localStorage.setItem(
        PARTNERING_FAMILIES_SORT_STORAGE_KEY,
        JSON.stringify(preset)
      );
    } catch (error) {
      console.log(error);
    }
  }, []);
  const handleRowClick = useCallback(
    (row: ClientBrowserRowV2) => appNavigate.family(row.familyId),
    [appNavigate]
  );
  const {
    rows,
    counties,
    assignmentRoles,
    familyCustomFields,
    caseCustomFields,
  } = useClientsBrowserViewModel({ canViewFunctionAssignments });
  const hasFeaturebaseChat = globalPermissions(Permission.AccessSupportScreen);
  return (
    <Box sx={wideTablePageSx(hasFeaturebaseChat)}>
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
        <Box sx={{ flex: 1, minHeight: 0 }}>
          <ClientsDataGridV2
            rows={rows}
            countyOptions={counties}
            assignmentRoles={assignmentRoles}
            familyCustomFields={familyCustomFields}
            caseCustomFields={caseCustomFields}
            sortModel={sortModel}
            onSortModelChange={handleSortModelChange}
            onRowClick={handleRowClick}
          />
        </Box>
      </Stack>
    </Box>
  );
}

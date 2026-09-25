import {
  Box,
  Button,
  Drawer,
  Stack,
  Typography,
  useTheme,
} from '@mui/material';
import {
  DataGridPremium,
  GridChartsIntegrationContextProvider,
  GridChartsRendererProxy,
  type GridChartsPanelProps,
  type GridColDef,
  type GridFilterModel,
  type GridRowParams,
} from '@mui/x-data-grid-premium';
import {
  ChartsRenderer,
  configurationOptions,
  type ChartsRendererProps,
} from '@mui/x-charts-premium/ChartsRenderer';
import { Permission } from '../GeneratedClient';
import { useScreenTitle } from '../Shell/ShellScreenTitle';
import { Add as AddIcon } from '@mui/icons-material';
import { useCallback, useMemo, useState } from 'react';
import { useGlobalPermissions } from '../Model/SessionModel';
import { AddEditCommunity } from './AddEditCommunity';
import { useVisibleCommunities } from '../Model/Data';
import { useAppNavigate } from '../Hooks/useAppNavigate';
import { useOrganizationConfigurationLoadable } from '../Model/ConfigurationModel';
import { useFeatureFlagEnabled } from 'posthog-js/react';
import { ORGANIZATION_CATEGORIES_FEATURE_FLAG } from '../featureFlags';
import { v2DataGridStyles } from '../Families/v2DataGridStyles';
import { v2Typography } from '../Families/v2Typography';
import { usePersistedGridFilterModel } from '../Hooks/usePersistedGridFilterModel';
import {
  buildOrganizationsGridColumns,
  canNavigateOrganizationRow,
  organizationGridExportFields,
  organizationGridFeatureProps,
  organizationGridInitialState,
} from './organizationsGridColumns';
import {
  buildOrganizationGridRows,
  type OrganizationGridRow,
} from './organizationsDataGridViewModel';
import { OrganizationsChartsPanel } from './OrganizationsChartsPanel';

type OrganizationsDataGridProps = {
  columns: GridColDef<OrganizationGridRow>[];
  filterModel: GridFilterModel;
  onFilterModelChange: (model: GridFilterModel) => void;
  onRowClick: (row: OrganizationGridRow) => void;
  rows: OrganizationGridRow[];
};

function isInteractiveElement(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false;

  return (
    target.closest(
      'button, a, input, textarea, select, [contenteditable]:not([contenteditable="false"]), [role="button"], [role="link"], [role="textbox"], [role="combobox"], [role="menuitem"]'
    ) !== null
  );
}

export function OrganizationsDataGrid({
  columns,
  filterModel,
  onFilterModelChange,
  onRowClick,
  rows,
}: OrganizationsDataGridProps) {
  const reportingSessionKey = JSON.stringify(
    columns.map(({ aggregable, chartable, field, pivotable, type }) => [
      field,
      type,
      aggregable,
      chartable,
      pivotable,
    ])
  );

  return (
    <OrganizationsDataGridSession
      key={reportingSessionKey}
      columns={columns}
      filterModel={filterModel}
      onFilterModelChange={onFilterModelChange}
      onRowClick={onRowClick}
      rows={rows}
    />
  );
}

function OrganizationsDataGridSession({
  columns,
  filterModel,
  onFilterModelChange,
  onRowClick,
  rows,
}: OrganizationsDataGridProps) {
  const theme = useTheme();
  const [pivotActive, setPivotActive] = useState(false);
  const slots = useMemo(
    () => ({
      chartsPanel: (props: GridChartsPanelProps) => (
        <OrganizationsChartsPanel {...props} pivotActive={pivotActive} />
      ),
    }),
    [pivotActive]
  );
  const renderChart = useCallback(
    (props: ChartsRendererProps) =>
      pivotActive && props.chartType ? (
        <Box sx={{ width: '100%', minWidth: 0, overflow: 'auto' }}>
          <ChartsRenderer {...props} />
        </Box>
      ) : null,
    [pivotActive]
  );

  return (
    <GridChartsIntegrationContextProvider>
      <Box sx={v2DataGridStyles(theme)}>
        <DataGridPremium
          {...organizationGridFeatureProps}
          showToolbar
          chartsIntegration
          autoHeight
          pagination
          pivotActive={pivotActive}
          onPivotActiveChange={setPivotActive}
          aggregationRowsScope="filtered"
          rows={rows}
          columns={columns}
          filterModel={filterModel}
          onFilterModelChange={onFilterModelChange}
          rowHeight={56}
          columnHeaderHeight={42}
          pageSizeOptions={[25, 50, 100]}
          hideFooter={rows.length <= 25}
          initialState={organizationGridInitialState}
          onRowClick={({ row }: GridRowParams<OrganizationGridRow>) => {
            if (canNavigateOrganizationRow(row, pivotActive)) onRowClick(row);
          }}
          onCellKeyDown={({ row }, event) => {
            if (
              !canNavigateOrganizationRow(row, pivotActive) ||
              event.defaultMuiPrevented ||
              event.ctrlKey ||
              event.metaKey ||
              event.altKey ||
              isInteractiveElement(event.target) ||
              (event.key !== 'Enter' && event.key !== ' ')
            ) {
              return;
            }

            event.preventDefault();
            onRowClick(row);
          }}
          slots={slots}
          slotProps={{
            chartsPanel: {
              schema: {
                bar: configurationOptions.bar,
                column: configurationOptions.column,
                pie: configurationOptions.pie,
              },
            },
            toolbar: {
              csvOptions: { fields: [...organizationGridExportFields] },
              excelOptions: { fields: [...organizationGridExportFields] },
              printOptions: { fields: [...organizationGridExportFields] },
            },
          }}
        />
      </Box>
      <GridChartsRendererProxy
        id="organizations-report"
        label="Organization counts"
        renderer={renderChart}
      />
    </GridChartsIntegrationContextProvider>
  );
}

export function CommunitiesList() {
  useScreenTitle('Organizations');

  const organizationCategoriesEnabled =
    useFeatureFlagEnabled(ORGANIZATION_CATEGORIES_FEATURE_FLAG) === true;

  const communities = useVisibleCommunities().flatMap(({ community }) =>
    community ? [community] : []
  );
  const organizationConfiguration = useOrganizationConfigurationLoadable();
  const categoriesById = useMemo(
    () =>
      new Map(
        (organizationConfiguration?.organizationCategories ?? []).flatMap(
          (category) => (category.id ? [[category.id, category] as const] : [])
        )
      ),
    [organizationConfiguration?.organizationCategories]
  );
  const rows = useMemo(
    () => buildOrganizationGridRows(communities, categoriesById),
    [categoriesById, communities]
  );
  const columns = useMemo(
    () => buildOrganizationsGridColumns({ organizationCategoriesEnabled }),
    [organizationCategoriesEnabled]
  );
  const { filterModel, onFilterModelChange } = usePersistedGridFilterModel({
    columns,
    namespace: 'organizations',
  });

  const appNavigate = useAppNavigate();
  function openCommunity(row: OrganizationGridRow) {
    appNavigate.organization(row.id);
  }

  const [addDrawerOpen, setAddDrawerOpen] = useState(false);
  const permissions = useGlobalPermissions();

  return (
    <>
      <Stack spacing={2} sx={{ flex: 1, minHeight: 0 }}>
        <Box>
          <Typography
            className="ph-unmask"
            {...v2Typography.pageTitle}
            sx={{ mt: 2 }}
          >
            Organizations
          </Typography>
          <Typography
            className="ph-unmask"
            {...v2Typography.secondaryValue}
            sx={{ ...v2Typography.secondaryValue.sx, mt: 0.5 }}
          >
            Browse and manage organizations.
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Button
            size="small"
            variant="contained"
            startIcon={<AddIcon />}
            sx={{
              alignSelf: { xs: 'stretch', md: 'center' },
              flexShrink: 0,
              whiteSpace: 'nowrap',
            }}
            onClick={() => setAddDrawerOpen(true)}
          >
            ADD NEW ORGANIZATION
          </Button>
        </Box>

        <OrganizationsDataGrid
          columns={columns}
          filterModel={filterModel}
          onFilterModelChange={onFilterModelChange}
          onRowClick={openCommunity}
          rows={rows}
        />
      </Stack>
      {permissions(Permission.CreateOrganization) && (
        <Drawer
          anchor="right"
          open={addDrawerOpen}
          onClose={() => setAddDrawerOpen(false)}
          slotProps={{
            paper: {
              sx: {
                padding: 2,
                paddingTop: { xs: 7, sm: 8, md: 6 },
              },
            },
          }}
        >
          <AddEditCommunity onClose={() => setAddDrawerOpen(false)} />
        </Drawer>
      )}
    </>
  );
}

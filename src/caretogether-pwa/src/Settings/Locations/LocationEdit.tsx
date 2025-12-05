import {
  Stack,
  Typography,
  useTheme,
  useMediaQuery,
  IconButton,
  Button,
} from '@mui/material';
import { useState, useEffect, useMemo } from 'react';
import { useLoadable } from '../../Hooks/useLoadable';
import {
  organizationConfigurationQuery,
  policyData,
} from '../../Model/ConfigurationModel';
import { ProgressBackdrop } from '../../Shell/ProgressBackdrop';
import { useScreenTitle } from '../../Shell/ShellScreenTitle';
import { useRecoilValue } from 'recoil';
import { selectedLocationContextState, useDataLoaded } from '../../Model/Data';
import { useParams } from 'react-router-dom';
import { Box } from '@mui/system';
import BasicConfiguration from './Tabs/BasicConfiguration';
import ActionDefinitions from './Tabs/ActionDefinitions';
import ApprovalPolicies from './Tabs/ApprovalPolicies';
import SettingsTabMenu from './SettingsTabMenu';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { useFeatureFlagEnabled } from 'posthog-js/react';
import { useUserIsOrganizationAdministrator } from '../../Model/SessionModel';
import { useAppNavigate } from '../../Hooks/useAppNavigate';
import AccessLevels from './Tabs/AccessLevels/AccessLevels';
import { Breadcrumbs } from '../../Generic/Breadcrumbs';
import { useSearchParams } from 'react-router-dom';

export function LocationEdit() {
  const { locationId, editingLocationId } = useParams<{
    locationId: string;
    editingLocationId: string;
  }>();

  const configuration = useLoadable(organizationConfigurationQuery);
  const { organizationId } = useRecoilValue(selectedLocationContextState);

  const location = configuration?.locations?.find(
    (location) => location.id === editingLocationId
  );

  const effectiveLocationPolicy = useRecoilValue(policyData);

  // TODO: Use this to implement the other tabs
  console.log({ effectiveLocationPolicy });

  useScreenTitle(`Editing ${location?.name} configuration`);

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  useEffect(() => {
    if (isMobile) {
      setIsSidebarCollapsed(true);
    } else {
      setIsSidebarCollapsed(false);
    }
  }, [isMobile]);
  const actionTabEnabled = useFeatureFlagEnabled('actionDefinitionsTab');
  const approvalTabEnabled = useFeatureFlagEnabled('approvalPoliciesTab');

  const tabs = useMemo(
    () => [
      {
        id: 'basic' as const,
        label: 'Basic Configuration',
        component: BasicConfiguration,
        shouldShow: true,
      },
      {
        id: 'actions' as const,
        label: 'Action Definitions',
        component: ActionDefinitions,
        shouldShow: actionTabEnabled,
      },
      {
        id: 'approvalPolicies' as const,
        label: 'Approval Policies',
        component: ApprovalPolicies,
        shouldShow: approvalTabEnabled,
      },
      {
        id: 'accessLevels' as const,
        label: 'Access Levels',
        component: AccessLevels,
        shouldShow: true,
      },
    ],
    [actionTabEnabled, approvalTabEnabled]
  );

  // This result in a type like: 'basic' | 'actions' | 'policies'
  // Depends on `as const` on the tabs const above
  type LocationTabId = (typeof tabs)[number]['id'];

  // Use the type derived from LOCATION_TABS
  const [activeTab, setActiveTab] = useState<LocationTabId>('basic');

  const [searchParams, setSearchParams] = useSearchParams();

  const urlTab = searchParams.get('tab');

  useEffect(() => {
    const match = tabs.find((tab) => tab.id === urlTab);
    if (!match) {
      setSearchParams({ tab: 'basic' });
      return;
    }

    setActiveTab(urlTab as LocationTabId);
  }, [urlTab, tabs, setSearchParams]);

  const dataLoaded = useDataLoaded();

  const canEdit = useUserIsOrganizationAdministrator();

  const appNavigate = useAppNavigate();

  if (!dataLoaded) {
    return (
      <ProgressBackdrop>
        <p className="ph-unmask">Loading location configuration...</p>
      </ProgressBackdrop>
    );
  }

  if (!canEdit || !location) {
    return (
      <Box className="ph-unmask" mt={10} textAlign="center">
        <Typography>
          Oops! You can't edit this Location. It may be restricted or
          unavailable.
        </Typography>
        <Button
          variant="contained"
          sx={{ mt: 2 }}
          onClick={() => appNavigate.dashboard()}
        >
          Home
        </Button>
      </Box>
    );
  }

  // Filter available tabs based on feature flags
  const availableTabs = tabs.filter((tab) => tab.shouldShow);

  const basicData = {
    name: location?.name || '',
    ethnicities: location.ethnicities || [],
    adultFamilyRelationships: location.adultFamilyRelationships || [],
    arrangementReasons: location.arrangementReasons || [],
  };

  return (
    <Stack
      className="ph-unmask"
      spacing={0}
      sx={{ height: '100%', minHeight: '100vh', pt: 2 }}
    >
      <Box>
        <Breadcrumbs
          items={[
            {
              label: 'Settings',
              to: `/org/${organizationId}/${locationId}/settings`,
            },
            {
              label: 'Locations',
              to: `/org/${organizationId}/${locationId}/settings/locations`,
            },
          ]}
          currentPageLabel={location.name || ''}
        />
      </Box>

      <Box display="flex" flex={1} minHeight={0} sx={{ overflow: 'auto' }}>
        <Box
          sx={{
            width: isMobile && isSidebarCollapsed ? 40 : 240,
            minHeight: '100%',
            borderRight: '1px solid #e0e0e0',
            p: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'stretch',
          }}
        >
          {isMobile && (
            <IconButton
              size="small"
              onClick={() => setIsSidebarCollapsed((prev) => !prev)}
              sx={{ alignSelf: 'flex-end', mb: 1 }}
              color="primary"
            >
              {isSidebarCollapsed ? <ChevronRightIcon /> : <ChevronLeftIcon />}
            </IconButton>
          )}

          {(!isMobile || !isSidebarCollapsed) && (
            <Box sx={{ flex: 1, px: 1 }}>
              <SettingsTabMenu
                tabs={availableTabs}
                activeTab={activeTab}
                onTabChange={(tabId) => {
                  setActiveTab(tabId);
                  setSearchParams({ tab: tabId });
                }}
              />
            </Box>
          )}
        </Box>

        <Box flex={1} paddingLeft={4} paddingTop={2}>
          {/* Render the active tab component */}
          {activeTab === 'basic' && (
            <Box key="basic">
              <BasicConfiguration
                data={basicData}
                currentLocationDefinition={location}
              />
            </Box>
          )}

          {activeTab === 'actions' && (
            <Box key="actions">
              <ActionDefinitions />
            </Box>
          )}

          {activeTab === 'accessLevels' && (
            <Box key="accessLevels">
              <AccessLevels locationConfiguration={location} />
            </Box>
          )}
        </Box>
      </Box>
    </Stack>
  );
}

import {
  Alert,
  Stack,
  Typography,
  useTheme,
  useMediaQuery,
  IconButton,
  Button,
} from '@mui/material';
import { useState, useEffect, useMemo } from 'react';
import { useLoadable } from '../../Hooks/useLoadable';
import { useBackdrop } from '../../Hooks/useBackdrop';
import {
  organizationConfigurationQuery,
  policyData,
} from '../../Model/ConfigurationModel';
import { ProgressBackdrop } from '../../Shell/ProgressBackdrop';
import { useScreenTitle } from '../../Shell/ShellScreenTitle';
import { useRecoilRefresher_UNSTABLE, useRecoilValue } from 'recoil';
import { selectedLocationContextState, useDataLoaded } from '../../Model/Data';
import { useParams } from 'react-router-dom';
import { Box } from '@mui/system';
import BasicConfiguration from './Tabs/BasicConfiguration';
import SettingsTabMenu from './SettingsTabMenu';
import {
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
} from '@mui/icons-material';
import { useGlobalPermissions } from '../../Model/SessionModel';
import { useAppNavigate } from '../../Hooks/useAppNavigate';
import AccessLevels from './Tabs/AccessLevels/AccessLevels';
import { Breadcrumbs } from '../../Generic/Breadcrumbs';
import { useSearchParams } from 'react-router-dom';
import {
  PolicyConfiguration,
} from './Tabs/PolicyConfiguration';
import {
  ApiException,
  EffectiveLocationPolicy,
  Permission,
} from '../../GeneratedClient';
import { api } from '../../Api/Api';
import {
  DESKTOP_BOTTOM_SAFE_AREA,
  MOBILE_BOTTOM_SAFE_AREA,
} from '../../Shell/ShellRootLayout';

export function LocationEdit() {
  const { locationId, editingLocationId } = useParams<{
    locationId: string;
    editingLocationId: string;
  }>();

  const configuration = useLoadable(organizationConfigurationQuery);
  const { organizationId } = useRecoilValue(selectedLocationContextState);
  const targetLocationId = editingLocationId ?? locationId;

  const location = configuration?.locations?.find(
    (location) => location.id === editingLocationId
  );

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
  const policy = useLoadable(policyData);
  const [policyDraft, setPolicyDraft] =
    useState<EffectiveLocationPolicy | null>(null);
  const [policySaveErrors, setPolicySaveErrors] = useState<string[]>([]);

  useEffect(() => {
    if (!policy) return;
    setPolicyDraft(policy);
  }, [policy]);

  const tabs = useMemo(
    () => [
      {
        id: 'basic' as const,
        label: 'Basic Configuration',
        component: BasicConfiguration,
        shouldShow: true,
      },
      {
        id: 'actionDefinitions' as const,
        label: 'Action Definitions',
        component: PolicyConfiguration,
        shouldShow: true,
      },
      {
        id: 'customFamilyFields' as const,
        label: 'Custom Family Fields',
        component: PolicyConfiguration,
        shouldShow: true,
      },
      {
        id: 'casePolicy' as const,
        label: 'Case Policies',
        component: PolicyConfiguration,
        shouldShow: true,
      },
      {
        id: 'v1ReferralPolicy' as const,
        label: 'Referral Policies',
        component: PolicyConfiguration,
        shouldShow: true,
      },
      {
        id: 'volunteerPolicy' as const,
        label: 'Volunteer Policies',
        component: PolicyConfiguration,
        shouldShow: true,
      },
      {
        id: 'accessLevels' as const,
        label: 'Access Levels',
        component: AccessLevels,
        shouldShow: true,
      },
    ],
    []
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

  const permissions = useGlobalPermissions();
  const canAccessSettings = permissions(Permission.AccessSettingsScreen);

  const appNavigate = useAppNavigate();
  const withBackdrop = useBackdrop();
  const refreshPolicy = useRecoilRefresher_UNSTABLE(policyData);

  const policyTabIds = [
    'actionDefinitions',
    'customFamilyFields',
    'casePolicy',
    'v1ReferralPolicy',
    'volunteerPolicy',
  ] as const;
  const isPolicyTabActive = policyTabIds.some((tabId) => tabId === activeTab);
  function savePolicy(nextPolicy: EffectiveLocationPolicy) {
    if (!targetLocationId) return;

    withBackdrop(async () => {
      try {
        setPolicySaveErrors([]);
        const saved = await api.configuration.putEffectiveLocationPolicy(
          organizationId,
          targetLocationId,
          nextPolicy
        );
        setPolicyDraft(saved);
        refreshPolicy();
      } catch (error) {
        setPolicySaveErrors(getPolicySaveErrors(error));
      }
    });
  }

  if (!dataLoaded) {
    return (
      <ProgressBackdrop>
        <p className="ph-unmask">Loading location configuration...</p>
      </ProgressBackdrop>
    );
  }

  if (!canAccessSettings || !location) {
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
    referralCloseReasons: configuration?.referralCloseReasons || [],
  };
  const locationRoles = configuration?.roles?.map((role) => role.roleName) ?? [];

  return (
    <Stack
      className="ph-unmask"
      spacing={0}
      sx={{
        height: {
          xs: `calc(100vh - 48px - ${MOBILE_BOTTOM_SAFE_AREA}px)`,
          md: `calc(100vh - 48px - ${DESKTOP_BOTTOM_SAFE_AREA}px)`,
        },
        minHeight: 0,
        pt: 2,
      }}
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

        <Box flex={1} paddingLeft={4} paddingTop={2} sx={{ overflow: 'auto' }}>
          {isPolicyTabActive && policySaveErrors.length > 0 && (
            <Alert severity="error" sx={{ mb: 2 }}>
              <Stack spacing={0.5}>
                {policySaveErrors.map((error) => (
                  <Typography key={error} variant="body2">
                    {error}
                  </Typography>
                ))}
              </Stack>
            </Alert>
          )}

          {/* Render the active tab component */}
          {activeTab === 'basic' && (
            <Box key="basic">
              <BasicConfiguration
                data={basicData}
                currentLocationDefinition={location}
              />
            </Box>
          )}

          {activeTab === 'accessLevels' && (
            <Box key="accessLevels">
              <AccessLevels locationConfiguration={location} />
            </Box>
          )}

          {policyDraft && activeTab === 'actionDefinitions' && (
            <Box key="actionDefinitions">
              <PolicyConfiguration
                policy={policyDraft}
                locationRoles={locationRoles}
                onPolicyChange={savePolicy}
                section="actionDefinitions"
              />
            </Box>
          )}

          {policyDraft && activeTab === 'customFamilyFields' && (
            <Box key="customFamilyFields">
              <PolicyConfiguration
                policy={policyDraft}
                locationRoles={locationRoles}
                onPolicyChange={savePolicy}
                section="customFamilyFields"
              />
            </Box>
          )}

          {policyDraft && activeTab === 'casePolicy' && (
            <Box key="casePolicy">
              <PolicyConfiguration
                policy={policyDraft}
                locationRoles={locationRoles}
                onPolicyChange={savePolicy}
                section="casePolicy"
              />
            </Box>
          )}

          {policyDraft && activeTab === 'v1ReferralPolicy' && (
            <Box key="v1ReferralPolicy">
              <PolicyConfiguration
                policy={policyDraft}
                locationRoles={locationRoles}
                onPolicyChange={savePolicy}
                section="v1ReferralPolicy"
              />
            </Box>
          )}

          {policyDraft && activeTab === 'volunteerPolicy' && (
            <Box key="volunteerPolicy">
              <PolicyConfiguration
                policy={policyDraft}
                locationRoles={locationRoles}
                onPolicyChange={savePolicy}
                section="volunteerPolicy"
              />
            </Box>
          )}
        </Box>
      </Box>
    </Stack>
  );
}

function getPolicySaveErrors(error: unknown) {
  if (!(error instanceof ApiException)) {
    return [error instanceof Error ? error.message : 'Policy changes could not be saved.'];
  }

  if (error.status === 403) {
    return ['You do not have permission to save policy changes.'];
  }

  const parsedErrors = parseValidationErrors(error.response);
  if (parsedErrors.length > 0) return parsedErrors;

  return [error.response || error.message || 'Policy changes could not be saved.'];
}

function parseValidationErrors(response: string) {
  try {
    const parsed = JSON.parse(response) as { errors?: unknown };
    return Array.isArray(parsed.errors)
      ? parsed.errors.filter((error): error is string => typeof error === 'string')
      : [];
  } catch {
    return [];
  }
}

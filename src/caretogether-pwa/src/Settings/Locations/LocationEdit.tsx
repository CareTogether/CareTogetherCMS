import {
  Stack,
  Typography,
  Breadcrumbs,
  useTheme,
  useMediaQuery,
  Link as MuiLink,
  IconButton,
  Button,
} from '@mui/material';
import { useState, useEffect } from 'react';
import { useLoadable } from '../../Hooks/useLoadable';
import { organizationConfigurationQuery } from '../../Model/ConfigurationModel';
import { ProgressBackdrop } from '../../Shell/ProgressBackdrop';
import useScreenTitle from '../../Shell/ShellScreenTitle';
import { useRecoilValue } from 'recoil';
import { selectedLocationContextState, useDataLoaded } from '../../Model/Data';
import { useParams } from 'react-router-dom';
import { Link } from 'react-router-dom';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
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
import OtherPolicies from './Tabs/OtherPolicies/OtherPolicies';

export function LocationEdit() {
  const { locationId } = useParams<{ locationId: string }>();

  const configuration = useLoadable(organizationConfigurationQuery);
  const { organizationId } = useRecoilValue(selectedLocationContextState);

  const location = configuration?.locations?.find(
    (location) => location.id === locationId
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

  const tabs = [
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
      shouldShow: useFeatureFlagEnabled('actionDefinitionsTab'),
    },
    {
      id: 'approvalPolicies' as const,
      label: 'Approval Policies',
      component: ApprovalPolicies,
      shouldShow: useFeatureFlagEnabled('approvalPoliciesTab'),
    },
    {
      id: 'otherPolicies' as const,
      label: 'Other Policies',
      component: OtherPolicies,
      shouldShow: true,
    },
  ];

  // This result in a type like: 'basic' | 'actions' | 'policies'
  // Depends on `as const` on the tabs const above
  type LocationTabId = (typeof tabs)[number]['id'];

  // Use the type derived from LOCATION_TABS
  const [activeTab, setActiveTab] = useState<LocationTabId>('basic');

  const dataLoaded = useDataLoaded();

  const canEdit = useUserIsOrganizationAdministrator();

  const appNavigate = useAppNavigate();

  if (!dataLoaded) {
    return (
      <ProgressBackdrop>
        <p>Loading location configuration...</p>
      </ProgressBackdrop>
    );
  }

  if (!canEdit || !location) {
    return (
      <Box mt={10} textAlign="center">
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

  return (
    <Stack spacing={0} sx={{ height: '100%', minHeight: '100vh', pt: 2 }}>
      <Box>
        <Breadcrumbs
          aria-label="breadcrumb"
          separator={<NavigateNextIcon fontSize="small" />}
        >
          <MuiLink
            component={Link}
            to={`/org/${organizationId}/${locationId}/settings`}
            sx={{ textDecoration: 'none', color: 'text.primary' }}
          >
            Settings
          </MuiLink>

          <MuiLink
            component={Link}
            to={`/org/${organizationId}/${locationId}/settings/locations`}
            sx={{ textDecoration: 'none', color: 'text.primary' }}
          >
            Locations
          </MuiLink>

          <Typography color="text.primary">{location.name}</Typography>
        </Breadcrumbs>
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
                tabs={[...tabs]}
                activeTab={activeTab}
                onTabChange={setActiveTab}
              />
            </Box>
          )}
        </Box>

        <Box flex={1} paddingLeft={4} paddingTop={2}>
          {/* Render the active tab component */}
          {availableTabs.map(
            (tab) =>
              activeTab === tab.id && (
                <Box key={tab.id}>
                  <tab.component
                    data={{
                      name: location?.name || '',
                      ethnicities: location.ethnicities || [],
                      adultFamilyRelationships:
                        location.adultFamilyRelationships || [],
                      arrangementReasons: location.arrangementReasons || [],
                    }}
                    currentLocationDefinition={location}
                  />
                </Box>
              )
          )}
        </Box>
      </Box>
    </Stack>
  );
}

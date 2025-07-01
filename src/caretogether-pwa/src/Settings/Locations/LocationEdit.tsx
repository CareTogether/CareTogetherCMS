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
import {
  organizationConfigurationQuery,
  policyData,
} from '../../Model/ConfigurationModel';
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

export function LocationEdit() {
  const { locationId } = useParams<{ locationId: string }>();

  const configuration = useLoadable(organizationConfigurationQuery);
  const { organizationId } = useRecoilValue(selectedLocationContextState);

  const location = configuration?.locations?.find(
    (location) => location.id === locationId
  );

  const effectiveLocationPolicy = useRecoilValue(policyData);

  // TODO: Use this to implement the other tabs
  console.log({ effectiveLocationPolicy });

  useScreenTitle(`Editing ${location?.name} configuration`);

  const showActionsTab = useFeatureFlagEnabled('actionDefinitionsTab');
  const showPoliciesTab = useFeatureFlagEnabled('approvalPoliciesTab');

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

  const [activeTab, setActiveTab] = useState<'basic' | 'actions' | 'policies'>(
    'basic'
  );

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
          Oops! You can’t edit this Location. It may be restricted or
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
                activeTab={activeTab}
                onTabChange={setActiveTab}
                showActionsTab={showActionsTab ?? false}
                showPoliciesTab={showPoliciesTab ?? false}
              />
            </Box>
          )}
        </Box>

        <Box flex={1} paddingLeft={4} paddingTop={2}>
          {activeTab === 'basic' && (
            <BasicConfiguration
              data={{
                name: location?.name || '',
                ethnicities: location.ethnicities || [],
                adultFamilyRelationships:
                  location.adultFamilyRelationships || [],
                arrangementReasons: location.arrangementReasons || [],
              }}
              currentLocationDefinition={location}
            />
          )}

          {activeTab === 'actions' && showActionsTab && <ActionDefinitions />}

          {activeTab === 'policies' && showPoliciesTab && <ApprovalPolicies />}
        </Box>
      </Box>
    </Stack>
  );
}

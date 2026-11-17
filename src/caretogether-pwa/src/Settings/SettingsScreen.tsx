import {
  getSettingsNavigationSections,
  settingsCategories,
  settingsCategoryForSection,
  type SettingsCategory,
} from './settingsSections';
import { useGlobalPermissions } from '../Model/SessionModel';
import { Permission } from '../GeneratedClient';
import { v2Typography } from '../Families/v2Typography';
import Grid from '@mui/material/Grid';
import {
  Alert,
  Box,
  Card,
  CardActionArea,
  CardContent,
  Typography,
} from '@mui/material';
import { useScreenTitle } from '../Shell/ShellScreenTitle';
import {
  AssignmentInd as AssignmentIndIcon,
  CategoryOutlined as CategoryOutlinedIcon,
  LocationOn as LocationOnIcon,
  FactCheck,
  PlaylistAdd,
  Tune,
  AccountTree,
  VolunteerActivism,
  VerifiedUser,
  AdminPanelSettings,
  Business,
} from '@mui/icons-material';
import { Breadcrumbs } from '../Generic/Breadcrumbs';
import { useRequiredSelectedLocationContext } from '../Model/Data';
import { useAppNavigate } from '../Hooks/useAppNavigate';
import { useUserIsOrganizationAdministrator } from '../Model/SessionModel';
import { useFeatureFlagEnabled } from 'posthog-js/react';
import {
  SELF_SERVICE_POLICY_FEATURE_FLAG,
  FAMILY_SCREEN_V2_EARLY_ACCESS_FEATURE_FLAG,
  ORGANIZATION_CATEGORIES_FEATURE_FLAG,
} from '../featureFlags';

const settingsCardIcons = {
  roles: AssignmentIndIcon,
  locations: LocationOnIcon,
  organizationCategories: CategoryOutlinedIcon,
  actionDefinitions: FactCheck,
  customFamilyFields: PlaylistAdd,
  casePolicy: Tune,
  v1ReferralPolicy: AccountTree,
  volunteerPolicy: VolunteerActivism,
  organizationPolicy: VerifiedUser,
  accessLevels: AdminPanelSettings,
};

export function SettingsScreen({
  category,
}: { category?: SettingsCategory } = {}) {
  const { organizationId, locationId } = useRequiredSelectedLocationContext();
  const selectedCategory = settingsCategories.find(
    (item) => item.id === category
  );
  const isV2 =
    useFeatureFlagEnabled(FAMILY_SCREEN_V2_EARLY_ACCESS_FEATURE_FLAG) === true;
  useScreenTitle(selectedCategory?.label ?? 'Settings');
  const appNavigate = useAppNavigate();
  const permissions = useGlobalPermissions();
  const policyEnabled =
    useFeatureFlagEnabled(SELF_SERVICE_POLICY_FEATURE_FLAG) === true;
  const isOrganizationAdministrator =
    useUserIsOrganizationAdministrator() === true;
  const organizationCategoriesEnabled =
    useFeatureFlagEnabled(ORGANIZATION_CATEGORIES_FEATURE_FLAG) === true;

  const sections = getSettingsNavigationSections({
    canAccessSettings: permissions(Permission.AccessSettingsScreen),
    policyEnabled,
    isOrganizationAdministrator,
    organizationCategoriesEnabled,
  });
  const cards = selectedCategory
    ? sections.filter(
        (section) => settingsCategoryForSection(section.id).id === category
      )
    : settingsCategories;
  if (category && !permissions(Permission.AccessSettingsScreen))
    return (
      <Alert severity="error">Settings are restricted or unavailable.</Alert>
    );
  return (
    <Box
      className="ph-unmask"
      sx={{
        paddingTop: category ? { xs: 2.5, sm: 3 } : isV2 ? 0 : { xs: 2, sm: 4 },
        display: 'flex',
        flexDirection: category || isV2 ? 'column' : 'row',
        justifyContent: 'flex-start',
      }}
    >
      {isV2 && !category && (
        <Typography
          className="ph-unmask"
          {...v2Typography.pageTitle}
          component="h1"
          sx={{ mt: { xs: 1, sm: 2 }, mb: { xs: 1, sm: 2 } }}
        >
          Settings
        </Typography>
      )}
      {selectedCategory && (
        <Breadcrumbs
          items={[
            {
              label: 'Settings',
              to: '/org/' + organizationId + '/' + locationId + '/settings',
            },
          ]}
          currentPageLabel={selectedCategory.label}
          sx={{ mb: { xs: 2, sm: 3 } }}
        />
      )}
      <Grid
        component="section"
        aria-label={selectedCategory?.label ?? 'Settings categories'}
        container
        spacing={{ xs: 2, sm: 3 }}
        sx={{ width: '100%' }}
      >
        {cards.map((section) => {
          const Icon =
            section.id === 'tenant'
              ? Business
              : section.id === 'location'
                ? LocationOnIcon
                : settingsCardIcons[section.id];
          return (
            <Grid key={section.id} size={{ xs: 12, sm: 6, md: 4 }}>
              <Card variant="outlined">
                <CardActionArea
                  onClick={() => {
                    if (section.id === 'tenant' || section.id === 'location')
                      appNavigate.settingsCategory(section.id);
                    else if (section.id === 'roles')
                      appNavigate.settingsRoles();
                    else if (section.id === 'locations')
                      appNavigate.settingsLocations();
                    else if (section.id === 'organizationCategories')
                      appNavigate.settingsOrganizationCategories();
                    else appNavigate.settingsSection(section.id);
                  }}
                >
                  <CardContent sx={{ textAlign: 'center' }}>
                    <Icon sx={{ fontSize: 30, color: 'primary.main' }} />
                    <Typography variant="h6">
                      {'cardLabel' in section
                        ? (section.cardLabel ?? section.label)
                        : section.label}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {section.description}
                    </Typography>
                  </CardContent>
                </CardActionArea>
              </Card>
            </Grid>
          );
        })}
      </Grid>
    </Box>
  );
}

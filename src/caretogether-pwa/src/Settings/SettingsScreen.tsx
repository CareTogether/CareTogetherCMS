import { v2Typography } from '../Families/v2Typography';
import Grid from '@mui/material/Grid';
import {
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
} from '@mui/icons-material';
import { useAppNavigate } from '../Hooks/useAppNavigate';
import { useUserIsOrganizationAdministrator } from '../Model/SessionModel';
import { useFeatureFlagEnabled } from 'posthog-js/react';
import {
  FAMILY_SCREEN_V2_EARLY_ACCESS_FEATURE_FLAG,
  ORGANIZATION_CATEGORIES_FEATURE_FLAG,
} from '../featureFlags';

export function SettingsScreen() {
  const isV2 =
    useFeatureFlagEnabled(FAMILY_SCREEN_V2_EARLY_ACCESS_FEATURE_FLAG) === true;
  useScreenTitle('Settings');
  const appNavigate = useAppNavigate();
  const isOrganizationAdministrator =
    useUserIsOrganizationAdministrator() === true;
  const organizationCategoriesEnabled =
    useFeatureFlagEnabled(ORGANIZATION_CATEGORIES_FEATURE_FLAG) === true;

  return (
    <Box
      className="ph-unmask"
      sx={{
        paddingTop: isV2 ? 0 : 4,
        display: 'flex',
        flexDirection: isV2 ? 'column' : 'row',
        justifyContent: 'flex-start',
      }}
    >
      {isV2 && (
        <Typography
          className="ph-unmask"
          {...v2Typography.pageTitle}
          component="h1"
          sx={{ mt: 2, mb: 2 }}
        >
          Settings
        </Typography>
      )}
      <Grid container spacing={3} sx={{ width: '100%' }}>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <Card variant="outlined">
            <CardActionArea onClick={() => appNavigate.settingsRoles()}>
              <CardContent sx={{ textAlign: 'center' }}>
                <AssignmentIndIcon
                  sx={{ fontSize: 30, color: 'primary.main' }}
                />

                <Typography variant="h6">Roles</Typography>
                <Typography variant="body2" color="text.secondary">
                  Configure role definitions for your Staff, Volunteers, and
                  others. Define what each role is able to view and edit.
                </Typography>
              </CardContent>
            </CardActionArea>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <Card variant="outlined">
            <CardActionArea onClick={() => appNavigate.settingsLocations()}>
              <CardContent sx={{ textAlign: 'center' }}>
                <LocationOnIcon sx={{ fontSize: 30, color: 'primary.main' }} />

                <Typography variant="h6">Locations</Typography>
                <Typography variant="body2" color="text.secondary">
                  Manage your locations, configure approval and arrangement
                  policies, and set up custom fields for family and Cases.
                </Typography>
              </CardContent>
            </CardActionArea>
          </Card>
        </Grid>

        {isOrganizationAdministrator && organizationCategoriesEnabled && (
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <Card variant="outlined">
              <CardActionArea
                onClick={() => appNavigate.settingsOrganizationCategories()}
              >
                <CardContent sx={{ textAlign: 'center' }}>
                  <CategoryOutlinedIcon
                    sx={{ fontSize: 30, color: 'primary.main' }}
                  />

                  <Typography variant="h6">Organization Categories</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Define the categories available for classifying
                    Organizations across your Tenant.
                  </Typography>
                </CardContent>
              </CardActionArea>
            </Card>
          </Grid>
        )}
      </Grid>
    </Box>
  );
}

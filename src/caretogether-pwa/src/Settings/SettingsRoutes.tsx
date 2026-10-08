/* eslint-disable react-refresh/only-export-components */
import { Navigate, Outlet } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useFeatureFlagEnabled, usePostHog } from 'posthog-js/react';
import { SettingsScreen } from './SettingsScreen';
import { RoleEditScreen } from './Roles/RoleEditScreen';
import { LocationEdit } from './Locations/LocationEdit';
import { RolesScreen } from './Roles/RolesScreen';
import { OrganizationCategoriesScreen } from './OrganizationCategories/OrganizationCategoriesScreen';
import { ORGANIZATION_CATEGORIES_FEATURE_FLAG } from '../featureFlags';
import { ProgressBackdrop } from '../Shell/ProgressBackdrop';
import type { LocationRoute } from '../Shell/LocationRoute';

function OrganizationCategoriesRoute() {
  const posthog = usePostHog();
  const organizationCategoriesEnabled = useFeatureFlagEnabled(
    ORGANIZATION_CATEGORIES_FEATURE_FLAG
  );
  const [featureFlagsLoaded, setFeatureFlagsLoaded] = useState(
    () => posthog.featureFlags.hasLoadedFlags
  );

  useEffect(() => {
    setFeatureFlagsLoaded(posthog.featureFlags.hasLoadedFlags);

    return posthog.onFeatureFlags(() => {
      setFeatureFlagsLoaded(true);
    });
  }, [posthog]);

  if (!featureFlagsLoaded) {
    return (
      <ProgressBackdrop opaque>
        <p>Loading...</p>
      </ProgressBackdrop>
    );
  }

  return organizationCategoriesEnabled === true ? (
    <OrganizationCategoriesScreen />
  ) : (
    <Navigate to=".." replace />
  );
}

export const settingsRoutes = [
  {
    path: 'settings',
    element: <Outlet />,
    locationSwitch: 'same-path',
    children: [
      {
        index: true,
        element: <SettingsScreen />,
        locationSwitch: 'same-path',
      },
      {
        path: 'roles',
        element: <RolesScreen />,
        locationSwitch: 'same-path',
      },
      {
        path: 'locations',
        element: <LocationEdit />,
        locationSwitch: 'same-path',
      },
      {
        path: 'organization-categories',
        element: <OrganizationCategoriesRoute />,
        locationSwitch: 'same-path',
      },
      {
        path: 'roles/:roleName',
        element: <RoleEditScreen />,
        locationSwitch: 'same-path',
      },
      {
        path: 'locations/:editingLocationId',
        element: <LocationEdit />,
        locationSwitch: 'same-path',
      },
      {
        path: '*',
        element: <Navigate to="../roles" replace />,
        locationSwitch: 'dashboard',
      },
    ],
  },
] satisfies LocationRoute[];

import { Navigate, Route, Routes } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useFeatureFlagEnabled, usePostHog } from 'posthog-js/react';
import { SettingsScreen } from './SettingsScreen';
import { RoleEditScreen } from './Roles/RoleEditScreen';
import { LocationEdit } from './Locations/LocationEdit';
import { RolesScreen } from './Roles/RolesScreen';
import { LocationsScreen } from './Locations/LocationsScreen';
import { OrganizationCategoriesScreen } from './OrganizationCategories/OrganizationCategoriesScreen';
import { ORGANIZATION_CATEGORIES_FEATURE_FLAG } from '../featureFlags';
import { ProgressBackdrop } from '../Shell/ProgressBackdrop';

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

function Settings() {
  return (
    <Routes>
      <Route path="" element={<SettingsScreen />} />
      <Route path="roles" element={<RolesScreen />} />
      <Route path="locations" element={<LocationsScreen />} />
      <Route
        path="organization-categories"
        element={<OrganizationCategoriesRoute />}
      />
      <Route path="roles/:roleName" element={<RoleEditScreen />} />
      <Route path="locations/:editingLocationId" element={<LocationEdit />} />
      <Route path="*" element={<Navigate to="./roles" replace />} />
    </Routes>
  );
}

export { Settings };

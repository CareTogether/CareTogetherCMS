import { StrictMode, Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'jotai';
import {
  BrowserRouter,
  Link,
  Route,
  Routes,
  useLocation,
} from 'react-router-dom';
import { LocationEdit } from '../src/Settings/Locations/LocationEdit';
import { PolicyNavigationConfirmation } from '../src/Hooks/PolicyNavigationConfirmation';
import { SettingsConfigurationScreen } from '../src/Settings/SettingsConfigurationScreen';
import { LegacyCasePolicyRedirect } from '../src/Settings/LegacyCasePolicyRedirect';
import { SettingsScreen } from '../src/Settings/SettingsScreen';
import { RolesScreen } from '../src/Settings/Roles/RolesScreen';
import { OrganizationCategoriesScreen } from '../src/Settings/OrganizationCategories/OrganizationCategoriesScreen';
import { SettingsSidebarNavigation } from '../src/Settings/SettingsSidebarNavigation';
import { List } from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import {
  settingsSections,
  CASE_POLICY_ADMINISTRATION_PATH,
  settingsCategories,
} from '../src/Settings/settingsSections';

export function LocationLinks() {
  const location = useLocation();
  const section = location.pathname.split('/settings')[1] ?? '';
  return (
    <>
      <Link to={'/org/org/a/settings' + section}>Location A</Link>
      <Link to={'/org/org/b/settings' + section}>Location B</Link>
    </>
  );
}
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Provider>
      <LocalizationProvider dateAdapter={AdapterDateFns}>
        <BrowserRouter>
          <PolicyNavigationConfirmation />
          {Reflect.get(window, '__QA_SETTINGS_NAVIGATION__') === true && (
            <aside aria-label="Settings sidebar">
              <List>
                <SettingsSidebarNavigation collapsed={false} />
              </List>
            </aside>
          )}
          <LocationLinks />
          <Suspense fallback={<p>Loading policy...</p>}>
            <Routes>
              <Route path="/org/:organizationId/:locationId/settings">
                <Route index element={<SettingsScreen />} />
                {settingsCategories.map((category) => (
                  <Route
                    key={category.id}
                    path={category.path}
                    element={<SettingsScreen category={category.id} />}
                  />
                ))}
                <Route path="roles" element={<RolesScreen />} />
                <Route
                  path="organization-categories"
                  element={<OrganizationCategoriesScreen />}
                />
                <Route
                  path={CASE_POLICY_ADMINISTRATION_PATH}
                  element={<LegacyCasePolicyRedirect />}
                />
                {settingsSections.map((section) => (
                  <Route
                    key={section.id}
                    path={section.path}
                    element={
                      <SettingsConfigurationScreen section={section.id} />
                    }
                  />
                ))}
                <Route path="locations" element={<LocationEdit />} />
                <Route
                  path="locations/:editingLocationId"
                  element={<LocationEdit />}
                />
              </Route>
            </Routes>
          </Suspense>
        </BrowserRouter>
      </LocalizationProvider>
    </Provider>
  </StrictMode>
);

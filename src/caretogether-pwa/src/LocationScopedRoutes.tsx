/* eslint-disable react-refresh/only-export-components */
import { Navigate, useLocation, useRoutes } from 'react-router-dom';
import { Dashboard } from './Dashboard/Dashboard';
import { InboxScreen } from './Inbox/InboxScreen';
import { FamilyScreenRoute } from './Families/FamilyScreenRoute';
import { clientsRoutes } from './V1Cases/ClientsScreenRoute';
import { referralsRoutes } from './V1Referrals/ReferralsScreenRoute';
import { volunteersRoutes } from './Volunteers/VolunteersScreenRoute';
import { organizationsRoutes } from './Communities/Communities';
import { reportsRoutes } from './Reports/Reports';
import { settingsRoutes } from './Settings/SettingsRoutes';
import { Support } from './Support';
import type { LocationRoute } from './Shell/LocationRoute';

export function RouteError(): never {
  throw new Error(`The URL path '${window.location.href}' is invalid.`);
}

export function CasesToClientsRedirect() {
  const location = useLocation();
  const targetPath = location.pathname.replace('/cases', '/clients');

  return (
    <Navigate to={`${targetPath}${location.search}${location.hash}`} replace />
  );
}

function CommunitiesToOrganizationsRedirect() {
  const location = useLocation();
  const targetPath = location.pathname
    .replace('/communities/community/', '/organizations/organization/')
    .replace('/communities', '/organizations');

  return (
    <Navigate to={`${targetPath}${location.search}${location.hash}`} replace />
  );
}

export const locationScopedRoutes = [
  { index: true, element: <Dashboard />, locationSwitch: 'same-path' },
  { path: 'inbox', element: <InboxScreen />, locationSwitch: 'same-path' },
  { path: 'inbox/*', element: <InboxScreen />, locationSwitch: 'dashboard' },
  {
    path: 'families/:familyId',
    element: <FamilyScreenRoute />,
    locationSwitch: 'dashboard',
  },
  ...clientsRoutes,
  {
    path: 'cases',
    element: <CasesToClientsRedirect />,
    locationSwitch: 'same-path',
  },
  {
    path: 'cases/family/:familyId',
    element: <CasesToClientsRedirect />,
    locationSwitch: 'dashboard',
  },
  {
    path: 'cases/*',
    element: <CasesToClientsRedirect />,
    locationSwitch: 'dashboard',
  },
  ...referralsRoutes,
  ...volunteersRoutes,
  ...organizationsRoutes,
  {
    path: 'communities',
    element: <CommunitiesToOrganizationsRedirect />,
    locationSwitch: 'same-path',
  },
  {
    path: 'communities/community/:communityId',
    element: <CommunitiesToOrganizationsRedirect />,
    locationSwitch: 'dashboard',
  },
  {
    path: 'communities/*',
    element: <CommunitiesToOrganizationsRedirect />,
    locationSwitch: 'dashboard',
  },
  ...reportsRoutes,
  ...settingsRoutes,
  { path: 'support', element: <Support />, locationSwitch: 'same-path' },
  { path: 'support/*', element: <Support />, locationSwitch: 'dashboard' },
  { path: '*', element: <RouteError />, locationSwitch: 'dashboard' },
] satisfies LocationRoute[];

export function LocationScopedRoutes() {
  return useRoutes(locationScopedRoutes);
}

import { Navigate, Outlet } from 'react-router-dom';
import { CommunitiesList } from './CommunitiesList';
import { CommunityScreen } from './CommunityScreen';
import type { LocationRoute } from '../Shell/LocationRoute';

export const organizationsRoutes = [
  {
    path: 'organizations',
    element: <Outlet />,
    locationSwitch: 'same-path',
    children: [
      {
        index: true,
        element: <CommunitiesList />,
        locationSwitch: 'same-path',
      },
      {
        path: 'organization/:communityId',
        element: <CommunityScreen />,
        locationSwitch: 'dashboard',
      },
      {
        path: '*',
        element: <Navigate to=".." replace />,
        locationSwitch: 'dashboard',
      },
    ],
  },
] satisfies LocationRoute[];

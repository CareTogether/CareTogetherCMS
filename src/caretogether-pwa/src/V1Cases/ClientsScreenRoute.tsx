/* eslint-disable react-refresh/only-export-components */
import { useFeatureFlagEnabled } from 'posthog-js/react';
import { Navigate, Outlet, useParams } from 'react-router-dom';
import { FAMILY_SCREEN_V2_EARLY_ACCESS_FEATURE_FLAG } from '../featureFlags';
import type { LocationRoute } from '../Shell/LocationRoute';
import { ProgressBackdrop } from '../Shell/ProgressBackdrop';
import { useFeatureFlagsLoaded } from '../Utilities/Instrumentation/useFeatureFlagsLoaded';
import { ClientsScreenV2 } from './ClientsScreenV2';
import { PartneringFamilies } from './PartneringFamilies';

function ClientsRouteLayout() {
  const featureFlagsLoaded = useFeatureFlagsLoaded();

  if (!featureFlagsLoaded) {
    return (
      <ProgressBackdrop opaque>
        <p>Loading...</p>
      </ProgressBackdrop>
    );
  }

  return <Outlet />;
}

function ClientsIndexRoute() {
  const earlyAccessEnabled = useFeatureFlagEnabled(
    FAMILY_SCREEN_V2_EARLY_ACCESS_FEATURE_FLAG
  );

  return earlyAccessEnabled === true ? (
    <ClientsScreenV2 />
  ) : (
    <PartneringFamilies />
  );
}

function ClientFamilyRedirect() {
  const { familyId } = useParams<{ familyId: string }>();

  return <Navigate to={`/families/${familyId}`} />;
}

export const clientsRoutes = [
  {
    path: 'clients',
    element: <ClientsRouteLayout />,
    locationSwitch: 'same-path',
    children: [
      {
        index: true,
        element: <ClientsIndexRoute />,
        locationSwitch: 'same-path',
      },
      {
        path: 'family/:familyId',
        element: <ClientFamilyRedirect />,
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

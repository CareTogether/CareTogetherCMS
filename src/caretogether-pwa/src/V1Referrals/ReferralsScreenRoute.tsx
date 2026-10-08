/* eslint-disable react-refresh/only-export-components */
import { useFeatureFlagEnabled } from 'posthog-js/react';
import { Navigate, Outlet } from 'react-router-dom';
import { FAMILY_SCREEN_V2_EARLY_ACCESS_FEATURE_FLAG } from '../featureFlags';
import type { LocationRoute } from '../Shell/LocationRoute';
import { ProgressBackdrop } from '../Shell/ProgressBackdrop';
import { useFeatureFlagsLoaded } from '../Utilities/Instrumentation/useFeatureFlagsLoaded';
import { ReferralDetailsPage } from './ReferralDetailsPage';
import { ReferralsScreenV2 } from './ReferralsScreenV2';
import { V1Referrals, V1ReferralsIndex } from './V1Referrals';

function ReferralsRouteLayout() {
  const earlyAccessEnabled = useFeatureFlagEnabled(
    FAMILY_SCREEN_V2_EARLY_ACCESS_FEATURE_FLAG
  );
  const featureFlagsLoaded = useFeatureFlagsLoaded();

  if (!featureFlagsLoaded) {
    return (
      <ProgressBackdrop opaque>
        <p>Loading...</p>
      </ProgressBackdrop>
    );
  }

  return earlyAccessEnabled === true ? <Outlet /> : <V1Referrals />;
}

function ReferralsIndexRoute() {
  const earlyAccessEnabled = useFeatureFlagEnabled(
    FAMILY_SCREEN_V2_EARLY_ACCESS_FEATURE_FLAG
  );

  return earlyAccessEnabled === true ? (
    <ReferralsScreenV2 />
  ) : (
    <V1ReferralsIndex />
  );
}

export const referralsRoutes = [
  {
    path: 'referrals',
    element: <ReferralsRouteLayout />,
    locationSwitch: 'same-path',
    children: [
      {
        index: true,
        element: <ReferralsIndexRoute />,
        locationSwitch: 'same-path',
      },
      {
        path: ':referralId',
        element: <ReferralDetailsPage />,
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

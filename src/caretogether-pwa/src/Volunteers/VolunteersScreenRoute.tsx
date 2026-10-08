/* eslint-disable react-refresh/only-export-components */
import { useFeatureFlagEnabled } from 'posthog-js/react';
import { Navigate, useOutletContext, useParams } from 'react-router-dom';
import { FAMILY_SCREEN_V2_EARLY_ACCESS_FEATURE_FLAG } from '../featureFlags';
import { ProgressBackdrop } from '../Shell/ProgressBackdrop';
import type { LocationRoute } from '../Shell/LocationRoute';
import { useFeatureFlagsLoaded } from '../Utilities/Instrumentation/useFeatureFlagsLoaded';
import { VolunteerApproval } from './VolunteerApprovalTab/VolunteerApproval';
import { VolunteerProgress } from './VolunteerProgressTab/VolunteerProgress';
import { VolunteersBrowserV2 } from './VolunteersBrowserV2';
import {
  Volunteers,
  type VolunteersRouteContext,
} from './VolunteersRouteContext';
import { VolunteersScreenV2 } from './VolunteersScreenV2';

export function VolunteersScreenRoute() {
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

  const showVolunteersScreenV2 = earlyAccessEnabled === true;

  return showVolunteersScreenV2 ? <VolunteersScreenV2 /> : <Volunteers />;
}

function VolunteersIndexRoute() {
  const context = useOutletContext<VolunteersRouteContext>();

  return context.version === 'v2' ? (
    <VolunteersBrowserV2 />
  ) : (
    <Navigate to={context.lastScreen} replace />
  );
}

function VolunteerApprovalRoute() {
  const context = useOutletContext<VolunteersRouteContext>();

  return context.version === 'v2' ? (
    <Navigate to=".." replace />
  ) : (
    <VolunteerApproval onOpen={() => context.setLastScreen('approval')} />
  );
}

function VolunteerProgressRoute() {
  const context = useOutletContext<VolunteersRouteContext>();

  return context.version === 'v2' ? (
    <Navigate to=".." replace />
  ) : (
    <VolunteerProgress onOpen={() => context.setLastScreen('progress')} />
  );
}

function VolunteerFamilyRedirect() {
  const { familyId } = useParams<{ familyId: string }>();

  return <Navigate to={`/families/${familyId}`} />;
}

function VolunteersFallbackRoute() {
  const context = useOutletContext<VolunteersRouteContext>();

  return context.version === 'v2' ? (
    <Navigate to=".." replace />
  ) : (
    <Navigate to={`../${context.lastScreen}`} replace />
  );
}

export const volunteersRoutes = [
  {
    path: 'volunteers',
    element: <VolunteersScreenRoute />,
    locationSwitch: 'dashboard',
    children: [
      {
        index: true,
        element: <VolunteersIndexRoute />,
        locationSwitch: 'same-path',
      },
      {
        path: 'approval',
        element: <VolunteerApprovalRoute />,
        locationSwitch: 'same-path',
      },
      {
        path: 'progress',
        element: <VolunteerProgressRoute />,
        locationSwitch: 'same-path',
      },
      {
        path: 'family/:familyId',
        element: <VolunteerFamilyRedirect />,
        locationSwitch: 'dashboard',
      },
      {
        path: '*',
        element: <VolunteersFallbackRoute />,
        locationSwitch: 'dashboard',
      },
    ],
  },
] satisfies LocationRoute[];

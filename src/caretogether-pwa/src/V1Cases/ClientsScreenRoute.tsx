import { useFeatureFlagEnabled } from 'posthog-js/react';
import { Navigate, Route, Routes, useParams } from 'react-router-dom';
import { FAMILY_SCREEN_V2_EARLY_ACCESS_FEATURE_FLAG } from '../featureFlags';
import { ProgressBackdrop } from '../Shell/ProgressBackdrop';
import { V1Cases } from './V1Cases';
import { ClientsScreenV2 } from './ClientsScreenV2';
import { useFeatureFlagsLoaded } from '../Utilities/Instrumentation/useFeatureFlagsLoaded';

function ClientFamilyRedirect() {
  const { familyId } = useParams<{ familyId: string }>();

  return <Navigate to={`/families/${familyId}`} />;
}

export function ClientsScreenRoute() {
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

  const showClientsScreenV2 = earlyAccessEnabled === true;

  if (!showClientsScreenV2) {
    return <V1Cases />;
  }

  return (
    <Routes>
      <Route path="" element={<ClientsScreenV2 />} />
      <Route path="family/:familyId" element={<ClientFamilyRedirect />} />
      <Route path="*" element={<Navigate to=".." replace />} />
    </Routes>
  );
}

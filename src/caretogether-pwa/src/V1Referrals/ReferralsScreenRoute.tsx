import { useFeatureFlagEnabled } from 'posthog-js/react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { FAMILY_SCREEN_V2_EARLY_ACCESS_FEATURE_FLAG } from '../featureFlags';
import { ProgressBackdrop } from '../Shell/ProgressBackdrop';
import { useFeatureFlagsLoaded } from '../Utilities/Instrumentation/useFeatureFlagsLoaded';
import { ReferralDetailsPage } from './ReferralDetailsPage';
import { ReferralsScreenV2 } from './ReferralsScreenV2';
import { V1Referrals } from './V1Referrals';

export function ReferralsScreenRoute() {
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

  const showReferralsScreenV2 = earlyAccessEnabled === true;

  if (!showReferralsScreenV2) {
    return <V1Referrals />;
  }

  return (
    <Routes>
      <Route path="" element={<ReferralsScreenV2 />} />
      <Route path=":referralId" element={<ReferralDetailsPage />} />
      <Route path="*" element={<Navigate to=".." replace />} />
    </Routes>
  );
}

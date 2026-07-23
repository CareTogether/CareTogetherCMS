import { useEffect, useState } from 'react';
import { useFeatureFlagEnabled, usePostHog } from 'posthog-js/react';
import { FAMILY_SCREEN_V2_EARLY_ACCESS_FEATURE_FLAG } from '../featureFlags';
import { ProgressBackdrop } from '../Shell/ProgressBackdrop';
import { FamilyScreen } from './FamilyScreen';
import { FamilyScreenV2 } from './FamilyScreenV2';

export function FamilyScreenRoute() {
  const posthog = usePostHog();
  const earlyAccessEnabled = useFeatureFlagEnabled(
    FAMILY_SCREEN_V2_EARLY_ACCESS_FEATURE_FLAG
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

  const showFamilyScreenV2 = earlyAccessEnabled === true;

  return showFamilyScreenV2 ? <FamilyScreenV2 /> : <FamilyScreen />;
}

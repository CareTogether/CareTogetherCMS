import { useEffect, useState } from 'react';
import { useFeatureFlagEnabled, usePostHog } from 'posthog-js/react';
import {
  FAMILY_SCREEN_V2_EARLY_ACCESS_FEATURE_FLAG,
  FAMILY_SCREEN_V2_FEATURE_FLAG,
} from '../featureFlags';
import { getEarlyAccessEnrollment } from '../Utilities/Instrumentation/earlyAccessEnrollment';
import { ProgressBackdrop } from '../Shell/ProgressBackdrop';
import { Volunteers } from './Volunteers';
import { VolunteersScreenV2 } from './VolunteersScreenV2';

export function VolunteersScreenRoute() {
  const posthog = usePostHog();
  const rolloutEnabled = useFeatureFlagEnabled(FAMILY_SCREEN_V2_FEATURE_FLAG);
  const [featureFlagsLoaded, setFeatureFlagsLoaded] = useState(
    () => posthog.featureFlags.hasLoadedFlags
  );
  const [earlyAccessEnrollment, setEarlyAccessEnrollment] = useState<
    boolean | undefined
  >(() =>
    getEarlyAccessEnrollment(
      posthog,
      FAMILY_SCREEN_V2_EARLY_ACCESS_FEATURE_FLAG
    )
  );

  useEffect(() => {
    function updateEarlyAccessEnrollment() {
      setEarlyAccessEnrollment(
        getEarlyAccessEnrollment(
          posthog,
          FAMILY_SCREEN_V2_EARLY_ACCESS_FEATURE_FLAG
        )
      );
    }

    setFeatureFlagsLoaded(posthog.featureFlags.hasLoadedFlags);
    updateEarlyAccessEnrollment();

    return posthog.onFeatureFlags(() => {
      setFeatureFlagsLoaded(true);
      updateEarlyAccessEnrollment();
    });
  }, [posthog]);

  if (!featureFlagsLoaded) {
    return (
      <ProgressBackdrop opaque>
        <p>Loading...</p>
      </ProgressBackdrop>
    );
  }

  const showVolunteersScreenV2 =
    earlyAccessEnrollment ?? (rolloutEnabled === true);

  return showVolunteersScreenV2 ? <VolunteersScreenV2 /> : <Volunteers />;
}

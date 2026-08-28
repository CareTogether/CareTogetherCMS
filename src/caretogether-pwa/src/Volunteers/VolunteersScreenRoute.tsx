import { useFeatureFlagEnabled } from 'posthog-js/react';
import { FAMILY_SCREEN_V2_EARLY_ACCESS_FEATURE_FLAG } from '../featureFlags';
import { ProgressBackdrop } from '../Shell/ProgressBackdrop';
import { useFeatureFlagsLoaded } from '../Utilities/Instrumentation/useFeatureFlagsLoaded';
import { Volunteers } from './Volunteers';
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

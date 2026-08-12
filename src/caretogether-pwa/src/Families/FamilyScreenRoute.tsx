import { FAMILY_SCREEN_V2_EARLY_ACCESS_FEATURE_FLAG } from '../featureFlags';
import { ProgressBackdrop } from '../Shell/ProgressBackdrop';
import { FamilyScreen } from './FamilyScreen';
import { FamilyScreenV2 } from './FamilyScreenV2';
import {
  useFeatureFlagEnabledWithLocalOverride,
  useFeatureFlagsLoadedWithLocalOverride,
} from '../Utilities/Instrumentation/useFeatureFlagWithLocalOverride';

export function FamilyScreenRoute() {
  const earlyAccessEnabled = useFeatureFlagEnabledWithLocalOverride(
    FAMILY_SCREEN_V2_EARLY_ACCESS_FEATURE_FLAG
  );
  const featureFlagsLoaded = useFeatureFlagsLoadedWithLocalOverride(
    FAMILY_SCREEN_V2_EARLY_ACCESS_FEATURE_FLAG
  );

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

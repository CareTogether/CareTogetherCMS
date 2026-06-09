import { useFeatureFlagEnabled, usePostHog } from 'posthog-js/react';

function normalizedLocalFeatureFlags() {
  return (import.meta.env.VITE_APP_LOCAL_FEATURE_FLAGS ?? '')
    .split(',')
    .map((flag) => flag.trim().toLowerCase())
    .filter(Boolean);
}

function isLocalFeatureFlagEnabled(featureFlag: string) {
  return normalizedLocalFeatureFlags().includes(featureFlag.toLowerCase());
}

export function useFeatureFlagEnabledWithLocalOverride(featureFlag: string) {
  const featureFlagEnabled = useFeatureFlagEnabled(featureFlag);

  return featureFlagEnabled === true || isLocalFeatureFlagEnabled(featureFlag);
}

export function useFeatureFlagsLoadedWithLocalOverride(
  ...featureFlags: string[]
) {
  const posthog = usePostHog();

  if (featureFlags.every(isLocalFeatureFlagEnabled)) {
    return true;
  }

  return posthog.featureFlags?.hasLoadedFlags === true;
}

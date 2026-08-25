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

function isPostHogConfigured() {
  return Boolean(import.meta.env.VITE_APP_PUBLIC_POSTHOG_KEY?.trim());
}

export function useFeatureFlagEnabledWithLocalOverride(featureFlag: string) {
  const featureFlagEnabled = useFeatureFlagEnabled(featureFlag);

  return featureFlagEnabled === true || isLocalFeatureFlagEnabled(featureFlag);
}

export function useFeatureFlagsLoadedWithLocalOverride(
  ...featureFlags: string[]
) {
  const posthog = usePostHog();

  if (
    !isPostHogConfigured() ||
    featureFlags.every(isLocalFeatureFlagEnabled)
  ) {
    return true;
  }

  return posthog.featureFlags?.hasLoadedFlags === true;
}

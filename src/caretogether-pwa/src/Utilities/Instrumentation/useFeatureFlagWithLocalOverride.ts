import { useFeatureFlagEnabled, usePostHog } from 'posthog-js/react';

function postHogFeatureFlagsConfigured() {
  return Boolean(import.meta.env.VITE_APP_PUBLIC_POSTHOG_KEY?.trim());
}

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

  if (!postHogFeatureFlagsConfigured()) {
    return true;
  }

  return posthog.featureFlags?.hasLoadedFlags === true;
}

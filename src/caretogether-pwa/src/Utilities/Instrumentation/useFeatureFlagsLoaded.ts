import { useCallback, useSyncExternalStore } from 'react';
import { usePostHog } from 'posthog-js/react';

export function useFeatureFlagsLoaded() {
  const posthog = usePostHog();
  const subscribe = useCallback(
    (onStoreChange: () => void) => posthog.onFeatureFlags(onStoreChange),
    [posthog]
  );
  const getSnapshot = useCallback(
    () => posthog.featureFlags.hasLoadedFlags,
    [posthog]
  );

  return useSyncExternalStore(subscribe, getSnapshot, () => false);
}

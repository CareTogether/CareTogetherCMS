import { useCallback, useEffect, useMemo, useState } from 'react';

export type ScopedFilterPreferenceScope = {
  locationId?: string;
  organizationId?: string;
  userId?: string;
};

type UseScopedFilterPreferencesOptions<TPreferences> = {
  namespace: string;
  parsePreferences: (value: unknown) => TPreferences | null;
  scope: ScopedFilterPreferenceScope;
  version: number;
};

type LoadedScopedFilterPreferences<TPreferences> = {
  preferences: TPreferences | null;
  key: string | null;
};

function storageKey(
  namespace: string,
  version: number,
  { locationId, organizationId, userId }: ScopedFilterPreferenceScope
) {
  if (!userId || !organizationId || !locationId) return null;

  return [namespace, `v${version}`, userId, organizationId, locationId].join(
    ':'
  );
}

function readPreferences<TPreferences>(
  key: string | null,
  parsePreferences: (value: unknown) => TPreferences | null
) {
  if (!key) return null;

  try {
    return parsePreferences(
      JSON.parse(window.localStorage.getItem(key) ?? 'null')
    );
  } catch {
    return null;
  }
}

function writePreferences<TPreferences>(
  key: string | null,
  preferences: TPreferences
) {
  if (!key) return false;

  try {
    window.localStorage.setItem(key, JSON.stringify(preferences));
    return true;
  } catch {
    return false;
  }
}

function removePreferences(key: string | null) {
  if (!key) return false;

  try {
    window.localStorage.removeItem(key);
    return true;
  } catch {
    return false;
  }
}

export function useScopedFilterPreferences<TPreferences>({
  namespace,
  parsePreferences,
  scope,
  version,
}: UseScopedFilterPreferencesOptions<TPreferences>) {
  const { locationId, organizationId, userId } = scope;
  const key = useMemo(
    () =>
      storageKey(namespace, version, {
        locationId,
        organizationId,
        userId,
      }),
    [locationId, namespace, organizationId, userId, version]
  );
  const [loadedPreferences, setLoadedPreferences] =
    useState<LoadedScopedFilterPreferences<TPreferences>>(() => ({
      preferences: readPreferences(key, parsePreferences),
      key,
    }));
  const currentPreferences =
    loadedPreferences.key === key ? loadedPreferences.preferences : null;

  useEffect(() => {
    setLoadedPreferences({
      preferences: readPreferences(key, parsePreferences),
      key,
    });
  }, [key, parsePreferences]);

  const savePreferences = useCallback(
    (preferences: TPreferences) => {
      if (writePreferences(key, preferences)) {
        setLoadedPreferences({
          preferences,
          key,
        });
      }
    },
    [key]
  );

  const clearPreferences = useCallback(() => {
    if (removePreferences(key)) {
      setLoadedPreferences({
        preferences: null,
        key,
      });
    }
  }, [key]);

  return {
    canPersistPreferences: key !== null,
    clearPreferences,
    hasSavedPreferences: currentPreferences !== null,
    preferencesLoaded: loadedPreferences.key === key,
    savedPreferences: currentPreferences,
    savePreferences,
    storageKey: key,
  };
}

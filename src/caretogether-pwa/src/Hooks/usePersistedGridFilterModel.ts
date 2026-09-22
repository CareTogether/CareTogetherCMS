import type { GridColDef, GridFilterModel } from '@mui/x-data-grid-premium';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useAccountInfo } from '../Authentication/Auth';
import { useSelectedLocationContext } from '../Model/Data';
import {
  dataGridFilterPreferencesFromUnknown,
  dataGridFilterPreferencesVersion,
  emptyGridFilterModel,
  emptyPersistedDataGridFilters,
  filterModelFromPersistedDataGridFilters,
  filterModelHasIncompleteItems,
  isSameJsonValue,
  normalizeGridFilterModel,
  type PersistedDataGridFilterPreferencesV1,
} from './dataGridFilterPreferences';

type UsePersistedGridFilterModelOptions = {
  columns: GridColDef[];
  entityId?: string;
  namespace: string;
};

type KeyedGridFilterModel = {
  filterModel: GridFilterModel;
  storageKey: string | null;
};

type LoadedFilterPreferences = {
  preferences: PersistedDataGridFilterPreferencesV1 | null;
  storageKey: string | null;
};

type FilterPreferenceScope = {
  entityId?: string;
  locationId?: string;
  organizationId?: string;
  userId?: string;
};

function persistedFilterStorageKey(
  namespace: string,
  { entityId, locationId, organizationId, userId }: FilterPreferenceScope
) {
  if (!userId || !organizationId || !locationId) return null;
  if (entityId !== undefined && !entityId) return null;

  return [
    'caretogether:dataGridFilterPreferences',
    `v${dataGridFilterPreferencesVersion}`,
    namespace,
    userId,
    organizationId,
    locationId,
    ...(entityId ? [entityId] : []),
  ].join(':');
}

function readFilterPreferences(
  key: string | null
): PersistedDataGridFilterPreferencesV1 | null {
  if (!key) return null;

  try {
    return dataGridFilterPreferencesFromUnknown(
      JSON.parse(window.localStorage.getItem(key) ?? 'null')
    );
  } catch {
    return null;
  }
}

function restoredFilterModel(
  preferences: PersistedDataGridFilterPreferencesV1 | null,
  columns: GridColDef[]
) {
  const storedFilterModel = filterModelFromPersistedDataGridFilters(
    preferences ?? emptyPersistedDataGridFilters
  );
  return filterModelFromPersistedDataGridFilters(
    normalizeGridFilterModel(storedFilterModel, columns)
  );
}

function writeFilterPreferences(key: string, preferences: unknown) {
  try {
    window.localStorage.setItem(key, JSON.stringify(preferences));
    return true;
  } catch {
    return false;
  }
}

function removeFilterPreferences(key: string) {
  try {
    window.localStorage.removeItem(key);
    return true;
  } catch {
    return false;
  }
}

export function usePersistedGridFilterModel({
  columns,
  entityId,
  namespace,
}: UsePersistedGridFilterModelOptions) {
  const userId = useAccountInfo()?.userId;
  const locationContext = useSelectedLocationContext();
  const storageKey = useMemo(
    () =>
      persistedFilterStorageKey(namespace, {
        entityId,
        locationId: locationContext?.locationId,
        organizationId: locationContext?.organizationId,
        userId,
      }),
    [entityId, locationContext, namespace, userId]
  );
  const [loadedPreferences, setLoadedPreferences] =
    useState<LoadedFilterPreferences>(() => ({
      preferences: readFilterPreferences(storageKey),
      storageKey,
    }));
  const preferencesLoaded = loadedPreferences.storageKey === storageKey;
  const savedPreferences = preferencesLoaded
    ? loadedPreferences.preferences
    : null;
  const [keyedFilterModel, setKeyedFilterModel] =
    useState<KeyedGridFilterModel>(() => ({
      filterModel: restoredFilterModel(loadedPreferences.preferences, columns),
      storageKey,
    }));
  const filterModel =
    keyedFilterModel.storageKey === storageKey
      ? keyedFilterModel.filterModel
      : emptyGridFilterModel;
  const restoredFilterPreferenceStorageKey = useRef<string | null>(storageKey);
  const normalizedFilterModel = useMemo(
    () => normalizeGridFilterModel(filterModel, columns),
    [columns, filterModel]
  );
  const normalizedPreferences = useMemo<PersistedDataGridFilterPreferencesV1>(
    () => ({
      version: dataGridFilterPreferencesVersion,
      ...normalizedFilterModel,
    }),
    [normalizedFilterModel]
  );
  const filterModelIsEmpty =
    normalizedFilterModel.items.length === 0 &&
    normalizedFilterModel.quickFilterValues.length === 0;
  const filterModelHasIncompleteItem = useMemo(
    () => filterModelHasIncompleteItems(filterModel, columns),
    [columns, filterModel]
  );

  useEffect(() => {
    const preferences = readFilterPreferences(storageKey);
    setLoadedPreferences({ preferences, storageKey });
  }, [storageKey]);

  useEffect(() => {
    if (
      !storageKey ||
      !preferencesLoaded ||
      restoredFilterPreferenceStorageKey.current === storageKey
    ) {
      return;
    }

    restoredFilterPreferenceStorageKey.current = storageKey;
    setKeyedFilterModel({
      filterModel: restoredFilterModel(savedPreferences, columns),
      storageKey,
    });
  }, [columns, preferencesLoaded, savedPreferences, storageKey]);

  const savePreferences = useCallback(
    (preferences: PersistedDataGridFilterPreferencesV1) => {
      if (writeFilterPreferences(storageKey!, preferences)) {
        setLoadedPreferences({ preferences, storageKey });
      }
    },
    [storageKey]
  );

  const clearPreferences = useCallback(() => {
    if (removeFilterPreferences(storageKey!)) {
      setLoadedPreferences({ preferences: null, storageKey });
    }
  }, [storageKey]);

  useEffect(() => {
    if (
      !storageKey ||
      !preferencesLoaded ||
      restoredFilterPreferenceStorageKey.current !== storageKey ||
      filterModelHasIncompleteItem
    ) {
      return;
    }

    if (filterModelIsEmpty) {
      if (savedPreferences) {
        clearPreferences();
      }

      return;
    }

    if (
      savedPreferences &&
      isSameJsonValue(savedPreferences, normalizedPreferences)
    ) {
      return;
    }

    savePreferences(normalizedPreferences);
  }, [
    clearPreferences,
    filterModelHasIncompleteItem,
    filterModelIsEmpty,
    normalizedPreferences,
    preferencesLoaded,
    savePreferences,
    savedPreferences,
    storageKey,
  ]);

  const onFilterModelChange = useCallback(
    (model: GridFilterModel) => {
      setKeyedFilterModel({ filterModel: model, storageKey });
    },
    [storageKey]
  );

  return {
    filterModel,
    onFilterModelChange,
  };
}

import type { GridColDef, GridFilterModel } from '@mui/x-data-grid';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  dataGridFilterPreferencesFromUnknown,
  dataGridFilterPreferencesVersion,
  emptyGridFilterModel,
  emptyPersistedDataGridFilters,
  filterModelFromPersistedDataGridFilters,
  filterModelHasIncompleteItems,
  hasQuickFilterValues,
  isSameJsonValue,
  normalizeGridFilterModel,
  type PersistedDataGridFilterPreferencesV1,
} from './dataGridFilterPreferences';
import {
  type ScopedFilterPreferenceScope,
  useScopedFilterPreferences,
} from './useScopedFilterPreferences';

type ScopedDataGridFilterPreferencesScope = ScopedFilterPreferenceScope & {
  entityId?: string;
};

type UseScopedDataGridFilterPreferencesOptions = {
  columns: GridColDef[];
  namespace: string;
  scope: ScopedDataGridFilterPreferencesScope;
};

type KeyedGridFilterModel = {
  filterModel: GridFilterModel;
  storageKey: string | null;
};

const emptyPersistedGridFilterPreferences: PersistedDataGridFilterPreferencesV1 =
  {
    version: dataGridFilterPreferencesVersion,
    ...emptyPersistedDataGridFilters,
  };

export function useScopedDataGridFilterPreferences({
  columns,
  namespace,
  scope,
}: UseScopedDataGridFilterPreferencesOptions) {
  const {
    canPersistPreferences,
    clearPreferences,
    preferencesLoaded,
    savedPreferences,
    savePreferences,
    storageKey,
  } = useScopedFilterPreferences({
    namespace,
    parsePreferences: dataGridFilterPreferencesFromUnknown,
    scope,
    version: dataGridFilterPreferencesVersion,
  });
  const [keyedFilterModel, setKeyedFilterModel] = useState<KeyedGridFilterModel>(
    () => ({
      filterModel: emptyGridFilterModel,
      storageKey,
    })
  );
  const filterModel =
    keyedFilterModel.storageKey === storageKey
      ? keyedFilterModel.filterModel
      : emptyGridFilterModel;
  const restoredFilterPreferenceStorageKey = useRef<string | null>(null);
  const normalizedFilterModel = useMemo(
    () => normalizeGridFilterModel(filterModel, columns),
    [columns, filterModel]
  );
  const normalizedFilterPreferences = useMemo(
    () => ({
      version: dataGridFilterPreferencesVersion,
      ...normalizedFilterModel,
    }),
    [normalizedFilterModel]
  );
  const filterModelIsEmpty = normalizedFilterModel.items.length === 0;
  const filterModelHasIncompleteItem = useMemo(
    () => filterModelHasIncompleteItems(filterModel, columns),
    [columns, filterModel]
  );
  const hasActiveFilters =
    normalizedFilterModel.items.length > 0 || hasQuickFilterValues(filterModel);

  useEffect(() => {
    if (
      !storageKey ||
      !preferencesLoaded ||
      restoredFilterPreferenceStorageKey.current === storageKey
    ) {
      return;
    }

    const restoredPreferences = normalizeGridFilterModel(
      filterModelFromPersistedDataGridFilters(
        savedPreferences ?? emptyPersistedGridFilterPreferences
      ),
      columns
    );

    restoredFilterPreferenceStorageKey.current = storageKey;
    setKeyedFilterModel({
      filterModel: filterModelFromPersistedDataGridFilters(restoredPreferences),
      storageKey,
    });
  }, [columns, preferencesLoaded, savedPreferences, storageKey]);

  useEffect(() => {
    if (
      !canPersistPreferences ||
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
      isSameJsonValue(savedPreferences, normalizedFilterPreferences)
    ) {
      return;
    }

    savePreferences(normalizedFilterPreferences);
  }, [
    canPersistPreferences,
    clearPreferences,
    filterModelHasIncompleteItem,
    filterModelIsEmpty,
    normalizedFilterModel,
    normalizedFilterPreferences,
    preferencesLoaded,
    savePreferences,
    savedPreferences,
    storageKey,
  ]);

  const onFilterModelChange = useCallback(
    (model: GridFilterModel) => {
      setKeyedFilterModel({
        filterModel: model,
        storageKey,
      });
    },
    [storageKey]
  );

  const clearFilters = useCallback(() => {
    clearPreferences();
    setKeyedFilterModel({
      filterModel: emptyGridFilterModel,
      storageKey,
    });
  }, [clearPreferences, storageKey]);

  return {
    clearFilters,
    filterModel,
    hasActiveFilters,
    onFilterModelChange,
    preferencesLoaded,
  };
}

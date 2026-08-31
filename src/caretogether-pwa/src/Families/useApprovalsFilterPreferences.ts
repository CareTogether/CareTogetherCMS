import { type GridColDef, type GridFilterModel } from '@mui/x-data-grid';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  emptyGridFilterModel,
  emptyPersistedDataGridFilters,
  filterModelFromPersistedDataGridFilters,
  filterModelHasIncompleteItems,
  hasQuickFilterValues,
  isSameJsonValue,
  normalizeGridFilterModel,
  persistedDataGridFiltersFromUnknown,
  type JsonSafeValue,
  type PersistedDataGridFilters,
  type PersistedGridFilterItem,
} from '../Hooks/dataGridFilterPreferences';
import {
  type ScopedFilterPreferenceScope,
  useScopedFilterPreferences,
} from '../Hooks/useScopedFilterPreferences';
import type { ApprovalLedgerStatus } from './approvalLedgerViewModel';

export type ApprovalStatusFilter = ApprovalLedgerStatus | 'all';

export const approvalStatusFilterOptions: {
  value: ApprovalStatusFilter;
  label: string;
}[] = [
  { value: 'all', label: 'All' },
  { value: 'missing', label: 'Missing' },
  { value: 'completed', label: 'Completed' },
  { value: 'exempted', label: 'Exempted' },
  { value: 'expiring', label: 'Expiring' },
  { value: 'expired', label: 'Expired' },
  { value: 'availableApplication', label: 'Available Application' },
];

type PersistedApprovalsExternalFilters = {
  appliesToFilter: string;
  roleFilter: string;
  statusFilter: ApprovalStatusFilter;
};

type PersistedApprovalsFilterPreferencesV1 = {
  version: 1;
  external: PersistedApprovalsExternalFilters;
  grid: PersistedDataGridFilters;
};

type ApprovalsFilterState = PersistedApprovalsExternalFilters & {
  filterModel: GridFilterModel;
  searchText: string;
};

type KeyedApprovalsFilterState = {
  state: ApprovalsFilterState;
  storageKey: string | null;
};

type UseApprovalsFilterPreferencesOptions = {
  appliesToOptionValues: string[];
  columns: GridColDef[];
  neededForRoleOptionValues: string[];
  scope: ScopedFilterPreferenceScope;
};

const approvalsFilterPreferencesVersion = 1 as const;
const defaultExternalFilters: PersistedApprovalsExternalFilters = {
  appliesToFilter: 'all',
  roleFilter: 'all',
  statusFilter: 'all',
};
const defaultApprovalsFilterState: ApprovalsFilterState = {
  ...defaultExternalFilters,
  filterModel: emptyGridFilterModel,
  searchText: '',
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function statusFilterFromUnknown(value: unknown): ApprovalStatusFilter {
  return approvalStatusFilterOptions.some((option) => option.value === value)
    ? (value as ApprovalStatusFilter)
    : 'all';
}

function stringFilterFromUnknown(value: unknown) {
  return typeof value === 'string' ? value : 'all';
}

function externalFiltersFromUnknown(
  value: unknown
): PersistedApprovalsExternalFilters {
  if (!isRecord(value)) {
    return defaultExternalFilters;
  }

  return {
    appliesToFilter: stringFilterFromUnknown(value.appliesToFilter),
    roleFilter: stringFilterFromUnknown(value.roleFilter),
    statusFilter: statusFilterFromUnknown(value.statusFilter),
  };
}

function preferencesFromUnknown(
  value: unknown
): PersistedApprovalsFilterPreferencesV1 | null {
  if (
    !isRecord(value) ||
    value.version !== approvalsFilterPreferencesVersion
  ) {
    return null;
  }

  return {
    version: approvalsFilterPreferencesVersion,
    external: externalFiltersFromUnknown(value.external),
    grid: persistedDataGridFiltersFromUnknown(value.grid),
  };
}

function validateExternalFilters(
  filters: PersistedApprovalsExternalFilters,
  {
    appliesToOptionValues,
    neededForRoleOptionValues,
  }: Pick<
    UseApprovalsFilterPreferencesOptions,
    'appliesToOptionValues' | 'neededForRoleOptionValues'
  >
): PersistedApprovalsExternalFilters {
  return {
    appliesToFilter:
      filters.appliesToFilter === 'all' ||
      appliesToOptionValues.includes(filters.appliesToFilter)
        ? filters.appliesToFilter
        : 'all',
    roleFilter:
      filters.roleFilter === 'all' ||
      neededForRoleOptionValues.includes(filters.roleFilter)
        ? filters.roleFilter
        : 'all',
    statusFilter: statusFilterFromUnknown(filters.statusFilter),
  };
}

function externalFiltersAreDefault(filters: PersistedApprovalsExternalFilters) {
  return isSameJsonValue(filters, defaultExternalFilters);
}

function persistedGridFiltersAreEmpty(filters: PersistedDataGridFilters) {
  return filters.items.length === 0;
}

function hasExternalSearch(searchText: string) {
  return searchText.trim().length > 0;
}

function gridFilterItemValueIsAllowed(
  item: PersistedGridFilterItem,
  neededForRoleOptionValues: string[]
) {
  if (item.field !== 'neededForRoles') {
    return true;
  }

  const value = item.value;
  if (typeof value === 'string') {
    return neededForRoleOptionValues.includes(value);
  }

  if (Array.isArray(value)) {
    return value.every(
      (entry: JsonSafeValue) =>
        typeof entry === 'string' &&
        neededForRoleOptionValues.includes(entry)
    );
  }

  return false;
}

export function useApprovalsFilterPreferences({
  appliesToOptionValues,
  columns,
  neededForRoleOptionValues,
  scope,
}: UseApprovalsFilterPreferencesOptions) {
  const {
    canPersistPreferences,
    clearPreferences,
    preferencesLoaded,
    savedPreferences,
    savePreferences,
    storageKey,
  } = useScopedFilterPreferences({
    namespace: 'approvals-filter-preferences',
    parsePreferences: preferencesFromUnknown,
    scope,
    version: approvalsFilterPreferencesVersion,
  });
  const [keyedFilterState, setKeyedFilterState] =
    useState<KeyedApprovalsFilterState>(() => ({
      state: defaultApprovalsFilterState,
      storageKey,
    }));
  const filterState =
    keyedFilterState.storageKey === storageKey
      ? keyedFilterState.state
      : defaultApprovalsFilterState;
  const restoredFilterPreferenceStorageKey = useRef<string | null>(null);
  const lastPersistableGridFilters = useRef<PersistedDataGridFilters>(
    emptyPersistedDataGridFilters
  );
  const normalizedGridFilters = useMemo(
    () =>
      normalizeGridFilterModel(filterState.filterModel, columns, {
        isFilterItemValueAllowed: (item) =>
          gridFilterItemValueIsAllowed(item, neededForRoleOptionValues),
      }),
    [columns, filterState.filterModel, neededForRoleOptionValues]
  );
  const gridFilterHasIncompleteItem = useMemo(
    () => filterModelHasIncompleteItems(filterState.filterModel, columns),
    [columns, filterState.filterModel]
  );
  const externalFilters = useMemo(
    () =>
      validateExternalFilters(
        {
          appliesToFilter: filterState.appliesToFilter,
          roleFilter: filterState.roleFilter,
          statusFilter: filterState.statusFilter,
        },
        { appliesToOptionValues, neededForRoleOptionValues }
      ),
    [
      appliesToOptionValues,
      filterState.appliesToFilter,
      filterState.roleFilter,
      filterState.statusFilter,
      neededForRoleOptionValues,
    ]
  );
  const hasStructuredFilters =
    !externalFiltersAreDefault(externalFilters) ||
    !persistedGridFiltersAreEmpty(normalizedGridFilters);
  const hasActiveFilters =
    hasStructuredFilters ||
    hasExternalSearch(filterState.searchText) ||
    hasQuickFilterValues(filterState.filterModel);

  useEffect(() => {
    if (
      !storageKey ||
      !preferencesLoaded ||
      restoredFilterPreferenceStorageKey.current === storageKey
    ) {
      return;
    }

    const restoredExternalFilters = validateExternalFilters(
      savedPreferences?.external ?? defaultExternalFilters,
      { appliesToOptionValues, neededForRoleOptionValues }
    );
    const restoredGridFilters = normalizeGridFilterModel(
      filterModelFromPersistedDataGridFilters(
        savedPreferences?.grid ?? emptyPersistedDataGridFilters
      ),
      columns,
      {
        isFilterItemValueAllowed: (item) =>
          gridFilterItemValueIsAllowed(item, neededForRoleOptionValues),
      }
    );

    restoredFilterPreferenceStorageKey.current = storageKey;
    lastPersistableGridFilters.current = restoredGridFilters;
    setKeyedFilterState({
      state: {
        ...restoredExternalFilters,
        filterModel: filterModelFromPersistedDataGridFilters(
          restoredGridFilters
        ),
        searchText: '',
      },
      storageKey,
    });
  }, [
    appliesToOptionValues,
    columns,
    neededForRoleOptionValues,
    preferencesLoaded,
    savedPreferences,
    storageKey,
  ]);

  useEffect(() => {
    if (
      !canPersistPreferences ||
      !storageKey ||
      !preferencesLoaded ||
      restoredFilterPreferenceStorageKey.current !== storageKey
    ) {
      return;
    }

    const gridFiltersForPersistence = gridFilterHasIncompleteItem
      ? lastPersistableGridFilters.current
      : normalizedGridFilters;

    if (!gridFilterHasIncompleteItem) {
      lastPersistableGridFilters.current = normalizedGridFilters;
    }

    const nextPreference: PersistedApprovalsFilterPreferencesV1 = {
      version: approvalsFilterPreferencesVersion,
      external: externalFilters,
      grid: gridFiltersForPersistence,
    };
    const nextPreferenceIsEmpty =
      externalFiltersAreDefault(nextPreference.external) &&
      persistedGridFiltersAreEmpty(nextPreference.grid);

    if (nextPreferenceIsEmpty) {
      if (savedPreferences) {
        clearPreferences();
      }

      return;
    }

    if (savedPreferences && isSameJsonValue(savedPreferences, nextPreference)) {
      return;
    }

    savePreferences(nextPreference);
  }, [
    canPersistPreferences,
    clearPreferences,
    externalFilters,
    gridFilterHasIncompleteItem,
    normalizedGridFilters,
    preferencesLoaded,
    savePreferences,
    savedPreferences,
    storageKey,
  ]);

  const updateFilterState = useCallback(
    (nextState: Partial<ApprovalsFilterState>) => {
      setKeyedFilterState((previous) => ({
        state: {
          ...(previous.storageKey === storageKey
            ? previous.state
            : defaultApprovalsFilterState),
          ...nextState,
        },
        storageKey,
      }));
    },
    [storageKey]
  );

  const clearFilters = useCallback(() => {
    clearPreferences();
    lastPersistableGridFilters.current = emptyPersistedDataGridFilters;
    setKeyedFilterState({
      state: defaultApprovalsFilterState,
      storageKey,
    });
  }, [clearPreferences, storageKey]);

  return {
    appliesToFilter: filterState.appliesToFilter,
    clearFilters,
    filterModel: filterState.filterModel,
    hasActiveFilters,
    onFilterModelChange: (filterModel: GridFilterModel) =>
      updateFilterState({ filterModel }),
    preferencesLoaded,
    roleFilter: filterState.roleFilter,
    searchText: filterState.searchText,
    setAppliesToFilter: (appliesToFilter: string) =>
      updateFilterState({ appliesToFilter }),
    setRoleFilter: (roleFilter: string) => updateFilterState({ roleFilter }),
    setSearchText: (searchText: string) => updateFilterState({ searchText }),
    setStatusFilter: (statusFilter: ApprovalStatusFilter) =>
      updateFilterState({ statusFilter }),
    statusFilter: filterState.statusFilter,
  };
}

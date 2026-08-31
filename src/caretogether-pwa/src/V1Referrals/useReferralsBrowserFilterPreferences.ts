import { useCallback } from 'react';
import {
  type ScopedFilterPreferenceScope,
  useScopedFilterPreferences,
} from '../Hooks/useScopedFilterPreferences';
import type { ReferralStatusFilter } from './referralStatusFilter';
import type {
  ReferralAssignmentGridFilter,
  ReferralsGridFilterLogicOperator,
} from './referralsGridFilterAdapter';

export type ReferralsBrowserFilterPreferencesV1 = {
  version: 1;
  assignmentFilterLogicOperator: ReferralsGridFilterLogicOperator;
  assignmentFilters: ReferralAssignmentGridFilter[];
  countyFilter: (string | null)[];
  statusFilter: ReferralStatusFilter;
};

type ValidationOptions = {
  assignmentRoles?: string[];
  counties?: (string | null)[];
};

const referralsFilterPreferencesVersion = 1 as const;
const defaultReferralsFilterPreferences: ReferralsBrowserFilterPreferencesV1 = {
  version: referralsFilterPreferencesVersion,
  assignmentFilterLogicOperator: 'and',
  assignmentFilters: [],
  countyFilter: [],
  statusFilter: 'ALL',
};
const supportedAssignmentFilterOperators = new Set([
  'contains',
  'doesNotContain',
  'equals',
  'doesNotEqual',
  'startsWith',
  'endsWith',
  'isEmpty',
  'isNotEmpty',
  'isAnyOf',
]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function normalizeUnknownReferralStatusFilter(
  value: unknown
): ReferralStatusFilter {
  switch (value) {
    case 'OPEN':
    case 'ACCEPTED':
    case 'CLOSED':
      return value;

    default:
      return 'ALL';
  }
}

function normalizeUnknownLogicOperator(
  value: unknown
): ReferralsGridFilterLogicOperator {
  return value === 'or' ? 'or' : 'and';
}

function stringOrNullArray(value: unknown): (string | null)[] {
  return Array.isArray(value)
    ? value.filter(
        (item): item is string | null =>
          typeof item === 'string' || item === null
      )
    : [];
}

function jsonSafeGridFilterValue(value: unknown) {
  if (
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'boolean' ||
    value === null
  ) {
    return value;
  }

  return Array.isArray(value)
    ? value.filter(
        (item) =>
          typeof item === 'string' ||
          typeof item === 'number' ||
          typeof item === 'boolean' ||
          item === null
      )
    : undefined;
}

function assignmentFiltersFromUnknown(
  value: unknown
): ReferralAssignmentGridFilter[] {
  if (!Array.isArray(value)) return [];

  return value.flatMap((item) => {
    if (
      !isRecord(item) ||
      typeof item.assignmentRole !== 'string' ||
      typeof item.operator !== 'string'
    ) {
      return [];
    }

    return [
      {
        assignmentRole: item.assignmentRole,
        ...(typeof item.id === 'string' || typeof item.id === 'number'
          ? { id: item.id }
          : {}),
        operator: item.operator,
        value: jsonSafeGridFilterValue(item.value),
      },
    ];
  });
}

function preferencesFromUnknown(
  value: unknown
): ReferralsBrowserFilterPreferencesV1 | null {
  if (!isRecord(value) || value.version !== referralsFilterPreferencesVersion) {
    return null;
  }

  return {
    version: referralsFilterPreferencesVersion,
    assignmentFilterLogicOperator: normalizeUnknownLogicOperator(
      value.assignmentFilterLogicOperator
    ),
    assignmentFilters: assignmentFiltersFromUnknown(value.assignmentFilters),
    countyFilter: stringOrNullArray(value.countyFilter),
    statusFilter: normalizeUnknownReferralStatusFilter(value.statusFilter),
  };
}

function filterByValidCountyValues(
  selectedValues: (string | null)[],
  validValues: (string | null)[] | undefined
) {
  if (!validValues) return selectedValues;

  const validValueSet = new Set(validValues);
  return selectedValues.filter((value) => validValueSet.has(value));
}

function hasActiveAssignmentFilter(
  assignmentFilter: ReferralAssignmentGridFilter
) {
  switch (assignmentFilter.operator) {
    case 'isEmpty':
    case 'isNotEmpty':
      return true;
    case 'isAnyOf':
      return (
        Array.isArray(assignmentFilter.value) &&
        assignmentFilter.value.length > 0
      );
    default:
      return String(assignmentFilter.value ?? '').trim() !== '';
  }
}

export function sanitizeReferralsBrowserFilterPreferences(
  preferences: ReferralsBrowserFilterPreferencesV1,
  { assignmentRoles, counties }: ValidationOptions = {}
): ReferralsBrowserFilterPreferencesV1 {
  const validAssignmentRoles = new Set(assignmentRoles);
  const assignmentFilters = preferences.assignmentFilters.filter(
    (assignmentFilter) =>
      supportedAssignmentFilterOperators.has(assignmentFilter.operator) &&
      (!assignmentRoles ||
        validAssignmentRoles.has(assignmentFilter.assignmentRole)) &&
      hasActiveAssignmentFilter(assignmentFilter)
  );

  return {
    version: referralsFilterPreferencesVersion,
    assignmentFilterLogicOperator: normalizeUnknownLogicOperator(
      preferences.assignmentFilterLogicOperator
    ),
    assignmentFilters,
    countyFilter: filterByValidCountyValues(preferences.countyFilter, counties),
    statusFilter: normalizeUnknownReferralStatusFilter(
      preferences.statusFilter
    ),
  };
}

export function defaultReferralsBrowserFilterState() {
  return defaultReferralsFilterPreferences;
}

export function useReferralsBrowserFilterPreferences(
  scope: ScopedFilterPreferenceScope
) {
  const {
    canPersistPreferences,
    clearPreferences,
    preferencesLoaded,
    savedPreferences,
    savePreferences,
    storageKey,
  } = useScopedFilterPreferences({
    namespace: 'referrals-filter-preferences',
    parsePreferences: preferencesFromUnknown,
    scope,
    version: referralsFilterPreferencesVersion,
  });

  const saveFilters = useCallback(
    (filters: Omit<ReferralsBrowserFilterPreferencesV1, 'version'>) => {
      savePreferences({
        version: referralsFilterPreferencesVersion,
        ...filters,
      });
    },
    [savePreferences]
  );

  return {
    canPersistFilters: canPersistPreferences,
    clearSavedFilters: clearPreferences,
    defaultFilters: defaultReferralsFilterPreferences,
    preferencesLoaded,
    savedFilters: savedPreferences,
    saveFilters,
    storageKey,
  };
}

import { useCallback } from 'react';
import type { CustomField } from '../GeneratedClient';
import type { AssignmentFilterSelectionsByRole } from '../FunctionAssignments/assignmentRoleColumns';
import type {
  CustomFieldFilterSelectionsByField,
  CustomFieldFilterValue,
} from '../Generic/CustomFieldsFilter/types';
import {
  type ScopedFilterPreferenceScope,
  useScopedFilterPreferences,
} from '../Hooks/useScopedFilterPreferences';
import {
  normalizePartneringFamiliesSortMode,
  type PartneringFamiliesSortMode,
} from './PartneringFamilies/sortPartneringFamilies';
import {
  type ArrangementsFilter,
  normalizeArrangementsFilter,
} from './PartneringFamilies/types';

export type ClientsBrowserFilterPreferencesV1 = {
  version: 1;
  arrangementsFilter: ArrangementsFilter;
  assignmentFilters: AssignmentFilterSelectionsByRole;
  countyFilter: (string | null)[];
  customFieldFilters: CustomFieldFilterSelectionsByField;
  sortMode: PartneringFamiliesSortMode;
};

type ValidationOptions = {
  assignmentRoles?: string[];
  assignmentValuesByRole?: Record<string, (string | null)[]>;
  counties?: string[];
  customFields?: CustomField[];
  customFieldValueOptionsByField?: Record<string, CustomFieldFilterValue[]>;
};

const clientsFilterPreferencesVersion = 1 as const;
const defaultClientsFilterPreferences: ClientsBrowserFilterPreferencesV1 = {
  version: clientsFilterPreferencesVersion,
  arrangementsFilter: 'All',
  assignmentFilters: {},
  countyFilter: [],
  customFieldFilters: {},
  sortMode: 'lastNameAsc',
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isCustomFieldFilterValue(
  value: unknown
): value is CustomFieldFilterValue {
  return (
    typeof value === 'string' || typeof value === 'boolean' || value === null
  );
}

function normalizeUnknownArrangementsFilter(value: unknown) {
  return typeof value === 'string'
    ? normalizeArrangementsFilter(value as ArrangementsFilter)
    : 'All';
}

function normalizeUnknownSortMode(value: unknown) {
  return typeof value === 'string'
    ? normalizePartneringFamiliesSortMode(value)
    : 'lastNameAsc';
}

function stringOrNullArray(value: unknown): (string | null)[] {
  return Array.isArray(value)
    ? value.filter(
        (item): item is string | null =>
          typeof item === 'string' || item === null
      )
    : [];
}

function assignmentFiltersFromUnknown(
  value: unknown
): AssignmentFilterSelectionsByRole {
  if (!isRecord(value)) return {};

  return Object.fromEntries(
    Object.entries(value).flatMap(([assignmentRole, selectedValues]) => {
      const values = stringOrNullArray(selectedValues);
      return values.length > 0 ? [[assignmentRole, values]] : [];
    })
  );
}

function customFieldFiltersFromUnknown(
  value: unknown
): CustomFieldFilterSelectionsByField {
  if (!isRecord(value)) return {};

  return Object.fromEntries(
    Object.entries(value).flatMap(([fieldName, selectedValues]) => {
      const values = Array.isArray(selectedValues)
        ? selectedValues.filter(isCustomFieldFilterValue)
        : [];
      return values.length > 0 ? [[fieldName, values]] : [];
    })
  );
}

function preferencesFromUnknown(
  value: unknown
): ClientsBrowserFilterPreferencesV1 | null {
  if (!isRecord(value) || value.version !== clientsFilterPreferencesVersion) {
    return null;
  }

  return {
    version: clientsFilterPreferencesVersion,
    arrangementsFilter: normalizeUnknownArrangementsFilter(
      value.arrangementsFilter
    ),
    assignmentFilters: assignmentFiltersFromUnknown(value.assignmentFilters),
    countyFilter: stringOrNullArray(value.countyFilter),
    customFieldFilters: customFieldFiltersFromUnknown(value.customFieldFilters),
    sortMode: normalizeUnknownSortMode(value.sortMode),
  };
}

function filterByValidStrings(
  selectedValues: string[],
  validValues: string[] | undefined
) {
  if (!validValues) return selectedValues;

  const validValueSet = new Set(validValues);
  return selectedValues.filter((value) => validValueSet.has(value));
}

function filterByValidCustomFieldValues(
  selectedValues: CustomFieldFilterValue[],
  validValues: CustomFieldFilterValue[] | undefined
) {
  if (!validValues) return selectedValues;

  const validValueSet = new Set(validValues);
  return selectedValues.filter((value) => validValueSet.has(value));
}

export function sanitizeClientsBrowserFilterPreferences(
  preferences: ClientsBrowserFilterPreferencesV1,
  {
    assignmentRoles,
    assignmentValuesByRole,
    counties,
    customFields,
    customFieldValueOptionsByField,
  }: ValidationOptions = {}
): ClientsBrowserFilterPreferencesV1 {
  const validCountyFilter = preferences.countyFilter.filter(
    (county) =>
      county === null ||
      filterByValidStrings([county], counties).length === 1
  );
  const validAssignmentRoles = new Set(assignmentRoles);
  const assignmentFilters =
    assignmentRoles
      ? Object.fromEntries(
          Object.entries(preferences.assignmentFilters).flatMap(
            ([assignmentRole, selectedValues]) =>
              validAssignmentRoles.has(assignmentRole) &&
              selectedValues.length > 0
                ? [
                    [
                      assignmentRole,
                      filterByValidAssignmentValues(
                        selectedValues,
                        assignmentValuesByRole?.[assignmentRole]
                      ),
                    ],
                  ]
                : []
          )
          .filter(
            (entry): entry is [string, (string | null)[]] =>
              entry.length > 0 && entry[1].length > 0
          )
        )
      : preferences.assignmentFilters;
  const validCustomFieldsByName = new Map(
    customFields?.map((customField) => [customField.name, customField])
  );
  const customFieldFilters =
    customFields
      ? Object.fromEntries(
          Object.entries(preferences.customFieldFilters).flatMap(
            ([fieldName, selectedValues]) => {
              const field = validCustomFieldsByName.get(fieldName);

              if (!field) return [];

              const filteredValues = filterByValidCustomFieldValues(
                selectedValues,
                customFieldValueOptionsByField?.[fieldName]
              );

              return filteredValues.length > 0
                ? [[fieldName, filteredValues]]
                : [];
            }
          )
        )
      : preferences.customFieldFilters;

  return {
    version: clientsFilterPreferencesVersion,
    arrangementsFilter: normalizeArrangementsFilter(
      preferences.arrangementsFilter
    ),
    assignmentFilters,
    countyFilter: validCountyFilter,
    customFieldFilters,
    sortMode: normalizePartneringFamiliesSortMode(preferences.sortMode),
  };
}

function filterByValidAssignmentValues(
  selectedValues: (string | null)[],
  validValues: (string | null)[] | undefined
) {
  if (!validValues) return selectedValues;

  const validValueSet = new Set(validValues);
  return selectedValues.filter((value) => validValueSet.has(value));
}

export function defaultClientsBrowserFilterState() {
  return defaultClientsFilterPreferences;
}

export function useClientsBrowserFilterPreferences(
  scope: ScopedFilterPreferenceScope
) {
  const {
    canPersistPreferences,
    clearPreferences,
    hasSavedPreferences,
    preferencesLoaded,
    savedPreferences,
    savePreferences,
    storageKey,
  } = useScopedFilterPreferences({
    namespace: 'clients-filter-preferences',
    parsePreferences: preferencesFromUnknown,
    scope,
    version: clientsFilterPreferencesVersion,
  });

  const saveFilters = useCallback(
    (filters: Omit<ClientsBrowserFilterPreferencesV1, 'version'>) => {
      const preferences: ClientsBrowserFilterPreferencesV1 = {
        version: clientsFilterPreferencesVersion,
        ...filters,
      };

      savePreferences(preferences);
    },
    [savePreferences]
  );

  return {
    canPersistFilters: canPersistPreferences,
    clearSavedFilters: clearPreferences,
    defaultFilters: defaultClientsFilterPreferences,
    hasSavedFilters: hasSavedPreferences,
    preferencesLoaded,
    savedFilters: savedPreferences,
    saveFilters,
    storageKey,
  };
}

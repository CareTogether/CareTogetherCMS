import { useCallback } from 'react';
import type { CustomField } from '../GeneratedClient';
import type {
  CustomFieldFilterSelectionsByField,
  CustomFieldFilterValue,
} from '../Generic/CustomFieldsFilter/types';
import {
  type ScopedFilterPreferenceScope,
  useScopedFilterPreferences,
} from '../Hooks/useScopedFilterPreferences';
import type {
  AssignmentFilterSelectionsByArrangementType,
  AssignmentFilterValue,
} from './VolunteerApprovalTab/assignmentFilters';
import type { RequirementFilterValue } from './VolunteerApprovalTab/volunteerMissingRequirementsPresentation';

export type VolunteersBrowserFilterPreferencesV1 = {
  version: 1;
  assignmentFilters: AssignmentFilterSelectionsByArrangementType;
  customFieldFilters: CustomFieldFilterSelectionsByField;
  requirementFilter?: RequirementFilterValue;
  roleFilterValues: string[];
  statusFilterValues: string[];
};

type ValidationOptions = {
  arrangementTypes?: string[];
  customFields?: CustomField[];
  customFieldValueOptionsByField?: Record<string, CustomFieldFilterValue[]>;
  requirementFilterOptions?: string[];
  roleFilterValues?: string[];
  statusFilterValues?: string[];
};

const volunteersFilterPreferencesVersion = 1 as const;
const defaultVolunteersFilterPreferences: VolunteersBrowserFilterPreferencesV1 =
  {
    version: volunteersFilterPreferencesVersion,
    assignmentFilters: {},
    customFieldFilters: {},
    roleFilterValues: [],
    statusFilterValues: [],
  };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isAssignmentFilterValue(
  value: unknown
): value is AssignmentFilterValue {
  return value === 'assigned' || value === 'unassigned';
}

function isCustomFieldFilterValue(
  value: unknown
): value is CustomFieldFilterValue {
  return (
    typeof value === 'string' || typeof value === 'boolean' || value === null
  );
}

function stringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === 'string')
    : [];
}

function assignmentFiltersFromUnknown(
  value: unknown
): AssignmentFilterSelectionsByArrangementType {
  if (!isRecord(value)) return {};

  return Object.fromEntries(
    Object.entries(value).flatMap(([arrangementType, selectedValues]) => {
      const values = Array.isArray(selectedValues)
        ? selectedValues.filter(isAssignmentFilterValue)
        : [];

      return values.length > 0 ? [[arrangementType, values]] : [];
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
): VolunteersBrowserFilterPreferencesV1 | null {
  if (!isRecord(value) || value.version !== volunteersFilterPreferencesVersion) {
    return null;
  }

  return {
    version: volunteersFilterPreferencesVersion,
    assignmentFilters: assignmentFiltersFromUnknown(value.assignmentFilters),
    customFieldFilters: customFieldFiltersFromUnknown(value.customFieldFilters),
    requirementFilter:
      typeof value.requirementFilter === 'string'
        ? value.requirementFilter
        : undefined,
    roleFilterValues: stringArray(value.roleFilterValues),
    statusFilterValues: stringArray(value.statusFilterValues),
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

export function sanitizeVolunteersBrowserFilterPreferences(
  preferences: VolunteersBrowserFilterPreferencesV1,
  {
    arrangementTypes,
    customFields,
    customFieldValueOptionsByField,
    requirementFilterOptions,
    roleFilterValues,
    statusFilterValues,
  }: ValidationOptions = {}
): VolunteersBrowserFilterPreferencesV1 {
  const validArrangementTypes = new Set(arrangementTypes);
  const assignmentFilters = arrangementTypes
    ? Object.fromEntries(
        Object.entries(preferences.assignmentFilters).flatMap(
          ([arrangementType, selectedValues]) =>
            validArrangementTypes.has(arrangementType) &&
            selectedValues.length > 0
              ? [[arrangementType, selectedValues]]
              : []
        )
      )
    : preferences.assignmentFilters;
  const validCustomFieldsByName = new Map(
    customFields?.map((customField) => [customField.name, customField])
  );
  const customFieldFilters = customFields
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
  const requirementFilter =
    preferences.requirementFilter &&
    filterByValidStrings(
      [preferences.requirementFilter],
      requirementFilterOptions
    ).length === 1
      ? preferences.requirementFilter
      : undefined;

  return {
    version: volunteersFilterPreferencesVersion,
    assignmentFilters,
    customFieldFilters,
    ...(requirementFilter ? { requirementFilter } : {}),
    roleFilterValues: filterByValidStrings(
      preferences.roleFilterValues,
      roleFilterValues
    ),
    statusFilterValues: filterByValidStrings(
      preferences.statusFilterValues,
      statusFilterValues
    ),
  };
}

export function defaultVolunteersBrowserFilterState() {
  return defaultVolunteersFilterPreferences;
}

export function useVolunteersBrowserFilterPreferences(
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
    namespace: 'volunteers-filter-preferences',
    parsePreferences: preferencesFromUnknown,
    scope,
    version: volunteersFilterPreferencesVersion,
  });

  const saveFilters = useCallback(
    (filters: Omit<VolunteersBrowserFilterPreferencesV1, 'version'>) => {
      savePreferences({
        version: volunteersFilterPreferencesVersion,
        ...filters,
      });
    },
    [savePreferences]
  );

  return {
    canPersistFilters: canPersistPreferences,
    clearSavedFilters: clearPreferences,
    defaultFilters: defaultVolunteersFilterPreferences,
    preferencesLoaded,
    savedFilters: savedPreferences,
    saveFilters,
    storageKey,
  };
}

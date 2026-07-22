import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRecoilState, useRecoilValue } from 'recoil';
import { CombinedFamilyInfo, CustomField } from '../GeneratedClient';
import { familyNameString } from '../Families/FamilyName';
import {
  FamilyNameSortMode,
  filterFamiliesByText,
  normalizeFamilyNameSortMode,
  sortFamiliesByName,
} from '../Families/FamilyUtils';
import { personNameString } from '../Families/PersonName';
import { matchesCustomFieldFilters } from '../Generic/CustomFieldsFilter/matchesCustomFieldFilters';
import {
  CustomFieldFilterOption,
  CustomFieldFilterSelectionsByField,
  CustomFieldFilterValue,
} from '../Generic/CustomFieldsFilter/types';
import { useCustomFieldFilters } from '../Generic/CustomFieldsFilter/useCustomFieldFilters';
import { useLocalStorage } from '../Hooks/useLocalStorage';
import { useLoadable } from '../Hooks/useLoadable';
import {
  allApprovalAndOnboardingRequirementsData,
  policyData,
} from '../Model/ConfigurationModel';
import { volunteerFamiliesData } from '../Model/VolunteersModel';
import {
  AssignmentFilterSelectionsByArrangementType,
  AssignmentFilterValue,
  matchesAssignmentFilters,
} from './VolunteerApprovalTab/assignmentFilters';
import { filterOption } from './VolunteerApprovalTab/filterOption';
import { getOptionValueFromSelection } from './VolunteerApprovalTab/getOptionValueFromSelection';
import { getUpdatedFilters } from './VolunteerApprovalTab/getUpdatedFilters';
import { roleFiltersState } from './VolunteerApprovalTab/roleFiltersState';
import { statusFiltersState } from './VolunteerApprovalTab/statusFiltersState';
import {
  buildVolunteerApprovalRolesPresentation,
  VolunteerApprovalRolesPresentation,
} from './VolunteerApprovalTab/volunteerApprovalRolePresentation';
import { familyOrFamilyMembersMeetRoleStatusFilterCriteria } from './VolunteerApprovalTab/volunteerApprovalRoleStatusFilters';
import {
  buildVolunteerMissingRequirementGroups,
  familyHasMissingRequirements,
  RequirementFilterValue,
  VolunteerMissingRequirementGroup,
} from './VolunteerApprovalTab/volunteerMissingRequirementsPresentation';

const VOLUNTEER_APPROVAL_SORT_STORAGE_KEY = 'volunteer-approval-sortMode';
const DEFAULT_VOLUNTEER_APPROVAL_SORT_MODE =
  normalizeFamilyNameSortMode(undefined);

export type VolunteerBrowserRowV2 = {
  customFieldValues: Record<string, unknown>;
  id: string;
  family: string;
  missingRequirementGroups: VolunteerMissingRequirementGroup[];
  primaryContact: string;
  roles: VolunteerApprovalRolesPresentation;
  sourceFamily: CombinedFamilyInfo;
};

type VolunteersBrowserViewModel = {
  activeAssignmentFilterCount: number;
  activeCustomFieldFilterCount: number;
  arrangementTypes: string[];
  assignmentFilters: AssignmentFilterSelectionsByArrangementType;
  customFieldCount: number;
  customFieldFilterOptionsByField: Record<string, CustomFieldFilterOption[]>;
  customFieldFilters: CustomFieldFilterSelectionsByField;
  customFields: CustomField[];
  empty: boolean;
  loading: boolean;
  requirementFilter: RequirementFilterValue | undefined;
  requirementFilterOptions: string[];
  roleFilters: filterOption[];
  rows: VolunteerBrowserRowV2[];
  searchValue: string;
  setAssignmentFilter: (
    arrangementType: string,
    selectedValues: AssignmentFilterValue[]
  ) => void;
  setCustomFieldFilter: (
    fieldName: string,
    selectedValues: CustomFieldFilterValue[]
  ) => void;
  setRequirementFilter: (value: RequirementFilterValue | undefined) => void;
  setRoleFilterSelection: (selection: string | string[]) => void;
  setSearchValue: (value: string) => void;
  setSortMode: (value: FamilyNameSortMode) => void;
  setStatusFilterSelection: (selection: string | string[]) => void;
  sortMode: FamilyNameSortMode;
  statusFilters: filterOption[];
  totalVolunteerFamilies: number;
  visibleVolunteerFamilies: CombinedFamilyInfo[];
};

type CustomFieldValuesByFamily = Map<CombinedFamilyInfo, Record<string, unknown>>;

function primaryContactName(family: CombinedFamilyInfo) {
  const primaryContact = family.family?.adults?.find(
    (adult) => adult.item1?.id === family.family?.primaryFamilyContactPersonId
  )?.item1;

  return primaryContact ? personNameString(primaryContact) : '';
}

function customFieldValuesForFamily(
  family: CombinedFamilyInfo,
  customFields: CustomField[],
  customFieldValuesByFamily: CustomFieldValuesByFamily
) {
  const valuesByName = customFieldValuesByFamily.get(family) ?? {};

  return Object.fromEntries(
    customFields.map((field) => [field.name, valuesByName[field.name]])
  );
}

function toVolunteerBrowserRow(
  family: CombinedFamilyInfo,
  customFields: CustomField[],
  roleFilters: filterOption[],
  customFieldValuesByFamily: CustomFieldValuesByFamily
) {
  return {
    customFieldValues: customFieldValuesForFamily(
      family,
      customFields,
      customFieldValuesByFamily
    ),
    id: family.family!.id!,
    family: familyNameString(family),
    missingRequirementGroups: buildVolunteerMissingRequirementGroups(
      family,
      roleFilters
    ),
    primaryContact: primaryContactName(family),
    roles: buildVolunteerApprovalRolesPresentation(family, roleFilters),
    sourceFamily: family,
  };
}

function volunteerCustomFields(
  policyCustomFields: CustomField[] | undefined,
  volunteerCustomFields: CustomField[] | undefined
) {
  return (policyCustomFields ?? []).concat(volunteerCustomFields ?? []);
}

function buildCustomFieldValuesByFamily(volunteerFamilies: CombinedFamilyInfo[]) {
  return new Map(
    volunteerFamilies.map((family) => [
      family,
      customFieldValuesByName(family),
    ])
  );
}

function customFieldValuesByName(family: CombinedFamilyInfo) {
  const valuesByName: Record<string, unknown> = {};

  family.volunteerFamilyInfo?.completedCustomFields?.forEach((customField) => {
    valuesByName[customField.customFieldName] = customField.value;
  });
  family.family?.completedCustomFields?.forEach((customField) => {
    if (customField.value === undefined || customField.value === null) {
      return;
    }

    valuesByName[customField.customFieldName] = customField.value;
  });

  return valuesByName;
}

function customFieldValueFromLookup(
  customFieldValuesByFamily: CustomFieldValuesByFamily,
  family: CombinedFamilyInfo,
  fieldName: string
) {
  return customFieldValuesByFamily.get(family)?.[fieldName];
}

function customFieldIsBlank(value: unknown) {
  return value === undefined || value === null;
}

function sourceVolunteerFamilies(
  volunteerFamilies: CombinedFamilyInfo[] | null | undefined
) {
  return volunteerFamilies ?? [];
}

function applySearchStage(
  volunteerFamilies: CombinedFamilyInfo[],
  searchValue: string
) {
  return filterFamiliesByText(volunteerFamilies, searchValue);
}

function applyFilterStage(
  volunteerFamilies: CombinedFamilyInfo[],
  roleFilters: filterOption[],
  statusFilters: filterOption[],
  assignmentFilters: AssignmentFilterSelectionsByArrangementType,
  customFields: CustomField[],
  customFieldFilters: CustomFieldFilterSelectionsByField,
  customFieldValuesByFamily: CustomFieldValuesByFamily,
  requirementFilter: RequirementFilterValue | undefined
) {
  return volunteerFamilies.filter(
    (family) =>
      familyOrFamilyMembersMeetRoleStatusFilterCriteria(
        family,
        roleFilters,
        statusFilters
      ) &&
      familyHasMissingRequirements(
        family,
        roleFilters,
        requirementFilter
      ) &&
      matchesAssignmentFilters(family, assignmentFilters) &&
      matchesCustomFieldFilters({
        item: family,
        customFields,
        selectedValuesByField: customFieldFilters,
        isBlank: (item, fieldName) =>
          customFieldIsBlank(
            customFieldValueFromLookup(
              customFieldValuesByFamily,
              item,
              fieldName
            )
          ),
        getValue: (item, fieldName) =>
          customFieldValueFromLookup(
            customFieldValuesByFamily,
            item,
            fieldName
          ),
      })
  );
}

function applySortStage(
  volunteerFamilies: CombinedFamilyInfo[],
  sortMode: FamilyNameSortMode
) {
  return sortFamiliesByName(volunteerFamilies, sortMode);
}

function mapRows(
  volunteerFamilies: CombinedFamilyInfo[],
  customFields: CustomField[],
  roleFilters: filterOption[],
  customFieldValuesByFamily: CustomFieldValuesByFamily
) {
  return volunteerFamilies.map((family) =>
    toVolunteerBrowserRow(
      family,
      customFields,
      roleFilters,
      customFieldValuesByFamily
    )
  );
}

export function useVolunteersBrowserViewModel(): VolunteersBrowserViewModel {
  const volunteerFamilies = useLoadable(volunteerFamiliesData);
  const requirementNames = useLoadable(allApprovalAndOnboardingRequirementsData);
  const policy = useRecoilValue(policyData);
  const [roleFilters, setRoleFilters] = useRecoilState(roleFiltersState);
  const [statusFilters, setStatusFilters] = useRecoilState(statusFiltersState);
  const [assignmentFilters, setAssignmentFilters] =
    useState<AssignmentFilterSelectionsByArrangementType>({});
  const [searchValue, setSearchValue] = useState('');
  const [requirementFilter, setRequirementFilter] =
    useState<RequirementFilterValue | undefined>();
  const [storedSortMode, setStoredSortMode] =
    useLocalStorage<FamilyNameSortMode>(
      VOLUNTEER_APPROVAL_SORT_STORAGE_KEY,
      DEFAULT_VOLUNTEER_APPROVAL_SORT_MODE
    );
  const sortMode = normalizeFamilyNameSortMode(storedSortMode);
  const loading = volunteerFamilies == null;
  const sourceFamilies = sourceVolunteerFamilies(volunteerFamilies);
  const arrangementTypes = useMemo(
    () =>
      Array.from(
        new Set(
          (policy.referralPolicy?.arrangementPolicies ?? [])
            .map((arrangementPolicy) => arrangementPolicy.arrangementType)
            .filter(
              (arrangementType): arrangementType is string => !!arrangementType
            )
        )
      ),
    [policy.referralPolicy?.arrangementPolicies]
  );
  const activeAssignmentFilterCount = Object.values(assignmentFilters).filter(
    (selectedValues) => selectedValues.length > 0
  ).length;
  const customFields = useMemo(
    () =>
      volunteerCustomFields(
        policy.customFamilyFields,
        policy.volunteerPolicy?.customFields
      ),
    [policy.customFamilyFields, policy.volunteerPolicy?.customFields]
  );
  const customFieldValuesByFamily = useMemo(
    () => buildCustomFieldValuesByFamily(sourceFamilies),
    [sourceFamilies]
  );
  const getCustomFieldValue = useCallback(
    (family: CombinedFamilyInfo, fieldName: string) =>
      customFieldValueFromLookup(customFieldValuesByFamily, family, fieldName),
    [customFieldValuesByFamily]
  );
  const isCustomFieldBlank = useCallback(
    (family: CombinedFamilyInfo, fieldName: string) =>
      customFieldIsBlank(getCustomFieldValue(family, fieldName)),
    [getCustomFieldValue]
  );
  const {
    selectedValuesByField: customFieldFilters,
    setSelectedValuesForField: setCustomFieldFilter,
    optionsByField: customFieldFilterOptionsByField,
  } = useCustomFieldFilters({
    customFields,
    items: sourceFamilies,
    isBlank: isCustomFieldBlank,
    getValue: getCustomFieldValue,
  });
  const customFieldCount = customFields.length;
  const activeCustomFieldFilterCount = Object.values(
    customFieldFilters
  ).filter((selectedValues) => selectedValues.length > 0).length;

  useEffect(() => {
    setAssignmentFilters((currentFilters) => {
      const validFilters = Object.fromEntries(
        Object.entries(currentFilters).filter(([arrangementType]) =>
          arrangementTypes.includes(arrangementType)
        )
      );

      return Object.keys(validFilters).length ===
        Object.keys(currentFilters).length
        ? currentFilters
        : validFilters;
    });
  }, [arrangementTypes]);

  function setSortMode(value: FamilyNameSortMode) {
    setStoredSortMode(value);
  }

  function setAssignmentFilter(
    arrangementType: string,
    selectedValues: AssignmentFilterValue[]
  ) {
    setAssignmentFilters((previous) => ({
      ...previous,
      [arrangementType]: selectedValues,
    }));
  }

  function setRoleFilterSelection(selection: string | string[]) {
    const filterOptionToUpdate = roleFilters.find(
      (filter) => filter.value === getOptionValueFromSelection(selection)
    );

    if (!filterOptionToUpdate) {
      return;
    }

    setRoleFilters(getUpdatedFilters(roleFilters, filterOptionToUpdate));
  }

  function setStatusFilterSelection(selection: string | string[]) {
    const filterOptionToUpdate = statusFilters.find(
      (filter) => filter.value === getOptionValueFromSelection(selection)
    );

    if (!filterOptionToUpdate) {
      return;
    }

    setStatusFilters(getUpdatedFilters(statusFilters, filterOptionToUpdate));
  }

  const visibleVolunteerFamilies = useMemo(() => {
    const searchedFamilies = applySearchStage(sourceFamilies, searchValue);
    const filteredFamilies = applyFilterStage(
      searchedFamilies,
      roleFilters,
      statusFilters,
      assignmentFilters,
      customFields,
      customFieldFilters,
      customFieldValuesByFamily,
      requirementFilter
    );

    return applySortStage(filteredFamilies, sortMode);
  }, [
    assignmentFilters,
    customFieldFilters,
    customFieldValuesByFamily,
    customFields,
    requirementFilter,
    roleFilters,
    searchValue,
    sortMode,
    sourceFamilies,
    statusFilters,
  ]);
  const rows = useMemo(
    () =>
      mapRows(
        visibleVolunteerFamilies,
        customFields,
        roleFilters,
        customFieldValuesByFamily
      ),
    [
      customFieldValuesByFamily,
      customFields,
      roleFilters,
      visibleVolunteerFamilies,
    ]
  );

  return {
    activeAssignmentFilterCount,
    activeCustomFieldFilterCount,
    arrangementTypes,
    assignmentFilters,
    customFieldCount,
    customFieldFilterOptionsByField,
    customFieldFilters,
    customFields,
    empty: !loading && rows.length === 0,
    loading,
    requirementFilter,
    requirementFilterOptions: requirementNames ?? [],
    roleFilters,
    rows,
    searchValue,
    setAssignmentFilter,
    setCustomFieldFilter,
    setRequirementFilter,
    setRoleFilterSelection,
    setSearchValue,
    setSortMode,
    setStatusFilterSelection,
    sortMode,
    statusFilters,
    totalVolunteerFamilies: sourceFamilies.length,
    visibleVolunteerFamilies,
  };
}

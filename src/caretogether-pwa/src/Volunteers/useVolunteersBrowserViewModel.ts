import {
  type Dispatch,
  type SetStateAction,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useRecoilState, useRecoilValue } from 'recoil';
import {
  CombinedFamilyInfo,
  CustomField,
  RoleApprovalStatus,
} from '../GeneratedClient';
import { familyNameString } from '../Families/FamilyName';
import { filterFamiliesByText } from '../Families/FamilyUtils';
import { personNameString } from '../Families/PersonName';
import { matchesCustomFieldFilters } from '../Generic/CustomFieldsFilter/matchesCustomFieldFilters';
import {
  CustomFieldFilterOption,
  CustomFieldFilterSelectionsByField,
  CustomFieldFilterValue,
} from '../Generic/CustomFieldsFilter/types';
import { useCustomFieldFilters } from '../Generic/CustomFieldsFilter/useCustomFieldFilters';
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
import { roleFiltersState } from './VolunteerApprovalTab/roleFiltersState';
import { statusFiltersState } from './VolunteerApprovalTab/statusFiltersState';
import {
  buildVolunteerApprovalRolesPresentation,
  VolunteerApprovalRolesPresentation,
} from './VolunteerApprovalTab/volunteerApprovalRolePresentation';
import { familyOrFamilyMembersMeetRoleStatusFilterCriteria } from './VolunteerApprovalTab/volunteerApprovalRoleStatusFilters';
import {
  buildVolunteerMissingRequirementGroups,
  completeRequirementFilterValue,
  familyHasMissingRequirements,
  missingRequirementFilterValue,
  RequirementFilterValue,
  VolunteerMissingRequirementGroup,
} from './VolunteerApprovalTab/volunteerMissingRequirementsPresentation';

export type VolunteerBrowserRowV2 = {
  customFieldValues: Record<string, unknown>;
  id: string;
  family: string;
  requirementFilterValues: string[];
  missingRequirementGroups: VolunteerMissingRequirementGroup[];
  primaryContact: string;
  roleFilterValues: string[];
  roles: VolunteerApprovalRolesPresentation;
  sourceFamily: CombinedFamilyInfo;
  statusFilterValues: string[];
  statusLabels: string[];
};

type VolunteersBrowserViewModel = {
  activeAssignmentFilterCount: number;
  activeCustomFieldFilterCount: number;
  arrangementTypes: string[];
  assignmentFilters: AssignmentFilterSelectionsByArrangementType;
  customFieldCount: number;
  customFieldFilters: CustomFieldFilterSelectionsByField;
  customFields: CustomField[];
  empty: boolean;
  getCustomFieldFilterOptionsForField: (
    field: CustomField
  ) => CustomFieldFilterOption[];
  loading: boolean;
  requirementFilter: RequirementFilterValue | undefined;
  requirementFilterOptionsLoaded: boolean;
  requirementFilterOptions: string[];
  roleFilters: filterOption[];
  rows: VolunteerBrowserRowV2[];
  searchValue: string;
  setAssignmentFilters: Dispatch<
    SetStateAction<AssignmentFilterSelectionsByArrangementType>
  >;
  setAssignmentFilter: (
    arrangementType: string,
    selectedValues: AssignmentFilterValue[]
  ) => void;
  setCustomFieldFilters: Dispatch<
    SetStateAction<CustomFieldFilterSelectionsByField>
  >;
  setCustomFieldFilter: (
    fieldName: string,
    selectedValues: CustomFieldFilterValue[]
  ) => void;
  setRequirementFilter: Dispatch<
    SetStateAction<RequirementFilterValue | undefined>
  >;
  setRoleFilterValues: (values: string[]) => void;
  setSearchValue: (value: string) => void;
  setStatusFilterValues: (values: string[]) => void;
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

function familyRoleNames(family: CombinedFamilyInfo) {
  return Object.keys(family.volunteerFamilyInfo?.familyRoleApprovals ?? {});
}

function individualRoleNames(family: CombinedFamilyInfo) {
  return Object.values(
    family.volunteerFamilyInfo?.individualVolunteers ?? {}
  ).flatMap((volunteer) =>
    Object.keys(volunteer.approvalStatusByRole ?? {})
  );
}

function roleFilterValuesForFamily(
  family: CombinedFamilyInfo,
  roleFilters: filterOption[]
) {
  const roleNames = new Set(familyRoleNames(family).concat(individualRoleNames(family)));

  return roleFilters
    .filter(
      (roleFilter) =>
        roleFilter.value !== undefined && roleNames.has(roleFilter.key)
    )
    .map((roleFilter) => roleFilter.value!);
}

function statusValue(status: RoleApprovalStatus | null | undefined) {
  return status === null || status === undefined ? '0' : status.toString();
}

function statusFilterValuesForFamily(family: CombinedFamilyInfo) {
  return Array.from(
    new Set(
      Object.values(family.volunteerFamilyInfo?.familyRoleApprovals ?? {})
        .map((approval) => statusValue(approval.currentStatus))
        .concat(
          Object.values(
            family.volunteerFamilyInfo?.individualVolunteers ?? {}
          ).flatMap((volunteer) =>
            Object.values(volunteer.approvalStatusByRole ?? {}).map(
              (approval) => statusValue(approval.currentStatus)
            )
          )
        )
    )
  );
}

function statusLabelsForFamily(
  family: CombinedFamilyInfo,
  statusFilters: filterOption[]
) {
  const statusLabelsByValue = new Map(
    statusFilters
      .filter((statusFilter) => statusFilter.value !== undefined)
      .map((statusFilter) => [statusFilter.value!, statusFilter.key])
  );

  return statusFilterValuesForFamily(family)
    .map((value) => statusLabelsByValue.get(value))
    .filter((label): label is string => Boolean(label));
}

function requirementFilterValuesForGroups(
  missingRequirementGroups: VolunteerMissingRequirementGroup[]
) {
  const missingRequirements = missingRequirementGroups.flatMap(
    (group) => group.requirements
  );

  if (!missingRequirements.length) {
    return [completeRequirementFilterValue];
  }

  return Array.from(new Set([missingRequirementFilterValue, ...missingRequirements]));
}

function toVolunteerBrowserRow(
  family: CombinedFamilyInfo,
  customFields: CustomField[],
  roleFilters: filterOption[],
  statusFilters: filterOption[],
  customFieldValuesByFamily: CustomFieldValuesByFamily
) {
  const missingRequirementGroups = buildVolunteerMissingRequirementGroups(
    family,
    roleFilters
  );

  return {
    customFieldValues: customFieldValuesForFamily(
      family,
      customFields,
      customFieldValuesByFamily
    ),
    id: family.family!.id!,
    family: familyNameString(family),
    requirementFilterValues:
      requirementFilterValuesForGroups(missingRequirementGroups),
    missingRequirementGroups,
    primaryContact: primaryContactName(family),
    roleFilterValues: roleFilterValuesForFamily(family, roleFilters),
    roles: buildVolunteerApprovalRolesPresentation(family, roleFilters),
    sourceFamily: family,
    statusFilterValues: statusFilterValuesForFamily(family),
    statusLabels: statusLabelsForFamily(family, statusFilters),
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

function mapRows(
  volunteerFamilies: CombinedFamilyInfo[],
  customFields: CustomField[],
  roleFilters: filterOption[],
  statusFilters: filterOption[],
  customFieldValuesByFamily: CustomFieldValuesByFamily
) {
  return volunteerFamilies.map((family) =>
    toVolunteerBrowserRow(
      family,
      customFields,
      roleFilters,
      statusFilters,
      customFieldValuesByFamily
    )
  );
}

function withSelectedFilterValues(
  filters: filterOption[],
  selectedValues: string[]
) {
  const selectedValueSet = new Set(selectedValues);

  return filters.map((filter) => ({
    ...filter,
    selected:
      filter.value !== undefined && selectedValueSet.has(filter.value),
  }));
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
    setSelectedValuesByField: setCustomFieldFilters,
    setSelectedValuesForField: setCustomFieldFilter,
    getOptionsForField: getCustomFieldFilterOptionsForField,
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

  const setAssignmentFilter = useCallback((
    arrangementType: string,
    selectedValues: AssignmentFilterValue[]
  ) => {
    setAssignmentFilters((previous) => ({
      ...previous,
      [arrangementType]: selectedValues,
    }));
  }, []);

  const setRoleFilterValues = useCallback(
    (values: string[]) => {
      setRoleFilters((current) => withSelectedFilterValues(current, values));
    },
    [setRoleFilters]
  );

  const setStatusFilterValues = useCallback(
    (values: string[]) => {
      setStatusFilters((current) => withSelectedFilterValues(current, values));
    },
    [setStatusFilters]
  );

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

    return filteredFamilies;
  }, [
    assignmentFilters,
    customFieldFilters,
    customFieldValuesByFamily,
    customFields,
    requirementFilter,
    roleFilters,
    searchValue,
    sourceFamilies,
    statusFilters,
  ]);
  const rows = useMemo(
    () =>
      mapRows(
        visibleVolunteerFamilies,
        customFields,
        roleFilters,
        statusFilters,
        customFieldValuesByFamily
      ),
    [
      customFieldValuesByFamily,
      customFields,
      roleFilters,
      statusFilters,
      visibleVolunteerFamilies,
    ]
  );

  return {
    activeAssignmentFilterCount,
    activeCustomFieldFilterCount,
    arrangementTypes,
    assignmentFilters,
    customFieldCount,
    customFieldFilters,
    customFields,
    empty: !loading && rows.length === 0,
    getCustomFieldFilterOptionsForField,
    loading,
    requirementFilter,
    requirementFilterOptionsLoaded: requirementNames !== null,
    requirementFilterOptions: requirementNames ?? [],
    roleFilters,
    rows,
    searchValue,
    setAssignmentFilters,
    setAssignmentFilter,
    setCustomFieldFilters,
    setCustomFieldFilter,
    setRequirementFilter,
    setRoleFilterValues,
    setSearchValue,
    setStatusFilterValues,
    statusFilters,
    totalVolunteerFamilies: sourceFamilies.length,
    visibleVolunteerFamilies,
  };
}

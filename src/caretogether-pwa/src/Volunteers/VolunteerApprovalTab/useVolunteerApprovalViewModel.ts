import { useMemo } from 'react';
import {
  CombinedFamilyInfo,
  CustomField,
  EffectiveLocationPolicy,
  EmailAddress,
} from '../../GeneratedClient';
import {
  useRoleFilters,
  useStatusFilters,
  usePolicy,
} from '../../Model/PolicyModel';
import { useVolunteerFamilies } from '../../Model/VolunteersModel';
import {
  CustomFieldFilterSelectionsByField,
  CustomFieldFilterValue,
} from '../../Generic/CustomFieldsFilter/types';
import { useCustomFieldFilters } from '../../Generic/CustomFieldsFilter/useCustomFieldFilters';
import { matchesCustomFieldFilters } from '../../Generic/CustomFieldsFilter/matchesCustomFieldFilters';
import {
  FamilyNameSortMode,
  sortFamiliesByName,
} from '../../Families/FamilyUtils';
import {
  AssignmentFilterSelectionsByArrangementType,
  matchesAssignmentFilters,
} from './assignmentFilters';
import { filterOption } from './filterOption';
import { simplify } from './simplify';
import { familyOrFamilyMembersMeetRoleStatusFilterCriteria } from './volunteerApprovalRoleStatusFilters';

type VolunteerApprovalViewModelParameters = {
  assignmentFilters: AssignmentFilterSelectionsByArrangementType;
  filterText: string;
  sortMode: FamilyNameSortMode;
  uncheckedFamilies: string[];
};

function volunteerCustomFields(policy: EffectiveLocationPolicy) {
  return (policy.customFamilyFields ?? []).concat(
    policy.volunteerPolicy?.customFields ?? []
  );
}

function volunteerCustomFieldNames(policy: EffectiveLocationPolicy) {
  return (
    policy.customFamilyFields?.map((field) => field.name) || []
  ).concat(
    policy.volunteerPolicy?.customFields?.map((field) => field.name) || []
  );
}

function customFieldValue(
  family: CombinedFamilyInfo,
  fieldName: string
) {
  const familyField = family.family?.completedCustomFields?.find(
    (field) => field.customFieldName === fieldName
  );

  if (familyField?.value !== undefined && familyField?.value !== null) {
    return familyField.value;
  }

  const volunteerField =
    family.volunteerFamilyInfo?.completedCustomFields?.find(
      (field) => field.customFieldName === fieldName
    );

  return volunteerField?.value;
}

function customFieldIsBlank(family: CombinedFamilyInfo, fieldName: string) {
  return customFieldValue(family, fieldName) === undefined ||
    customFieldValue(family, fieldName) === null;
}

function familyMatchesText(family: CombinedFamilyInfo, filterText: string) {
  return (
    filterText.length === 0 ||
    family.family?.adults?.some((adult) =>
      simplify(`${adult.item1?.firstName} ${adult.item1?.lastName}`).includes(
        filterText.toLowerCase()
      )
    ) ||
    family.family?.children?.some((child) =>
      simplify(`${child?.firstName} ${child?.lastName}`).includes(
        filterText.toLowerCase()
      )
    )
  );
}

function familyMatchesCustomFieldFilters(
  family: CombinedFamilyInfo,
  customFields: CustomField[],
  customFieldFilters: CustomFieldFilterSelectionsByField
) {
  return matchesCustomFieldFilters({
    item: family,
    customFields,
    selectedValuesByField: customFieldFilters,
    isBlank: customFieldIsBlank,
    getValue: customFieldValue,
  });
}

function filteredFamilies(
  volunteerFamilies: CombinedFamilyInfo[],
  roleFilters: filterOption[],
  statusFilters: filterOption[],
  assignmentFilters: AssignmentFilterSelectionsByArrangementType,
  customFields: CustomField[],
  customFieldFilters: CustomFieldFilterSelectionsByField,
  filterText: string
) {
  return volunteerFamilies.filter(
    (family) =>
      familyMatchesText(family, filterText) &&
      familyOrFamilyMembersMeetRoleStatusFilterCriteria(
        family,
        roleFilters,
        statusFilters
      ) &&
      matchesAssignmentFilters(family, assignmentFilters) &&
      familyMatchesCustomFieldFilters(family, customFields, customFieldFilters)
  );
}

function arrangementTypes(policy: EffectiveLocationPolicy) {
  return Array.from(
    new Set(
      (policy.referralPolicy?.arrangementPolicies ?? [])
        .map((arrangementPolicy) => arrangementPolicy.arrangementType)
        .filter(
          (arrangementType): arrangementType is string =>
            !!arrangementType
        )
    )
  );
}

function selectedFamilies(
  volunteerFamilies: CombinedFamilyInfo[],
  uncheckedFamilies: string[]
) {
  return volunteerFamilies.filter(
    (family) => !uncheckedFamilies.some((id) => id === family.family!.id!)
  );
}

function selectedFamilyContactEmails(
  volunteerFamilies: CombinedFamilyInfo[]
) {
  return volunteerFamilies
    .map((family) => {
      const primaryContactPerson = family.family?.adults?.find(
        (adult) =>
          adult.item1?.id === family.family?.primaryFamilyContactPersonId
      );
      const preferredEmailAddress =
        primaryContactPerson?.item1?.emailAddresses?.find(
          (email) =>
            email.id === primaryContactPerson.item1?.preferredEmailAddressId
        );
      return preferredEmailAddress;
    })
    .filter((email) => typeof email !== 'undefined') as EmailAddress[];
}

function activeFilterCount<TValue>(
  filters: Record<string, TValue[]>
) {
  return Object.values(filters).filter(
    (selectedValues) => selectedValues.length > 0
  ).length;
}

export function useVolunteerApprovalViewModel({
  assignmentFilters,
  filterText,
  sortMode,
  uncheckedFamilies,
}: VolunteerApprovalViewModelParameters) {
  const policy = usePolicy();
  const [roleFilters, setRoleFilters] = useRoleFilters();
  const [statusFilters, setStatusFilters] = useStatusFilters();
  const volunteerFamiliesData = useVolunteerFamilies();
  const volunteerFamilies = useMemo(
    () => sortFamiliesByName(volunteerFamiliesData, sortMode),
    [sortMode, volunteerFamiliesData]
  );
  const customFields = useMemo(() => volunteerCustomFields(policy), [policy]);
  const customFieldNames = useMemo(
    () => volunteerCustomFieldNames(policy),
    [policy]
  );
  const {
    selectedValuesByField: customFieldFilters,
    setSelectedValuesForField: setCustomFieldFilter,
    getOptionsForField: getCustomFieldFilterOptionsForField,
  } = useCustomFieldFilters({
    customFields,
    items: volunteerFamilies,
    isBlank: customFieldIsBlank,
    getValue: customFieldValue,
  });
  const currentArrangementTypes = useMemo(
    () => arrangementTypes(policy),
    [policy]
  );
  const filteredVolunteerFamilies = useMemo(
    () =>
      filteredFamilies(
        volunteerFamilies,
        roleFilters,
        statusFilters,
        assignmentFilters,
        customFields,
        customFieldFilters,
        filterText
      ),
    [
      assignmentFilters,
      customFieldFilters,
      customFields,
      filterText,
      roleFilters,
      statusFilters,
      volunteerFamilies,
    ]
  );
  const selectedVolunteerFamilies = useMemo(
    () => selectedFamilies(filteredVolunteerFamilies, uncheckedFamilies),
    [filteredVolunteerFamilies, uncheckedFamilies]
  );
  const selectedVolunteerFamilyContactEmails = useMemo(
    () => selectedFamilyContactEmails(selectedVolunteerFamilies),
    [selectedVolunteerFamilies]
  );

  return {
    activeAssignmentFilterCount: activeFilterCount(assignmentFilters),
    activeCustomFieldFilterCount: activeFilterCount(customFieldFilters),
    arrangementTypes: currentArrangementTypes,
    customFieldCount: customFields.length,
    customFields,
    customFieldFilters,
    customFieldNames,
    filteredVolunteerFamilies,
    getCustomFieldFilterOptionsForField,
    roleFilters,
    selectedFamilies: selectedVolunteerFamilies,
    selectedFamilyContactEmails: selectedVolunteerFamilyContactEmails,
    setCustomFieldFilter: (
      fieldName: string,
      value: CustomFieldFilterValue[]
    ) => setCustomFieldFilter(fieldName, value),
    setRoleFilters,
    setStatusFilters,
    statusFilters,
  };
}

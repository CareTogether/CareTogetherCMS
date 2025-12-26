import {
  CombinedFamilyInfo,
  CustomField,
  CustomFieldType,
} from '../../GeneratedClient';
import {
  CustomFieldFilterSelectionsByField,
  CustomFieldFilterValue,
} from './types';

export function matchesCustomFieldFiltersForFamily(
  family: CombinedFamilyInfo,
  referralCustomFields: CustomField[],
  selectedValuesByField: CustomFieldFilterSelectionsByField
): boolean {
  return referralCustomFields.every((field) => {
    const selectedValues: CustomFieldFilterValue[] =
      selectedValuesByField[field.name] ?? [];

    if (selectedValues.length === 0) return true;

    const openCase = family.partneringFamilyInfo?.openV1Case;
    const isMissing =
      openCase?.missingCustomFields?.includes(field.name) ?? false;

    if (selectedValues.includes(null) && isMissing) return true;

    const rawVal = openCase?.completedCustomFields?.find(
      (f) => f.customFieldName === field.name
    )?.value;

    if (field.type === CustomFieldType.Boolean) {
      if (selectedValues.includes(true) && rawVal === true) return true;
      if (selectedValues.includes(false) && rawVal === false) return true;
      return false;
    }

    if (rawVal === undefined || rawVal === null || rawVal === '') return false;

    return selectedValues.includes(rawVal.toString());
  });
}

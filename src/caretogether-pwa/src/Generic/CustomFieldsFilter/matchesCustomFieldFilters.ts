import { CustomField, CustomFieldType } from '../../GeneratedClient';
import {
  CustomFieldFilterSelectionsByField,
  CustomFieldFilterValue,
} from './types';

type Args<TItem> = {
  item: TItem;
  customFields: CustomField[];
  selectedValuesByField: CustomFieldFilterSelectionsByField;
  isBlank: (item: TItem, fieldName: string) => boolean;
  getValue: (item: TItem, fieldName: string) => unknown;
};

export function matchesCustomFieldFilters<TItem>({
  item,
  customFields,
  selectedValuesByField,
  isBlank,
  getValue,
}: Args<TItem>): boolean {
  return customFields.every((field) => {
    const selectedValues: CustomFieldFilterValue[] =
      selectedValuesByField[field.name] ?? [];

    if (selectedValues.length === 0) return true;

    const blank = isBlank(item, field.name);
    if (blank) {
      return selectedValues.includes(null);
    }

    const raw = getValue(item, field.name);

    if (field.type === CustomFieldType.Boolean) {
      if (selectedValues.includes(true) && raw === true) return true;
      if (selectedValues.includes(false) && raw === false) return true;
      return false;
    }

    if (raw === undefined || raw === null || raw === '') return false;

    return selectedValues.includes(raw.toString());
  });
}

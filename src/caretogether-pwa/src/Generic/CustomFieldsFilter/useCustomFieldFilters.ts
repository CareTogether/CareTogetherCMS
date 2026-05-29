import React from 'react';
import { CustomField, CustomFieldType } from '../../GeneratedClient';
import { sortByPolicyOrder } from '../sortByPolicyOrder';
import {
  CustomFieldFilterOption,
  CustomFieldFilterSelectionsByField,
  CustomFieldFilterValue,
} from './types';

type Args<TItem> = {
  customFields: CustomField[];
  items: TItem[];
  isBlank: (item: TItem, fieldName: string) => boolean;
  getValue: (item: TItem, fieldName: string) => unknown;
};

export function useCustomFieldFilters<TItem>({
  customFields,
  items,
  isBlank,
  getValue,
}: Args<TItem>) {
  const [selectedValuesByField, setSelectedValuesByField] =
    React.useState<CustomFieldFilterSelectionsByField>({});

  const setSelectedValuesForField = React.useCallback(
    (fieldName: string, selectedValues: CustomFieldFilterValue[]) => {
      setSelectedValuesByField((prev) => ({
        ...prev,
        [fieldName]: selectedValues,
      }));
    },
    []
  );

  const optionsByField = React.useMemo(() => {
    return Object.fromEntries(
      customFields.map((field) => {
        const selectedSet = new Set<CustomFieldFilterValue>(
          selectedValuesByField[field.name] ?? []
        );

        if (field.type === CustomFieldType.Boolean) {
          const options: CustomFieldFilterOption[] = [
            { key: '(blank)', value: null, selected: selectedSet.has(null) },
            { key: 'Yes', value: true, selected: selectedSet.has(true) },
            { key: 'No', value: false, selected: selectedSet.has(false) },
          ];

          return [field.name, options] as const;
        }

        const observedValues: CustomFieldFilterValue[] =
          items.flatMap<CustomFieldFilterValue>((item) => {
            if (isBlank(item, field.name)) return [];

            const raw = getValue(item, field.name);

            if (raw === undefined || raw === null || raw === '') return [];

            if (field.type === CustomFieldType.StringArray) {
              if (Array.isArray(raw)) return raw as string[];
              return [];
            }

            return [raw.toString()];
          });

        const values = Array.from(
          new Set<CustomFieldFilterValue>([null, ...observedValues])
        );

        const mappedOptions: CustomFieldFilterOption[] = values.map((v) => {
          const key = v === null ? '(blank)' : v.toString();
          return {
            key,
            value: v,
            selected: selectedSet.has(v),
          };
        });

        const options: CustomFieldFilterOption[] =
          field.type === CustomFieldType.StringArray &&
          field.validValues &&
          field.validValues.length > 0
            ? [
                ...mappedOptions.filter((o) => o.value === null),
                ...sortByPolicyOrder(
                  mappedOptions
                    .filter((o) => o.value !== null)
                    .map((o) => o.key),
                  field.validValues
                ).map((key) => mappedOptions.find((o) => o.key === key)!),
              ]
            : mappedOptions.sort((a, b) => {
                if (a.value === null) return -1;
                if (b.value === null) return 1;
                return a.key.localeCompare(b.key);
              });

        return [field.name, options] as const;
      })
    ) as Record<string, CustomFieldFilterOption[]>;
  }, [customFields, getValue, isBlank, items, selectedValuesByField]);

  return {
    selectedValuesByField,
    setSelectedValuesByField,
    setSelectedValuesForField,
    optionsByField,
  };
}

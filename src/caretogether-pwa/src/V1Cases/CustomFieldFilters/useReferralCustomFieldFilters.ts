import React from 'react';
import {
  CombinedFamilyInfo,
  CustomField,
  CustomFieldType,
} from '../../GeneratedClient';
import {
  CustomFieldFilterOption,
  CustomFieldFilterSelectionsByField,
  CustomFieldFilterValue,
} from './types';

type UseReferralCustomFieldFiltersArgs = {
  referralCustomFields: CustomField[];
  partneringFamilies: CombinedFamilyInfo[];
};

export function useReferralCustomFieldFilters({
  referralCustomFields,
  partneringFamilies,
}: UseReferralCustomFieldFiltersArgs) {
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
      referralCustomFields.map((field) => {
        const selectedValues = new Set<CustomFieldFilterValue>(
          selectedValuesByField[field.name] ?? []
        );

        if (field.type === CustomFieldType.Boolean) {
          return [
            field.name,
            [
              {
                key: 'Yes',
                value: true,
                selected: selectedValues.has(true),
              },
              {
                key: 'No',
                value: false,
                selected: selectedValues.has(false),
              },
              {
                key: 'Blank',
                value: null,
                selected: selectedValues.has(null),
              },
            ],
          ];
        }

        const observedValues: CustomFieldFilterValue[] =
          partneringFamilies.flatMap((family) => {
            const openCase = family.partneringFamilyInfo?.openV1Case;
            const isMissing =
              openCase?.missingCustomFields?.includes(field.name) ?? false;

            if (isMissing) {
              return [null];
            }

            const value = openCase?.completedCustomFields?.find(
              (f) => f.customFieldName === field.name
            )?.value;

            if (value !== undefined && value !== null && value !== '') {
              return [value.toString()];
            }

            return [];
          });

        const values = Array.from(
          new Set<CustomFieldFilterValue>([...observedValues])
        );

        const options: CustomFieldFilterOption[] = values.map((value) => {
          const key = value === null ? 'Blank' : value.toString();

          return {
            key,
            value: value,
            selected: selectedValues.has(value),
          };
        });

        return [field.name, options] as const;
      })
    ) as Record<string, CustomFieldFilterOption[]>;
  }, [partneringFamilies, referralCustomFields, selectedValuesByField]);

  return {
    selectedValuesByField,
    setSelectedValuesByField,
    setSelectedValuesForField,
    optionsByField,
  };
}

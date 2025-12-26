import { CustomField } from '../../GeneratedClient';
import { ReferralCustomFieldFilter } from '../Arrangements/ReferralCustomFieldFilter';
import { CustomFieldFilterOption, CustomFieldFilterValue } from './types';

type Props = {
  referralCustomFields: CustomField[];
  optionsByField: Record<string, CustomFieldFilterOption[]>;
  onFieldChange: (
    fieldName: string,
    selectedValues: CustomFieldFilterValue[]
  ) => void;
};

export function ReferralCustomFieldFilters({
  referralCustomFields,
  optionsByField,
  onFieldChange,
}: Props) {
  return (
    <>
      {referralCustomFields.map((field) => {
        const options = optionsByField[field.name] ?? [];

        return (
          <ReferralCustomFieldFilter
            key={field.name}
            label={field.name}
            options={options}
            onChange={(selectedValues) =>
              onFieldChange(field.name, selectedValues)
            }
          />
        );
      })}
    </>
  );
}

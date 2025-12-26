import { CustomField } from '../../GeneratedClient';
import { CustomFieldsFilterSelect } from './CustomFieldsFilterSelect';
import {
  CustomFieldFilterOption,
  CustomFieldFilterSelectionsByField,
  CustomFieldFilterValue,
} from './types';

type Props = {
  customFields: CustomField[];
  optionsByField: Record<string, CustomFieldFilterOption[]>;
  selectedValuesByField: CustomFieldFilterSelectionsByField;
  onFieldChange: (
    fieldName: string,
    selectedValues: CustomFieldFilterValue[]
  ) => void;
};

export function CustomFieldsFilter({
  customFields,
  optionsByField,
  selectedValuesByField,
  onFieldChange,
}: Props) {
  return (
    <>
      {customFields.map((field) => {
        if (!field.name) return null;

        const options = optionsByField[field.name] ?? [];
        const selectedValues = selectedValuesByField[field.name] ?? [];

        return (
          <CustomFieldsFilterSelect
            key={field.name}
            label={field.name}
            options={options}
            selectedValues={selectedValues}
            onChange={(selected) => onFieldChange(field.name, selected)}
          />
        );
      })}
    </>
  );
}

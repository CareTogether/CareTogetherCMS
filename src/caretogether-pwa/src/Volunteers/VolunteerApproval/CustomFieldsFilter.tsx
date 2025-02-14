import {
  CombinedFamilyInfo,
  CustomField,
  CustomFieldType,
} from '../../GeneratedClient';
import { CustomFieldsFilterSelect } from './CustomFieldsFilterSelect';

type VolunteerFilterProps = {
  customFamilyFields: CustomField[];
  volunteerFamilies: CombinedFamilyInfo[];
  customFieldFilters: Record<string, string[]>;
  changeCustomFieldFilter: (fieldName: string, value: string[]) => void;
};

export function CustomFieldsFilter({
  customFamilyFields,
  volunteerFamilies,
  customFieldFilters,
  changeCustomFieldFilter,
}: VolunteerFilterProps) {
  return customFamilyFields?.map(({ name: fieldName, type: fieldType }) => {
    if (!fieldName) return null;

    const uniqueValues = Array.from(
      new Set(
        volunteerFamilies
          .map((family) => {
            const field = family.family?.completedCustomFields?.find(
              (customField) => customField.customFieldName === fieldName
            );
            return field?.value;
          })
          .filter((value) => value !== null && value !== undefined)
      )
    ).map((value) => value.toString());

    uniqueValues.sort((a, b) => a.localeCompare(b));

    const filterOptions: string[] = (
      fieldType === CustomFieldType.Boolean ? ['Yes', 'No'] : uniqueValues
    ).concat('(blank)');

    return (
      <CustomFieldsFilterSelect
        key={fieldName}
        label={fieldName}
        options={filterOptions}
        value={customFieldFilters[fieldName] ?? []}
        setSelected={(value) => {
          if (typeof value === 'string') {
            return changeCustomFieldFilter(fieldName, [value]);
          }

          changeCustomFieldFilter(fieldName, value);
        }}
      />
    );
  });
}

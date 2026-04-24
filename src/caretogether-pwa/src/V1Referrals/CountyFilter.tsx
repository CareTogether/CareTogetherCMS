import { CombinedFamilyInfo } from '../GeneratedClient';
import { CustomFieldsFilterSelect } from '../Generic/CustomFieldsFilter/CustomFieldsFilterSelect';
import { CustomFieldFilterOption } from '../Generic/CustomFieldsFilter/types';
import { getFamilyCounty } from '../Utilities/getFamilyCounty';

type CountyFilterValue = string | null;

type CountyFilterProps = {
  families: CombinedFamilyInfo[];
  value: CountyFilterValue[];
  onChange: (value: CountyFilterValue[]) => void;
};

export function CountyFilter({ families, value, onChange }: CountyFilterProps) {
  const counties = Array.from(
    new Set(
      families
        .map(getFamilyCounty)
        .filter((county): county is string => Boolean(county))
    )
  ).sort((a, b) => a.localeCompare(b));

  const options: CustomFieldFilterOption[] = [
    { key: '(blank)', value: null, selected: value.includes(null) },
    ...counties.map((county) => ({
      key: county,
      value: county,
      selected: value.includes(county),
    })),
  ];

  return (
    <CustomFieldsFilterSelect
      label="County"
      options={options}
      selectedValues={value}
      onChange={(selected) => {
        onChange(
          selected.filter(
            (v): v is string | null => typeof v === 'string' || v === null
          )
        );
      }}
    />
  );
}

import { CombinedFamilyInfo, IAddress } from '../GeneratedClient';
import { CustomFieldsFilterSelect } from '../Generic/CustomFieldsFilter/CustomFieldsFilterSelect';
import { CustomFieldFilterOption } from '../Generic/CustomFieldsFilter/types';

type CountyFilterValue = string | null;

type CountyFilterProps = {
  families: CombinedFamilyInfo[];
  value: CountyFilterValue[];
  onChange: (value: CountyFilterValue[]) => void;
};

function getCountyFromFamily(familyInfo: CombinedFamilyInfo): string | null {
  const family = familyInfo.family;
  if (!family) return null;

  const primaryPersonId = family.primaryFamilyContactPersonId;
  const primaryPerson = family.adults?.find(
    (a) => a.item1?.id === primaryPersonId
  )?.item1;

  if (!primaryPerson?.addresses?.length) return null;

  if (primaryPerson.currentAddressId) {
    const current = primaryPerson.addresses.find(
      (a: IAddress) => a.id === primaryPerson.currentAddressId
    );
    if (current?.county) return current.county;
  }

  const anyWithCounty = primaryPerson.addresses.find(
    (a: IAddress) => !!a.county
  );

  return anyWithCounty?.county ?? null;
}

export function CountyFilter({ families, value, onChange }: CountyFilterProps) {
  const counties = Array.from(
    new Set(
      families
        .map(getCountyFromFamily)
        .filter((county): county is string => Boolean(county))
    )
  ).sort((a, b) => a.localeCompare(b));

  const options: CustomFieldFilterOption[] = [
    {
      key: '(blank)',
      value: null,
      selected: value.includes(null),
    },
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

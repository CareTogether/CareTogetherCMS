import { CombinedFamilyInfo, IAddress } from '../GeneratedClient';
import { CustomFieldsFilterSelect } from '../Volunteers/VolunteerApproval/CustomFieldsFilterSelect';

type CountyFilterProps = {
  families: CombinedFamilyInfo[];
  value: string[];
  onChange: (value: string[]) => void;
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

  const options = counties.concat('(blank)');

  return (
    <CustomFieldsFilterSelect
      label="County"
      options={options}
      value={value}
      setSelected={(val) => {
        if (typeof val === 'string') {
          onChange([val]);
        } else {
          onChange(val);
        }
      }}
    />
  );
}

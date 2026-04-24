import { CombinedFamilyInfo, IAddress } from '../GeneratedClient';

export function getFamilyCounty(
  familyInfo: CombinedFamilyInfo | null | undefined
): string | null {
  const family = familyInfo?.family;
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

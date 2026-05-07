import { CombinedFamilyInfo } from '../../GeneratedClient';

export function familyLastName(family: CombinedFamilyInfo) {
  return (
    family.family!.adults?.filter(
      (adult) => family.family!.primaryFamilyContactPersonId === adult.item1?.id
    )[0]?.item1?.lastName || '⚠ MISSING PRIMARY CONTACT'
  );
}

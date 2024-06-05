import { CombinedFamilyInfo } from '../GeneratedClient';
import { personNameString } from './PersonName';

type FamilyNameProps = {
  family?: CombinedFamilyInfo
}

// eslint-disable-next-line react-refresh/only-export-components
export function familyNameString(family?: CombinedFamilyInfo) {
  const primaryContactPerson = family?.family?.adults?.find(adult =>
    family.family!.primaryFamilyContactPersonId === adult.item1?.id)?.item1;

  // If the primary contact is missing for the family (e.g., if that person was deleted),
  // show a warning text instead of silently showing ` Family`.
  return primaryContactPerson
    ? `${personNameString(primaryContactPerson)} Family`
    : `⚠ MISSING PRIMARY CONTACT Family`;
}

export function FamilyName({ family }: FamilyNameProps) {
  return (
    <span className='ct-family-name'>{familyNameString(family)}</span>
  );
}

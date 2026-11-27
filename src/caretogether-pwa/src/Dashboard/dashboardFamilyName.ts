import { familyNameString } from '../Families/FamilyName';
import { type CombinedFamilyInfo } from '../GeneratedClient';

export function disclosedFamilyName(family?: CombinedFamilyInfo) {
  const contactId = family?.family?.primaryFamilyContactPersonId;
  const contact =
    contactId &&
    family?.family?.adults?.find(({ item1 }) => item1?.id === contactId)?.item1;
  return contact && (contact.firstName?.trim() || contact.lastName?.trim())
    ? familyNameString(family)
    : undefined;
}

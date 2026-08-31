import { useMemo } from 'react';
import type { CombinedFamilyInfo } from '../GeneratedClient';
import { familyLastName } from './FamilyUtils';

export type FamilyHeaderViewModel = {
  primaryAddressText?: string;
  primaryEmailAddress?: string;
  primaryPhoneNumber?: string;
  screenTitle: string;
};

function primaryContactPerson(family?: CombinedFamilyInfo) {
  return family?.family?.adults?.find(
    (adult) => adult.item1?.id === family.family?.primaryFamilyContactPersonId
  )?.item1;
}

export function useFamilyHeaderViewModel(
  family?: CombinedFamilyInfo
): FamilyHeaderViewModel {
  return useMemo(() => {
    const primaryContact = primaryContactPerson(family);
    const primaryPhoneNumber =
      primaryContact?.phoneNumbers?.find(
        (phoneNumber) =>
          phoneNumber.id === primaryContact.preferredPhoneNumberId
      ) ?? primaryContact?.phoneNumbers?.[0];
    const primaryEmailAddress =
      primaryContact?.emailAddresses?.find(
        (emailAddress) =>
          emailAddress.id === primaryContact.preferredEmailAddressId
      ) ?? primaryContact?.emailAddresses?.[0];
    const primaryAddress = primaryContact?.addresses?.find(
      (address) => address.id === primaryContact.currentAddressId
    );
    const primaryAddressText = primaryAddress
      ? [
          primaryAddress.line1,
          primaryAddress.line2,
          [
            primaryAddress.city,
            primaryAddress.state,
            primaryAddress.postalCode,
          ]
            .filter(Boolean)
            .join(', '),
        ]
          .filter(Boolean)
          .join(' ')
      : undefined;

    return {
      primaryAddressText,
      primaryEmailAddress: primaryEmailAddress?.address,
      primaryPhoneNumber: primaryPhoneNumber?.number,
      screenTitle: family ? `${familyLastName(family)} Family` : '...',
    };
  }, [family]);
}

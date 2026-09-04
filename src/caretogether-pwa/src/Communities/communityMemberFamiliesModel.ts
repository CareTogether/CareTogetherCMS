import { familyLastName } from '../Families/FamilyUtils';
import {
  CombinedFamilyInfo,
  DateOnlyTimelineOfRoleApprovalStatus,
  EmailAddress,
  Permission,
  Person,
  PhoneNumber,
  ValueTupleOfPersonAndFamilyAdultRelationshipInfo,
} from '../GeneratedClient';

export type CommunityMemberFamilyAdultInfo =
  ValueTupleOfPersonAndFamilyAdultRelationshipInfo;

export type CommunityMemberFamilyApprovalRow = {
  roleName: string;
  status?: DateOnlyTimelineOfRoleApprovalStatus;
};

function preferredFirst<T extends { id?: string }>(
  values: T[] | undefined,
  preferredId: string | undefined,
  valueSelector: (value: T) => string | undefined
) {
  return (values || [])
    .filter((value) => Boolean(valueSelector(value)?.trim()))
    .map((value, index) => ({ value, index }))
    .sort((a, b) => {
      const aPreferred = a.value.id === preferredId;
      const bPreferred = b.value.id === preferredId;

      if (aPreferred !== bPreferred) {
        return aPreferred ? -1 : 1;
      }

      return a.index - b.index;
    })
    .map(({ value }) => value);
}

export function phoneNumbersFor(person?: Person): PhoneNumber[] {
  return preferredFirst(
    person?.phoneNumbers,
    person?.preferredPhoneNumberId,
    (phoneNumber) => phoneNumber.number
  );
}

export function emailAddressesFor(person?: Person): EmailAddress[] {
  return preferredFirst(
    person?.emailAddresses,
    person?.preferredEmailAddressId,
    (emailAddress) => emailAddress.address
  );
}

export function adultsFor(
  family: CombinedFamilyInfo
): (CommunityMemberFamilyAdultInfo | undefined)[] {
  const adults = family.family?.adults || [];

  if (adults.length === 0) {
    return [undefined];
  }

  return adults;
}

export function buildCommunityMemberFamilies(
  memberFamilyIds: string[] | undefined,
  visibleFamilies: CombinedFamilyInfo[]
): CombinedFamilyInfo[] {
  return (memberFamilyIds || [])
    .map((familyId) =>
      visibleFamilies.find((family) => family.family?.id === familyId)
    )
    .filter((family): family is CombinedFamilyInfo => Boolean(family))
    .sort((a, b) => {
      const aName = familyLastName(a);
      const bName = familyLastName(b);
      return aName.localeCompare(bName, undefined, { sensitivity: 'base' });
    });
}

export function canViewFamilyContactInfo(
  family: CombinedFamilyInfo,
  communityCanViewContactInfo: boolean
) {
  return (
    communityCanViewContactInfo ||
    (family.userPermissions || []).includes(Permission.ViewPersonContactInfo)
  );
}

export function isPrimaryFamilyContact(
  family: CombinedFamilyInfo,
  person: Person
) {
  return family.family?.primaryFamilyContactPersonId === person.id;
}

export function familyApprovalRows(
  family: CombinedFamilyInfo
): CommunityMemberFamilyApprovalRow[] {
  return Object.entries(
    family.volunteerFamilyInfo?.familyRoleApprovals || {}
  ).map(([roleName, roleApprovalStatus]) => ({
    roleName,
    status: roleApprovalStatus.effectiveRoleApprovalStatus,
  }));
}

export function adultApprovalRows(
  family: CombinedFamilyInfo,
  person: Person | undefined
): CommunityMemberFamilyApprovalRow[] {
  if (!person?.id) {
    return [];
  }

  return Object.entries(
    family.volunteerFamilyInfo?.individualVolunteers?.[person.id]
      ?.approvalStatusByRole || {}
  ).map(([roleName, roleApprovalStatus]) => ({
    roleName,
    status: roleApprovalStatus.effectiveRoleApprovalStatus,
  }));
}

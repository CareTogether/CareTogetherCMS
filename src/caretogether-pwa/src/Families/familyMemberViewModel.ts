import {
  Address,
  Age,
  AgeInYears,
  CombinedFamilyInfo,
  CompletedCustomFieldInfo,
  ExactAge,
  Gender,
  Permission,
  Person,
} from '../GeneratedClient';
import {
  differenceInYears,
  formatDuration,
  intervalToDuration,
} from 'date-fns';

export type FamilyMemberRowV2 = {
  id: string;
  kind: 'adult' | 'child';
  name: string;
  relationshipLabel?: string;
  ageLabel?: string;
  dateOfBirth?: Date;
  genderLabel?: string;
  ethnicity?: string;
  householdStatus?: string;
  statusLabels: string[];
  phone?: string;
  email?: string;
  address?: Address;
  concerns?: string;
  notes?: string;
  customFields: CompletedCustomFieldInfo[];
  canEdit: boolean;
  canManageUser: boolean;
  source: Person;
};

type BuildFamilyMemberRowsOptions = {
  family: CombinedFamilyInfo;
  permissions: (permission: Permission) => boolean;
  inviteUserEnabled?: boolean;
};

function personName(person: Person) {
  return [person.firstName, person.lastName].filter(Boolean).join(' ');
}

function preferredPhone(person: Person) {
  return person.phoneNumbers?.find(
    (phoneNumber) => phoneNumber.id === person.preferredPhoneNumberId
  )?.number;
}

function preferredEmail(person: Person) {
  return person.emailAddresses?.find(
    (emailAddress) => emailAddress.id === person.preferredEmailAddressId
  )?.address;
}

function ageLabel(age?: Age) {
  if (!age) {
    return undefined;
  }

  if (age instanceof ExactAge && age.dateOfBirth) {
    const duration = intervalToDuration({
      start: new Date(age.dateOfBirth),
      end: new Date(),
    });
    const years = duration.years ?? 0;
    const months = duration.months ?? 0;

    if (years < 5) {
      return (
        formatDuration(
          { years, months },
          { format: ['years', 'months'], zero: false }
        ) || '0 months'
      );
    }

    return years.toString();
  }

  if (age instanceof AgeInYears && age.years && age.asOf) {
    return (age.years + differenceInYears(new Date(), age.asOf)).toString();
  }

  return undefined;
}

function dateOfBirth(age?: Age) {
  if (age instanceof ExactAge && age.dateOfBirth) {
    return new Date(age.dateOfBirth);
  }

  return undefined;
}

function genderLabel(person: Person) {
  return person.gender !== undefined ? Gender[person.gender] : undefined;
}

function currentAddress(person: Person) {
  return person.addresses?.find((address) => address.id === person.currentAddressId);
}

function isAdultChild(person: Person) {
  return (
    person.age instanceof ExactAge &&
    person.age.dateOfBirth &&
    differenceInYears(new Date(), person.age.dateOfBirth) >= 18
  );
}

function canManageUserForAdult(
  permissions: (permission: Permission) => boolean,
  inviteUserEnabled: boolean
) {
  return (
    (inviteUserEnabled && permissions(Permission.InvitePersonUser)) ||
    permissions(Permission.EditPersonUserStandardRoles) ||
    permissions(Permission.EditPersonUserProtectedRoles)
  );
}

export function buildFamilyMemberRows({
  family,
  permissions,
  inviteUserEnabled = false,
}: BuildFamilyMemberRowsOptions): FamilyMemberRowV2[] {
  const canEdit = permissions(Permission.EditFamilyInfo);
  const canManageUser = canManageUserForAdult(permissions, inviteUserEnabled);
  const adults: FamilyMemberRowV2[] =
    family.family?.adults?.flatMap((adult) => {
      if (!adult.item1?.id || !adult.item1.active || !adult.item2) {
        return [];
      }

      const user = family.users?.find(
        (userInfo) => userInfo.personId === adult.item1?.id
      );
      const statusLabels = [
        adult.item2.isInHousehold ? 'In Household' : null,
        user
          ? user.userId
            ? 'User Activated'
            : 'User Not Activated'
          : null,
      ].filter((label): label is string => Boolean(label));

      return [
        {
          id: adult.item1.id,
          kind: 'adult' as const,
          name: personName(adult.item1),
          relationshipLabel: adult.item2.relationshipToFamily || 'Adult',
          ageLabel: ageLabel(adult.item1.age),
          dateOfBirth: dateOfBirth(adult.item1.age),
          genderLabel: genderLabel(adult.item1),
          ethnicity: adult.item1.ethnicity,
          householdStatus: adult.item2.isInHousehold
            ? 'In Household'
            : undefined,
          statusLabels,
          phone: preferredPhone(adult.item1),
          email: preferredEmail(adult.item1),
          address: currentAddress(adult.item1),
          concerns: adult.item1.concerns,
          notes: adult.item1.notes,
          customFields: adult.item1.completedCustomFields ?? [],
          canEdit,
          canManageUser,
          source: adult.item1,
        },
      ];
    }) ?? [];

  const children: FamilyMemberRowV2[] =
    family.family?.children?.flatMap((child) => {
      if (!child.id || !child.active) {
        return [];
      }

      return [
        {
          id: child.id,
          kind: 'child' as const,
          name: personName(child),
          relationshipLabel: 'Child',
          ageLabel: ageLabel(child.age),
          dateOfBirth: dateOfBirth(child.age),
          genderLabel: genderLabel(child),
          ethnicity: child.ethnicity,
          statusLabels: isAdultChild(child) ? ['No longer under 18'] : [],
          phone: preferredPhone(child),
          email: preferredEmail(child),
          address: currentAddress(child),
          concerns: child.concerns,
          notes: child.notes,
          customFields: child.completedCustomFields ?? [],
          canEdit,
          canManageUser: false,
          source: child,
        },
      ];
    }) ?? [];

  return adults.concat(children);
}

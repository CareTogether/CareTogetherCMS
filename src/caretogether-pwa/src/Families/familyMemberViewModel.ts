import {
  Age,
  AgeInYears,
  Arrangement,
  ArrangementPhase,
  CombinedFamilyInfo,
  CustodialRelationship,
  CustodialRelationshipType,
  ExactAge,
  Gender,
  Permission,
  Person,
  UserInfo,
  V1Case,
  ValueTupleOfPersonAndFamilyAdultRelationshipInfo,
} from '../GeneratedClient';
import {
  differenceInYears,
  formatDuration,
  intervalToDuration,
} from 'date-fns';

export type FamilyMemberTypeV2 = 'Adult' | 'Child';

export type FamilyMemberPermissionFlagsV2 = {
  canEdit: boolean;
  canDelete: boolean;
  canViewDateOfBirth: boolean;
  canViewContactInfo: boolean;
  canEditContactInfo: boolean;
  canViewNotes: boolean;
  canEditNotes: boolean;
  canViewConcerns: boolean;
  canEditConcerns: boolean;
  canViewCustomFields: boolean;
  canManageUser: boolean;
  canConvertChildToAdult: boolean;
};

export type AdultFamilyMemberSourceV2 = {
  adult: ValueTupleOfPersonAndFamilyAdultRelationshipInfo;
  user?: UserInfo;
};

export type ChildFamilyMemberSourceV2 = {
  child: Person;
  custodialRelationships: CustodialRelationship[];
};

export type FamilyMemberArrangementShortcutV2 = {
  arrangementId: string;
  v1CaseId: string;
  label: string;
};

export type FamilyMemberRowV2 = {
  id: string;
  person: Person;
  personType: FamilyMemberTypeV2;
  displayName: string;
  relationshipSummary?: string;
  age?: Age;
  ageLabel?: string;
  dateOfBirth?: Date;
  genderLabel?: string;
  ethnicity?: string;
  isInHousehold?: boolean;
  householdStatusLabel?: string;
  primaryPhone?: string;
  primaryEmail?: string;
  currentAddressSummary?: string;
  primaryContactSummary?: string;
  hasConcerns: boolean;
  concernIndicator?: string;
  hasNotes: boolean;
  userIndicator?: string;
  activeArrangements: FamilyMemberArrangementShortcutV2[];
  permissionFlags: FamilyMemberPermissionFlagsV2;
  source: AdultFamilyMemberSourceV2 | ChildFamilyMemberSourceV2;
};

type BuildFamilyMemberRowsParameters = {
  family: CombinedFamilyInfo;
  permissions: (permission: Permission) => boolean;
  includeInactive?: boolean;
  now?: Date;
  v1Cases?: V1Case[];
};

function displayName(person: Person) {
  return [person.firstName, person.lastName].filter(Boolean).join(' ');
}

function isExactAge(age?: Age): age is ExactAge {
  return age instanceof ExactAge && age.dateOfBirth !== undefined;
}

function isAgeInYears(age?: Age): age is AgeInYears {
  return age instanceof AgeInYears && age.years !== undefined;
}

function ageLabel(age: Age | undefined, now: Date) {
  if (!age) return undefined;

  if (isExactAge(age)) {
    const duration = intervalToDuration({
      start: new Date(age.dateOfBirth),
      end: now,
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

    return `${years}`;
  }

  if (isAgeInYears(age) && age.asOf) {
    return `${age.years + differenceInYears(now, age.asOf)}`;
  }

  return undefined;
}

function dateOfBirth(age?: Age) {
  return isExactAge(age) ? age.dateOfBirth : undefined;
}

function genderLabel(gender?: Gender) {
  return gender === undefined ? undefined : Gender[gender];
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

function currentAddressSummary(person: Person) {
  const address = person.addresses?.find(
    (candidate) => candidate.id === person.currentAddressId
  );

  if (!address) return undefined;

  return [
    address.line1,
    address.line2,
    [address.city, address.state, address.postalCode]
      .filter(Boolean)
      .join(', '),
    address.county ? `${address.county} County` : undefined,
  ]
    .filter(Boolean)
    .join(' ');
}

function primaryContactSummary(person: Person) {
  return [preferredPhone(person), preferredEmail(person)]
    .filter(Boolean)
    .join(' | ');
}

function custodialRelationshipLabel(type?: CustodialRelationshipType) {
  if (type === CustodialRelationshipType.LegalGuardian) {
    return 'legal guardian';
  }

  if (type === CustodialRelationshipType.ParentWithCustody) {
    return 'parent with custody';
  }

  if (type === CustodialRelationshipType.ParentWithCourtAppointedCustody) {
    return 'parent with court-appointed sole custody';
  }

  return undefined;
}

function childRelationshipSummary(
  family: CombinedFamilyInfo,
  child: Person,
  custodialRelationships: CustodialRelationship[]
) {
  const adults = family.family?.adults ?? [];

  return custodialRelationships
    .filter((relationship) => relationship.childId === child.id)
    .map((relationship) => {
      const adult = adults.find(
        (candidate) => candidate.item1?.id === relationship.personId
      )?.item1;
      const adultName = adult ? displayName(adult) : '(adult not found)';
      const label = custodialRelationshipLabel(relationship.type);

      return label ? `${adultName}: ${label}` : adultName;
    })
    .join('; ');
}

function isActiveArrangement(arrangement: Arrangement) {
  return (
    arrangement.phase === ArrangementPhase.SettingUp ||
    arrangement.phase === ArrangementPhase.ReadyToStart ||
    arrangement.phase === ArrangementPhase.Started
  );
}

function arrangementAppliesToPerson({
  arrangement,
  family,
  person,
}: {
  arrangement: Arrangement;
  family: CombinedFamilyInfo;
  person: Person;
}) {
  if (arrangement.partneringFamilyPersonId === person.id) {
    return true;
  }

  return (arrangement.individualVolunteerAssignments ?? []).some(
    (assignment) =>
      assignment.familyId === family.family?.id && assignment.personId === person.id
  );
}

function activeArrangementShortcuts(
  family: CombinedFamilyInfo,
  person: Person,
  v1Cases: V1Case[] | undefined
): FamilyMemberArrangementShortcutV2[] {
  return (
    v1Cases?.flatMap(
      (v1Case) =>
        v1Case.arrangements
          ?.filter(
            (arrangement) =>
              arrangement.id &&
              v1Case.id &&
              isActiveArrangement(arrangement) &&
              arrangementAppliesToPerson({ arrangement, family, person })
          )
          .map((arrangement) => ({
            arrangementId: arrangement.id!,
            v1CaseId: v1Case.id!,
            label: arrangement.arrangementType || 'Arrangement',
          })) ?? []
    ) ?? []
  );
}

function userIndicator(user?: UserInfo) {
  if (!user) return undefined;

  const prefix = user.userId ? 'User' : 'User not activated';
  const roles = user.locationRoles?.join(', ');

  return roles ? `${prefix}: ${roles}` : prefix;
}

function permissionFlags(
  permissions: BuildFamilyMemberRowsParameters['permissions'],
  personType: FamilyMemberTypeV2
): FamilyMemberPermissionFlagsV2 {
  const canManageUser =
    personType === 'Adult' &&
    (permissions(Permission.InvitePersonUser) ||
      permissions(Permission.EditPersonUserStandardRoles) ||
      permissions(Permission.EditPersonUserProtectedRoles));

  return {
    canEdit: permissions(Permission.EditFamilyInfo),
    canDelete: permissions(Permission.EditFamilyInfo),
    canViewDateOfBirth: permissions(Permission.ViewPersonDateOfBirth),
    canViewContactInfo: permissions(Permission.ViewPersonContactInfo),
    canEditContactInfo: permissions(Permission.EditPersonContactInfo),
    canViewNotes: permissions(Permission.ViewPersonNotes),
    canEditNotes: permissions(Permission.EditPersonNotes),
    canViewConcerns: permissions(Permission.ViewPersonConcerns),
    canEditConcerns: permissions(Permission.EditPersonConcerns),
    canViewCustomFields: permissions(Permission.ViewFamilyCustomFields),
    canManageUser,
    canConvertChildToAdult:
      personType === 'Child' && permissions(Permission.EditFamilyInfo),
  };
}

function commonRowFields({
  family,
  person,
  personType,
  relationshipSummary,
  permissions,
  now,
  v1Cases,
}: {
  person: Person;
  personType: FamilyMemberTypeV2;
  relationshipSummary?: string;
  permissions: BuildFamilyMemberRowsParameters['permissions'];
  now: Date;
  family: CombinedFamilyInfo;
  v1Cases?: V1Case[];
}) {
  const contactSummary = primaryContactSummary(person);

  return {
    id: person.id!,
    person,
    personType,
    displayName: displayName(person),
    relationshipSummary: relationshipSummary || undefined,
    age: person.age,
    ageLabel: ageLabel(person.age, now),
    dateOfBirth: dateOfBirth(person.age),
    genderLabel: genderLabel(person.gender),
    ethnicity: person.ethnicity,
    primaryPhone: preferredPhone(person),
    primaryEmail: preferredEmail(person),
    currentAddressSummary: currentAddressSummary(person),
    primaryContactSummary: contactSummary || undefined,
    hasConcerns: !!person.concerns,
    concernIndicator: person.concerns ? 'Concerns' : undefined,
    hasNotes: !!person.notes,
    activeArrangements: activeArrangementShortcuts(family, person, v1Cases),
    permissionFlags: permissionFlags(permissions, personType),
  };
}

export function buildFamilyMemberRowsV2({
  family,
  permissions,
  includeInactive = false,
  now = new Date(),
  v1Cases,
}: BuildFamilyMemberRowsParameters): FamilyMemberRowV2[] {
  const adultRows =
    family.family?.adults?.flatMap((adult) => {
      const person = adult.item1;
      const relationship = adult.item2;

      if (!person?.id || !relationship) return [];
      if (!includeInactive && !person.active) return [];

      const user = family.users?.find((candidate) => candidate.personId === person.id);

      return [
        {
          ...commonRowFields({
            person,
            personType: 'Adult',
            relationshipSummary: relationship.relationshipToFamily,
            permissions,
            now,
            family,
            v1Cases,
          }),
          isInHousehold: relationship.isInHousehold,
          householdStatusLabel: relationship.isInHousehold
            ? 'In Household'
            : undefined,
          userIndicator: userIndicator(user),
          source: { adult, user },
        },
      ];
    }) ?? [];

  const childRows =
    family.family?.children?.flatMap((child) => {
      if (!child.id) return [];
      if (!includeInactive && !child.active) return [];

      const relationshipSummary = childRelationshipSummary(
        family,
        child,
        family.family?.custodialRelationships ?? []
      );

      return [
        {
          ...commonRowFields({
            person: child,
            personType: 'Child',
            relationshipSummary,
            permissions,
            now,
            family,
            v1Cases,
          }),
          source: {
            child,
            custodialRelationships:
              family.family?.custodialRelationships?.filter(
                (relationship) => relationship.childId === child.id
              ) ?? [],
          },
        },
      ];
    }) ?? [];

  return [...adultRows, ...childRows];
}

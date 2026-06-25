import { CombinedFamilyInfo } from '../GeneratedClient';
import { simplify } from '../Utilities/stringUtils';

export function familyLastName(family: CombinedFamilyInfo) {
  return (
    family.family!.adults?.filter(
      (adult) => family.family!.primaryFamilyContactPersonId === adult.item1?.id
    )[0]?.item1?.lastName || '⚠ MISSING PRIMARY CONTACT'
  );
}

export type FamilyNameSortMode =
  | 'lastNameAsc'
  | 'lastNameDesc'
  | 'firstNameAsc'
  | 'firstNameDesc';

export function normalizeFamilyNameSortMode(value: unknown): FamilyNameSortMode {
  if (
    value === 'lastNameAsc' ||
    value === 'lastNameDesc' ||
    value === 'firstNameAsc' ||
    value === 'firstNameDesc'
  ) {
    return value;
  }

  return 'lastNameAsc';
}

function familyFirstName(family: CombinedFamilyInfo) {
  return (
    family.family!.adults?.filter(
      (adult) => family.family!.primaryFamilyContactPersonId === adult.item1?.id
    )[0]?.item1?.firstName || 'MISSING PRIMARY CONTACT'
  );
}

function compareByFamilyLastName(
  firstFamily: CombinedFamilyInfo,
  secondFamily: CombinedFamilyInfo
) {
  const firstLastName = familyLastName(firstFamily);
  const secondLastName = familyLastName(secondFamily);

  if (firstLastName < secondLastName) {
    return -1;
  }

  if (firstLastName > secondLastName) {
    return 1;
  }

  return (firstFamily.family?.id ?? '').localeCompare(
    secondFamily.family?.id ?? ''
  );
}

function compareByFamilyFirstName(
  firstFamily: CombinedFamilyInfo,
  secondFamily: CombinedFamilyInfo
) {
  const firstFirstName = familyFirstName(firstFamily);
  const secondFirstName = familyFirstName(secondFamily);

  if (firstFirstName < secondFirstName) {
    return -1;
  }

  if (firstFirstName > secondFirstName) {
    return 1;
  }

  return compareByFamilyLastName(firstFamily, secondFamily);
}

export function filterFamiliesByText(
  families: CombinedFamilyInfo[],
  inputText: string
) {
  return families.filter(
    (family) =>
      inputText.length === 0 ||
      family.family?.adults?.some((adult) =>
        simplify(`${adult.item1?.firstName} ${adult.item1?.lastName}`).includes(
          inputText.toLowerCase()
        )
      ) ||
      family.family?.children?.some((child) =>
        simplify(`${child?.firstName} ${child?.lastName}`).includes(
          inputText.toLowerCase()
        )
      )
  );
}

export function sortFamiliesByName(
  families: CombinedFamilyInfo[],
  sortMode: FamilyNameSortMode
) {
  return families.map((family) => family).sort((firstFamily, secondFamily) => {
    if (sortMode === 'lastNameDesc') {
      return compareByFamilyLastName(secondFamily, firstFamily);
    }

    if (sortMode === 'firstNameDesc') {
      return compareByFamilyFirstName(secondFamily, firstFamily);
    }

    if (sortMode === 'firstNameAsc') {
      return compareByFamilyFirstName(firstFamily, secondFamily);
    }

    return compareByFamilyLastName(firstFamily, secondFamily);
  });
}

export function sortFamiliesByLastNameDesc(families: CombinedFamilyInfo[]) {
  return families
    .map((x) => x)
    .sort((a, b) =>
      familyLastName(a) < familyLastName(b)
        ? -1
        : familyLastName(a) > familyLastName(b)
          ? 1
          : 0
    );
}

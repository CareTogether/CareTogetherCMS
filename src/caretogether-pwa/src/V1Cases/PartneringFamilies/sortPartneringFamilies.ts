import {
  CombinedFamilyInfo,
  V1Referral,
  V1ReferralStatus,
} from '../../GeneratedClient';
import { familyLastName } from '../../Families/FamilyUtils';

export type PartneringFamiliesSortMode =
  | 'lastNameAsc'
  | 'lastNameDesc'
  | 'dateOpenedDesc'
  | 'dateOpenedAsc';

export function normalizePartneringFamiliesSortMode(
  value: unknown
): PartneringFamiliesSortMode {
  if (
    value === 'lastNameAsc' ||
    value === 'lastNameDesc' ||
    value === 'dateOpenedDesc' ||
    value === 'dateOpenedAsc'
  ) {
    return value;
  }

  return 'lastNameAsc';
}

function safeDateTime(value: Date | string | null | undefined) {
  if (!value) {
    return null;
  }

  const time = new Date(value).getTime();

  return Number.isNaN(time) ? null : time;
}

function compareByFamilyName(
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

export function openReferralByFamilyId(referrals: V1Referral[]) {
  return referrals.reduce((referralByFamilyId, referral) => {
    if (referral.status !== V1ReferralStatus.Open || !referral.familyId) {
      return referralByFamilyId;
    }

    const currentReferral = referralByFamilyId.get(referral.familyId);
    const currentReferralTime = safeDateTime(currentReferral?.createdAtUtc);
    const referralTime = safeDateTime(referral.createdAtUtc);

    if (currentReferral && (referralTime ?? 0) <= (currentReferralTime ?? 0)) {
      return referralByFamilyId;
    }

    referralByFamilyId.set(referral.familyId, referral);
    return referralByFamilyId;
  }, new Map<string, V1Referral>());
}

function getOpenedAtTime(
  family: CombinedFamilyInfo,
  openReferralByFamily: Map<string, V1Referral>
) {
  const caseOpenedAt = safeDateTime(
    family.partneringFamilyInfo?.openV1Case?.openedAtUtc
  );

  if (caseOpenedAt !== null) {
    return caseOpenedAt;
  }

  const familyId = family.family?.id;

  if (!familyId) {
    return null;
  }

  return safeDateTime(openReferralByFamily.get(familyId)?.createdAtUtc);
}

function compareByDateOpenedDesc(
  firstFamily: CombinedFamilyInfo,
  secondFamily: CombinedFamilyInfo,
  openReferralByFamily: Map<string, V1Referral>
) {
  const firstOpenedAt = getOpenedAtTime(firstFamily, openReferralByFamily);
  const secondOpenedAt = getOpenedAtTime(secondFamily, openReferralByFamily);

  if (firstOpenedAt === null && secondOpenedAt === null) {
    return compareByFamilyName(firstFamily, secondFamily);
  }

  if (firstOpenedAt === null) {
    return 1;
  }

  if (secondOpenedAt === null) {
    return -1;
  }

  if (firstOpenedAt === secondOpenedAt) {
    return compareByFamilyName(firstFamily, secondFamily);
  }

  return secondOpenedAt - firstOpenedAt;
}

function compareByDateOpenedAsc(
  firstFamily: CombinedFamilyInfo,
  secondFamily: CombinedFamilyInfo,
  openReferralByFamily: Map<string, V1Referral>
) {
  return compareByDateOpenedDesc(
    secondFamily,
    firstFamily,
    openReferralByFamily
  );
}

export function sortPartneringFamilies(
  families: CombinedFamilyInfo[],
  sortMode: PartneringFamiliesSortMode,
  openReferralByFamily: Map<string, V1Referral>
) {
  return families.map((family) => family).sort((firstFamily, secondFamily) => {
    if (sortMode === 'dateOpenedDesc') {
      return compareByDateOpenedDesc(
        firstFamily,
        secondFamily,
        openReferralByFamily
      );
    }

    if (sortMode === 'dateOpenedAsc') {
      return compareByDateOpenedAsc(
        firstFamily,
        secondFamily,
        openReferralByFamily
      );
    }

    if (sortMode === 'lastNameDesc') {
      return compareByFamilyName(secondFamily, firstFamily);
    }

    return compareByFamilyName(firstFamily, secondFamily);
  });
}

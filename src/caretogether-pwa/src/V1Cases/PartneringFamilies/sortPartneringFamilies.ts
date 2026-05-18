import {
  CombinedFamilyInfo,
  V1Referral,
  V1ReferralStatus,
} from '../../GeneratedClient';
import { familyLastName } from '../../Families/FamilyUtils';

export type PartneringFamiliesSortMode = 'familyName' | 'dateOpened';

export function isPartneringFamiliesSortMode(
  value: unknown
): value is PartneringFamiliesSortMode {
  return value === 'familyName' || value === 'dateOpened';
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

function compareByDateOpened(
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

export function sortPartneringFamilies(
  families: CombinedFamilyInfo[],
  sortMode: PartneringFamiliesSortMode,
  openReferralByFamily: Map<string, V1Referral>
) {
  return families.map((family) => family).sort((firstFamily, secondFamily) => {
    if (sortMode === 'dateOpened') {
      return compareByDateOpened(
        firstFamily,
        secondFamily,
        openReferralByFamily
      );
    }

    return compareByFamilyName(firstFamily, secondFamily);
  });
}

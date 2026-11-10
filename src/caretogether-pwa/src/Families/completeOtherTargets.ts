import type { RequirementContext } from '../Requirements/RequirementContext';

export const FAMILY_TARGET_KEY = 'family';

export type CompleteOtherTargetOption = {
  key: string;
  label: string;
};

export type CompleteOtherTargets = {
  family: boolean;
  personIds: string[];
};

type AdultSummary = {
  id?: string;
  active?: boolean;
  firstName?: string;
  lastName?: string;
};

function adultLabel(adult: AdultSummary) {
  return [adult.firstName, adult.lastName].filter(Boolean).join(' ') || 'Adult';
}

export function completeOtherTargetOptions(
  adults: AdultSummary[]
): CompleteOtherTargetOption[] {
  const people = adults
    .filter((adult): adult is AdultSummary & { id: string } =>
      Boolean(adult.id && adult.active)
    )
    .map((adult) => ({ key: adult.id, label: adultLabel(adult) }));

  return [{ key: FAMILY_TARGET_KEY, label: 'Family' }, ...people];
}

export function initialCompleteOtherTargetKeys(context: RequirementContext) {
  if (context.kind === 'Individual Volunteer') {
    return [context.personId];
  }

  return [FAMILY_TARGET_KEY];
}

export function completeOtherTargetsFromKeys(
  keys: string[]
): CompleteOtherTargets {
  return {
    family: keys.includes(FAMILY_TARGET_KEY),
    personIds: keys.filter((key) => key !== FAMILY_TARGET_KEY),
  };
}

export function toggleCompleteOtherTargetKey(
  keys: string[],
  key: string,
  checked: boolean
) {
  if (!checked) {
    return keys.filter((current) => current !== key);
  }

  return keys.includes(key) ? keys : [...keys, key];
}

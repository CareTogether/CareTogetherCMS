import type { CombinedFamilyInfo } from '../GeneratedClient.ts';

export function isClientOnlyFamily(family: CombinedFamilyInfo) {
  return (
    family.partneringFamilyInfo != null && family.volunteerFamilyInfo == null
  );
}

export function canSubmitChildDateOfBirth(
  family: CombinedFamilyInfo,
  dateOfBirth: Date | null,
  hasDateError: boolean
) {
  if (hasDateError) return false;
  if (dateOfBirth == null) return isClientOnlyFamily(family);
  return Number.isFinite(dateOfBirth.getTime());
}

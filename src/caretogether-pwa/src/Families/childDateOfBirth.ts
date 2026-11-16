import type { CombinedFamilyInfo } from '../GeneratedClient.ts';

export function isClientOnlyFamily(family: CombinedFamilyInfo) {
  return (
    family.partneringFamilyInfo != null && family.volunteerFamilyInfo == null
  );
}

export function canSubmitChildDateOfBirth(
  family: CombinedFamilyInfo,
  dateOfBirth: Date | null,
  hasDateError: boolean,
  now = new Date()
) {
  if (hasDateError) return false;
  if (dateOfBirth == null) return isClientOnlyFamily(family);
  if (!Number.isFinite(dateOfBirth.getTime())) return false;
  if (dateOfBirth.getFullYear() < 1900) return false;

  const endOfToday = new Date(now);
  endOfToday.setHours(23, 59, 59, 999);
  return dateOfBirth <= endOfToday;
}

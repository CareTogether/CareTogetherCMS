import { CombinedFamilyInfo, ArrangementEntry } from '../GeneratedClient';

export function getAssignmentsForVolunteerFamily(
  family: CombinedFamilyInfo
): { arrangement: ArrangementEntry }[] {
  const results: { arrangement: ArrangementEntry }[] = [];

  if (!family.volunteerFamilyInfo) {
    return results;
  }

  if (!family.volunteerFamilyInfo.assignments) {
    return results;
  }

  family.volunteerFamilyInfo.assignments.forEach(
    (assignment: ArrangementEntry) => {
      results.push({ arrangement: assignment });
    }
  );

  return results;
}

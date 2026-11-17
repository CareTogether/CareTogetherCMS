import type { CombinedFamilyInfo, Person } from '../GeneratedClient.ts';

export interface MissingChildDateOfBirth {
  type: 'MissingChildDateOfBirth';
  family: CombinedFamilyInfo;
  child: Person;
}

export function missingChildDateOfBirthInboxItemsForFamilies(
  families: CombinedFamilyInfo[]
): MissingChildDateOfBirth[] {
  return families.flatMap((family) =>
    (family.family?.children ?? [])
      .filter((child) => child.active && child.age == null)
      .map((child) => ({
        type: 'MissingChildDateOfBirth' as const,
        family,
        child,
      }))
  );
}

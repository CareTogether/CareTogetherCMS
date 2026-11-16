import type { CombinedFamilyInfo, Person } from '../GeneratedClient.ts';
import { isClientOnlyFamily } from '../Families/childDateOfBirth.ts';

export interface MissingChildDateOfBirth {
  type: 'MissingChildDateOfBirth';
  family: CombinedFamilyInfo;
  child: Person;
}

export function missingChildDateOfBirthInboxItemsForFamilies(
  families: CombinedFamilyInfo[]
): MissingChildDateOfBirth[] {
  const seen = new Set<string>();

  return families.flatMap((family) => {
    const familyId = family.family?.id;
    if (!familyId?.trim() || !isClientOnlyFamily(family)) return [];

    return (family.family?.children ?? []).flatMap((child) => {
      if (!child.id?.trim() || !child.active || child.age != null) return [];

      const key = `${familyId}:${child.id}`;
      if (seen.has(key)) return [];
      seen.add(key);

      return [{ type: 'MissingChildDateOfBirth' as const, family, child }];
    });
  });
}

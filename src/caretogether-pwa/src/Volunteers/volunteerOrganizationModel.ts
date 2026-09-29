import type { Community } from '../GeneratedClient';

export function organizationNamesByFamilyId(communities: Community[]) {
  const namesByFamilyId = new Map<string, Set<string>>();

  communities.forEach((community) => {
    if (!community.name) return;

    (community.memberFamilies ?? []).forEach((familyId) => {
      const names = namesByFamilyId.get(familyId) ?? new Set<string>();
      names.add(community.name);
      namesByFamilyId.set(familyId, names);
    });
  });

  return new Map(
    Array.from(namesByFamilyId, ([familyId, names]) => [
      familyId,
      Array.from(names).sort((first, second) => first.localeCompare(second)),
    ])
  );
}

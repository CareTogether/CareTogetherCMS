import type { Community, OrganizationCategory } from '../GeneratedClient';

export type OrganizationGridRow = {
  id: string;
  name: string;
  description: string;
  categoryLabels: string[];
  memberFamilyCount: number;
  organizationCount: number;
  roleAssignmentCount: number;
};

function categoryLabels(
  categoryIds: string[] | null | undefined,
  categoriesById: ReadonlyMap<string, OrganizationCategory>
) {
  return (categoryIds ?? [])
    .map((categoryId) => categoriesById.get(categoryId)?.name)
    .filter((categoryName): categoryName is string => Boolean(categoryName))
    .sort((first, second) =>
      first.localeCompare(second, undefined, { sensitivity: 'base' })
    );
}

export function buildOrganizationGridRows(
  communities: readonly Community[],
  categoriesById: ReadonlyMap<string, OrganizationCategory>
): OrganizationGridRow[] {
  return communities
    .filter((community): community is Community & { id: string } =>
      Boolean(community.id)
    )
    .map((community) => ({
      id: community.id,
      name: community.name ?? '',
      description: community.description ?? '',
      categoryLabels: categoryLabels(community.categoryIds, categoriesById),
      memberFamilyCount: community.memberFamilies?.length ?? 0,
      organizationCount: 1,
      roleAssignmentCount: community.communityRoleAssignments?.length ?? 0,
    }));
}

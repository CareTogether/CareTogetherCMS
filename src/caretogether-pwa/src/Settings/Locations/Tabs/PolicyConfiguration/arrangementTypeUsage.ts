import type { CombinedFamilyInfo } from '../../../../GeneratedClient.ts';

/** Counts the existing arrangements of each arrangement type across the given families. */
export function countArrangementsByType(
  families: readonly CombinedFamilyInfo[]
): ReadonlyMap<string, number> {
  return families
    .flatMap((family) => [
      ...(family.partneringFamilyInfo?.openV1Case
        ? [family.partneringFamilyInfo.openV1Case]
        : []),
      ...(family.partneringFamilyInfo?.closedV1Cases ?? []),
    ])
    .flatMap((v1Case) => v1Case.arrangements ?? [])
    .reduce(
      (counts, arrangement) =>
        counts.set(
          arrangement.arrangementType,
          (counts.get(arrangement.arrangementType) ?? 0) + 1
        ),
      new Map<string, number>()
    );
}

/**
 * Explains why an arrangement type cannot be deleted, or returns undefined when it can.
 * Removing a type that existing arrangements use is rejected by the server, because those
 * arrangements could no longer be evaluated against their policy.
 */
export function arrangementTypeDeleteBlockedReason(
  arrangementType: string,
  arrangementCount: number
): string | undefined {
  if (arrangementCount <= 0) return undefined;
  const arrangements =
    arrangementCount === 1
      ? '1 existing arrangement uses'
      : `${arrangementCount} existing arrangements use`;
  return `${arrangements} ${arrangementType}, so it cannot be deleted. Mark it as superseded or change those arrangements to another type first.`;
}

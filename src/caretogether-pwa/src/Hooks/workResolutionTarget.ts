import type { IMissingArrangementRequirement } from '../GeneratedClient';

export function uniqueMatch<T>(
  items: readonly T[],
  matches: (item: T) => boolean
) {
  const found = items.filter(matches);
  return found.length === 1 ? found[0] : undefined;
}

export type ArrangementRequirementTarget = {
  actionName: string;
  date: string;
  arrangementFunction?: string;
  arrangementFunctionVariant?: string;
  volunteerFamilyId?: string;
  personId?: string;
};

export function arrangementRequirementQuery(
  target: ArrangementRequirementTarget
) {
  return JSON.stringify([
    target.actionName,
    target.date,
    target.arrangementFunction ?? null,
    target.arrangementFunctionVariant ?? null,
    target.volunteerFamilyId ?? null,
    target.personId ?? null,
  ]);
}

export function findArrangementRequirement(
  rows: readonly IMissingArrangementRequirement[],
  query: string
) {
  return uniqueMatch(rows, (row) => {
    const date = row.dueBy ?? row.pastDueSince;
    if (
      !row.action?.isRequired ||
      !row.action.actionName ||
      !date ||
      !Number.isFinite(date.getTime())
    )
      return false;
    return (
      query ===
      arrangementRequirementQuery({
        actionName: row.action.actionName,
        date: date.toISOString().slice(0, 10),
        arrangementFunction: row.arrangementFunction,
        arrangementFunctionVariant: row.arrangementFunctionVariant,
        volunteerFamilyId: row.volunteerFamilyId,
        personId: row.personId,
      })
    );
  });
}

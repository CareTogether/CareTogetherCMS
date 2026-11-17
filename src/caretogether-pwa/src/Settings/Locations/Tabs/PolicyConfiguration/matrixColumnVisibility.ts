import type { GridColumnVisibilityModel } from '@mui/x-data-grid-premium';
import type { MatrixScope } from './casePolicyMatrix.ts';

export type ArrangementColumns = {
  id: string;
  name: string;
  fields: string[];
};

export function arrangementColumns(
  scopes: readonly MatrixScope[]
): ArrangementColumns[] {
  const groups = new Map<string, ArrangementColumns>();
  for (const scope of scopes) {
    const id = JSON.stringify(['arrangement', scope.arrangement]);
    const group = groups.get(id) ?? { id, name: scope.arrangement, fields: [] };
    if (!group.fields.includes(scope.field)) group.fields.push(scope.field);
    groups.set(id, group);
  }
  return [...groups.values()];
}

export function reconcileHiddenArrangements(
  hidden: ReadonlySet<string>,
  groups: readonly ArrangementColumns[]
): ReadonlySet<string> {
  const ids = new Set(groups.map((group) => group.id));
  if ([...hidden].every((id) => ids.has(id))) return hidden;
  return new Set([...hidden].filter((id) => ids.has(id)));
}

export function toggleArrangementVisibility(
  hidden: ReadonlySet<string>,
  id: string
): ReadonlySet<string> {
  const next = new Set(hidden);
  if (next.has(id)) next.delete(id);
  else next.add(id);
  return next;
}

export function arrangementVisibilityModel(
  groups: readonly ArrangementColumns[],
  hidden: ReadonlySet<string>
): GridColumnVisibilityModel {
  return Object.fromEntries([
    ...groups.flatMap((group) =>
      group.fields
        .filter((field) => field !== 'actionName')
        .map((field) => [field, !hidden.has(group.id)])
    ),
    ['actionName', true],
  ]);
}

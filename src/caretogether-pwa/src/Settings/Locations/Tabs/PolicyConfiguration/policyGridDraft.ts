import type { GridApiPremium } from '@mui/x-data-grid-premium';

export function discardPolicyGridCellEdits(api: GridApiPremium) {
  for (const id of api.getAllRowIds())
    for (const { field } of api.getAllColumns())
      if (api.getCellMode(id, field) === 'edit')
        api.stopCellEditMode({ id, field, ignoreModifications: true });
}

export function samePolicyGridValue<T>(left: T, right: T) {
  return JSON.stringify(left) === JSON.stringify(right);
}

export function countPolicyGridChanges<T>(base: T, value: T): number {
  function count(left: unknown, right: unknown): number {
    if (left === right) return 0;
    if (
      left === null ||
      right === null ||
      typeof left !== 'object' ||
      typeof right !== 'object'
    )
      return 1;
    if (Array.isArray(left) && Array.isArray(right)) {
      const actionKey = (
        item: { actionName?: string; action?: { actionName?: string } } | null
      ) => item?.actionName ?? item?.action?.actionName;
      const beforeKeys = left.map(actionKey);
      const afterKeys = right.map(actionKey);
      if (
        [...beforeKeys, ...afterKeys].every((key) => typeof key === 'string') &&
        new Set(beforeKeys).size === left.length &&
        new Set(afterKeys).size === right.length
      ) {
        const before = new Map(
          left.map((item, index) => [beforeKeys[index], item])
        );
        const after = new Map(
          right.map((item, index) => [afterKeys[index], item])
        );
        const changes = [
          ...new Set([...before.keys(), ...after.keys()]),
        ].reduce(
          (total, key) => total + count(before.get(key), after.get(key)),
          0
        );
        return (
          changes ||
          (JSON.stringify(beforeKeys) === JSON.stringify(afterKeys) ? 0 : 1)
        );
      }
    }
    const before = left as Record<string, unknown>;
    const after = right as Record<string, unknown>;
    return [...new Set([...Object.keys(before), ...Object.keys(after)])].reduce(
      (total, key) => total + count(before[key], after[key]),
      0
    );
  }
  const before = JSON.stringify(base);
  const after = JSON.stringify(value);
  if (before === after) return 0;
  return Math.max(
    1,
    count(
      before === undefined ? undefined : JSON.parse(before),
      after === undefined ? undefined : JSON.parse(after)
    )
  );
}

export type PolicyGridDraft<T> = {
  scope: string;
  loaded: T;
  base: T;
  value: T;
};

export function createPolicyGridDraft<T>(
  value: T,
  scope: string
): PolicyGridDraft<T> {
  return { scope, loaded: value, base: value, value };
}

export function policyGridHasChanges<T>(draft: PolicyGridDraft<T>) {
  return !samePolicyGridValue(draft.base, draft.value);
}

export function resolvePolicyGridDraft<T>(
  draft: PolicyGridDraft<T>,
  loaded: T,
  scope: string
) {
  if (
    draft.scope !== scope ||
    (!policyGridHasChanges(draft) && !samePolicyGridValue(draft.loaded, loaded))
  )
    return createPolicyGridDraft(loaded, scope);
  return draft;
}

export async function savePolicyGridDraft<T>(
  draft: PolicyGridDraft<T>,
  loaded: T,
  save: (value: T) => Promise<boolean>
) {
  if (!policyGridHasChanges(draft)) return draft;
  if (!samePolicyGridValue(draft.loaded, loaded))
    throw new Error(
      'The loaded policy changed while you were editing. Your draft is retained. Cancel and review the latest values before editing again.'
    );
  if (!(await save(draft.value)))
    throw new Error(
      'Changes could not be saved. Your draft is retained. Review the policy errors and try again.'
    );
  return { ...draft, base: draft.value };
}

import type { ActionRequirement, EffectiveLocationPolicy } from '../GeneratedClient';

export function normalizeActionDefinitionOrder(
  actionDefinitions?: Record<string, ActionRequirement>,
  actionDefinitionOrder?: string[]
): string[] {
  const definitions = actionDefinitions ?? {};
  const remainingNames = new Set(Object.keys(definitions));
  const normalizedOrder: string[] = [];

  for (const actionName of actionDefinitionOrder ?? []) {
    if (remainingNames.delete(actionName)) {
      normalizedOrder.push(actionName);
    }
  }

  for (const actionName of Object.keys(definitions)) {
    if (remainingNames.delete(actionName)) {
      normalizedOrder.push(actionName);
    }
  }

  return normalizedOrder;
}

export function getOrderedActionDefinitionEntries(
  policy?: Pick<EffectiveLocationPolicy, 'actionDefinitions' | 'actionDefinitionOrder'> | null
): Array<[string, ActionRequirement]> {
  const actionDefinitions = policy?.actionDefinitions ?? {};
  const order = normalizeActionDefinitionOrder(
    actionDefinitions,
    policy?.actionDefinitionOrder
  );

  return order
    .map((actionName) => [actionName, actionDefinitions[actionName]] as const)
    .filter((entry): entry is [string, ActionRequirement] => Boolean(entry[1]));
}

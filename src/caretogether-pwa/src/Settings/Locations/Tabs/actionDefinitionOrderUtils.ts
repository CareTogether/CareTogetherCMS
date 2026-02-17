import type { ActionRequirement } from '../../../GeneratedClient';
import { normalizeActionDefinitionOrder } from '../../../Model/ActionDefinitionOrder';

export function getUpdatedActionDefinitionOrder(params: {
  currentActionDefinitions?: Record<string, ActionRequirement>;
  currentActionDefinitionOrder?: string[];
  updatedActionDefinitions: Record<string, ActionRequirement>;
  originalActionName?: string;
  newActionName: string;
}): string[] {
  const {
    currentActionDefinitions,
    currentActionDefinitionOrder,
    updatedActionDefinitions,
    originalActionName,
    newActionName,
  } = params;

  const currentOrder = normalizeActionDefinitionOrder(
    currentActionDefinitions,
    currentActionDefinitionOrder
  );

  let nextOrder = currentOrder;
  if (originalActionName && originalActionName !== newActionName) {
    const originalIndex = currentOrder.indexOf(originalActionName);
    const withoutOriginal = currentOrder.filter(
      (actionName) => actionName !== originalActionName
    );

    if (originalIndex >= 0) {
      nextOrder = [
        ...withoutOriginal.slice(0, originalIndex),
        newActionName,
        ...withoutOriginal.slice(originalIndex),
      ];
    } else {
      nextOrder = [...withoutOriginal, newActionName];
    }
  } else if (!currentOrder.includes(newActionName)) {
    nextOrder = [...currentOrder, newActionName];
  }

  return normalizeActionDefinitionOrder(updatedActionDefinitions, nextOrder);
}

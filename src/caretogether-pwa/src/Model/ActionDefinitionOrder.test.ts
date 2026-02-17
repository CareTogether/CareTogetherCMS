import type { ActionRequirement } from '../GeneratedClient';
import {
  getOrderedActionDefinitionEntries,
  normalizeActionDefinitionOrder,
} from './ActionDefinitionOrder';

function req(): ActionRequirement {
  return {} as ActionRequirement;
}

describe('ActionDefinitionOrder', () => {
  test('normalize uses provided order, removes stale/duplicates, appends missing', () => {
    const actionDefinitions = {
      A: req(),
      B: req(),
      C: req(),
    };

    const normalized = normalizeActionDefinitionOrder(actionDefinitions, [
      'B',
      'Missing',
      'B',
    ]);

    expect(normalized).toEqual(['B', 'A', 'C']);
  });

  test('getOrderedActionDefinitionEntries follows normalized order', () => {
    const actionDefinitions = {
      First: req(),
      Second: req(),
      Third: req(),
    };

    const entries = getOrderedActionDefinitionEntries({
      actionDefinitions,
      actionDefinitionOrder: ['Third', 'First'],
    });

    expect(entries.map(([name]) => name)).toEqual(['Third', 'First', 'Second']);
  });
});

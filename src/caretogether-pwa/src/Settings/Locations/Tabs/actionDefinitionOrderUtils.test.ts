import type { ActionRequirement } from '../../../GeneratedClient';
import { getUpdatedActionDefinitionOrder } from './actionDefinitionOrderUtils';

function req(): ActionRequirement {
  return {} as ActionRequirement;
}

describe('getUpdatedActionDefinitionOrder', () => {
  test('appends new action on create', () => {
    const result = getUpdatedActionDefinitionOrder({
      currentActionDefinitions: { A: req(), B: req() },
      currentActionDefinitionOrder: ['A', 'B'],
      updatedActionDefinitions: { A: req(), B: req(), C: req() },
      newActionName: 'C',
    });

    expect(result).toEqual(['A', 'B', 'C']);
  });

  test('keeps position when action is renamed', () => {
    const result = getUpdatedActionDefinitionOrder({
      currentActionDefinitions: { A: req(), B: req(), C: req() },
      currentActionDefinitionOrder: ['A', 'B', 'C'],
      updatedActionDefinitions: { A: req(), Z: req(), C: req() },
      originalActionName: 'B',
      newActionName: 'Z',
    });

    expect(result).toEqual(['A', 'Z', 'C']);
  });

  test('preserves order for same-name edits', () => {
    const result = getUpdatedActionDefinitionOrder({
      currentActionDefinitions: { A: req(), B: req() },
      currentActionDefinitionOrder: ['B', 'A'],
      updatedActionDefinitions: { A: req(), B: req() },
      originalActionName: 'B',
      newActionName: 'B',
    });

    expect(result).toEqual(['B', 'A']);
  });
});

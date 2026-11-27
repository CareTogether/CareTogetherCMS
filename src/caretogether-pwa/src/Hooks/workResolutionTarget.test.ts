import assert from 'node:assert/strict';
import test from 'node:test';
import type { IMissingArrangementRequirement } from '../GeneratedClient';
import {
  arrangementRequirementQuery,
  findArrangementRequirement,
} from './workResolutionTarget.ts';

test('arrangement links distinguish assignment and occurrence and reject duplicates', () => {
  const date = new Date('2026-11-26');
  const action = {
    actionName: 'Check',
    isRequired: true,
  } as IMissingArrangementRequirement['action'];
  const context = {
    arrangementFunction: 'Visit',
    volunteerFamilyId: 'volunteer',
    personId: 'member',
  };
  const target = arrangementRequirementQuery({
    actionName: 'Check',
    date: '2026-11-26',
    ...context,
  });
  const upcoming = {
    action,
    dueBy: date,
    ...context,
  } satisfies IMissingArrangementRequirement;
  const overdue = { ...upcoming, dueBy: undefined, pastDueSince: date };
  const other = { ...upcoming, personId: 'other' };
  assert.equal(findArrangementRequirement([other, upcoming], target), upcoming);
  assert.equal(findArrangementRequirement([other, overdue], target), overdue);
  assert.equal(
    findArrangementRequirement([upcoming, { ...upcoming }], target),
    undefined
  );
  assert.equal(findArrangementRequirement([other], target), undefined);
  assert.equal(findArrangementRequirement([upcoming], 'invalid'), undefined);
});

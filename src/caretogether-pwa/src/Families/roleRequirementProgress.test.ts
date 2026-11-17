import assert from 'node:assert/strict';
import test from 'node:test';
import { roleRequirementProgress } from './roleRequirementProgress.ts';

test('counts completed, exempted and expiring as done', () => {
  assert.deepEqual(
    roleRequirementProgress([
      { status: 'completed' },
      { status: 'exempted' },
      { status: 'expiring' },
      { status: 'missing' },
      { status: 'expired' },
      { status: 'availableApplication' },
    ]),
    { done: 3, total: 6, percentage: 50 }
  );
});

test('leaves optional requirements out of the total', () => {
  assert.deepEqual(
    roleRequirementProgress([{ status: 'completed' }, { status: 'optional' }]),
    { done: 1, total: 1, percentage: 100 }
  );
});

test('reports no progress when there is nothing to count', () => {
  assert.deepEqual(roleRequirementProgress([]), {
    done: 0,
    total: 0,
    percentage: 0,
  });
});

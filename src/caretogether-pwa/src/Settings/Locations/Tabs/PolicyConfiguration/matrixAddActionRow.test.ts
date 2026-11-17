import assert from 'node:assert/strict';
import test from 'node:test';
import { matrixAddActionRowId } from './matrixAddActionRow.ts';

test('control row identity is stable independently of action ordering or filtering', () => {
  assert.equal(matrixAddActionRowId([]), '__case_policy_add_action__');
  assert.equal(
    matrixAddActionRowId(['One', 'Two']),
    matrixAddActionRowId(['Two', 'One'])
  );
});

test('reserved control identities cannot collide with action-name row identities', () => {
  const names = Array.from(
    { length: 10 },
    (_, index) => '__case_policy_add_action__' + '_'.repeat(index)
  );
  const id = matrixAddActionRowId(names);
  assert.equal(names.includes(id), false);
  assert.equal(id, '__case_policy_add_action__' + '_'.repeat(10));
});

test('reserving a UI identity never mutates the real action catalog', () => {
  const names = Object.freeze([
    '__case_policy_add_action__',
    '__proto__',
    'constructor',
    '',
  ]);
  const before = [...names];
  assert.equal(matrixAddActionRowId(names), '__case_policy_add_action___');
  assert.deepEqual(names, before);
});

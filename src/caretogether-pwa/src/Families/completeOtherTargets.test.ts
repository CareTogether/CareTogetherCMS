import assert from 'node:assert/strict';
import test from 'node:test';
import {
  FAMILY_TARGET_KEY,
  completeOtherTargetOptions,
  completeOtherTargetsFromKeys,
  initialCompleteOtherTargetKeys,
  toggleCompleteOtherTargetKey,
} from './completeOtherTargets.ts';

test('lists the family first, then each active adult', () => {
  const options = completeOtherTargetOptions([
    { id: 'p1', active: true, firstName: 'Berrin', lastName: 'Brambleswift' },
    { id: 'p2', active: false, firstName: 'Gone', lastName: 'Person' },
    { id: 'p3', active: true, firstName: 'Elda' },
    { active: true, firstName: 'No', lastName: 'Id' },
  ]);

  assert.deepEqual(options, [
    { key: FAMILY_TARGET_KEY, label: 'Family' },
    { key: 'p1', label: 'Berrin Brambleswift' },
    { key: 'p3', label: 'Elda' },
  ]);
});

test('starts with the person when opened for one person', () => {
  assert.deepEqual(
    initialCompleteOtherTargetKeys({
      kind: 'Individual Volunteer',
      volunteerFamilyId: 'f1',
      personId: 'p1',
    }),
    ['p1']
  );
});

test('starts with the family when opened for the family', () => {
  assert.deepEqual(
    initialCompleteOtherTargetKeys({
      kind: 'Volunteer Family',
      volunteerFamilyId: 'f1',
    }),
    [FAMILY_TARGET_KEY]
  );
});

test('splits checked keys into the family flag and person ids', () => {
  assert.deepEqual(
    completeOtherTargetsFromKeys(['p1', FAMILY_TARGET_KEY, 'p2']),
    { family: true, personIds: ['p1', 'p2'] }
  );
  assert.deepEqual(completeOtherTargetsFromKeys(['p2']), {
    family: false,
    personIds: ['p2'],
  });
});

test('toggles a key without duplicates', () => {
  assert.deepEqual(toggleCompleteOtherTargetKey(['a'], 'a', true), ['a']);
  assert.deepEqual(toggleCompleteOtherTargetKey(['a'], 'b', true), ['a', 'b']);
  assert.deepEqual(toggleCompleteOtherTargetKey(['a', 'b'], 'a', false), ['b']);
});

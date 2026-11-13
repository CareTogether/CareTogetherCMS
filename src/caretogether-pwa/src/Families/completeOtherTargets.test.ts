import assert from 'node:assert/strict';
import test from 'node:test';
import {
  FAMILY_TARGET_KEY,
  completeOtherTargetKeysForSubject,
  completeOtherTargetOptions,
  completeOtherTargetsFromKeys,
  toggleCompleteOtherTargetKey,
  unsavedCompleteOtherTargets,
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

test('skips targets saved by an earlier attempt', () => {
  assert.deepEqual(
    unsavedCompleteOtherTargets({ family: true, personIds: ['p1', 'p2'] }, [
      FAMILY_TARGET_KEY,
      'p1',
    ]),
    { family: false, personIds: ['p2'] }
  );
});

test('starts with the target matching where it was opened', () => {
  assert.deepEqual(
    completeOtherTargetKeysForSubject({ scope: 'family', id: 'f1' }),
    [FAMILY_TARGET_KEY]
  );
  assert.deepEqual(
    completeOtherTargetKeysForSubject({ scope: 'person', id: 'p1' }),
    ['p1']
  );
});

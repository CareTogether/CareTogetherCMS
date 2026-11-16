import assert from 'node:assert/strict';
import test from 'node:test';
import {
  mergeMonitoringRequirements,
  mergeRequirements,
} from './requirementLists.ts';

const required = (actionName: string) => ({ actionName, isRequired: true });
const optional = (actionName: string) => ({ actionName, isRequired: false });

test('keeps legacy names when the new list also has entries', () => {
  const merged = mergeRequirements(
    ['Handoff from Intake to Support Coach'],
    [optional('Media Consent')],
    undefined,
    required
  );

  assert.deepEqual(merged, [
    required('Handoff from Intake to Support Coach'),
    optional('Media Consent'),
  ]);
});

test('includes requirements only present in the evaluated list', () => {
  const merged = mergeRequirements(
    [],
    [required('A')],
    [required('A'), required('B')],
    required
  );

  assert.deepEqual(merged, [required('A'), required('B')]);
});

test('lists each action once, keeping the first definition', () => {
  const merged = mergeRequirements(
    ['A'],
    [optional('A'), optional('B')],
    [required('A'), required('B')],
    required
  );

  assert.deepEqual(merged, [required('A'), optional('B')]);
});

test('handles missing lists', () => {
  assert.deepEqual(
    mergeRequirements(undefined, undefined, undefined, required),
    []
  );
});

test('merges legacy monitoring requirements with new ones', () => {
  const recurrence = { delay: '7.00:00:00' };
  const merged = mergeMonitoringRequirements(
    [{ actionName: 'Home Visit', recurrence }],
    [{ action: optional('Check-in'), recurrence }],
    [{ action: required('Home Visit'), recurrence }],
    (legacy) => ({ action: required(legacy.actionName), recurrence })
  );

  assert.deepEqual(merged, [
    { action: required('Home Visit'), recurrence },
    { action: optional('Check-in'), recurrence },
  ]);
});

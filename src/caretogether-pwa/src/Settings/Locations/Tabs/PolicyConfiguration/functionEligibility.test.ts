import assert from 'node:assert/strict';
import test from 'node:test';
import { functionEligibility } from './functionEligibility.ts';

test('removing the final explicit role or person preserves an explicit empty collection', () => {
  assert.deepEqual(functionEligibility(['configured'], [], true), []);
  assert.deepEqual(functionEligibility([], [], false), []);
});

test('unchanged inherited collections stay inherited while explicit edits remain explicit', () => {
  assert.equal(functionEligibility(undefined, [], false), undefined);
  assert.equal(functionEligibility(null, [], false), undefined);
  assert.deepEqual(functionEligibility(undefined, ['selected'], true), [
    'selected',
  ]);
  assert.deepEqual(functionEligibility(undefined, [], true), []);
});

test('unchanged explicit eligibility preserves values without mutating its source', () => {
  const original = Object.freeze(['configured']);
  assert.deepEqual(functionEligibility(original, ['configured'], false), [
    'configured',
  ]);
  assert.deepEqual(original, ['configured']);
});

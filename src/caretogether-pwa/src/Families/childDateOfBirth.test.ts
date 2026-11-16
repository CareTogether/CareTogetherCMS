import assert from 'node:assert/strict';
import test from 'node:test';
import type { CombinedFamilyInfo } from '../GeneratedClient.ts';
import {
  canSubmitChildDateOfBirth,
  isClientOnlyFamily,
} from './childDateOfBirth.ts';

function family(markers: object): CombinedFamilyInfo {
  return markers as CombinedFamilyInfo;
}

const client = family({ partneringFamilyInfo: {} });
const now = new Date(2026, 5, 15, 12);

test('client markers allow unknown DOB without requiring an active case', () => {
  for (const partneringFamilyInfo of [
    {},
    { closedV1Cases: [] },
    { closedV1Cases: [{ id: 'historical-case' }] },
    { openV1Case: { id: 'active-case' } },
  ]) {
    const candidate = family({ partneringFamilyInfo });
    assert.equal(isClientOnlyFamily(candidate), true);
    assert.equal(canSubmitChildDateOfBirth(candidate, null, false, now), true);
  }
});

test('volunteer, dual-role and unclassified families still require DOB', () => {
  for (const candidate of [
    family({ volunteerFamilyInfo: {} }),
    family({ partneringFamilyInfo: {}, volunteerFamilyInfo: {} }),
    family({}),
  ]) {
    assert.equal(isClientOnlyFamily(candidate), false);
    assert.equal(canSubmitChildDateOfBirth(candidate, null, false, now), false);
    assert.equal(
      canSubmitChildDateOfBirth(candidate, new Date(2020, 0, 1), false, now),
      true
    );
  }
});

test('malformed, incomplete and out-of-range dates cannot be submitted', () => {
  assert.equal(
    canSubmitChildDateOfBirth(client, new Date(NaN), false, now),
    false
  );
  assert.equal(canSubmitChildDateOfBirth(client, null, true, now), false);
  assert.equal(
    canSubmitChildDateOfBirth(client, new Date(2020, 0, 1), true, now),
    false
  );
  assert.equal(
    canSubmitChildDateOfBirth(client, new Date(1899, 11, 31), false, now),
    false
  );
  assert.equal(
    canSubmitChildDateOfBirth(client, new Date(2026, 5, 16), false, now),
    false
  );
  assert.equal(canSubmitChildDateOfBirth(client, now, false, now), true);
});

test('submission does not introduce a new age-limit rule', () => {
  assert.equal(
    canSubmitChildDateOfBirth(client, new Date(1900, 0, 1), false, now),
    true
  );
});

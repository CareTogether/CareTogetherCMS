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

test('client markers allow unknown DOB without requiring an active case', () => {
  for (const partneringFamilyInfo of [
    {},
    { closedV1Cases: [] },
    { closedV1Cases: [{ id: 'historical-case' }] },
    { openV1Case: { id: 'active-case' } },
  ]) {
    const candidate = family({ partneringFamilyInfo });
    assert.equal(isClientOnlyFamily(candidate), true);
    assert.equal(canSubmitChildDateOfBirth(candidate, null, false), true);
  }
});

test('volunteer, dual-role and unclassified families still require DOB', () => {
  for (const candidate of [
    family({ volunteerFamilyInfo: {} }),
    family({ partneringFamilyInfo: {}, volunteerFamilyInfo: {} }),
    family({}),
  ]) {
    assert.equal(isClientOnlyFamily(candidate), false);
    assert.equal(canSubmitChildDateOfBirth(candidate, null, false), false);
    assert.equal(
      canSubmitChildDateOfBirth(candidate, new Date(2020, 0, 1), false),
      true
    );
  }
});

test('picker errors and invalid dates cannot be submitted', () => {
  assert.equal(canSubmitChildDateOfBirth(client, new Date(NaN), false), false);
  assert.equal(canSubmitChildDateOfBirth(client, null, true), false);
  assert.equal(
    canSubmitChildDateOfBirth(client, new Date(2020, 0, 1), true),
    false
  );
});

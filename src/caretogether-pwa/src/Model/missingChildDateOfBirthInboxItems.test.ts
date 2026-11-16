import assert from 'node:assert/strict';
import test from 'node:test';
import type { CombinedFamilyInfo, ExactAge } from '../GeneratedClient.ts';
import { missingChildDateOfBirthInboxItemsForFamilies } from './missingChildDateOfBirthInboxItems.ts';

function family(
  children: object[],
  markers: object = { partneringFamilyInfo: {} }
) {
  return {
    ...markers,
    family: {
      id: 'family-1',
      adults: [{ item1: { id: 'adult-1', active: true } }],
      children,
    },
  } as unknown as CombinedFamilyInfo;
}

test('warns for each active child with a missing age', () => {
  const candidate = family([
    { id: 'child-1', active: true },
    { id: 'child-2', active: true, age: null },
  ]);
  const items = missingChildDateOfBirthInboxItemsForFamilies([candidate]);
  assert.deepEqual(
    items.map((item) => item.child.id),
    ['child-1', 'child-2']
  );
  assert.equal(items[0].type, 'MissingChildDateOfBirth');
  assert.equal(items[0].family, candidate);
});

test('ignores inactive children and known or redacted ages', () => {
  const candidate = family([
    { id: 'inactive', active: false },
    { id: 'unknown-active-status' },
    {
      id: 'exact',
      active: true,
      age: { _discriminator: 'ExactAge', dateOfBirth: new Date(2020, 0, 1) },
    },
    {
      id: 'redacted',
      active: true,
      age: { _discriminator: 'AgeInYears', years: 6, asOf: new Date() },
    },
  ]);
  assert.deepEqual(
    missingChildDateOfBirthInboxItemsForFamilies([candidate]),
    []
  );
});

test('warns regardless of family type', () => {
  for (const markers of [
    { partneringFamilyInfo: {} },
    { volunteerFamilyInfo: {} },
    { partneringFamilyInfo: {}, volunteerFamilyInfo: {} },
    {},
  ]) {
    assert.equal(
      missingChildDateOfBirthInboxItemsForFamilies([
        family([{ id: 'child', active: true }], markers),
      ]).length,
      1
    );
  }
});

test('resolves after age is supplied and remains visible to read-only users', () => {
  const candidate = family([{ id: 'child', active: true }]);
  candidate.userPermissions = [];
  assert.equal(
    missingChildDateOfBirthInboxItemsForFamilies([candidate]).length,
    1
  );
  candidate.family!.children![0].age = {
    dateOfBirth: new Date(2020, 0, 1),
  } as ExactAge;
  assert.deepEqual(
    missingChildDateOfBirthInboxItemsForFamilies([candidate]),
    []
  );
});

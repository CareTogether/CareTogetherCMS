import assert from 'node:assert/strict';
import test from 'node:test';
import type { CombinedFamilyInfo } from '../../../../GeneratedClient.ts';
import {
  arrangementTypeDeleteBlockedReason,
  countArrangementsByType,
} from './arrangementTypeUsage.ts';

function family(
  openTypes: string[] | undefined,
  closedTypes: string[][] = []
): CombinedFamilyInfo {
  const v1Case = (types: string[]) => ({
    arrangements: types.map((arrangementType) => ({ arrangementType })),
  });
  return {
    partneringFamilyInfo: {
      openV1Case: openTypes ? v1Case(openTypes) : undefined,
      closedV1Cases: closedTypes.map(v1Case),
    },
  } as unknown as CombinedFamilyInfo;
}

test('counts arrangements in open and closed cases by type', () => {
  const counts = countArrangementsByType([
    family(['Recurring Hosting', 'Hosting'], [['Recurring Hosting']]),
    family(undefined, [['Recurring Hosting'], ['Friending']]),
  ]);

  assert.equal(counts.get('Recurring Hosting'), 3);
  assert.equal(counts.get('Hosting'), 1);
  assert.equal(counts.get('Friending'), 1);
  assert.equal(counts.get('Unused'), undefined);
});

test('ignores families that are not partnering families', () => {
  const counts = countArrangementsByType([
    {} as CombinedFamilyInfo,
    family(['Hosting']),
  ]);

  assert.deepEqual([...counts], [['Hosting', 1]]);
});

test('allows deleting an arrangement type nobody uses', () => {
  assert.equal(arrangementTypeDeleteBlockedReason('Hosting', 0), undefined);
});

test('blocks deleting an arrangement type in use', () => {
  assert.equal(
    arrangementTypeDeleteBlockedReason('Recurring Hosting', 9),
    '9 existing arrangements use Recurring Hosting, so it cannot be deleted. Mark it as superseded or change those arrangements to another type first.'
  );
  assert.match(
    arrangementTypeDeleteBlockedReason('Hosting', 1) ?? '',
    /^1 existing arrangement uses Hosting,/
  );
});

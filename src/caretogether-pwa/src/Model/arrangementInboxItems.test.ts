import assert from 'node:assert/strict';
import test from 'node:test';
import type { CombinedFamilyInfo } from '../GeneratedClient.ts';
import { arrangementInboxItemsForFamilies } from './arrangementInboxItems.ts';

const phases = { settingUp: 10, readyToStart: 20, started: 30 };

function familyWithCases({
  openArrangements = [],
  closedArrangements = [],
}: {
  openArrangements?: object[];
  closedArrangements?: object[];
}): CombinedFamilyInfo {
  return {
    family: { id: 'family-1', children: [{ id: 'child-1' }] },
    partneringFamilyInfo: {
      openV1Case: { id: 'open-case', arrangements: openArrangements },
      closedV1Cases: [
        { id: 'closed-case', arrangements: closedArrangements },
      ],
    },
  } as unknown as CombinedFamilyInfo;
}

function arrangement(id: string, phase: number, plannedStartUtc?: Date) {
  return {
    id,
    phase,
    plannedStartUtc,
    partneringFamilyPersonId: 'child-1',
    arrangementType: 'Respite',
  };
}

test('warns for each ongoing arrangement in a closed case regardless of date', () => {
  const items = arrangementInboxItemsForFamilies(
    [
      familyWithCases({
        closedArrangements: [
          arrangement('setting-up', phases.settingUp),
          arrangement(
            'ready-future',
            phases.readyToStart,
            new Date('2099-01-01T00:00:00Z')
          ),
          arrangement('started', phases.started),
        ],
      }),
    ],
    phases,
    new Date('2026-10-02T12:00:00Z')
  );

  assert.deepEqual(
    items.map((item) => [item.type, item.arrangementId, item.v1CaseId]),
    [
      ['ClosedCaseInvalidArrangementStatus', 'setting-up', 'closed-case'],
      ['ClosedCaseInvalidArrangementStatus', 'ready-future', 'closed-case'],
      ['ClosedCaseInvalidArrangementStatus', 'started', 'closed-case'],
    ]
  );
  assert.equal(items[0].family.family?.id, 'family-1');
  assert.equal(items[0].child.id, 'child-1');
});

test('excludes ended and cancelled closed arrangements and avoids duplicate due warnings', () => {
  const items = arrangementInboxItemsForFamilies(
    [
      familyWithCases({
        openArrangements: [
          arrangement(
            'open-due',
            phases.readyToStart,
            new Date('2026-10-02T10:00:00Z')
          ),
        ],
        closedArrangements: [
          arrangement(
            'closed-due',
            phases.readyToStart,
            new Date('2026-10-02T10:00:00Z')
          ),
          arrangement('ended', 40),
          arrangement('cancelled', 50),
        ],
      }),
    ],
    phases,
    new Date('2026-10-02T12:00:00Z')
  );

  assert.deepEqual(
    items.map((item) => [item.type, item.arrangementId, item.v1CaseId]),
    [
      ['ArrangementDueToStart', 'open-due', 'open-case'],
      [
        'ClosedCaseInvalidArrangementStatus',
        'closed-due',
        'closed-case',
      ],
    ]
  );
});

import assert from 'node:assert/strict';
import test from 'node:test';
import type { CombinedFamilyInfo } from '../GeneratedClient';
import { buildArrangementWorkQueue } from './arrangementWorkQueue.ts';
import { selectDashboardRequirements } from './dashboardRequirements.ts';
import {
  partitionSnoozed,
  removeSnooze,
  writeSnooze,
} from './dashboardSnoozes.ts';

const scope = { organizationId: 'organization', locationId: 'location' };
const snoozeScope = { ...scope, userId: 'user' };
const action = { actionName: 'Safety visit', isRequired: true };

function family(requirements: object[]) {
  return {
    family: { id: 'family' },
    partneringFamilyInfo: {
      openV1Case: {
        id: 'case',
        arrangements: [
          { id: 'arrangement', missingRequirements: requirements },
        ],
      },
    },
  } as unknown as CombinedFamilyInfo;
}

function storage() {
  const values = new Map<string, string>();
  return {
    values,
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => {
      values.set(key, value);
    },
    removeItem: (key: string) => {
      values.delete(key);
    },
  };
}

function project(
  requirements: object[],
  now: number,
  local: ReturnType<typeof storage>
) {
  const items = buildArrangementWorkQueue(scope, [family(requirements)]);
  const partition = partitionSnoozed(
    items,
    ({ snoozeToken }) => snoozeToken,
    snoozeScope,
    now,
    local
  );
  return {
    ...partition,
    visible: selectDashboardRequirements(partition.active, '2026-12-01', {
      upcomingDays: 30,
      pastDueDays: 'all',
    }),
  };
}

test('only authoritative arrangement-level tokens make requirements snoozable', () => {
  const items = buildArrangementWorkQueue(scope, [
    family([
      { action, dueBy: new Date('2026-12-02'), snoozeEpisodeToken: 'episode' },
      { action, dueBy: new Date('2026-12-03'), snoozeEpisodeToken: ' ' },
      { action, dueBy: new Date('2026-12-04') },
      {
        action,
        dueBy: new Date('2026-12-05'),
        arrangementFunction: 'Host',
        volunteerFamilyId: 'volunteer',
        snoozeEpisodeToken: 'assignment',
      },
    ]),
  ]);
  assert.deepEqual(
    items.map(({ snoozeToken }) => snoozeToken),
    ['episode', undefined, undefined, undefined]
  );
});

test('snoozed requirements leave active counts, keep their occurrence when overdue, wake, and restore', () => {
  const local = storage();
  const upcoming = {
    action,
    dueBy: new Date('2026-12-02'),
    snoozeEpisodeToken: 'episode',
  };
  const legacy = { action, dueBy: new Date('2026-12-03') };
  assert.equal(writeSnooze(snoozeScope, 'episode', 500, 100, local), true);
  assert.deepEqual([...local.values.values()], ['500']);
  assert.ok([...local.values.keys()].every((key) => !key.includes('Safety')));

  const snoozed = project([upcoming, legacy], 100, local);
  assert.deepEqual(
    snoozed.snoozed.map(({ token, wakeAt }) => [token, wakeAt]),
    [['episode', 500]]
  );
  assert.equal(snoozed.nextWake, 500);
  assert.deepEqual(
    snoozed.visible.upcoming.map(({ item }) => item.occurrenceDate),
    ['2026-12-03']
  );

  const overdue = project(
    [
      {
        action,
        pastDueSince: new Date('2026-12-02'),
        snoozeEpisodeToken: 'episode',
      },
    ],
    200,
    local
  );
  assert.equal(overdue.snoozed.length, 1);
  assert.equal(overdue.visible.pastDue.length, 0);

  const reactivated = project(
    [
      {
        action,
        pastDueSince: new Date('2026-12-02'),
        snoozeEpisodeToken: 'reactivated',
      },
    ],
    200,
    local
  );
  assert.equal(reactivated.visible.pastDue.length, 1);

  assert.equal(project([upcoming], 500, local).visible.upcoming.length, 1);
  assert.equal(removeSnooze(snoozeScope, 'episode', local), true);
  assert.equal(project([upcoming], 100, local).visible.upcoming.length, 1);
});

test('identical display rows with distinct tokens stay independently actionable', () => {
  const local = storage();
  const rows = [
    { action, dueBy: new Date('2026-12-02'), snoozeEpisodeToken: 'first' },
    { action, dueBy: new Date('2026-12-02'), snoozeEpisodeToken: 'second' },
  ];
  const before = project(rows, 100, local);
  assert.deepEqual(
    before.visible.upcoming.map(({ item, count }) => [item.snoozeToken, count]),
    [
      ['first', 1],
      ['second', 1],
    ]
  );
  writeSnooze(snoozeScope, 'first', 500, 100, local);
  assert.deepEqual(
    project(rows, 100, local).visible.upcoming.map(
      ({ item }) => item.snoozeToken
    ),
    ['second']
  );
});

test('requirement snoozes respect the requirement windows and other users and locations', () => {
  const local = storage();
  writeSnooze(snoozeScope, 'episode', 500, 100, local);
  const far = {
    action,
    dueBy: new Date('2027-03-01'),
    snoozeEpisodeToken: 'episode',
  };
  const result = project([far], 100, local);
  assert.equal(result.snoozed.length, 1);
  assert.equal(
    selectDashboardRequirements(
      result.snoozed.map(({ item }) => item),
      '2026-12-01',
      { upcomingDays: 30, pastDueDays: 'all' }
    ).upcoming.length,
    0
  );
  for (const key of ['userId', 'locationId'] as const) {
    const other = partitionSnoozed(
      buildArrangementWorkQueue(scope, [family([far])]),
      ({ snoozeToken }) => snoozeToken,
      { ...snoozeScope, [key]: 'other' },
      100,
      local
    );
    assert.equal(other.snoozed.length, 0);
  }
});

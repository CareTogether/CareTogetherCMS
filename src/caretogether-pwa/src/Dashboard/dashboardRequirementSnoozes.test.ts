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

function tokenFor(requirement: object, now = 100) {
  const local = storage();
  const [item] = project([requirement], now, local).active;
  return item.snoozeToken!;
}

test('every dated requirement gets a deterministic snooze key from its identity', () => {
  const items = buildArrangementWorkQueue(scope, [
    family([
      { action, dueBy: new Date('2026-12-02') },
      {
        action,
        dueBy: new Date('2026-12-05'),
        arrangementFunction: 'Host',
        volunteerFamilyId: 'volunteer',
      },
    ]),
  ]);
  assert.deepEqual(
    items.map(({ id, snoozeToken }) => snoozeToken === id),
    [true, true]
  );
  const again = buildArrangementWorkQueue(scope, [
    family([{ action, dueBy: new Date('2026-12-02') }]),
  ]);
  assert.equal(again[0].snoozeToken, items[0].snoozeToken);
});

test('the snooze key changes with the arrangement, action, assignee and date', () => {
  const base = { action, dueBy: new Date('2026-12-02') };
  const keys = [
    tokenFor(base),
    tokenFor({ ...base, dueBy: new Date('2026-12-09') }),
    tokenFor({ ...base, action: { ...action, actionName: 'Home visit' } }),
    tokenFor({
      ...base,
      arrangementFunction: 'Host',
      volunteerFamilyId: 'volunteer',
    }),
    tokenFor({
      ...base,
      arrangementFunction: 'Host',
      volunteerFamilyId: 'volunteer',
      personId: 'person',
    }),
  ];
  assert.equal(new Set(keys).size, keys.length);
});

test('assignment requirements with identical display information snooze independently', () => {
  const local = storage();
  const coach = {
    action,
    pastDueSince: new Date('2026-11-20'),
    arrangementFunction: 'Family Coach',
    volunteerFamilyId: 'volunteer',
  };
  const rows = [
    { ...coach, personId: 'first-coach' },
    { ...coach, personId: 'second-coach' },
    coach,
  ];
  const before = project(rows, 100, local);
  assert.equal(before.visible.pastDue.length, 3);
  const [first] = before.active;

  assert.equal(
    writeSnooze(snoozeScope, first.snoozeToken!, 500, 100, local),
    true
  );
  const snoozed = project(rows, 100, local);
  assert.equal(snoozed.visible.pastDue.length, 2);
  assert.deepEqual(
    snoozed.snoozed.map(({ token }) => token),
    [first.snoozeToken]
  );
  assert.equal(project(rows, 500, local).visible.pastDue.length, 3);
  assert.equal(removeSnooze(snoozeScope, first.snoozeToken!, local), true);
  assert.equal(project(rows, 100, local).visible.pastDue.length, 3);
});

test('snoozed requirements leave active counts, stay snoozed when they become overdue, wake, and restore', () => {
  const local = storage();
  const upcoming = { action, dueBy: new Date('2026-12-02') };
  const other = { action, dueBy: new Date('2026-12-03') };
  const token = tokenFor(upcoming);
  assert.equal(writeSnooze(snoozeScope, token, 500, 100, local), true);
  assert.deepEqual([...local.values.values()], ['500']);

  const snoozed = project([upcoming, other], 100, local);
  assert.deepEqual(
    snoozed.snoozed.map(({ token, wakeAt }) => [token, wakeAt]),
    [[token, 500]]
  );
  assert.equal(snoozed.nextWake, 500);
  assert.deepEqual(
    snoozed.visible.upcoming.map(({ item }) => item.occurrenceDate),
    ['2026-12-03']
  );

  const overdue = project(
    [{ action, pastDueSince: new Date('2026-12-02') }],
    200,
    local
  );
  assert.equal(overdue.snoozed.length, 1);
  assert.equal(overdue.visible.pastDue.length, 0);

  const nextOccurrence = project(
    [{ action, pastDueSince: new Date('2026-12-09') }],
    200,
    local
  );
  assert.equal(nextOccurrence.visible.pastDue.length, 1);

  assert.equal(project([upcoming], 500, local).visible.upcoming.length, 1);
  assert.equal(removeSnooze(snoozeScope, token, local), true);
  assert.equal(project([upcoming], 100, local).visible.upcoming.length, 1);
});

test('requirement snoozes respect the requirement windows and other users and locations', () => {
  const local = storage();
  const far = { action, dueBy: new Date('2027-03-01') };
  writeSnooze(snoozeScope, tokenFor(far), 500, 100, local);
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

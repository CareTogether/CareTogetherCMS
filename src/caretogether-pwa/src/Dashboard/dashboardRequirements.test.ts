import assert from 'node:assert/strict';
import test from 'node:test';
import type { ArrangementWorkQueueItem } from './arrangementWorkQueue';
import {
  locationCalendarDate,
  selectDashboardRequirements,
} from './dashboardRequirements.ts';

function requirement(
  occurrenceDate: string,
  status: ArrangementWorkQueueItem['status'] = 'upcoming'
): ArrangementWorkQueueItem {
  return {
    id: occurrenceDate,
    occurrenceDate,
    status,
    requirementName: 'Safety visit',
    target: {
      familyId: 'family',
      v1CaseId: 'case',
      arrangementId: 'arrangement',
    },
  };
}

test('includes today and day 30 in the upcoming window across a month boundary', () => {
  const today = requirement('2026-01-31');
  const cutoff = requirement('2026-03-02');
  const { upcoming } = selectDashboardRequirements(
    [today, cutoff, requirement('2026-03-03')],
    '2026-01-31'
  );

  assert.deepEqual(upcoming, [
    { item: today, count: 1 },
    { item: cutoff, count: 1 },
  ]);
});

test('keeps a cached upcoming requirement visible until Records confirms its status', () => {
  const cached = requirement('2026-01-30');
  const today = '2026-01-31';
  assert.deepEqual(selectDashboardRequirements([cached], today), {
    upcoming: [{ item: cached, count: 1 }],
    pastDue: [],
    olderPastDueCount: 0,
  });

  const refreshed = { ...cached, status: 'past-due' as const };
  assert.deepEqual(selectDashboardRequirements([refreshed], today), {
    upcoming: [],
    pastDue: [{ item: refreshed, count: 1 }],
    olderPastDueCount: 0,
  });
});

test('keeps all backend-classified past-due work, including older unresolved items', () => {
  const old = requirement('2022-01-01', 'past-due');
  const dueToday = requirement('2026-01-31', 'past-due');
  assert.deepEqual(selectDashboardRequirements([old, dueToday], '2026-01-31'), {
    upcoming: [],
    pastDue: [
      { item: old, count: 1 },
      { item: dueToday, count: 1 },
    ],
    olderPastDueCount: 0,
  });
});

test('counts indistinguishable rows under one action and updates after resolution', () => {
  const duplicate = requirement('2026-02-01');
  const other = { ...duplicate, id: 'separate-assignment' };
  const items = [duplicate, { ...duplicate }, other];
  assert.deepEqual(selectDashboardRequirements(items, '2026-01-31').upcoming, [
    { item: duplicate, count: 2 },
    { item: other, count: 1 },
  ]);
  assert.deepEqual(
    selectDashboardRequirements([other], '2026-01-31').upcoming,
    [{ item: other, count: 1 }]
  );
  assert.deepEqual(selectDashboardRequirements([], '2026-01-31'), {
    upcoming: [],
    pastDue: [],
    olderPastDueCount: 0,
  });
});

test('uses independent inclusive windows and counts underlying older overdue requirements', () => {
  const upcomingBoundary = requirement('2026-03-08');
  const pastDueBoundary = requirement('2026-02-15', 'past-due');
  const overdueToday = requirement('2026-03-01', 'past-due');
  const older = requirement('2026-02-14', 'past-due');
  assert.deepEqual(
    selectDashboardRequirements(
      [
        older,
        older,
        pastDueBoundary,
        pastDueBoundary,
        overdueToday,
        upcomingBoundary,
        requirement('2026-03-09'),
      ],
      '2026-03-01',
      { upcomingDays: 7, pastDueDays: 14 }
    ),
    {
      upcoming: [{ item: upcomingBoundary, count: 1 }],
      pastDue: [
        { item: pastDueBoundary, count: 2 },
        { item: overdueToday, count: 1 },
      ],
      olderPastDueCount: 2,
    }
  );
  assert.deepEqual(
    selectDashboardRequirements([older], '2026-03-01', {
      upcomingDays: 90,
      pastDueDays: 7,
    }),
    {
      upcoming: [],
      pastDue: [],
      olderPastDueCount: 1,
    }
  );
});

test('uses the location calendar day across time zones and falls back to the policy default', () => {
  const now = new Date('2026-03-08T04:30:00Z');
  assert.equal(locationCalendarDate(now, 'America/New_York'), '2026-03-07');
  assert.equal(locationCalendarDate(now, 'America/Sao_Paulo'), '2026-03-08');
  assert.equal(locationCalendarDate(now), '2026-03-07');
  assert.equal(locationCalendarDate(now, 'unsupported-zone'), '2026-03-07');
});

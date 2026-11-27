import assert from 'node:assert/strict';
import test from 'node:test';
import type { ApprovalExpirationWorkItem } from './approvalExpirationWorkQueue';
import { selectDashboardApprovalExpirations } from './dashboardApprovalExpirations.ts';
import { defaultDashboardPreferences } from './dashboardPreferences.ts';

test('keeps projection order, excludes today, and includes the last UTC day', () => {
  const items = [
    '2026-12-30',
    '2026-12-31',
    '2027-01-01',
    '2027-01-30',
    '2027-01-30',
    '2027-01-31',
  ].map((expirationDate) => ({
    expirationDate,
    status: 'expiring',
  })) as ApprovalExpirationWorkItem[];
  const now = new Date('2026-12-31T00:30:00Z');

  assert.deepEqual(
    selectDashboardApprovalExpirations(
      items,
      now,
      defaultDashboardPreferences.expirationDays
    ),
    [items[2], items[3], items[4]]
  );
  assert.deepEqual(selectDashboardApprovalExpirations(items, now, 7), [
    items[2],
  ]);
});

test('changes the visible count when updated timelines remove or move an expiration', () => {
  const now = new Date('2026-12-31T23:30:00Z');
  const item = {
    expirationDate: '2027-01-15',
    status: 'expiring',
  } as ApprovalExpirationWorkItem;
  assert.equal(selectDashboardApprovalExpirations([item], now, 30).length, 1);
  assert.deepEqual(
    selectDashboardApprovalExpirations(
      [{ ...item, expirationDate: '2027-02-01' }],
      now,
      30
    ),
    []
  );
  assert.deepEqual(selectDashboardApprovalExpirations([], now, 30), []);
});

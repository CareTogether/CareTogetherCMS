import assert from 'node:assert/strict';
import test from 'node:test';
import {
  dashboardPreferencesKey,
  defaultDashboardPreferences,
  readDashboardPreferences,
  writeDashboardPreferences,
} from './dashboardPreferences.ts';

const scope = { organizationId: 'org-a', locationId: 'location-a' };
const key = dashboardPreferencesKey('user-a', scope);

test('defaults to the next 30 days and all past due when entries are missing or invalid', () => {
  assert.deepEqual(defaultDashboardPreferences, {
    upcomingDays: 30,
    pastDueDays: 'all',
    expirationDays: 30,
    noteReviewSource: 'all',
  });
  for (const stored of [
    null,
    'invalid JSON',
    '[]',
    '{"upcomingDays":90.5,"pastDueDays":"30"}',
  ]) {
    assert.deepEqual(
      readDashboardPreferences(key, { getItem: () => stored }),
      defaultDashboardPreferences
    );
  }
  assert.deepEqual(
    readDashboardPreferences(key, {
      getItem: () =>
        '{"upcomingDays":14,"pastDueDays":99,"noteReviewSource":"invalid"}',
    }),
    {
      upcomingDays: 14,
      pastDueDays: 'all',
      expirationDays: 30,
      noteReviewSource: 'all',
    }
  );
});

test('restores Phase 4 windows without overwriting them when the expiration field is missing or invalid', () => {
  for (const stored of [
    '{"upcomingDays":60,"pastDueDays":7}',
    '{"upcomingDays":60,"pastDueDays":7,"expirationDays":"14"}',
    '{"upcomingDays":60,"pastDueDays":7,"expirationDays":45}',
  ]) {
    assert.deepEqual(readDashboardPreferences(key, { getItem: () => stored }), {
      upcomingDays: 60,
      pastDueDays: 7,
      expirationDays: 30,
      noteReviewSource: 'all',
    });
  }
});

test('serializes independent preferences and restores them by user, organization, and location', () => {
  const entries = new Map<string, string>();
  const storage = {
    getItem: (name: string) => entries.get(name) ?? null,
    setItem: (name: string, value: string) => {
      entries.set(name, value);
    },
  };
  const locationB = dashboardPreferencesKey('user-a', {
    ...scope,
    locationId: 'location-b',
  });
  writeDashboardPreferences(
    key,
    {
      ...defaultDashboardPreferences,
      upcomingDays: 14,
      expirationDays: 60,
      noteReviewSource: 'referral',
    },
    storage
  );
  assert.deepEqual(readDashboardPreferences(key, storage), {
    upcomingDays: 14,
    pastDueDays: 'all',
    expirationDays: 60,
    noteReviewSource: 'referral',
  });
  writeDashboardPreferences(
    locationB,
    { ...defaultDashboardPreferences, pastDueDays: 7 },
    storage
  );
  assert.deepEqual(readDashboardPreferences(locationB, storage), {
    upcomingDays: 30,
    pastDueDays: 7,
    expirationDays: 30,
    noteReviewSource: 'all',
  });
  assert.deepEqual(readDashboardPreferences(key, storage), {
    upcomingDays: 14,
    pastDueDays: 'all',
    expirationDays: 60,
    noteReviewSource: 'referral',
  });
  assert.deepEqual(
    readDashboardPreferences(dashboardPreferencesKey('user-b', scope), storage),
    defaultDashboardPreferences
  );
  assert.deepEqual(
    readDashboardPreferences(
      dashboardPreferencesKey('user-a', { ...scope, organizationId: 'org-b' }),
      storage
    ),
    defaultDashboardPreferences
  );
  assert.equal(entries.size, 2);
  assert.equal(
    entries.get(key!),
    '{"upcomingDays":14,"pastDueDays":"all","expirationDays":60,"noteReviewSource":"referral"}'
  );
});

test('handles denied storage and skips persistence without a complete scope', () => {
  const denied = {
    getItem: () => {
      throw new Error('denied');
    },
    setItem: () => {
      throw new Error('denied');
    },
  };
  assert.deepEqual(
    readDashboardPreferences(key, denied),
    defaultDashboardPreferences
  );
  assert.doesNotThrow(() =>
    writeDashboardPreferences(key, defaultDashboardPreferences, denied)
  );
  assert.equal(dashboardPreferencesKey(undefined, scope), null);
  assert.equal(dashboardPreferencesKey('user-a', null), null);
  let accesses = 0;
  assert.deepEqual(
    readDashboardPreferences(null, {
      getItem: () => {
        accesses += 1;
        return null;
      },
    }),
    defaultDashboardPreferences
  );
  writeDashboardPreferences(null, defaultDashboardPreferences, {
    setItem: () => {
      accesses += 1;
    },
  });
  assert.equal(accesses, 0);
});

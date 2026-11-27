import assert from 'node:assert/strict';
import test from 'node:test';
import {
  noteSnoozeToken,
  readSnooze,
  removeSnooze,
  snoozeWakeAt,
  writeSnooze,
} from './dashboardSnoozes.ts';

const hour = 3_600_000;

test('presets use elapsed hours and local calendar days with a strictly future Monday', () => {
  const monday = new Date(2026, 10, 30, 6).getTime();
  const sunday = new Date(2026, 10, 29, 12).getTime();
  assert.equal(snoozeWakeAt('hour', monday), monday + hour);
  assert.equal(
    snoozeWakeAt('tomorrow', monday),
    new Date(2026, 11, 1, 8).getTime()
  );
  assert.equal(
    snoozeWakeAt('monday', monday),
    new Date(2026, 11, 7, 8).getTime()
  );
  assert.equal(
    snoozeWakeAt('monday', sunday),
    new Date(2026, 10, 30, 8).getTime()
  );
});

test('tomorrow stays at 8 AM across the spring daylight saving transition', () => {
  const saturday = new Date(2027, 2, 13, 8);
  const sunday = new Date(2027, 2, 14, 8);
  const wake = snoozeWakeAt('tomorrow', saturday.getTime());
  assert.equal(wake, sunday.getTime());
  if (process.env.TZ === 'America/New_York') {
    assert.equal(sunday.getTime() - saturday.getTime(), 23 * hour);
  }
});

test('custom instants must be valid and strictly in the future', () => {
  assert.equal(snoozeWakeAt('custom', 100, new Date(101)), 101);
  assert.equal(snoozeWakeAt('custom', 100, new Date(100)), null);
  assert.equal(snoozeWakeAt('custom', 100, new Date(99)), null);
  assert.equal(snoozeWakeAt('custom', 100, new Date(NaN)), null);
  assert.equal(snoozeWakeAt('custom', 100, null), null);
  assert.equal(snoozeWakeAt('hour', 8_640_000_000_000_000), null);
});

test('note keys distinguish source, record, creation and draft revision', () => {
  const draft = {
    source: 'family' as const,
    recordId: 'record',
    id: 'note',
    note: {
      createdTimestampUtc: new Date(100),
      lastEditTimestampUtc: new Date(100),
    },
  };
  const token = noteSnoozeToken(draft);
  assert.ok(token);
  assert.equal(noteSnoozeToken({ ...draft, note: { ...draft.note } }), token);
  assert.notEqual(noteSnoozeToken({ ...draft, source: 'referral' }), token);
  assert.notEqual(noteSnoozeToken({ ...draft, recordId: 'another' }), token);
  assert.notEqual(noteSnoozeToken({ ...draft, id: 'another' }), token);
  assert.notEqual(
    noteSnoozeToken({
      ...draft,
      note: { ...draft.note, lastEditTimestampUtc: new Date(101) },
    }),
    token
  );
  assert.notEqual(
    noteSnoozeToken({
      ...draft,
      note: {
        createdTimestampUtc: new Date(200),
        lastEditTimestampUtc: new Date(200),
      },
    }),
    token
  );
  assert.equal(noteSnoozeToken({ ...draft, note: {} }), null);
});

test('storage survives new readers, isolates scopes and episodes, and expires at the wake instant', () => {
  const values = new Map<string, string>();
  const storage = {
    setItem: (key: string, value: string) => {
      values.set(key, value);
    },
    removeItem: (key: string) => {
      values.delete(key);
    },
  };
  const reader = { getItem: (key: string) => values.get(key) ?? null };
  const scope = {
    userId: 'user',
    organizationId: 'org',
    locationId: 'location',
  };
  assert.equal(writeSnooze(scope, 'first', 200, 100, storage), true);
  assert.equal(writeSnooze(scope, 'second', 300, 100, storage), true);
  assert.equal(readSnooze(scope, 'first', 199, reader), 200);
  assert.equal(readSnooze(scope, 'first', 200, reader), null);
  assert.equal(readSnooze(scope, 'new-episode', 100, reader), null);
  for (const key of ['userId', 'organizationId', 'locationId'] as const) {
    assert.equal(
      readSnooze({ ...scope, [key]: 'another' }, 'first', 100, reader),
      null
    );
  }
  assert.equal(removeSnooze(scope, 'first', storage), true);
  assert.equal(readSnooze(scope, 'first', 100, reader), null);
  assert.equal(readSnooze(scope, 'second', 100, reader), 300);
});

test('invalid, unavailable, and denied storage fail open', () => {
  const scope = {
    userId: 'user',
    organizationId: 'org',
    locationId: 'location',
  };
  const blocked = () => {
    throw new Error('Storage unavailable');
  };
  for (const stored of ['{', 'null', '"200"', '100', '1e40']) {
    assert.equal(
      readSnooze(scope, 'token', 100, { getItem: () => stored }),
      null
    );
  }
  assert.equal(readSnooze(scope, 'token', 100, { getItem: blocked }), null);
  assert.equal(readSnooze(scope, 'token', 100), null);
  assert.equal(
    writeSnooze(scope, 'token', 200, 100, { setItem: blocked }),
    false
  );
  assert.equal(removeSnooze(scope, 'token', { removeItem: blocked }), false);
  assert.equal(
    writeSnooze(null, 'token', 200, 100, { setItem: blocked }),
    false
  );
});

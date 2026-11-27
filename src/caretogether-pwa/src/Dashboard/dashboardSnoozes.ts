import type { LocationScope } from '../Model/LocationScope';

export type SnoozeScope = LocationScope & { userId: string };
export type SnoozePreset = 'hour' | 'tomorrow' | 'monday' | 'custom';

const prefix = 'caretogether:dashboardSnoozes:v1:';

export function snoozeStoragePrefix(scope: SnoozeScope) {
  return (
    prefix +
    JSON.stringify([scope.userId, scope.organizationId, scope.locationId]) +
    ':'
  );
}

function validInstant(value: unknown): value is number {
  return (
    typeof value === 'number' &&
    Number.isSafeInteger(value) &&
    Number.isFinite(new Date(value).getTime())
  );
}

export function noteSnoozeToken(item: {
  source: 'family' | 'referral';
  recordId: string;
  id: string;
  note: { createdTimestampUtc?: Date; lastEditTimestampUtc?: Date };
}) {
  const created = item.note.createdTimestampUtc?.getTime();
  const edited = item.note.lastEditTimestampUtc?.getTime();
  if (
    !item.recordId ||
    !item.id ||
    !validInstant(created) ||
    !validInstant(edited) ||
    edited < created
  )
    return null;
  return JSON.stringify([
    'note-review',
    item.source,
    item.recordId,
    item.id,
    created,
    edited,
  ]);
}

export function snoozeWakeAt(
  preset: SnoozePreset,
  now: number,
  custom?: Date | null
) {
  if (!validInstant(now)) return null;
  const local = new Date(now);
  const dayOffset = preset === 'monday' ? (8 - local.getDay()) % 7 || 7 : 1;
  const wakeAt =
    preset === 'hour'
      ? now + 3_600_000
      : preset === 'custom'
        ? custom?.getTime()
        : new Date(
            local.getFullYear(),
            local.getMonth(),
            local.getDate() + dayOffset,
            8
          ).getTime();
  return validInstant(wakeAt) && wakeAt > now ? wakeAt : null;
}

function storageKey(scope: SnoozeScope | null, token: string | null) {
  return scope?.userId.trim() &&
    scope.organizationId.trim() &&
    scope.locationId.trim() &&
    token?.trim()
    ? snoozeStoragePrefix(scope) + token
    : null;
}

export function readSnooze(
  scope: SnoozeScope | null,
  token: string | null,
  now: number,
  storage?: Pick<Storage, 'getItem'>
) {
  const key = storageKey(scope, token);
  if (!key || !validInstant(now)) return null;
  try {
    const wakeAt: unknown = JSON.parse(
      (storage ?? window.localStorage).getItem(key) ?? 'null'
    );
    return validInstant(wakeAt) && wakeAt > now ? wakeAt : null;
  } catch {
    return null;
  }
}

export function partitionSnoozed<T>(
  items: readonly T[],
  tokenOf: (item: T) => string | null | undefined,
  scope: SnoozeScope | null,
  now: number,
  storage?: Pick<Storage, 'getItem'>
) {
  const active: T[] = [];
  const snoozed: { item: T; token: string; wakeAt: number }[] = [];
  let nextWake: number | undefined;
  for (const item of items) {
    const token = tokenOf(item) ?? null;
    const wakeAt = readSnooze(scope, token, now, storage);
    if (token && wakeAt !== null) {
      snoozed.push({ item, token, wakeAt });
      nextWake = Math.min(nextWake ?? wakeAt, wakeAt);
    } else {
      active.push(item);
    }
  }
  return { active, snoozed, nextWake };
}

export function writeSnooze(
  scope: SnoozeScope | null,
  token: string | null,
  wakeAt: number,
  now: number,
  storage?: Pick<Storage, 'setItem'>
) {
  const key = storageKey(scope, token);
  if (!key || !validInstant(now) || !validInstant(wakeAt) || wakeAt <= now)
    return false;
  try {
    (storage ?? window.localStorage).setItem(key, JSON.stringify(wakeAt));
    return true;
  } catch {
    return false;
  }
}

export function removeSnooze(
  scope: SnoozeScope | null,
  token: string | null,
  storage?: Pick<Storage, 'removeItem'>
) {
  const key = storageKey(scope, token);
  if (!key) return false;
  try {
    (storage ?? window.localStorage).removeItem(key);
    return true;
  } catch {
    return false;
  }
}

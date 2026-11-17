import assert from 'node:assert/strict';
import test from 'node:test';
import {
  createPolicyConfirmation,
  policyConfirmationFor,
} from './policyConfirmationStore.ts';

test('policy confirmation requires an explicit discard decision and resets afterward', async () => {
  const store = createPolicyConfirmation();
  assert.equal(store.getSnapshot(), null);
  const keep = store.request('discard');
  assert.equal(store.getSnapshot(), 'discard');
  store.resolve(false);
  assert.equal(await keep, false);
  assert.equal(store.getSnapshot(), null);
  const leave = store.request('discard');
  store.resolve(true);
  assert.equal(await leave, true);
});

test('a second request cannot replace or resume alongside the first destination', async () => {
  const store = createPolicyConfirmation();
  const first = store.request('discard');
  assert.equal(await store.request('discard'), false);
  store.resolve(true);
  assert.equal(await first, true);
});

test('pending saves can never authorize leaving and cancellation cannot leak into another request', async () => {
  const store = createPolicyConfirmation();
  const saving = store.request('saving');
  store.resolve(true);
  assert.equal(await saving, false);
  const cancelled = store.request('discard');
  store.resolve(false);
  store.resolve(true);
  assert.equal(await cancelled, false);
  const next = store.request('discard');
  store.resolve(false);
  assert.equal(await next, false);
});

test('confirmation subscribers unsubscribe and router owners stay isolated', () => {
  const first = {};
  const second = {};
  assert.equal(policyConfirmationFor(first), policyConfirmationFor(first));
  assert.notEqual(policyConfirmationFor(first), policyConfirmationFor(second));
  const store = createPolicyConfirmation();
  let changes = 0;
  const unsubscribe = store.subscribe(() => changes++);
  void store.request('discard');
  store.resolve(false);
  assert.equal(changes, 2);
  unsubscribe();
  void store.request('saving');
  assert.equal(changes, 2);
  store.resolve(false);
});

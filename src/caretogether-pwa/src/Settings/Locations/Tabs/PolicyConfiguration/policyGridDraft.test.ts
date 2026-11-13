import assert from 'node:assert/strict';
import test from 'node:test';
import {
  createPolicyGridDraft,
  countPolicyGridChanges,
  policyGridHasChanges,
  resolvePolicyGridDraft,
  savePolicyGridDraft,
} from './policyGridDraft.ts';

test('change counts distinguish clean, single, multiple and added requirement values', () => {
  const original = {
    actions: { Form: { required: true, notes: false } },
    requirements: [{ name: 'First', required: true }],
  };
  assert.equal(countPolicyGridChanges(original, original), 0);
  assert.equal(
    countPolicyGridChanges(original, {
      ...original,
      actions: { Form: { required: false, notes: false } },
    }),
    1
  );
  assert.equal(
    countPolicyGridChanges(original, {
      ...original,
      actions: { Form: { required: false, notes: true } },
    }),
    2
  );
  assert.equal(
    countPolicyGridChanges(original, {
      ...original,
      requirements: [
        ...original.requirements,
        { name: 'Second', required: true },
      ],
    }),
    1
  );
});

test('removing a requirement counts once without treating following rows as edits', () => {
  const first = { actionName: 'First', isRequired: true };
  const second = { actionName: 'Second', isRequired: false };
  assert.equal(countPolicyGridChanges([first, second], [second]), 1);
  assert.equal(
    countPolicyGridChanges(
      [{ action: first }, { action: second }],
      [{ action: second }]
    ),
    1
  );
});

test('multiple staged fields are saved together once and unrelated values survive', async () => {
  const original = Object.freeze({
    first: true,
    second: true,
    recurrence: Object.freeze({ stages: [1, 2] }),
    history: ['original'],
  });
  const initial = createPolicyGridDraft(original, 'location');
  const draft = {
    ...initial,
    value: { ...original, first: false, second: false },
  };
  let calls = 0;
  assert.equal(policyGridHasChanges(draft), true);
  const saved = await savePolicyGridDraft(draft, original, async (value) => {
    calls++;
    assert.equal(value.first, false);
    assert.equal(value.second, false);
    assert.equal(value.recurrence, original.recurrence);
    assert.equal(value.history, original.history);
    return true;
  });
  assert.equal(calls, 1);
  assert.equal(policyGridHasChanges(saved), false);
  assert.equal(original.first, true);
});

test('no-op drafts do not save', async () => {
  const draft = createPolicyGridDraft({ value: 1 }, 'location');
  const result = await savePolicyGridDraft(
    { ...draft, value: { value: 1 } },
    draft.loaded,
    async () => {
      assert.fail('no-op save');
    }
  );
  assert.equal(policyGridHasChanges(result), false);
});

test('failed validation or saves leave the complete draft intact', async () => {
  const initial = createPolicyGridDraft({ value: 1 }, 'location');
  const draft = { ...initial, value: { value: 2 } };
  await assert.rejects(
    savePolicyGridDraft(draft, initial.loaded, async () => false),
    /draft is retained/
  );
  assert.equal(draft.value.value, 2);
  assert.equal(policyGridHasChanges(draft), true);
  await assert.rejects(
    savePolicyGridDraft(draft, initial.loaded, async () => {
      throw new Error('offline');
    }),
    /offline/
  );
  assert.equal(draft.value.value, 2);
});

test('newly loaded conflicting data blocks a save instead of overwriting it', async () => {
  const draft = {
    ...createPolicyGridDraft({ value: 1 }, 'location'),
    value: { value: 2 },
  };
  const loaded = { value: 3 };
  assert.equal(resolvePolicyGridDraft(draft, loaded, 'location'), draft);
  await assert.rejects(
    savePolicyGridDraft(draft, loaded, async () => {
      assert.fail('conflicting draft must not save');
    }),
    /loaded policy changed/
  );
});

test('scope switches drop an old draft and clean drafts refresh from loaded data', () => {
  const initial = createPolicyGridDraft({ value: 1 }, 'a');
  const dirty = { ...initial, value: { value: 2 } };
  assert.deepEqual(
    resolvePolicyGridDraft(dirty, { value: 3 }, 'b'),
    createPolicyGridDraft({ value: 3 }, 'b')
  );
  assert.deepEqual(
    resolvePolicyGridDraft(initial, { value: 3 }, 'a'),
    createPolicyGridDraft({ value: 3 }, 'a')
  );
  const cancelled = createPolicyGridDraft(initial.loaded, 'a');
  assert.equal(policyGridHasChanges(cancelled), false);
});

test('save completion is awaited before the draft becomes clean', async () => {
  const initial = createPolicyGridDraft({ value: 1 }, 'a');
  const draft = { ...initial, value: { value: 2 } };
  let finish!: (saved: boolean) => void;
  const pending = savePolicyGridDraft(
    draft,
    initial.loaded,
    () =>
      new Promise((resolve) => {
        finish = resolve;
      })
  );
  assert.equal(policyGridHasChanges(draft), true);
  finish(true);
  assert.equal(policyGridHasChanges(await pending), false);
});

import assert from 'node:assert/strict';
import test from 'node:test';
import {
  createPolicyGridDraft,
  countPolicyGridChanges,
  policyGridHasChanges,
  resolvePolicyGridDraft,
  savePolicyGridDraft,
  stagePolicyGridDraft,
  movePolicyGridHistory,
  cancelPolicyGridDraft,
} from './policyGridDraft.ts';

test('history starts empty and records exactly one transition per changed draft', () => {
  const initial = createPolicyGridDraft({ value: 1 }, 'a');
  assert.deepEqual(initial.past, []);
  assert.deepEqual(initial.future, []);
  assert.equal(movePolicyGridHistory(initial, 'undo'), initial);
  assert.equal(movePolicyGridHistory(initial, 'redo'), initial);
  const edited = stagePolicyGridDraft(initial, { value: 2 }, true);
  assert.deepEqual(edited.past, [initial.value]);
  const undone = movePolicyGridHistory(edited, 'undo');
  assert.equal(undone.value, initial.value);
  assert.equal(policyGridHasChanges(undone), false);
  assert.equal(movePolicyGridHistory(undone, 'redo').value, edited.value);
});

test('history replays multiple edits in order and a new edit invalidates redo', () => {
  const initial = createPolicyGridDraft({ value: 1 }, 'a');
  const first = stagePolicyGridDraft(initial, { value: 2 }, true);
  const second = stagePolicyGridDraft(first, { value: 3 }, true);
  const back = movePolicyGridHistory(second, 'undo');
  assert.equal(back.value, first.value);
  const start = movePolicyGridHistory(back, 'undo');
  assert.equal(start.value, initial.value);
  const forward = movePolicyGridHistory(start, 'redo');
  assert.equal(forward.value, first.value);
  assert.equal(movePolicyGridHistory(forward, 'redo').value, second.value);
  const branched = stagePolicyGridDraft(back, { value: 4 }, true);
  assert.deepEqual(branched.future, []);
  assert.equal(movePolicyGridHistory(branched, 'redo'), branched);
});

test('equivalent edits do not record history or invalidate redo', () => {
  const initial = createPolicyGridDraft({ value: 1 }, 'a');
  const edited = stagePolicyGridDraft(initial, { value: 2 }, true);
  assert.equal(stagePolicyGridDraft(edited, { value: 2 }, true), edited);
  const undone = movePolicyGridHistory(edited, 'undo');
  assert.equal(stagePolicyGridDraft(undone, { value: 1 }, true), undone);
});

test('successful save clears history and establishes the undo boundary', async () => {
  const initial = createPolicyGridDraft({ value: 1 }, 'a');
  const edited = stagePolicyGridDraft(initial, { value: 2 }, true);
  let writes = 0;
  const saved = await savePolicyGridDraft(
    edited,
    initial.loaded,
    async (value) => {
      writes++;
      assert.equal(value, edited.value);
      return true;
    }
  );
  assert.equal(writes, 1);
  assert.equal(saved.base, edited.value);
  assert.deepEqual(saved.past, []);
  assert.deepEqual(saved.future, []);
  assert.equal(movePolicyGridHistory(saved, 'undo'), saved);
});

test('failed saves preserve history for rejection and exceptions', async () => {
  const initial = createPolicyGridDraft({ value: 1 }, 'a');
  const edited = stagePolicyGridDraft(initial, { value: 2 }, true);
  for (const save of [
    async () => false,
    async () => {
      throw new Error('network');
    },
  ]) {
    await assert.rejects(savePolicyGridDraft(edited, initial.loaded, save));
    assert.deepEqual(edited.past, [initial.value]);
    assert.equal(movePolicyGridHistory(edited, 'undo').value, initial.value);
  }
});

test('Cancel clears past and future and restores the baseline', () => {
  const initial = createPolicyGridDraft({ value: 1 }, 'a');
  const first = stagePolicyGridDraft(initial, { value: 2 }, true);
  const second = stagePolicyGridDraft(first, { value: 3 }, true);
  const cancelled = cancelPolicyGridDraft(
    movePolicyGridHistory(second, 'undo'),
    initial.loaded
  );
  assert.equal(cancelled.value, initial.base);
  assert.deepEqual(cancelled.past, []);
  assert.deepEqual(cancelled.future, []);
});

test('scope and policy replacements reset history without losing a conflicting draft', () => {
  const initial = createPolicyGridDraft({ value: 1 }, 'a');
  const edited = stagePolicyGridDraft(initial, { value: 2 }, true);
  const replacement = { value: 9 };
  const otherLocation = resolvePolicyGridDraft(edited, replacement, 'b');
  assert.equal(otherLocation.value, replacement);
  assert.deepEqual(otherLocation.past, []);
  const conflict = resolvePolicyGridDraft(edited, replacement, 'a');
  assert.equal(conflict.value, edited.value);
  assert.deepEqual(conflict.past, []);
  assert.deepEqual(conflict.future, []);
  assert.equal(cancelPolicyGridDraft(conflict, replacement).value, replacement);
});

test('history preserves model instances, staged schedules and unrelated references', () => {
  class Model {
    stages: { delay: string; maxOccurrences: number | null }[];
    constructor(stages: { delay: string; maxOccurrences: number | null }[]) {
      this.stages = stages;
    }
    toJSON() {
      return { stages: this.stages };
    }
  }
  const recurrence = new Model([
    { delay: '2.00:00:00', maxOccurrences: 3 },
    { delay: '7.00:00:00', maxOccurrences: null },
  ]);
  const changed = new Model([
    { delay: '3.00:00:00', maxOccurrences: 3 },
    ...recurrence.stages.slice(1),
  ]);
  const unrelated = {
    legacy: ['Protected'],
    variants: ['Sibling'],
    policyVersions: ['Historical'],
  };
  const initial = createPolicyGridDraft({ recurrence, unrelated }, 'a');
  const edited = stagePolicyGridDraft(
    initial,
    { recurrence: changed, unrelated },
    true
  );
  const undone = movePolicyGridHistory(edited, 'undo');
  const redone = movePolicyGridHistory(undone, 'redo');
  assert.equal(undone.value.recurrence, recurrence);
  assert.equal(redone.value.recurrence, changed);
  assert.equal(redone.value.unrelated, unrelated);
  assert.ok(redone.value.recurrence instanceof Model);
  assert.deepEqual(redone.value.recurrence.toJSON().stages, changed.stages);
});

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

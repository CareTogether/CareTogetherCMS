import assert from 'node:assert/strict';
import test from 'node:test';
import { policyDraftStatus } from './policyDraftStatus.ts';

test('clean and staged draft statuses use exact singular and plural counts', () => {
  assert.deepEqual(policyDraftStatus({ changeCount: 0, saving: false }), {
    kind: 'clean',
    text: '',
  });
  assert.deepEqual(policyDraftStatus({ changeCount: 1, saving: false }), {
    kind: 'draft',
    text: '1 unsaved change',
  });
  assert.deepEqual(policyDraftStatus({ changeCount: 2, saving: false }), {
    kind: 'draft',
    text: '2 unsaved changes',
  });
});

test('success is explicit and cannot replace editing, pending changes or errors', () => {
  assert.deepEqual(
    policyDraftStatus({ changeCount: 0, saving: false, saved: true }),
    { kind: 'saved', text: 'Changes saved successfully' }
  );
  assert.equal(
    policyDraftStatus({ changeCount: 1, saving: false, saved: true }).kind,
    'draft'
  );
  assert.equal(
    policyDraftStatus({
      changeCount: 0,
      saving: false,
      editing: true,
      saved: true,
    }).kind,
    'editing'
  );
  assert.equal(
    policyDraftStatus({ changeCount: 0, saving: true, saved: true }).kind,
    'saving'
  );
  assert.equal(
    policyDraftStatus({
      changeCount: 0,
      saving: false,
      saved: true,
      error: 'Failed',
    }).kind,
    'error'
  );
});

test('active edits and saving never claim that all changes are saved', () => {
  assert.deepEqual(
    policyDraftStatus({ changeCount: 0, editing: true, saving: false }),
    { kind: 'editing', text: 'Cell edit in progress' }
  );
  assert.match(
    policyDraftStatus({ changeCount: 2, editing: true, saving: false }).text,
    /2 unsaved changes/
  );
  assert.deepEqual(
    policyDraftStatus({ changeCount: 0, editing: true, saving: true }),
    { kind: 'saving', text: 'Saving…' }
  );
});

test('errors remain distinct from ordinary pending drafts', () => {
  assert.deepEqual(
    policyDraftStatus({ changeCount: 1, saving: false, error: 'Failed' }),
    { kind: 'error', text: '1 unsaved change' }
  );
  assert.deepEqual(
    policyDraftStatus({ changeCount: 0, saving: false, error: 'Failed' }),
    { kind: 'error', text: 'Changes could not be saved' }
  );
});

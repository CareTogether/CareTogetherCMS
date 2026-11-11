import assert from 'node:assert/strict';
import test from 'node:test';
import {
  approvalLedgerStatusPresentation,
  approvalLedgerStatusText,
} from './approvalLedgerStatusPresentation.ts';
import {
  sortApprovalLedgerRows,
  type ApprovalLedgerRow,
  type ApprovalLedgerStatus,
} from './approvalLedgerViewModel.ts';

const expiredOn = new Date('2026-08-02T00:00:00.000Z');

test('shows an expired completion as completed, with the expiry date', () => {
  const row = {
    status: 'expired' as const,
    validUntil: expiredOn,
    occurrences: [{ status: 'completed' as const }],
  };

  assert.deepEqual(approvalLedgerStatusPresentation(row), {
    recordStatus: 'completed',
    label: 'Completed',
    color: 'success',
    expiredOn,
  });
  assert.equal(approvalLedgerStatusText(row), 'Completed (expired)');
});

test('shows an expired exemption as exempted, with the expiry date', () => {
  const row = {
    status: 'expired' as const,
    validUntil: expiredOn,
    occurrences: [{ status: 'exempted' as const }],
  };

  assert.deepEqual(approvalLedgerStatusPresentation(row), {
    recordStatus: 'exempted',
    label: 'Exempted',
    color: 'default',
    expiredOn,
  });
  assert.equal(approvalLedgerStatusText(row), 'Exempted (expired)');
});

test('keeps other statuses unchanged and without expiry info', () => {
  const missing = approvalLedgerStatusPresentation({
    status: 'missing',
    occurrences: [{ status: 'missing' }],
  });
  const expiring = approvalLedgerStatusPresentation({
    status: 'expiring',
    validUntil: expiredOn,
    occurrences: [{ status: 'completed' }],
  });

  assert.deepEqual(missing, {
    recordStatus: 'missing',
    label: 'Missing',
    color: 'error',
  });
  assert.deepEqual(expiring, {
    recordStatus: 'expiring',
    label: 'Expiring',
    color: 'warning',
  });
  assert.equal(
    approvalLedgerStatusText({ status: 'completed', occurrences: [] }),
    'Completed'
  );
});

test('sorts expired history after current records', () => {
  const row = (status: ApprovalLedgerStatus, requirementName: string) =>
    ({ status, requirementName }) as ApprovalLedgerRow;

  const sorted = sortApprovalLedgerRows([
    row('expired', 'Fingerprints'),
    row('completed', 'Fingerprints'),
    row('missing', 'Training'),
  ]);

  assert.deepEqual(
    sorted.map(({ status }) => status),
    ['missing', 'completed', 'expired']
  );
});

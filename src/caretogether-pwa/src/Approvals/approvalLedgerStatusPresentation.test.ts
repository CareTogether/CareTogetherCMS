import assert from 'node:assert/strict';
import test from 'node:test';
import {
  approvalAttentionCounts,
  approvalLedgerStatusTooltip,
  approvalLedgerStatusPresentation,
  approvalLedgerStatusText,
} from './approvalLedgerStatusPresentation.ts';
import type { ApprovalLedgerStatus } from './approvalLedgerViewModel.ts';

const expiredOn = new Date('2026-08-02T00:00:00.000Z');

test('shows an expired completion as an outlined Completed chip', () => {
  const row = {
    status: 'expired' as const,
    validUntil: expiredOn,
    occurrences: [{ status: 'completed' as const }],
  };

  assert.deepEqual(approvalLedgerStatusPresentation(row), {
    recordStatus: 'completed',
    label: 'Completed',
    color: 'success',
    variant: 'outlined',
    expiredOn,
  });
  assert.equal(approvalLedgerStatusText(row), 'Completed (expired)');
});

test('shows an expired exemption as an outlined Exempted chip', () => {
  const row = {
    status: 'expired' as const,
    validUntil: expiredOn,
    occurrences: [{ status: 'exempted' as const }],
  };

  assert.deepEqual(approvalLedgerStatusPresentation(row), {
    recordStatus: 'exempted',
    label: 'Exempted',
    color: 'default',
    variant: 'outlined',
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
    variant: 'filled',
  });
  assert.deepEqual(expiring, {
    recordStatus: 'expiring',
    label: 'Expiring',
    color: 'warning',
    variant: 'filled',
  });
  assert.equal(
    approvalLedgerStatusText({ status: 'completed', occurrences: [] }),
    'Completed'
  );
});

test('does not count a renewed expired record as needing attention', () => {
  const berrin = { scope: 'person' as const, id: 'berrin', label: 'Berrin' };
  const elda = { scope: 'person' as const, id: 'elda', label: 'Elda' };
  const row = (
    status: ApprovalLedgerStatus,
    requirementName: string,
    subject = berrin
  ) => ({ status, requirementName, appliesTo: [subject] });

  assert.deepEqual(
    approvalAttentionCounts([
      row('expired', 'Background Check'),
      row('completed', 'Background Check'),
      row('expired', 'Training'),
      row('expiring', 'Training'),
      row('expired', 'Fingerprints'),
      row('completed', 'Fingerprints', elda),
      row('missing', 'Fingerprints'),
    ]),
    { missing: 1, expired: 1 }
  );
});

test('explains an outlined chip with a tooltip, only for expired records', () => {
  const formatDate = (date: Date) => date.toISOString().slice(0, 10);

  assert.equal(
    approvalLedgerStatusTooltip(
      {
        status: 'expired',
        validUntil: expiredOn,
        occurrences: [{ status: 'completed' }],
      },
      formatDate
    ),
    'This completion expired on 2026-08-02.'
  );
  assert.match(
    approvalLedgerStatusTooltip(
      {
        status: 'expired',
        validUntil: expiredOn,
        occurrences: [{ status: 'exempted' }],
      },
      formatDate
    ) ?? '',
    /^This exemption expired on 2026-08-02\.$/
  );
  assert.equal(
    approvalLedgerStatusTooltip(
      { status: 'completed', occurrences: [{ status: 'completed' }] },
      formatDate
    ),
    undefined
  );
});

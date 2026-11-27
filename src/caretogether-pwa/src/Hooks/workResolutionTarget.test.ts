import assert from 'node:assert/strict';
import test from 'node:test';
import type { ApprovalLedgerRow } from '../Approvals/approvalLedgerViewModel';
import type { IMissingArrangementRequirement } from '../GeneratedClient';
import {
  appendApprovalTarget,
  arrangementRequirementQuery,
  clearApprovalTarget,
  findArrangementRequirement,
  findExpiringRequirementRow,
  readApprovalTarget,
  uniqueMatch,
} from './workResolutionTarget.ts';

test('approval links round trip and closing preserves ordinary deep links', () => {
  for (const target of [
    { kind: 'role', name: 'Driver & Host', personId: 'person' },
    { kind: 'requirement', name: 'Document / renewal' },
  ] as const) {
    const params = new URLSearchParams('v1CaseId=case&familyMemberId=member');
    appendApprovalTarget(params, target);
    assert.deepEqual(
      readApprovalTarget(new URLSearchParams(params.toString())),
      {
        personId: undefined,
        ...target,
      }
    );
    assert.equal(
      clearApprovalTarget(params).toString(),
      'v1CaseId=case&familyMemberId=member'
    );
  }
  for (const query of [
    '',
    'approvalAction=',
    'approvalRole=One&approvalRole=Two',
    'approvalRole=One&approvalAction=Two',
    'approvalRole=One&approvalPersonId=',
  ]) {
    assert.equal(readApprovalTarget(new URLSearchParams(query)), undefined);
  }
});

test('arrangement links distinguish assignment and occurrence and reject duplicates', () => {
  const date = new Date('2026-11-26');
  const action = {
    actionName: 'Check',
    isRequired: true,
  } as IMissingArrangementRequirement['action'];
  const context = {
    arrangementFunction: 'Visit',
    volunteerFamilyId: 'volunteer',
    personId: 'member',
  };
  const target = arrangementRequirementQuery({
    actionName: 'Check',
    date: '2026-11-26',
    ...context,
  });
  const upcoming = {
    action,
    dueBy: date,
    ...context,
  } satisfies IMissingArrangementRequirement;
  const overdue = { ...upcoming, dueBy: undefined, pastDueSince: date };
  const other = { ...upcoming, personId: 'other' };
  assert.equal(findArrangementRequirement([other, upcoming], target), upcoming);
  assert.equal(findArrangementRequirement([other, overdue], target), overdue);
  assert.equal(
    findArrangementRequirement([upcoming, { ...upcoming }], target),
    undefined
  );
  assert.equal(findArrangementRequirement([other], target), undefined);
  assert.equal(findArrangementRequirement([upcoming], 'invalid'), undefined);
});

test('expiring requirement links open the latest unique completion for the subject', () => {
  for (const [scope, context] of [
    ['family', { kind: 'Volunteer Family', volunteerFamilyId: 'subject' }],
    [
      'person',
      {
        kind: 'Individual Volunteer',
        volunteerFamilyId: 'family',
        personId: 'subject',
      },
    ],
    ['organization', { kind: 'Organization', organizationId: 'subject' }],
  ] as const) {
    const row = {
      requirementName: 'Check',
      status: 'completed',
      validUntil: new Date('2027-01-07'),
      neededForRoles: ['Driver'],
      occurrences: [
        {
          subject: { scope, id: scope === 'family' ? 'family' : 'subject' },
          context,
        },
      ],
    } as ApprovalLedgerRow;
    const older = {
      ...row,
      status: 'expired',
      validUntil: new Date('2025-01-07'),
    } as ApprovalLedgerRow;
    const find = (rows: ApprovalLedgerRow[]) =>
      findExpiringRequirementRow(rows, 'Check', scope, 'subject');
    assert.equal(find([older, row]), row);
    assert.equal(find([{ ...row, status: 'missing' }]), undefined);
    assert.equal(find([{ ...row, validUntil: undefined }]), undefined);
    assert.equal(find([row, { ...row }]), undefined);
    assert.equal(find([{ ...row, occurrences: [] }]), undefined);
    assert.equal(
      findExpiringRequirementRow([row], 'Check', scope, 'other'),
      undefined
    );
  }
  assert.equal(
    uniqueMatch(['Driver', 'Host'], (role) => role === 'Driver'),
    'Driver'
  );
  assert.equal(
    uniqueMatch(['Driver', 'Driver'], (role) => role === 'Driver'),
    undefined
  );
});

import { expect, test } from '@playwright/test';
import {
  APPROVAL_LEDGER_SEARCH_FIELD,
  approvalLedgerDefaultColumnFields,
  approvalLedgerExportFields,
  approvalLedgerMemberGroupingKey,
  approvalLedgerQuickFilterParser,
  approvalLedgerSearchText,
  compareApprovalLedgerMemberKeys,
  filterApprovalLedgerRows,
  isApprovalLedgerLeafRowNode,
  subjectKey,
  type ApprovalLedgerDomainFilters,
} from '../src/Approvals/approvalLedgerDataGridViewModel';
import {
  sortApprovalLedgerRows,
  type ApprovalLedgerOccurrence,
  type ApprovalLedgerRow,
  type ApprovalLedgerStatus,
  type ApprovalLedgerSubject,
} from '../src/Approvals/approvalLedgerViewModel';
import { formatApprovalLedgerLeafValue } from '../src/Approvals/approvalLedgerGridHelpers';

function subject(
  scope: ApprovalLedgerSubject['scope'],
  id: string,
  label: string
): ApprovalLedgerSubject {
  return { scope, id, label };
}

function occurrence(
  subjectValue: ApprovalLedgerSubject
): ApprovalLedgerOccurrence {
  return {
    id: `occurrence:${subjectValue.scope}:${subjectValue.id}`,
    status: 'missing',
    subject: subjectValue,
    context:
      subjectValue.scope === 'person'
        ? {
            kind: 'Individual Volunteer',
            personId: subjectValue.id,
            volunteerFamilyId: 'family-1',
          }
        : {
            kind: 'Volunteer Family',
            volunteerFamilyId: 'family-1',
          },
    requirement: 'Background Check',
  };
}

function ledgerRow({
  id,
  status = 'missing',
  subject: subjectValue,
  requirementName = 'Background Check',
  neededForRoles = [],
  notes = [],
}: {
  id: string;
  status?: ApprovalLedgerStatus;
  subject: ApprovalLedgerSubject;
  requirementName?: string;
  neededForRoles?: string[];
  notes?: string[];
}): ApprovalLedgerRow {
  return {
    id,
    status,
    requirementName,
    appliesTo: [subjectValue],
    neededForRoles,
    neededForRoleLabels: neededForRoles,
    linkedDocumentIds: [],
    noteIds: [],
    notes,
    occurrences: [occurrence(subjectValue)],
  };
}

test('preserves approval-ledger business identity, ordering, and domain filters', () => {
  const family = subject('family', 'family-1', 'Family');
  const alexOne = subject('person', 'person-1', 'Alex Smith');
  const alexTwo = subject('person', 'person-2', 'Alex Smith');
  const rows = [
    ledgerRow({ id: 'completed', status: 'completed', subject: alexOne }),
    ledgerRow({ id: 'expired', status: 'expired', subject: family }),
    ledgerRow({
      id: 'missing',
      subject: alexTwo,
      neededForRoles: ['Host Family'],
      notes: ['Authorized note text'],
    }),
  ];

  expect(rows[2].occurrences).toHaveLength(1);
  expect(rows[2].occurrences[0].subject).toBe(alexTwo);
  expect(subjectKey(alexOne.scope, alexOne.id)).not.toBe(
    subjectKey(alexTwo.scope, alexTwo.id)
  );
  expect(approvalLedgerMemberGroupingKey(rows[0])).toBe('person:person-1');
  expect(sortApprovalLedgerRows(rows).map((row) => row.id)).toEqual([
    'expired',
    'missing',
    'completed',
  ]);

  const memberLabels = new Map([
    ['family:family-1', 'Family'],
    ['person:person-1', 'Alex Smith'],
    ['person:person-2', 'Alex Smith'],
  ]);
  expect(
    compareApprovalLedgerMemberKeys(
      memberLabels,
      'family:family-1',
      'person:person-1'
    )
  ).toBeLessThan(0);
  expect(
    compareApprovalLedgerMemberKeys(
      memberLabels,
      'person:person-1',
      'person:person-2'
    )
  ).toBeLessThan(0);

  const filters: ApprovalLedgerDomainFilters = {
    appliesToFilter: 'person:person-2',
    roleFilter: 'Host Family',
    statusFilter: 'missing',
  };
  expect(filterApprovalLedgerRows(rows, filters).map((row) => row.id)).toEqual([
    'missing',
  ]);
});

test('uses an internal native Quick Filter field and exports only safe leaf data', () => {
  const row = ledgerRow({
    id: 'approval-row-id',
    subject: subject('person', 'person-2', 'Alex Smith'),
    neededForRoles: ['Host Family'],
    notes: ['Authorized note text'],
  });

  const searchText = approvalLedgerSearchText(row);
  expect(searchText).toContain('Background Check');
  expect(searchText).toContain('Alex Smith');
  expect(searchText).toContain('Host Family');
  expect(searchText).toContain('Authorized note text');
  expect(searchText).not.toContain('approval-row-id');
  expect(approvalLedgerQuickFilterParser('  Alex Smith  ')).toEqual([
    'Alex Smith',
  ]);
  expect(approvalLedgerDefaultColumnFields).toEqual([
    'status',
    'requirementName',
    'appliesTo',
    'completedOrExemptedOn',
    'validUntil',
    'neededForRoles',
    'documents',
    'notes',
    'completedOrExemptedByUserId',
    'openDetails',
  ]);
  expect(approvalLedgerExportFields).not.toContain(
    APPROVAL_LEDGER_SEARCH_FIELD
  );
  expect(approvalLedgerExportFields).not.toContain(
    'completedOrExemptedByUserId'
  );
  expect(isApprovalLedgerLeafRowNode({ type: 'leaf' })).toBe(true);
  expect(isApprovalLedgerLeafRowNode({ type: 'group' })).toBe(false);
});

test('does not format generated member rows with leaf-only array formatters', () => {
  let formatterCalled = false;
  const generatedRow = {
    get linkedDocumentIds(): string[] {
      formatterCalled = true;
      throw new Error('Leaf formatter should not run for a generated row');
    },
  };

  expect(
    formatApprovalLedgerLeafValue(
      generatedRow,
      true,
      (leafRow) => `${leafRow.linkedDocumentIds.length} documents`
    )
  ).toBe('');
  expect(formatterCalled).toBe(false);
});

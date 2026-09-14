import { expect, test } from '@playwright/test';
import { CustomField, CustomFieldType } from '../src/GeneratedClient';
import { referralsInitialSortModel } from '../src/V1Referrals/referralsGridSorting';
import type {
  ReferralAssignmentRoleV2,
  ReferralBrowserRowV2,
  ReferralCustomFieldValue,
} from '../src/V1Referrals/referralBrowserTypes';
import {
  buildReferralsColumns,
  isInternalReferralsColumn,
  isOptionalReferralsColumn,
  REFERRALS_SEARCH_FIELD,
} from '../src/V1Referrals/referralsGridColumns';

function customField(
  name: string,
  type: CustomFieldType,
  validValues?: string[]
) {
  return new CustomField({ name, type, validValues });
}

function row(
  overrides: Partial<ReferralBrowserRowV2> = {}
): ReferralBrowserRowV2 {
  return {
    referralCount: 1,
    id: 'referral-1',
    title: 'A referral',
    status: 'OPEN',
    openedAtUtc: new Date('2025-03-01T12:00:00Z'),
    acceptedAtUtc: null,
    closedAtUtc: null,
    clientFamilyName: 'Skywalker family',
    county: 'Wake',
    comments: `Preview ${'x'.repeat(550)} hidden phrase`,
    searchableText: `A referral\nSkywalker family\nPreview ${'x'.repeat(550)} hidden phrase`,
    assignmentNamesByRole: {},
    assignmentPersonIdsByRole: {},
    customFieldValues: {},
    ...overrides,
  };
}

function columns(
  rows: ReferralBrowserRowV2[],
  roles: ReferralAssignmentRoleV2[] = [],
  fields: CustomField[] = []
) {
  return buildReferralsColumns(rows, roles, fields, ['Wake', 'Durham'], true);
}

test('preserves referral search scope through one internal quick-filter column', () => {
  const referral = row();
  const built = columns([referral]);
  const search = built.find(
    (column) => column.field === REFERRALS_SEARCH_FIELD
  )!;
  const apply = search.getApplyQuickFilterFn!('HIDDEN PHRASE', search, {
    current: undefined,
  });

  expect(
    apply?.(referral.searchableText, referral, search, {
      current: undefined,
    })
  ).toBe(true);
  expect(search.disableExport).toBe(true);
  expect(search.filterable).toBe(false);
  expect(search.hideable).toBe(false);
  expect(isInternalReferralsColumn(search.field)).toBe(true);
});

test('uses raw status and typed date values', () => {
  const referral = row();
  const built = columns([referral]);
  const status = built.find((column) => column.field === 'status')!;
  const opened = built.find((column) => column.field === 'openedAtUtc')!;

  expect(status.valueGetter).toBeUndefined();
  expect(
    status.valueFormatter?.(referral.status, referral, status, {
      current: undefined,
    })
  ).toContain('Open since');
  expect(opened.type).toBe('dateTime');
  expect(isOptionalReferralsColumn(opened.field)).toBe(true);
  expect(referralsInitialSortModel).toEqual([
    { field: 'openedAtUtc', sort: 'desc' },
  ]);
});

test('filters assignments by identity and handles unassigned rows', () => {
  const roles: ReferralAssignmentRoleV2[] = [
    {
      role: 'Coordinator',
      options: [
        { value: 'person-1', label: 'John Smith' },
        { value: 'person-2', label: 'John Smith' },
      ],
    },
  ];
  const assigned = row({
    assignmentNamesByRole: { Coordinator: 'John Smith' },
    assignmentPersonIdsByRole: { Coordinator: ['person-2'] },
  });
  const unassigned = row({
    id: 'referral-2',
    assignmentNamesByRole: { Coordinator: '' },
    assignmentPersonIdsByRole: { Coordinator: [] },
  });
  const assignment = columns([assigned, unassigned], roles).find(
    (column) => column.field === 'assignmentRole:Coordinator'
  )!;
  const contains = assignment.filterOperators!.find(
    (operator) => operator.value === 'contains'
  )!;
  const isUnassigned = assignment.filterOperators!.find(
    (operator) => operator.value === 'isEmpty'
  )!;
  const containsPerson = contains.getApplyFilterFn!(
    { field: assignment.field, operator: 'contains', value: ['person-2'] },
    assignment
  )!;
  const matchesUnassigned = isUnassigned.getApplyFilterFn!(
    { field: assignment.field, operator: 'isEmpty' },
    assignment
  )!;

  expect(roles[0].options.map((option) => option.value)).toEqual([
    'person-1',
    'person-2',
  ]);
  expect(
    containsPerson(['person-2'], assigned, assignment, {
      current: undefined,
    })
  ).toBe(true);
  expect(
    matchesUnassigned([], unassigned, assignment, {
      current: undefined,
    })
  ).toBe(true);
  expect(
    matchesUnassigned(['person-2'], assigned, assignment, {
      current: undefined,
    })
  ).toBe(false);
  expect(
    assignment.valueFormatter?.(['person-2'], assigned, assignment, {
      current: undefined,
    })
  ).toBe('John Smith');
});

test('derives typed custom-field columns from each configuration', () => {
  const configA = [
    customField('Housing stable', CustomFieldType.Boolean),
    customField('Program', CustomFieldType.String, ['Mentoring', 'Respite']),
    customField('Notes', CustomFieldType.String),
    customField('Needs', CustomFieldType.StringArray, ['Food', 'Housing']),
  ];
  const valuesA: Record<string, ReferralCustomFieldValue> = {
    'Housing stable': true,
    Program: 'Mentoring',
    Notes: 'Follow up',
    Needs: ['Food'],
  };
  const configB = [
    customField('Region', CustomFieldType.String, ['North', 'South']),
  ];
  const builtA = columns([row({ customFieldValues: valuesA })], [], configA);
  const builtB = columns(
    [row({ customFieldValues: { Region: 'North' } })],
    [],
    configB
  );
  const builtC = columns([row()], [], []);

  expect(
    builtA.find((column) => column.field.endsWith('Housing stable'))?.type
  ).toBe('boolean');
  expect(builtA.find((column) => column.field.endsWith('Program'))?.type).toBe(
    'singleSelect'
  );
  expect(builtA.find((column) => column.field.endsWith('Notes'))?.type).toBe(
    'string'
  );
  expect(builtA.find((column) => column.field.endsWith('Needs'))?.type).toBe(
    'multiSelect'
  );
  expect(builtB.some((column) => column.field.endsWith('Region'))).toBe(true);
  expect(builtB.some((column) => column.field.endsWith('Program'))).toBe(false);
  expect(
    builtC.some((column) => column.field.startsWith('referralCustomField:'))
  ).toBe(false);
});

test('keeps unexpected configured-string values as filterable text', () => {
  const definition = customField('Program', CustomFieldType.String, [
    'Mentoring',
  ]);
  const referral = row({ customFieldValues: { Program: 'Other program' } });
  const program = columns([referral], [], [definition]).find(
    (column) => column.field === 'referralCustomField:Program'
  )!;

  expect(program.type).toBe('string');
  expect(
    program.valueGetter?.(undefined, referral, program, {
      current: undefined,
    })
  ).toBe('Other program');
});

test('exports display values while keeping identities and comments internal', () => {
  const definition = customField('Housing stable', CustomFieldType.Boolean);
  const roles: ReferralAssignmentRoleV2[] = [
    {
      role: 'Coordinator',
      options: [{ value: 'person-1', label: 'Megan Smith' }],
    },
  ];
  const referral = row({
    assignmentNamesByRole: { Coordinator: 'Megan Smith' },
    assignmentPersonIdsByRole: { Coordinator: ['person-1'] },
    customFieldValues: { 'Housing stable': true },
  });
  const built = columns([referral], roles, [definition]);
  const assignment = built.find(
    (column) => column.field === 'assignmentRole:Coordinator'
  )!;
  const custom = built.find(
    (column) => column.field === 'referralCustomField:Housing stable'
  )!;

  expect(
    assignment.valueFormatter?.(['person-1'], referral, assignment, {
      current: undefined,
    })
  ).toBe('Megan Smith');
  expect(
    custom.valueFormatter?.(true, referral, custom, { current: undefined })
  ).toBe('Yes');
  expect(
    built.find((column) => column.field === REFERRALS_SEARCH_FIELD)
      ?.disableExport
  ).toBe(true);
  expect(built.some((column) => column.field === 'comments')).toBe(false);
});

test('keeps sensitive fields excluded from analytics', () => {
  for (const column of columns([row()]).filter(
    (column) => !['referralCount', 'status', 'county'].includes(column.field)
  )) {
    expect(column.groupable).toBe(false);
    expect(column.aggregable).toBe(false);
    expect(column.pivotable).toBe(false);
    expect(column.chartable).toBe(false);
  }
});

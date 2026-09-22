import { expect, test } from '@playwright/test';
import type {
  GridColDef,
  GridMultiSelectColDef,
  GridSingleSelectColDef,
} from '@mui/x-data-grid-premium';
import { CombinedFamilyInfo } from '../src/GeneratedClient';
import { roleFilterValues } from '../src/Volunteers/roleFilterValues';
import { buildVolunteersGridColumns } from '../src/Volunteers/volunteersGridColumns';
import {
  buildVolunteerBrowserRow,
  type VolunteerBrowserRowV2,
} from '../src/Volunteers/useVolunteersBrowserViewModel';

function row(
  id: string,
  statusFilterValues: string[],
  county: string | null = null
): VolunteerBrowserRowV2 {
  return {
    arrangementAssignmentValues: {},
    county,
    family: `Family ${id}`,
    familyCustomFieldValues: {},
    familyLastName: id,
    id,
    missingRequirementGroups: [],
    primaryContact: '',
    requirementFilterValues: ['__complete__'],
    roleFilterValues: [],
    roleStatusValues: {},
    roles: { familyRoles: [], individualRoles: [] },
    searchableText: '',
    sourceFamily: new CombinedFamilyInfo(),
    statusFilterValues,
    statusLabels: [],
    volunteerFamilyCount: 1,
    volunteerCustomFieldValues: {},
  };
}

function isSingleSelectColumn(
  column: GridColDef<VolunteerBrowserRowV2>
): column is GridSingleSelectColDef<VolunteerBrowserRowV2, string | null> {
  return column.type === 'singleSelect';
}

function countyColumn(
  rows: VolunteerBrowserRowV2[]
): GridSingleSelectColDef<VolunteerBrowserRowV2, string | null> {
  const column = buildVolunteersGridColumns({
    arrangementTypes: [],
    familyCustomFields: [],
    roleNames: [],
    rows,
    volunteerCustomFields: [],
  }).find((item) => item.field === 'county');

  if (!column || !isSingleSelectColumn(column)) {
    throw new Error('County single-select column was not found.');
  }

  return column;
}

function isMultiSelectColumn(
  column: GridColDef<VolunteerBrowserRowV2>
): column is GridMultiSelectColDef<VolunteerBrowserRowV2> {
  return column.type === 'multiSelect';
}

function statusColumn(): GridMultiSelectColDef<VolunteerBrowserRowV2> {
  const column = buildVolunteersGridColumns({
    arrangementTypes: [],
    familyCustomFields: [],
    roleNames: [],
    rows: [],
    volunteerCustomFields: [],
  }).find((item) => item.field === 'status');

  if (!column) {
    throw new Error('Status column was not found.');
  }

  if (!isMultiSelectColumn(column)) {
    throw new Error('Expected Status to be a multiSelect column.');
  }

  return column;
}

test('Status configures the native membership operator for raw multi-value statuses', () => {
  const approved = row('approved', ['2']);
  const prospectiveAndApproved = row('prospective-approved', ['1', '2']);
  const inactive = row('inactive', ['5']);
  const column = statusColumn();
  const contains = column.filterOperators?.find(
    (operator) => operator.value === 'contains'
  );

  if (!contains) throw new Error('Status contains operator was not found.');

  const applyFilter = contains.getApplyFilterFn(
    { field: 'status', operator: 'contains', value: ['2'] },
    column
  );

  if (!applyFilter) throw new Error('Status filter function was not created.');

  if (!Array.isArray(column.valueOptions)) {
    throw new Error('Status value options were not configured.');
  }

  expect(column.valueOptions).toContainEqual({ label: 'Approved', value: '2' });
  expect(approved.statusFilterValues).toContain('2');
  expect(prospectiveAndApproved.statusFilterValues).toContain('2');
  expect(inactive.statusFilterValues).not.toContain('2');
});

test('Status remains a non-sortable, non-analytical native multi-select column', () => {
  const column = statusColumn();

  expect(column.filterable).not.toBe(false);
  expect(column.sortable).toBe(false);
  expect(column.aggregable).toBe(false);
  expect(column.pivotable).toBe(false);
  expect(column.chartable).toBe(false);
  expect(column.getApplyQuickFilterFn).toBeDefined();
});

test('County uses the native single-select filter with safe missing values', () => {
  const wakeCounty = row('wake', [], 'Wake');
  const durhamCounty = row('durham', [], 'Durham');
  const missingCounty = row('missing', []);
  const column = countyColumn([wakeCounty, durhamCounty, missingCounty]);
  const isOperator = column.filterOperators?.find(
    (operator) => operator.value === 'is'
  );

  if (!isOperator) throw new Error('County is operator was not found.');

  const matchesWake = isOperator.getApplyFilterFn(
    { field: 'county', operator: 'is', value: 'Wake' },
    column
  );

  if (!matchesWake) throw new Error('County filter function was not created.');

  expect(column.type).toBe('singleSelect');
  expect(column.valueOptions).toEqual(['Durham', 'Wake']);
  expect(column.filterable).not.toBe(false);
  expect(column.pivotable).toBe(true);
  expect(column.chartable).toBe(false);
  expect(column.aggregable).toBe(false);
  expect(column.getApplyQuickFilterFn).toBeDefined();
  expect(column.valueFormatter).toBeDefined();
});

test('County projects from the volunteer family primary contact current address', () => {
  const family = CombinedFamilyInfo.fromJS({
    family: {
      id: 'family-1',
      primaryFamilyContactPersonId: 'person-1',
      adults: [
        {
          item1: {
            id: 'person-1',
            firstName: 'Leia',
            lastName: 'Organa',
            currentAddressId: 'current-address',
            addresses: [
              { id: 'former-address', county: 'Durham' },
              { id: 'current-address', county: 'Wake' },
            ],
          },
        },
      ],
    },
    volunteerFamilyInfo: {
      familyRoleApprovals: {},
      individualVolunteers: {},
      assignments: [],
      completedCustomFields: [],
    },
  });

  const projected = buildVolunteerBrowserRow(family, [], [], [], new Map(), []);

  expect(projected.county).toBe('Wake');
});

test('Role filter values ignore un-applied role entries', () => {
  const family = CombinedFamilyInfo.fromJS({
    volunteerFamilyInfo: {
      familyRoleApprovals: {
        'Family Coach': { currentStatus: 2 },
        'Host Family': { currentStatus: null },
      },
      individualVolunteers: {
        adult: {
          approvalStatusByRole: {
            'Family Friend': { currentStatus: null },
          },
        },
      },
    },
  });

  expect(roleFilterValues(family)).toEqual(['Family Coach']);
});

test('Role filter values expose Not Applied when no roles are current', () => {
  const family = CombinedFamilyInfo.fromJS({
    volunteerFamilyInfo: {
      familyRoleApprovals: {
        'Host Family': { currentStatus: null },
      },
    },
  });

  expect(roleFilterValues(family)).toEqual(['Not Applied']);
});

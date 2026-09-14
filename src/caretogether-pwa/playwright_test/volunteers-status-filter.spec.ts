import { expect, test } from '@playwright/test';
import type {
  GridColDef,
  GridMultiSelectColDef,
} from '@mui/x-data-grid-premium';
import { CombinedFamilyInfo } from '../src/GeneratedClient';
import { buildVolunteersGridColumns } from '../src/Volunteers/volunteersGridColumns';
import type { VolunteerBrowserRowV2 } from '../src/Volunteers/useVolunteersBrowserViewModel';

function row(id: string, statusFilterValues: string[]): VolunteerBrowserRowV2 {
  return {
    arrangementAssignmentValues: {},
    family: `Family ${id}`,
    familyCustomFieldValues: {},
    familyLastName: id,
    id,
    missingRequirementGroups: [],
    primaryContact: '',
    requirementFilterValues: ['__complete__'],
    roleFilterValues: [],
    roles: { familyRoles: [], individualRoles: [] },
    searchableText: '',
    sourceFamily: new CombinedFamilyInfo(),
    statusFilterValues,
    statusLabels: [],
    volunteerFamilyCount: 1,
    volunteerCustomFieldValues: {},
  };
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

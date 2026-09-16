import { expect, test } from '@playwright/test';
import {
  ArrangementEntry,
  type IArrangementEntry,
} from '../src/GeneratedClient';
import {
  ASSIGNMENTS_SEARCH_FIELD,
  assignmentsDefaultColumnVisibility,
  assignmentsInitialSortModel,
  buildVolunteerAssignmentsGridColumns,
} from '../src/Families/volunteerAssignmentsGridColumns';
import {
  assignmentBrowserStatus,
  assignmentBrowserStatusPresentation,
  buildVolunteerAssignmentRowsV2,
} from '../src/Families/volunteerAssignmentViewModel';

function assignment(
  overrides: Partial<IArrangementEntry> = {}
): ArrangementEntry {
  return new ArrangementEntry({
    id: 'assignment-1',
    arrangementType: 'Hosting',
    arrangementPolicyVersion: 'policy-version',
    active: false,
    requestedAtUtc: new Date('2025-01-01T12:00:00Z'),
    partneringFamilyPersonId: 'person-1',
    completedRequirements: [],
    exemptedRequirements: [],
    individualVolunteerAssignments: [],
    familyVolunteerAssignments: [],
    childLocationHistory: [],
    childLocationPlan: [],
    comments: 'Private comment',
    reason: 'Private reason',
    ...overrides,
  });
}

function rowsFor(assignments: ArrangementEntry[]) {
  return buildVolunteerAssignmentRowsV2({
    assignments,
    childFamilyIdForAssignment: () => 'family-2',
    familyLabel: (familyId) =>
      familyId === 'family-2' ? 'Alderaan Family' : undefined,
    personLabel: (personId) =>
      personId === 'person-1' ? 'Leia Organa' : undefined,
  });
}

test('uses typed assignment rows with native Premium browser columns', () => {
  const first = assignment({
    id: 'assignment-1',
    startedAtUtc: new Date('2025-02-01T12:00:00Z'),
  });
  const second = assignment({
    id: 'assignment-2',
    endedAtUtc: new Date('2025-02-02T12:00:00Z'),
  });
  const rows = rowsFor([second, first]);
  const columns = buildVolunteerAssignmentsGridColumns(rows);

  expect(rows.map((row) => row.id)).toEqual(['assignment-2', 'assignment-1']);
  expect(rows[0].source).toBe(second);
  expect(rows[0].partneringFamilyPersonId).toBe('person-1');
  expect(rows[0].childFamilyId).toBe('family-2');
  expect(rows[0].startedAtUtc).toBeNull();
  expect(rows[0].endedAtUtc).toBeInstanceOf(Date);
  expect(rows[1].startedAtUtc).toBeInstanceOf(Date);
  expect(rows[0].status).toBe('ended');
  expect(assignmentBrowserStatus(first)).toBe('pending');
  expect(assignmentBrowserStatus(assignment({ active: true }))).toBe('active');
  expect(
    assignmentBrowserStatus(
      assignment({ cancelledAtUtc: new Date('2025-02-03T12:00:00Z') })
    )
  ).toBe('cancelled');
  expect(assignmentBrowserStatusPresentation('pending')).toEqual({
    label: 'Pending',
    color: 'warning',
  });
  expect(assignmentsInitialSortModel).toEqual([
    { field: 'startedAtUtc', sort: 'desc' },
  ]);
  expect(rows[0].searchableText).toContain('Hosting');
  expect(rows[0].searchableText).toContain('Leia Organa');
  expect(rows[0].searchableText).toContain('Ended');
  expect(rows[0].searchableText).toContain('Alderaan Family');
  expect(rows[0].searchableText).not.toContain('assignment-2');
  expect(rows[0].searchableText).not.toContain('policy-version');
  expect(rows[0].searchableText).not.toContain('Private comment');
  expect(rows[0].searchableText).not.toContain('Private reason');
  expect(
    columns
      .filter(
        (column) => assignmentsDefaultColumnVisibility[column.field] !== false
      )
      .map((column) => column.field)
  ).toEqual([
    'arrangementType',
    'personLabel',
    'status',
    'startedAtUtc',
    'endedAtUtc',
    'currentLocationLabel',
    'nextPlannedLocationLabel',
    'openDetails',
  ]);
  expect(
    columns.find((column) => column.field === ASSIGNMENTS_SEARCH_FIELD)
  ).toMatchObject({
    disableExport: true,
    filterable: false,
    hideable: false,
    sortable: false,
  });
  expect(
    columns.find((column) => column.field === 'openDetails')?.disableExport
  ).toBe(true);
  expect(
    columns.some((column) =>
      [
        'source',
        'partneringFamilyPersonId',
        'childFamilyId',
        'currentLocationFamilyId',
        'nextPlannedLocationFamilyId',
        'arrangementPolicyVersion',
      ].includes(column.field)
    )
  ).toBe(false);
  expect(columns.every((column) => column.aggregable === false)).toBe(true);
  expect(columns.every((column) => column.pivotable === false)).toBe(true);
  expect(columns.every((column) => column.groupable === false)).toBe(true);
});

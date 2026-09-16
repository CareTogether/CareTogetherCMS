import { expect, test } from '@playwright/test';
import {
  Arrangement,
  ArrangementFunction,
  ArrangementPhase,
  CombinedFamilyInfo,
  Family,
  FunctionRequirement,
  V1Case,
} from '../src/GeneratedClient';
import type { GridColDef } from '@mui/x-data-grid-premium';
import {
  ARRANGEMENTS_SEARCH_FIELD,
  arrangementsDefaultColumnVisibility,
  arrangementsInitialSortModel,
  buildArrangementsGridColumns,
  formatArrangementDate,
  isInternalArrangementsColumn,
  isOptionalArrangementsColumn,
} from '../src/V1Cases/Arrangements/arrangementsGridColumns';
import {
  arrangementFunctionFieldId,
  type ArrangementBrowserRowV2,
} from '../src/V1Cases/Arrangements/arrangementViewModel';

const sourceArrangement = new Arrangement({
  id: 'arrangement-1',
  arrangementType: 'Hosting',
  partneringFamilyPersonId: 'person-1',
  phase: ArrangementPhase.ReadyToStart,
  requestedAtUtc: new Date('2025-03-01T12:00:00Z'),
  completedRequirements: [],
  exemptedRequirements: [],
  missingRequirements: [],
  missingOptionalRequirements: [],
  individualVolunteerAssignments: [],
  familyVolunteerAssignments: [],
  childLocationHistory: [],
  childLocationPlan: [],
});

const partneringFamily = new CombinedFamilyInfo({
  family: new Family({
    id: 'family-1',
    active: true,
    primaryFamilyContactPersonId: 'person-1',
    adults: [],
    children: [],
    custodialRelationships: [],
    uploadedDocuments: [],
    deletedDocuments: [],
    completedCustomFields: [],
    history: [],
    isTestFamily: false,
  }),
  users: [],
  notes: [],
  uploadedDocuments: [],
  missingCustomFields: [],
  userPermissions: [],
});

const v1Case = new V1Case({
  id: 'case-1',
  openedAtUtc: new Date('2025-03-01T12:00:00Z'),
  completedRequirements: [],
  exemptedRequirements: [],
  missingRequirements: [],
  completedCustomFields: [],
  missingCustomFields: [],
  arrangements: [],
  assignedIndividualVolunteers: [],
  linkedV1ReferralIds: [],
});

const hostFunction = new ArrangementFunction({
  functionName: 'Host',
  requirement: FunctionRequirement.ExactlyOne,
  variants: [],
});

function requireColumn(
  columns: readonly GridColDef<ArrangementBrowserRowV2>[],
  field: string
): GridColDef<ArrangementBrowserRowV2> {
  const column = columns.find((candidate) => candidate.field === field);
  if (!column) {
    throw new Error(`Expected ${field} column`);
  }

  return column;
}

function row(
  overrides: Partial<ArrangementBrowserRowV2> = {}
): ArrangementBrowserRowV2 {
  const field = arrangementFunctionFieldId('Hosting', null, 'Host');
  return {
    id: 'arrangement-1',
    arrangementType: 'Hosting',
    arrangementPolicyVersion: null,
    phase: ArrangementPhase.ReadyToStart,
    requestedAtUtc: new Date('2025-03-01T12:00:00Z'),
    plannedStartUtc: null,
    plannedEndUtc: null,
    startedAtUtc: null,
    endedAtUtc: null,
    cancelledAtUtc: null,
    participantLabel: 'Leia Organa',
    caseLabel: 'Open since 3/1/25',
    currentLocationLabel: null,
    searchableText: 'Hosting\nLeia Organa\nReady to start\nOpen since 3/1/25',
    functionAssignmentValues: {
      [field]: {
        assignmentIds: ['person:family-2:person-2'],
        assignmentLabels: ['Han Solo'],
      },
    },
    familyLabel: 'Organa Family',
    childOrPersonLabel: 'Leia Organa',
    hostFamilyLabel: undefined,
    volunteerLabel: 'Han Solo',
    statusLabel: 'Ready to start',
    requestedDate: '3/1/25',
    startedDate: undefined,
    endedDate: undefined,
    cancelledDate: undefined,
    plannedStartDate: undefined,
    plannedEndDate: undefined,
    reason: undefined,
    comments: undefined,
    functionSummaries: [
      {
        functionName: 'Host',
        requirementLabel: 'Exactly one',
        statusLabel: 'Assigned',
        assignmentLabels: ['Han Solo'],
        assignments: [],
        missingVariantLabels: [],
        functionPolicy: hostFunction,
      },
    ],
    source: sourceArrangement,
    arrangementPolicy: undefined,
    partneringFamily,
    v1Case,
    ...overrides,
  };
}

test('keeps arrangement browser values typed and reporting disabled', () => {
  const first = row();
  const second = row({ id: 'arrangement-2' });
  const columns = buildArrangementsGridColumns([first, second]);
  const status = requireColumn(columns, 'phase');
  const requested = requireColumn(columns, 'requestedAtUtc');
  const search = requireColumn(columns, ARRANGEMENTS_SEARCH_FIELD);
  const assignment = columns.find((column) =>
    column.field.startsWith('functionAssignment:')
  );
  if (!assignment) {
    throw new Error('Expected dynamic assignment column');
  }
  const visibility = arrangementsDefaultColumnVisibility(columns);

  expect([first.id, second.id]).toEqual(['arrangement-1', 'arrangement-2']);
  expect(first.phase).toBe(ArrangementPhase.ReadyToStart);
  expect(first.requestedAtUtc).toBeInstanceOf(Date);
  expect(first.currentLocationLabel).toBeNull();
  expect(status.type).toBe('singleSelect');
  expect(requested.type).toBe('date');
  expect(formatArrangementDate(first.requestedAtUtc)).toBe('3/1/25');
  expect(arrangementsInitialSortModel).toEqual([
    { field: 'phase', sort: 'asc' },
  ]);
  expect(search.disableExport).toBe(true);
  expect(search.filterable).toBe(false);
  expect(search.hideable).toBe(false);
  expect(isInternalArrangementsColumn(ARRANGEMENTS_SEARCH_FIELD)).toBe(true);
  expect(isOptionalArrangementsColumn('requestedAtUtc')).toBe(true);
  expect(visibility.requestedAtUtc).toBe(false);
  expect(visibility.cancelledAtUtc).toBe(false);
  expect(visibility.functionAssignments).toBe(true);
  expect(visibility[assignment.field]).toBe(false);
  expect(
    columns
      .filter((column) => visibility[column.field] !== false)
      .map((column) => column.field)
  ).toEqual([
    'arrangementType',
    'participantLabel',
    'phase',
    'caseLabel',
    'plannedStartUtc',
    'plannedEndUtc',
    'startedAtUtc',
    'endedAtUtc',
    'currentLocationLabel',
    'functionAssignments',
    'openDetails',
  ]);
  expect(assignment.type).toBe('multiSelect');
  expect(assignment.disableExport).toBeUndefined();
  expect(columns.every((column) => column.aggregable === false)).toBe(true);
  expect(columns.every((column) => column.pivotable === false)).toBe(true);
  expect(columns.every((column) => column.groupable === false)).toBe(true);
});

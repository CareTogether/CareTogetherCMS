import assert from 'node:assert/strict';
import test from 'node:test';
import type { CombinedFamilyInfo } from '../GeneratedClient';
import { buildArrangementWorkQueue } from './arrangementWorkQueue.ts';

const scope = { organizationId: 'organization-1', locationId: 'location-1' };
const action = { actionName: 'Safety visit', isRequired: true };
const upcoming = { action, dueBy: new Date('2026-11-25') };
const pastDue = { action, pastDueSince: new Date('2026-11-24') };

function familyWithRequirements(
  missingRequirements: object[],
  {
    familyId = 'family-1',
    caseId = 'case-1',
    arrangementId = 'arrangement-1',
    closed = false,
    missingOptionalRequirements = [] as object[],
  } = {}
) {
  const v1Case = {
    id: caseId,
    arrangements: [
      { id: arrangementId, missingRequirements, missingOptionalRequirements },
    ],
  };
  return {
    family: { id: familyId },
    partneringFamilyInfo: closed
      ? { closedV1Cases: [v1Case] }
      : { openV1Case: v1Case },
  } as unknown as CombinedFamilyInfo;
}

test('projects backend-classified dates and arrangement navigation from open and closed cases', () => {
  const items = buildArrangementWorkQueue(scope, [
    familyWithRequirements([upcoming]),
    familyWithRequirements([pastDue], {
      caseId: 'case-2',
      arrangementId: 'arrangement-2',
      closed: true,
    }),
  ]);

  assert.deepEqual(
    items.map(({ id, snoozeToken, ...item }) => {
      assert.ok(id);
      assert.equal(snoozeToken, id);
      return item;
    }),
    [
      {
        requirementName: 'Safety visit',
        target: {
          familyId: 'family-1',
          v1CaseId: 'case-2',
          arrangementId: 'arrangement-2',
        },
        assignment: undefined,
        occurrenceDate: '2026-11-24',
        status: 'past-due',
      },
      {
        requirementName: 'Safety visit',
        target: {
          familyId: 'family-1',
          v1CaseId: 'case-1',
          arrangementId: 'arrangement-1',
        },
        assignment: undefined,
        occurrenceDate: '2026-11-25',
        status: 'upcoming',
      },
    ]
  );
});

test('omits optional and undated requirements', () => {
  const items = buildArrangementWorkQueue(scope, [
    familyWithRequirements(
      [
        upcoming,
        { action },
        { ...pastDue, action: { ...action, isRequired: false } },
      ],
      { missingOptionalRequirements: [pastDue] }
    ),
  ]);
  assert.deepEqual(
    items.map((item) => item.occurrenceDate),
    ['2026-11-25']
  );
});

test('keeps the same ID when the backend moves an occurrence to past due', () => {
  const [before] = buildArrangementWorkQueue(scope, [
    familyWithRequirements([upcoming]),
  ]);
  const [after] = buildArrangementWorkQueue(scope, [
    familyWithRequirements([{ action, pastDueSince: upcoming.dueBy }]),
  ]);

  assert.equal(before.id, after.id);
  assert.equal(before.status, 'upcoming');
  assert.equal(after.status, 'past-due');
});

test('sorts by date and ID regardless of input order and distinguishes recurring dates', () => {
  const later = { action, dueBy: new Date('2026-12-01') };
  const firstFamily = familyWithRequirements([later, pastDue, upcoming]);
  const secondFamily = familyWithRequirements([upcoming], {
    familyId: 'family-2',
    arrangementId: 'arrangement-2',
  });
  const items = buildArrangementWorkQueue(scope, [firstFamily, secondFamily]);

  assert.deepEqual(
    items.map((item) => item.occurrenceDate),
    ['2026-11-24', '2026-11-25', '2026-11-25', '2026-12-01']
  );
  assert.equal(new Set(items.map((item) => item.id)).size, 4);
  assert.deepEqual(
    items,
    buildArrangementWorkQueue(scope, [
      secondFamily,
      familyWithRequirements([upcoming, pastDue, later]),
    ])
  );
});

test('distinguishes arrangement, family assignment, and individual assignment occurrences', () => {
  const assignment = {
    arrangementFunction: 'Support',
    arrangementFunctionVariant: 'In person',
    volunteerFamilyId: 'volunteer-family-1',
    personId: 'volunteer-person-1',
  };
  const items = buildArrangementWorkQueue(scope, [
    familyWithRequirements([
      upcoming,
      { ...upcoming, ...assignment },
      { ...upcoming, ...assignment, personId: null },
      { ...upcoming, ...assignment, personId: 'volunteer-person-2' },
      { ...upcoming, ...assignment, volunteerFamilyId: 'volunteer-family-2' },
      { ...upcoming, ...assignment, arrangementFunction: 'Transport' },
      { ...upcoming, ...assignment, arrangementFunctionVariant: null },
      { ...upcoming, ...assignment, arrangementFunctionVariant: 'Remote' },
    ]),
  ]);

  assert.equal(items.length, 8);
  assert.equal(new Set(items.map((item) => item.id)).size, 8);
  assert.ok(items.some((item) => item.assignment === undefined));
  assert.ok(
    items.some(
      (item) =>
        item.assignment?.volunteerFamilyId === assignment.volunteerFamilyId &&
        item.assignment.personId === undefined
    )
  );
  assert.ok(
    items.some(
      ({ assignment: context }) =>
        context?.arrangementFunction === assignment.arrangementFunction &&
        context.arrangementFunctionVariant ===
          assignment.arrangementFunctionVariant &&
        context.volunteerFamilyId === assignment.volunteerFamilyId &&
        context.personId === assignment.personId
    )
  );
});

test('isolates IDs by organization and location', () => {
  const families = [familyWithRequirements([upcoming])];
  const keys = [
    scope,
    { ...scope, locationId: 'location-2' },
    { ...scope, organizationId: 'organization-2' },
  ].map((location) => buildArrangementWorkQueue(location, families)[0].id);

  assert.equal(new Set(keys).size, 3);
});

test('returns an empty queue for empty input and removes resolved occurrences on reprojection', () => {
  assert.deepEqual(buildArrangementWorkQueue(scope, []), []);
  const before = buildArrangementWorkQueue(scope, [
    familyWithRequirements([pastDue, upcoming]),
  ]);
  assert.equal(before.length, 2);
  assert.deepEqual(
    buildArrangementWorkQueue(scope, [familyWithRequirements([upcoming])]),
    [before[1]]
  );
});

test('omits rows with missing record or action identity, partial assignments, or inconsistent dates', () => {
  assert.deepEqual(
    buildArrangementWorkQueue({ ...scope, locationId: '' }, [
      familyWithRequirements([upcoming]),
    ]),
    []
  );
  assert.deepEqual(
    buildArrangementWorkQueue(scope, [
      familyWithRequirements([upcoming], { familyId: '' }),
      familyWithRequirements([upcoming], { caseId: '' }),
      familyWithRequirements([upcoming], { arrangementId: '' }),
      familyWithRequirements([
        { dueBy: upcoming.dueBy },
        { ...upcoming, action: { ...action, actionName: ' ' } },
        { ...upcoming, personId: 'volunteer-person-1' },
        { ...upcoming, arrangementFunction: 'Support' },
        { ...upcoming, pastDueSince: pastDue.pastDueSince },
        { ...upcoming, dueBy: new Date(Number.NaN) },
        { ...upcoming, dueBy: new Date('2026-11-25T12:00:00Z') },
      ]),
    ]),
    []
  );
});

test('does not invent distinct IDs for indistinguishable occurrences', () => {
  const items = buildArrangementWorkQueue(scope, [
    familyWithRequirements([
      upcoming,
      { ...upcoming, arrangementFunction: null, volunteerFamilyId: null },
    ]),
  ]);

  assert.equal(items.length, 2);
  assert.equal(items[0].id, items[1].id);
});

test('a requirement can reappear with the same display key after a completion reversal', () => {
  const before = buildArrangementWorkQueue(scope, [
    familyWithRequirements([upcoming]),
  ]);
  const completed = buildArrangementWorkQueue(scope, [
    familyWithRequirements([]),
  ]);
  const reversed = buildArrangementWorkQueue(scope, [
    familyWithRequirements([upcoming]),
  ]);

  assert.equal(before.length, 1);
  assert.deepEqual(completed, []);
  assert.deepEqual(reversed, before);
});

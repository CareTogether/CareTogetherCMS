import assert from 'node:assert/strict';
import { register } from 'node:module';
import test from 'node:test';
import type { CombinedFamilyInfo, CommunityInfo } from '../GeneratedClient';

register(
  new URL(
    `data:text/javascript,${encodeURIComponent(`
    import { readFile } from 'node:fs/promises';
    import { stripTypeScriptTypes } from 'node:module';
    export async function load(url, context, nextLoad) {
      if (!url.endsWith('/GeneratedClient.ts')) return nextLoad(url, context);
      const source = stripTypeScriptTypes(await readFile(new URL(url), 'utf8'), { mode: 'transform' });
      return { format: 'module', shortCircuit: true, source };
    }
  `)}`
  )
);

const { ArrangementPhase } = await import('../GeneratedClient.ts');
const { selectMyAssignments } = await import('./myAssignments.ts');

const me = 'me';
const other = 'other';

function volunteerFamily(
  id: string,
  adults: { id: string; active?: boolean }[],
  active = true
) {
  return {
    family: {
      id,
      active,
      adults: adults.map(({ id: personId, active: adultActive = true }) => ({
        item1: { id: personId, active: adultActive },
      })),
    },
  } as unknown as CombinedFamilyInfo;
}

function partneringFamily({
  id = 'client',
  active = true,
  closedAtUtc = undefined as Date | undefined,
  assigned = [] as { personId: string; assignmentRole: string }[],
  arrangements = [] as object[],
  closedCases = [] as object[],
} = {}) {
  return {
    family: { id, active, adults: [] },
    partneringFamilyInfo: {
      openV1Case: {
        id: `${id}-case`,
        closedAtUtc,
        assignedIndividualVolunteers: assigned,
        arrangements,
      },
      closedV1Cases: closedCases,
    },
  } as unknown as CombinedFamilyInfo;
}

function arrangement(
  id: string,
  phase: number,
  { individuals = [] as object[], families = [] as object[] } = {}
) {
  return {
    id,
    phase,
    arrangementType: 'Hosting',
    individualVolunteerAssignments: individuals,
    familyVolunteerAssignments: families,
  };
}

function community(
  id: string,
  assignments: { personId: string; communityRole: string }[]
) {
  return {
    community: {
      id,
      name: `Community ${id}`,
      communityRoleAssignments: assignments,
    },
  } as unknown as CommunityInfo;
}

const coach = {
  familyId: 'mine',
  personId: me,
  arrangementFunction: 'Family Coach',
};

test('selects only the signed-in person’s case, arrangement, and role assignments', () => {
  const families = [
    volunteerFamily('mine', [{ id: me }]),
    partneringFamily({
      assigned: [
        { personId: me, assignmentRole: 'Case Manager' },
        { personId: other, assignmentRole: 'Case Manager' },
      ],
      arrangements: [
        arrangement('a', ArrangementPhase.Started, {
          individuals: [coach, { ...coach, personId: other }],
          families: [
            { familyId: 'mine', arrangementFunction: 'Host Family' },
            { familyId: 'theirs', arrangementFunction: 'Host Family' },
          ],
        }),
      ],
    }),
  ];
  const communities = [
    community('c', [
      { personId: me, communityRole: 'Coordinator' },
      { personId: other, communityRole: 'Coordinator' },
    ]),
  ];
  const result = selectMyAssignments(me, families, communities);

  assert.deepEqual(
    result.cases.map(({ familyId, v1CaseId, role }) => [
      familyId,
      v1CaseId,
      role,
    ]),
    [['client', 'client-case', 'Case Manager']]
  );
  assert.deepEqual(
    result.arrangements.map(
      ({ arrangementId, assignee, arrangementFunction }) => [
        arrangementId,
        assignee,
        arrangementFunction,
      ]
    ),
    [
      ['a', 'family', 'Host Family'],
      ['a', 'individual', 'Family Coach'],
    ]
  );
  assert.deepEqual(
    result.roles.map(({ communityId, role }) => [communityId, role]),
    [['c', 'Coordinator']]
  );
  assert.deepEqual(
    selectMyAssignments(other, families, communities).arrangements.map(
      ({ assignee }) => assignee
    ),
    ['individual']
  );
});

test('excludes historical, deleted, and incomplete assignments', () => {
  const families = [
    volunteerFamily('mine', [{ id: me }]),
    partneringFamily({
      closedAtUtc: new Date('2026-01-01'),
      assigned: [{ personId: me, assignmentRole: 'Case Manager' }],
      arrangements: [
        arrangement('ended', ArrangementPhase.Ended, { individuals: [coach] }),
        arrangement('cancelled', ArrangementPhase.Cancelled, {
          individuals: [coach],
        }),
        arrangement('setup', ArrangementPhase.SettingUp, {
          individuals: [coach, { ...coach, arrangementFunction: ' ' }],
        }),
      ],
      closedCases: [
        {
          id: 'old-case',
          arrangements: [
            arrangement('old', ArrangementPhase.Ended, {
              individuals: [coach],
            }),
          ],
        },
      ],
    }),
    partneringFamily({
      id: 'deleted',
      active: false,
      assigned: [{ personId: me, assignmentRole: 'Case Manager' }],
    }),
  ];
  const result = selectMyAssignments(me, families, [
    community('c', [{ personId: me, communityRole: '' }]),
  ]);
  assert.deepEqual(result.cases, []);
  assert.deepEqual(
    result.arrangements.map(({ arrangementId }) => arrangementId),
    ['setup']
  );
  assert.deepEqual(result.roles, []);
});

test('keeps distinct responsibilities and removes only repeated assignments', () => {
  const families = [
    volunteerFamily('mine', [{ id: me }]),
    partneringFamily({
      assigned: [
        { personId: me, assignmentRole: 'Case Manager' },
        { personId: me, assignmentRole: 'Case Manager' },
        { personId: me, assignmentRole: 'Advocate' },
      ],
      arrangements: [
        arrangement('a', ArrangementPhase.Started, {
          individuals: [
            coach,
            coach,
            { ...coach, arrangementFunctionVariant: 'Backup' },
          ],
        }),
        arrangement('b', ArrangementPhase.Started, { individuals: [coach] }),
      ],
    }),
  ];
  const communities = [
    community('c', [
      { personId: me, communityRole: 'Coordinator' },
      { personId: me, communityRole: 'Coordinator' },
    ]),
    community('d', [{ personId: me, communityRole: 'Coordinator' }]),
  ];
  const result = selectMyAssignments(me, families, communities);
  assert.deepEqual(
    result.cases.map(({ role }) => role),
    ['Advocate', 'Case Manager']
  );
  assert.equal(result.arrangements.length, 3);
  assert.equal(result.roles.length, 2);

  const keys = [...result.cases, ...result.arrangements, ...result.roles].map(
    ({ key }) => key
  );
  assert.equal(new Set(keys).size, keys.length);
  const reordered = selectMyAssignments(
    me,
    [...families].reverse(),
    [...communities].reverse()
  );
  assert.deepEqual(
    [...reordered.cases, ...reordered.arrangements, ...reordered.roles].map(
      ({ key }) => key
    ),
    keys
  );
});

test('family assignments require one authoritative family membership', () => {
  const client = partneringFamily({
    arrangements: [
      arrangement('a', ArrangementPhase.Started, {
        families: [{ familyId: 'mine', arrangementFunction: 'Host Family' }],
      }),
    ],
  });
  const familyAssignments = (families: CombinedFamilyInfo[]) =>
    selectMyAssignments(me, [...families, client], []).arrangements.length;

  assert.equal(familyAssignments([volunteerFamily('mine', [{ id: me }])]), 1);
  assert.equal(familyAssignments([]), 0);
  assert.equal(
    familyAssignments([volunteerFamily('mine', [{ id: me, active: false }])]),
    0
  );
  assert.equal(
    familyAssignments([
      volunteerFamily('mine', [{ id: me }]),
      volunteerFamily('second', [{ id: me }]),
    ]),
    0
  );
  assert.equal(
    familyAssignments([volunteerFamily('mine', [{ id: me }], false)]),
    0
  );
});

test('missing identity, restricted records, and updates produce no stale assignments', () => {
  const assigned = partneringFamily({
    assigned: [{ personId: me, assignmentRole: 'Case Manager' }],
  });
  const empty = { cases: [], arrangements: [], roles: [] };
  assert.deepEqual(selectMyAssignments(undefined, [assigned], []), empty);
  assert.deepEqual(selectMyAssignments(' ', [assigned], []), empty);
  assert.deepEqual(
    selectMyAssignments(
      me,
      [
        {
          family: { id: 'restricted' },
          partneringFamilyInfo: { openV1Case: { id: 'case' } },
        } as unknown as CombinedFamilyInfo,
      ],
      [{ community: { id: 'c' } } as unknown as CommunityInfo]
    ),
    empty
  );
  assert.equal(selectMyAssignments(me, [assigned], []).cases.length, 1);
  assert.deepEqual(
    selectMyAssignments(me, [partneringFamily({ assigned: [] })], []),
    empty
  );
  assert.deepEqual(
    selectMyAssignments('person-in-other-location', [assigned], []),
    empty
  );
});

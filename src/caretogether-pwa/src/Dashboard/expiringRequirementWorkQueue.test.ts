import assert from 'node:assert/strict';
import { register } from 'node:module';
import test from 'node:test';
import type { CombinedFamilyInfo } from '../GeneratedClient';

register(
  new URL(
    `data:text/javascript,${encodeURIComponent(`
  import { readFile } from 'node:fs/promises';
  import { stripTypeScriptTypes } from 'node:module';
  export async function load(url, context, nextLoad) {
    if (!url.endsWith('/GeneratedClient.ts')) return nextLoad(url, context);
    return { format: 'module', shortCircuit: true,
      source: stripTypeScriptTypes(await readFile(new URL(url), 'utf8'), { mode: 'transform' }) };
  }
`)}`
  )
);

const { Permission } = await import('../GeneratedClient.ts');
const { buildExpiringRequirementWorkQueue, familyHasExpiryNear } = await import(
  './expiringRequirementWorkQueue.ts'
);

const scope = { organizationId: 'org', locationId: 'loc' };
const now = new Date('2026-12-01T15:00:00Z');
const canView = [
  Permission.ViewApprovalStatus,
  Permission.ViewApprovalProgress,
];

function completed(name: string, expiresAtUtc?: string, roleNames = ['Host']) {
  return {
    requirementName: name,
    completedAtUtc: new Date('2025-01-01'),
    expiresAtUtc: expiresAtUtc ? new Date(expiresAtUtc) : undefined,
    roleNames,
  };
}

function family({
  familyRequirements = [] as object[],
  adultRequirements = [] as object[],
  permissions = canView,
} = {}) {
  return {
    family: {
      id: 'family',
      adults: [
        { item1: { id: 'adult', active: true, firstName: 'Jane' } },
        { item1: { id: 'former', active: false, firstName: 'Old' } },
      ],
    },
    userPermissions: permissions,
    volunteerFamilyInfo: {
      completedRequirements: familyRequirements,
      familyRoleApprovals: { Host: {} },
      individualVolunteers: {
        adult: {
          completedRequirements: adultRequirements,
          approvalStatusByRole: { Driver: {} },
        },
        former: {
          completedRequirements: [completed('Check', '2026-12-05', ['Driver'])],
          approvalStatusByRole: { Driver: {} },
        },
      },
    },
  } as unknown as CombinedFamilyInfo;
}

const build = (families: CombinedFamilyInfo[]) =>
  buildExpiringRequirementWorkQueue(scope, families, [], now);

test('lists family and adult requirements with the day they stop counting', () => {
  const items = build([
    family({
      familyRequirements: [completed('Home study', '2026-12-10')],
      adultRequirements: [completed('Check', '2026-11-20', ['Driver'])],
    }),
  ]);
  assert.deepEqual(
    items.map(({ target, actionName, expirationDate, affectedRoles }) => [
      target,
      actionName,
      expirationDate,
      affectedRoles,
    ]),
    [
      [
        { kind: 'individual', familyId: 'family', familyMemberId: 'adult' },
        'Check',
        '2026-11-21',
        [{ scope: 'individual', roleName: 'Driver' }],
      ],
      [
        { kind: 'family', familyId: 'family' },
        'Home study',
        '2026-12-11',
        [{ scope: 'family', roleName: 'Host' }],
      ],
    ]
  );
});

test('a newer completion or one without expiry hides the older one', () => {
  assert.deepEqual(
    build([
      family({
        familyRequirements: [
          completed('Home study', '2026-12-10'),
          completed('Home study', '2027-12-10'),
          completed('Training', '2026-12-10'),
          completed('Training'),
        ],
      }),
    ]),
    []
  );
});

test('the snooze key changes when the requirement is renewed', () => {
  const [before] = build([
    family({ familyRequirements: [completed('Home study', '2026-12-10')] }),
  ]);
  const [after] = build([
    family({ familyRequirements: [completed('Home study', '2027-01-20')] }),
  ]);
  assert.equal(before.key, after.key);
  assert.notEqual(before.snoozeToken, after.snoozeToken);
});

test('skips families without approval permissions and far-away dates', () => {
  const requirements = [completed('Home study', '2026-12-10')];
  assert.deepEqual(
    build([
      family({
        familyRequirements: requirements,
        permissions: [Permission.ViewApprovalStatus],
      }),
    ]),
    []
  );
  const far = family({
    familyRequirements: [
      completed('Home study', '2027-06-01'),
      completed('Training', '2025-01-01'),
    ],
  });
  assert.equal(
    familyHasExpiryNear(
      {
        ...far,
        volunteerFamilyInfo: {
          ...far.volunteerFamilyInfo,
          individualVolunteers: {},
        },
      } as CombinedFamilyInfo,
      now
    ),
    false
  );
  assert.deepEqual(build([far]), []);
});

test('organization rows become organization items', () => {
  const items = buildExpiringRequirementWorkQueue(
    scope,
    [],
    [
      {
        communityId: 'community',
        rows: [
          {
            id: 'row',
            status: 'completed',
            requirementName: 'Insurance',
            appliesTo: [
              { scope: 'organization', id: 'community', label: 'Org' },
            ],
            validUntil: new Date('2026-12-20'),
            neededForRoles: ['Partner'],
            neededForRoleLabels: ['Partner'],
            linkedDocumentIds: [],
            noteIds: [],
            notes: [],
            occurrences: [],
          },
        ],
      },
    ],
    now
  );
  assert.deepEqual(
    items.map(({ target, expirationDate, affectedRoles }) => [
      target,
      expirationDate,
      affectedRoles,
    ]),
    [
      [
        { kind: 'organization', communityId: 'community' },
        '2026-12-21',
        [{ scope: 'organization', roleName: 'Partner' }],
      ],
    ]
  );
});

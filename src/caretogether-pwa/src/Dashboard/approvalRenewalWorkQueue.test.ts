import assert from 'node:assert/strict';
import { register } from 'node:module';
import test from 'node:test';

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

const {
  ApprovalRenewalRoleScope,
  CombinedFamilyInfo,
  CommunityInfo,
  DisclosedApprovalRenewalCandidate,
  DisclosedApprovalRenewalState,
  FamilyApprovalRenewalTarget,
  IndividualApprovalRenewalTarget,
  OrganizationApprovalRenewalTarget,
} = await import('../GeneratedClient.ts');
const { buildApprovalRenewalWorkQueue } = await import(
  './approvalRenewalWorkQueue.ts'
);

const scope = { organizationId: 'tenant-a', locationId: 'location-a' };
const familyTarget = {
  discriminator: 'FamilyApprovalRenewalTarget',
  familyId: 'family',
};
const individualTarget = {
  discriminator: 'IndividualApprovalRenewalTarget',
  familyId: 'family',
  personId: 'person',
};
const organizationTarget = {
  discriminator: 'OrganizationApprovalRenewalTarget',
  communityId: 'community',
};
const affectedRoles = [
  { scope: ApprovalRenewalRoleScope.Family, roleName: 'Family Coach' },
];
const candidate = {
  candidateKey: 'backend-key',
  actionName: 'Safety Check',
  firstUncoveredOnUtc: '2026-11-25',
  state: DisclosedApprovalRenewalState.Uncovered,
  affectedRoles,
  target: familyTarget,
};

function family(renewalCandidates?: object[], id = 'family') {
  return CombinedFamilyInfo.fromJS({
    family: { id },
    volunteerFamilyInfo: {
      renewalCandidates,
      completedRequirements: [
        {
          requirementName: 'Other check',
          expiresAtUtc: '2026-11-25T00:00:00Z',
        },
      ],
    },
  });
}

function community(renewalCandidates?: object[]) {
  return CommunityInfo.fromJS({
    community: { id: 'community' },
    approvalInfo: { renewalCandidates },
  });
}

test('uses generated target discrimination and preserves disclosed data and navigation IDs', () => {
  const familyRecord = family([
    candidate,
    {
      ...candidate,
      candidateKey: 'person-key',
      target: individualTarget,
      state: DisclosedApprovalRenewalState.Upcoming,
      affectedRoles: [
        ...affectedRoles,
        {
          scope: ApprovalRenewalRoleScope.Individual,
          roleName: 'Individual Coach',
        },
      ],
    },
  ]);
  const communityRecord = community([
    {
      ...candidate,
      candidateKey: 'community-key',
      target: organizationTarget,
      firstUncoveredOnUtc: '2026-11-24',
      affectedRoles: [
        { scope: ApprovalRenewalRoleScope.Organization, roleName: 'Partner' },
      ],
    },
  ]);
  const [familyDto, personDto] =
    familyRecord.volunteerFamilyInfo!.renewalCandidates;
  assert.ok(familyDto.target instanceof FamilyApprovalRenewalTarget);
  assert.ok(personDto.target instanceof IndividualApprovalRenewalTarget);
  assert.ok(
    communityRecord.approvalInfo!.renewalCandidates[0].target instanceof
      OrganizationApprovalRenewalTarget
  );
  const items = buildApprovalRenewalWorkQueue(
    scope,
    [familyRecord],
    [communityRecord]
  );
  assert.deepEqual(
    items.map(({ target }) => target),
    [
      { kind: 'organization', communityId: 'community' },
      { kind: 'family', familyId: 'family' },
      { kind: 'individual', familyId: 'family', familyMemberId: 'person' },
    ]
  );
  assert.deepEqual(
    items.map(({ candidateKey }) => candidateKey),
    ['community-key', 'backend-key', 'person-key']
  );
  assert.equal(items[2].firstUncoveredOnUtc, '2026-11-25');
  assert.equal(items[2].state, DisclosedApprovalRenewalState.Upcoming);
  assert.equal(items[0].state, DisclosedApprovalRenewalState.Uncovered);
  assert.equal(items[2].affectedRoles, personDto.affectedRoles);
  assert.equal(items[2].actionName, 'Safety Check');
});

test('reprojects only the supplied scope and reflects renewal, removal, and reversal', () => {
  const original = buildApprovalRenewalWorkQueue(
    scope,
    [family([candidate])],
    []
  );
  const moved = buildApprovalRenewalWorkQueue(
    scope,
    [
      family([
        {
          ...candidate,
          firstUncoveredOnUtc: '2026-12-25',
          state: DisclosedApprovalRenewalState.Upcoming,
        },
      ]),
    ],
    []
  );
  assert.equal(moved[0].candidateKey, original[0].candidateKey);
  assert.equal(moved[0].firstUncoveredOnUtc, '2026-12-25');
  assert.deepEqual(buildApprovalRenewalWorkQueue(scope, [family([])], []), []);
  assert.deepEqual(
    buildApprovalRenewalWorkQueue(scope, [family([candidate])], []),
    original
  );
  const nextScope = { organizationId: 'tenant-b', locationId: 'location-b' };
  assert.deepEqual(
    buildApprovalRenewalWorkQueue(nextScope, [family()], [community()]),
    []
  );
  const other = { ...candidate, candidateKey: 'other-scope-key' };
  assert.deepEqual(
    buildApprovalRenewalWorkQueue(nextScope, [family([other])], []).map(
      ({ candidateKey, scope }) => ({ candidateKey, scope })
    ),
    [{ candidateKey: 'other-scope-key', scope: nextScope }]
  );
});

test('accepts absent and empty collections without inferring hidden renewal work', () => {
  assert.deepEqual(
    buildApprovalRenewalWorkQueue(scope, [family()], [community([])]),
    []
  );
  assert.deepEqual(
    buildApprovalRenewalWorkQueue(scope, [family([])], [community()]),
    []
  );
  assert.deepEqual(
    buildApprovalRenewalWorkQueue(
      { ...scope, locationId: '' },
      [family([candidate])],
      []
    ),
    []
  );
});

test('sorts by date and key, preserving duplicate backend keys and different evidence subjects', () => {
  const entries = [
    { ...candidate, candidateKey: 'z' },
    candidate,
    {
      ...candidate,
      target: { ...individualTarget, personId: 'another-person' },
    },
  ];
  const items = buildApprovalRenewalWorkQueue(scope, [family(entries)], []);
  assert.deepEqual(
    items.map(({ candidateKey }) => candidateKey),
    ['backend-key', 'backend-key', 'z']
  );
  assert.deepEqual(
    items.slice(0, 2).map(({ target }) => target.kind),
    ['family', 'individual']
  );
  const unique = [entries[0], entries[1]];
  assert.deepEqual(
    buildApprovalRenewalWorkQueue(scope, [family(unique)], []),
    buildApprovalRenewalWorkQueue(scope, [family([...unique].reverse())], [])
  );
});

test('skips malformed values and targets that do not match their owning aggregate', () => {
  assert.deepEqual(
    buildApprovalRenewalWorkQueue(
      scope,
      [
        family([
          { ...candidate, target: undefined },
          {
            ...candidate,
            target: { ...familyTarget, familyId: 'different-family' },
          },
          { ...candidate, target: { ...individualTarget, personId: '' } },
          { ...candidate, target: organizationTarget },
          { ...candidate, candidateKey: '' },
          { ...candidate, actionName: '' },
          { ...candidate, firstUncoveredOnUtc: 'not-a-date' },
          { ...candidate, firstUncoveredOnUtc: '2026-11-25T16:00:00Z' },
          { ...candidate, state: 99 },
          {
            ...candidate,
            affectedRoles: [{ scope: 99, roleName: 'Unknown scope' }],
          },
        ]),
      ],
      [
        community([
          candidate,
          {
            ...candidate,
            target: { ...organizationTarget, communityId: 'tenant-a' },
          },
        ]),
      ]
    ),
    []
  );
  assert.throws(() =>
    DisclosedApprovalRenewalCandidate.fromJS({
      ...candidate,
      target: { discriminator: 'UnknownTarget' },
    })
  );
});

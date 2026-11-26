import assert from 'node:assert/strict';
import { register } from 'node:module';
import test from 'node:test';
import type { ApprovalExpirationWorkItem } from './approvalExpirationWorkQueue';
import type { ApprovalRenewalWorkItem } from './approvalRenewalWorkQueue';

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

const {
  ApprovalRenewalRoleScope,
  DisclosedApprovalRenewalRole,
  DisclosedApprovalRenewalState,
  RoleApprovalStatus,
} = await import('../GeneratedClient.ts');
const { affectedApprovalRoleLabel, selectDashboardApprovalWork } = await import(
  './dashboardApprovalRenewals.ts'
);
const { defaultDashboardPreferences } = await import(
  './dashboardPreferences.ts'
);

const scope = { organizationId: 'tenant', locationId: 'location' };
const today = new Date('2026-12-31T00:30:00Z');
const renewal: ApprovalRenewalWorkItem = {
  candidateKey: 'check',
  actionName: 'Safety check',
  scope,
  target: { kind: 'individual', familyId: 'family', familyMemberId: 'person' },
  firstUncoveredOnUtc: '2027-01-07',
  state: DisclosedApprovalRenewalState.Upcoming,
  affectedRoles: [
    DisclosedApprovalRenewalRole.fromJS({
      scope: ApprovalRenewalRoleScope.Family,
      roleName: 'Coach',
    }),
    DisclosedApprovalRenewalRole.fromJS({
      scope: ApprovalRenewalRoleScope.Individual,
      roleName: 'Coach',
    }),
  ],
};
const approval: ApprovalExpirationWorkItem = {
  id: 'family-approval',
  scope,
  target: { kind: 'family', familyId: 'family' },
  roleName: 'Coach',
  expirationDate: '2027-01-07',
  status: 'expiring',
  previousStatus: RoleApprovalStatus.Approved,
};

test('uses the inclusive UTC window and retains stale upcoming and all uncovered work', () => {
  const passed = { ...renewal, firstUncoveredOnUtc: '2026-11-10' };
  const dueToday = { ...renewal, firstUncoveredOnUtc: '2026-12-31' };
  const later = { ...renewal, firstUncoveredOnUtc: '2027-01-08' };
  const historical = {
    ...renewal,
    firstUncoveredOnUtc: '2020-01-01',
    state: DisclosedApprovalRenewalState.Uncovered,
  };
  const result = selectDashboardApprovalWork(
    [approval],
    [historical, passed, dueToday, renewal, later],
    today,
    7
  );
  assert.deepEqual(
    result.upcoming.map(({ firstUncoveredOnUtc, dateReached }) => [
      firstUncoveredOnUtc,
      dateReached,
    ]),
    [
      ['2026-11-10', true],
      ['2026-12-31', true],
      ['2027-01-07', false],
    ]
  );
  assert.ok(
    result.upcoming.every(
      ({ state }) => state === DisclosedApprovalRenewalState.Upcoming
    )
  );
  assert.equal(result.uncovered[0].firstUncoveredOnUtc, '2020-01-01');
  assert.equal(result.uncovered[0].dateReached, false);
  assert.equal(result.expiring.length, 1);
  const limit = { ...renewal, firstUncoveredOnUtc: '2027-01-30' };
  assert.equal(
    selectDashboardApprovalWork(
      [],
      [limit],
      today,
      defaultDashboardPreferences.expirationDays
    ).upcoming.length,
    1
  );
});

test('associates only exact disclosed role, subject, scope and date matches', () => {
  const individual = { ...approval, id: 'individual', target: renewal.target };
  const organization: ApprovalExpirationWorkItem = {
    ...approval,
    id: 'organization',
    target: { kind: 'organization', communityId: 'community' },
  };
  const partnerRenewal: ApprovalRenewalWorkItem = {
    ...renewal,
    candidateKey: 'organization-renewal',
    target: organization.target,
    affectedRoles: [
      DisclosedApprovalRenewalRole.fromJS({
        scope: ApprovalRenewalRoleScope.Organization,
        roleName: 'Coach',
      }),
    ],
  };
  const wrongPerson: ApprovalExpirationWorkItem = {
    ...individual,
    id: 'different-person',
    target: { kind: 'individual', familyId: 'family', familyMemberId: 'other' },
  };
  const unmatched = [
    wrongPerson,
    { ...approval, id: 'different-date', expirationDate: '2027-01-06' },
    { ...approval, id: 'different-role', roleName: 'coach' },
    {
      ...approval,
      id: 'different-location',
      scope: { ...scope, locationId: 'other' },
    },
    {
      ...approval,
      id: 'different-tenant',
      scope: { ...scope, organizationId: 'other' },
    },
  ];
  const result = selectDashboardApprovalWork(
    [approval, individual, organization, ...unmatched],
    [renewal, partnerRenewal],
    today,
    14
  );
  assert.deepEqual(
    result.expiring.map(({ relatedRenewals }) => relatedRenewals),
    [[renewal], [renewal], [partnerRenewal], [], [], [], [], []]
  );
  assert.deepEqual(renewal.affectedRoles.map(affectedApprovalRoleLabel), [
    'Family: Coach',
    'Individual: Coach',
  ]);
  const statusOnly = selectDashboardApprovalWork([approval], [], today, 14);
  assert.equal(statusOnly.expiring.length, 1);
  assert.deepEqual(statusOnly.expiring[0].relatedRenewals, []);
});

test('keeps duplicate candidates and counts separately without reusing React keys', () => {
  const result = selectDashboardApprovalWork(
    [approval],
    [renewal, { ...renewal }],
    today,
    14
  );
  assert.equal(result.upcoming.length, 2);
  assert.equal(result.expiring.length, 1);
  assert.equal(result.expiring[0].relatedRenewals.length, 2);
  assert.deepEqual(
    result.upcoming.map(({ candidateKey }) => candidateKey),
    ['check', 'check']
  );
  assert.equal(
    new Set(result.upcoming.map(({ renderKey }) => renderKey)).size,
    2
  );
});

test('recomputes visible rows and relationships after the source moves or removes a candidate', () => {
  const moved = { ...renewal, firstUncoveredOnUtc: '2027-01-13' };
  const result = selectDashboardApprovalWork([approval], [moved], today, 14);
  assert.equal(result.upcoming[0].candidateKey, 'check');
  assert.equal(result.upcoming[0].firstUncoveredOnUtc, '2027-01-13');
  assert.deepEqual(result.expiring[0].relatedRenewals, []);
  assert.deepEqual(selectDashboardApprovalWork([], [], today, 7), {
    upcoming: [],
    uncovered: [],
    expiring: [],
    expired: [],
  });
});

test('retains expired approvals outside the window with a separate renewal count', () => {
  const expired = {
    ...approval,
    status: 'expired' as const,
    expirationDate: '2025-01-01',
  };
  const uncovered = {
    ...renewal,
    state: DisclosedApprovalRenewalState.Uncovered,
    firstUncoveredOnUtc: expired.expirationDate,
  };
  const result = selectDashboardApprovalWork(
    [expired, approval],
    [uncovered],
    today,
    7
  );
  assert.deepEqual(result.expired, [expired]);
  assert.equal(result.uncovered.length, 1);
  assert.equal(result.expiring.length, 1);
});

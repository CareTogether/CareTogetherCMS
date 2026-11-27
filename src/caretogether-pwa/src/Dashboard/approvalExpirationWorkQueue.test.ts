import assert from 'node:assert/strict';
import { register } from 'node:module';
import test from 'node:test';
import type { RoleApprovalStatus as ApprovalStatus } from '../GeneratedClient';

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
  CombinedFamilyInfo,
  CommunityInfo,
  CompletedRequirementInfo,
  Permission,
  RoleApprovalStatus,
} = await import('../GeneratedClient.ts');
const { buildApprovalExpirationWorkQueue } = await import(
  './approvalExpirationWorkQueue.ts'
);

const scope = { organizationId: 'tenant', locationId: 'location' };
const evaluationTime = new Date('2026-11-24T19:00:00Z');
const { Approved, Onboarded, Expired, Inactive, Denied } = RoleApprovalStatus;

function range(start: string, end: string, tag: ApprovalStatus) {
  return { start, end, tag };
}

const approved = range('2026-10-01', '2026-11-30', Approved);
const expired = range('2026-12-01', '9999-12-31', Expired);

function role(ranges: ReturnType<typeof range>[], versionRanges = ranges) {
  return {
    effectiveRoleApprovalStatus: { ranges },
    roleVersionApprovals: [
      { roleName: 'Coach', version: '1', status: { ranges: versionRanges } },
    ],
  };
}

function family(
  familyRoleApprovals: Record<string, object>,
  individualVolunteers: Record<string, object> = {},
  userPermissions = [Permission.ViewApprovalStatus]
) {
  return CombinedFamilyInfo.fromJS({
    family: { id: 'subject' },
    userPermissions,
    volunteerFamilyInfo: {
      familyRoleApprovals,
      individualVolunteers,
    },
  });
}

function project(ranges: ReturnType<typeof range>[], at = evaluationTime) {
  return buildApprovalExpirationWorkQueue(
    scope,
    [family({ Coach: role(ranges) })],
    [],
    at
  );
}

test('projects only disclosed role data for family, individual, and organization subjects', () => {
  const expiring = role([approved, expired]);
  const familyRecord = family(
    { Coach: expiring, Support: expiring },
    {
      first: { approvalStatusByRole: { Coach: expiring } },
      second: { approvalStatusByRole: { Coach: expiring } },
    }
  );
  const community = CommunityInfo.fromJS({
    community: { id: 'subject' },
    userPermissions: [Permission.ViewApprovalStatus],
    approvalInfo: { approvalStatusByRole: { Coach: expiring } },
  });
  const items = buildApprovalExpirationWorkQueue(
    scope,
    [familyRecord],
    [community],
    evaluationTime
  );
  assert.equal(items.length, 5);
  assert.equal(new Set(items.map(({ id }) => id)).size, 5);
  assert.deepEqual(
    items.map(({ target }) => target),
    [
      { kind: 'family', familyId: 'subject' },
      { kind: 'family', familyId: 'subject' },
      { kind: 'individual', familyId: 'subject', familyMemberId: 'first' },
      { kind: 'individual', familyId: 'subject', familyMemberId: 'second' },
      { kind: 'organization', communityId: 'subject' },
    ]
  );
  for (const { id, snoozeToken, ...item } of items) {
    assert.ok(id);
    assert.equal(
      snoozeToken,
      JSON.stringify(['approval-expiration', id, '2026-12-01'])
    );
    assert.deepEqual(item, {
      scope,
      target: item.target,
      roleName: item.roleName,
      expirationDate: '2026-12-01',
      status: 'expiring',
      previousStatus: Approved,
    });
  }
  const afterLoss = buildApprovalExpirationWorkQueue(
    scope,
    [
      familyRecord,
      family({ Coach: expiring }, {}, [Permission.ViewApprovalProgress]),
    ],
    [community],
    new Date('2027-02-01')
  );
  assert.deepEqual(
    afterLoss,
    items.map((item) => ({ ...item, status: 'expired' }))
  );
  assert.deepEqual(
    buildApprovalExpirationWorkQueue(
      scope,
      [family({ Coach: expiring }, {}, [Permission.ViewApprovalProgress])],
      [],
      evaluationTime
    ),
    []
  );
});

test('follows contiguous effective coverage across an onboarding downgrade', () => {
  const onboarded = range('2026-11-01', '2026-11-25', Onboarded);
  const remainingApproval = range('2026-11-26', '2026-11-30', Approved);
  assert.deepEqual(project([onboarded, remainingApproval]), []);
  assert.equal(
    project([onboarded, range('2026-11-26', '9999-12-31', Expired)])[0]
      .previousStatus,
    Onboarded
  );
  const [item] = project([expired, remainingApproval, onboarded]);
  assert.equal(item.expirationDate, '2026-12-01');
  assert.equal(item.previousStatus, Approved);
});

test('follows approved coverage into onboarding before it expires', () => {
  const [item] = project([
    range('2026-10-01', '2026-11-25', Approved),
    range('2026-11-26', '2026-11-30', Onboarded),
    expired,
  ]);
  assert.equal(item.expirationDate, '2026-12-01');
  assert.equal(item.previousStatus, Onboarded);
});

test('uses effective coverage when other policy versions or replacement evidence prevent expiration', () => {
  const veteran = role(
    [range('2026-10-01', '9999-12-31', Approved)],
    [approved, expired]
  );
  veteran.roleVersionApprovals.push({
    roleName: 'Coach',
    version: '2',
    status: { ranges: [range('2026-11-25', '9999-12-31', Approved)] },
  });
  assert.deepEqual(
    buildApprovalExpirationWorkQueue(
      scope,
      [family({ Coach: veteran })],
      [],
      evaluationTime
    ),
    []
  );

  const original = project([approved, expired])[0];
  const renewed = project([
    range('2026-10-01', '2027-01-10', Approved),
    range('2027-01-11', '9999-12-31', Expired),
  ])[0];
  assert.equal(renewed.id, original.id);
  assert.equal(renewed.expirationDate, '2027-01-11');
  assert.deepEqual(project([range('2026-10-01', '9999-12-31', Approved)]), []);
});

test('ignores evidence expiry and optional requirement coverage when the role stays effective', () => {
  const record = family(
    {
      Coach: {
        ...role([range('2026-10-01', '9999-12-31', Approved)]),
        roleVersionApprovals: [
          {
            roleName: 'Coach',
            version: '1',
            requirements: [
              {
                actionName: 'Optional check',
                isRequired: false,
                whenMet: {
                  ranges: [{ start: '2026-10-01', end: '2026-11-30' }],
                },
              },
            ],
          },
        ],
      },
    },
    {},
    [Permission.ViewApprovalStatus, Permission.ViewApprovalProgress]
  );
  record.volunteerFamilyInfo!.completedRequirements = [
    CompletedRequirementInfo.fromJS({
      completedRequirementId: 'evidence',
      requirementName: 'Optional check',
      completedAtUtc: '2026-10-01T10:00:00Z',
      expiresAtUtc: '2026-11-30T10:00:00Z',
    }),
  ];
  assert.deepEqual(
    buildApprovalExpirationWorkQueue(scope, [record], [], evaluationTime),
    []
  );
});

test('preserves an expiration gap followed by restoration and uses UTC inclusive dates', () => {
  const timeline = [
    approved,
    range('2026-12-01', '2026-12-02', Expired),
    range('2026-12-03', '9999-12-31', Approved),
  ];
  assert.equal(
    project(timeline, new Date('2026-11-30T23:59:59Z'))[0].expirationDate,
    '2026-12-01'
  );
  const expiredItems = project(timeline, new Date('2026-12-01T00:00:00Z'));
  assert.equal(expiredItems[0]?.status, 'expired');
  assert.equal(expiredItems[0]?.expirationDate, '2026-12-01');
  assert.deepEqual(project(timeline, new Date('2026-12-03T00:00:00Z')), []);
});

test('uses the start of the current lapse after restored coverage', () => {
  const timeline = [
    approved,
    range('2026-12-01', '2026-12-02', Expired),
    range('2026-12-03', '2026-12-04', Onboarded),
    range('2026-12-05', '2026-12-09', Expired),
    range('2026-12-10', '9999-12-31', Expired),
  ];
  assert.equal(
    project(timeline, new Date('2026-12-03'))[0]?.status,
    'expiring'
  );
  const current = project(timeline, new Date('2027-02-09'))[0];
  const firstLapse = project(timeline, new Date('2026-12-01'))[0];
  assert.equal(current?.status, 'expired');
  assert.equal(current?.expirationDate, '2026-12-05');
  assert.equal(current?.previousStatus, Onboarded);
  assert.notEqual(current.expirationDate, firstLapse.expirationDate);
  assert.equal(current.id, firstLapse.id);
});

test('does not infer expiration through gaps or after interruption by another status', () => {
  assert.deepEqual(
    project(
      [approved, range('2026-12-02', '9999-12-31', Expired)],
      new Date('2026-12-03')
    ),
    []
  );
  for (const status of [Inactive, Denied]) {
    const interrupted = [
      approved,
      range('2026-12-01', '2026-12-02', status),
      range('2026-12-03', '9999-12-31', Expired),
    ];
    assert.deepEqual(project(interrupted, new Date('2026-12-02')), []);
    assert.deepEqual(project(interrupted, new Date('2026-12-03')), []);
  }
});

test('excludes removal transitions and approvals that are not currently effective', () => {
  for (const status of [Inactive, Denied]) {
    assert.deepEqual(
      project([
        approved,
        range('2026-12-01', '2026-12-05', status),
        range('2026-12-06', '2026-12-10', Approved),
        range('2026-12-11', '9999-12-31', Expired),
      ]),
      []
    );
  }
  assert.deepEqual(project([expired]), []);
  assert.deepEqual(
    project([approved, expired], new Date('2026-09-30T23:59:59Z')),
    []
  );
});

test('skips missing and malformed timelines without inventing a date or identifier', () => {
  assert.deepEqual(project([]), []);
  assert.deepEqual(
    project([range('invalid', '2026-11-30', Approved), expired]),
    []
  );
  assert.deepEqual(
    project([approved, range('2026-11-30', '9999-12-31', Expired)]),
    []
  );
  assert.deepEqual(
    project([approved, range('2026-12-02', '9999-12-31', Expired)]),
    []
  );
  assert.deepEqual(
    project([range('2026-11-30', '2026-11-01', Approved), expired]),
    []
  );
  assert.deepEqual(
    buildApprovalExpirationWorkQueue(
      scope,
      [family({ Coach: {}, ' ': role([approved, expired]) })],
      [],
      evaluationTime
    ),
    []
  );
});

test('keeps identities and sorting deterministic across input order and isolates scopes', () => {
  const sooner = role([
    range('2026-10-01', '2026-11-25', Approved),
    range('2026-11-26', '9999-12-31', Expired),
  ]);
  const later = role([approved, expired]);
  const records = [family({ Alpha: later, Beta: sooner, Gamma: sooner })];
  const items = buildApprovalExpirationWorkQueue(
    scope,
    records,
    [],
    evaluationTime
  );
  assert.deepEqual(
    items.map(({ roleName }) => roleName),
    ['Beta', 'Gamma', 'Alpha']
  );
  assert.deepEqual(
    buildApprovalExpirationWorkQueue(
      scope,
      [family({ Gamma: sooner, Beta: sooner, Alpha: later })],
      [],
      evaluationTime
    ),
    items
  );
  const otherLocation = buildApprovalExpirationWorkQueue(
    { ...scope, locationId: 'other' },
    records,
    [],
    evaluationTime
  );
  const otherTenant = buildApprovalExpirationWorkQueue(
    { ...scope, organizationId: 'other' },
    records,
    [],
    evaluationTime
  );
  assert.equal(
    new Set([...items, ...otherLocation, ...otherTenant].map(({ id }) => id))
      .size,
    9
  );
});

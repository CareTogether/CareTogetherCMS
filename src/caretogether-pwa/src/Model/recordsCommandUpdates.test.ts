import assert from 'node:assert/strict';
import { register } from 'node:module';
import test from 'node:test';
import { atom, createStore } from 'jotai';
import type { RecordsAggregate } from '../GeneratedClient';
import { buildArrangementWorkQueue } from '../Dashboard/arrangementWorkQueue.ts';
import { createRecordsScopeCache } from './recordsScopeCache.ts';

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
  AddAdultToFamilyCommand,
  ApprovalRenewalRoleScope,
  CommunityRecordsAggregate,
  DisclosedApprovalRenewalState,
  FamilyRecordsAggregate,
  FamilyRecordsCommand,
  Permission,
  RecordsClient,
  RoleApprovalStatus,
  UndoCreateFamily,
} = await import('../GeneratedClient.ts');
const { mergeRecordsCommandResult, runAtomicRecordsCommand } = await import(
  './recordsCommandUpdates.ts'
);
const { buildApprovalExpirationWorkQueue } = await import(
  '../Dashboard/approvalExpirationWorkQueue.ts'
);
const { buildApprovalRenewalWorkQueue } = await import(
  '../Dashboard/approvalRenewalWorkQueue.ts'
);

const origin = { organizationId: 'tenant', locationId: 'origin' };
const destination = { ...origin, locationId: 'destination' };
const otherTenant = { ...origin, organizationId: 'other' };
const deletedId = 'family';
const action = { actionName: 'Safety check', isRequired: true };
const familyWire = {
  discriminator: 'FamilyRecordsAggregate',
  id: deletedId,
  family: {
    family: { id: deletedId },
    userPermissions: [
      Permission.ViewApprovalStatus,
      Permission.ViewApprovalProgress,
    ],
    partneringFamilyInfo: {
      openV1Case: {
        id: 'case',
        arrangements: [
          {
            id: 'arrangement',
            missingRequirements: [
              { action, dueBy: '2026-12-02' },
              { action, pastDueSince: '2026-11-23' },
            ],
          },
        ],
      },
    },
    volunteerFamilyInfo: {
      familyRoleApprovals: {
        Coach: {
          effectiveRoleApprovalStatus: {
            ranges: [
              {
                start: '2026-11-01',
                end: '2026-12-01',
                tag: RoleApprovalStatus.Approved,
              },
              {
                start: '2026-12-02',
                end: '9999-12-31',
                tag: RoleApprovalStatus.Expired,
              },
            ],
          },
        },
      },
      renewalCandidates: [
        {
          candidateKey: 'renewal',
          actionName: 'Safety check',
          firstUncoveredOnUtc: '2026-12-02',
          state: DisclosedApprovalRenewalState.Upcoming,
          target: {
            discriminator: 'FamilyApprovalRenewalTarget',
            familyId: deletedId,
          },
          affectedRoles: [
            { scope: ApprovalRenewalRoleScope.Family, roleName: 'Coach' },
          ],
        },
      ],
    },
  },
};
const family = FamilyRecordsAggregate.fromJS(familyWire);
const sibling = FamilyRecordsAggregate.fromJS({
  id: 'sibling',
  family: { family: { id: 'sibling' } },
});
const community = CommunityRecordsAggregate.fromJS({
  id: deletedId,
  community: { community: { id: deletedId } },
});
const initial = [family, sibling, community];
const deletion = new FamilyRecordsCommand();
deletion.command = new UndoCreateFamily({ familyId: deletedId });
const unrelated = FamilyRecordsCommand.fromJS({
  command: {
    discriminator: 'UpdateTestFamilyFlag',
    familyId: deletedId,
    isTestFamily: true,
  },
});

function fixture(fetch: ConstructorParameters<typeof RecordsClient>[1]) {
  const store = createStore();
  const scopeKey = (scope: typeof origin) => JSON.stringify(scope);
  const caches = new Map(
    [origin, destination, otherTenant].map((scope) => [
      scopeKey(scope),
      atom<RecordsAggregate[]>(initial),
    ])
  );
  const scopeAtom = atom(origin);
  const records = (scope: typeof origin) => caches.get(scopeKey(scope))!;
  const queueCounts = atom((get) => {
    const families = get(records(get(scopeAtom)))
      .filter((record) => record instanceof FamilyRecordsAggregate)
      .map((record) => record.family);
    const arrangement = buildArrangementWorkQueue(get(scopeAtom), families);
    return [
      arrangement.filter((item) => item.status === 'upcoming').length,
      arrangement.filter((item) => item.status === 'past-due').length,
      buildApprovalExpirationWorkQueue(
        get(scopeAtom),
        families,
        [],
        new Date('2026-11-25')
      ).length,
      buildApprovalRenewalWorkQueue(get(scopeAtom), families, []).length,
    ];
  });
  const client = new RecordsClient('https://records.example', fetch);
  return {
    store,
    scopeAtom,
    records,
    queueCounts,
    execute: (command = deletion) =>
      runAtomicRecordsCommand(
        client,
        store.get(scopeAtom),
        deletedId,
        command,
        async (scope, update) => {
          store.set(records(scope), update);
        }
      ),
  };
}

test('confirmed deletion evicts only the family from the originating scope and removes its derived work', async () => {
  const pending = Promise.withResolvers<Response>();
  const urls: string[] = [];
  const { execute, store, scopeAtom, records, queueCounts } = fixture({
    fetch: async (url) => {
      urls.push(String(url));
      return pending.promise;
    },
  });
  assert.deepEqual(store.get(queueCounts), [1, 1, 1, 1]);
  const deletionRequest = execute();
  assert.equal(store.get(records(origin)), initial);
  store.set(scopeAtom, destination);
  pending.resolve(Response.json([]));
  await deletionRequest;
  assert.deepEqual(urls, [
    'https://records.example/api/tenant/origin/Records/atomicRecordsCommand',
  ]);
  assert.deepEqual(store.get(records(origin)), [sibling, community]);
  assert.equal(store.get(records(destination)), initial);
  assert.equal(store.get(records(otherTenant)), initial);
  assert.deepEqual(store.get(queueCounts), [1, 1, 1, 1]);

  store.set(scopeAtom, origin);
  assert.deepEqual(store.get(queueCounts), [0, 0, 0, 0]);
  const repeated = fixture({ fetch: async () => Response.json([]) });
  await repeated.execute();
  await repeated.execute();
  assert.deepEqual(repeated.store.get(repeated.records(origin)), [
    sibling,
    community,
  ]);
});

test('rejected, unauthorized, and unconfirmed deletion responses preserve the cache', async () => {
  for (const status of [403, 500, 204]) {
    const { execute, store, records } = fixture({
      fetch: async () => new Response(null, { status }),
    });
    await assert.rejects(execute());
    assert.equal(store.get(records(origin)), initial);
  }
});

test('unrelated empty responses preserve cache and ordinary responses still merge', async () => {
  const empty = fixture({ fetch: async () => Response.json([]) });
  await empty.execute(unrelated);
  assert.equal(empty.store.get(empty.records(origin)), initial);

  const changed = {
    ...familyWire,
    family: {
      ...familyWire.family,
      family: { id: deletedId, isTestFamily: true },
    },
  };
  const updated = fixture({ fetch: async () => Response.json([changed]) });
  await updated.execute(unrelated);
  const [record, ...remaining] = updated.store.get(updated.records(origin));
  assert.ok(record instanceof FamilyRecordsAggregate);
  assert.equal(record.family.family.isTestFamily, true);
  assert.deepEqual(remaining, [sibling, community]);
});

async function overlappingRequests() {
  const requests: ReturnType<typeof Promise.withResolvers<Response>>[] = [];
  const client = new RecordsClient('https://records.example', {
    fetch: () => {
      const request = Promise.withResolvers<Response>();
      requests.push(request);
      return request.promise;
    },
  });
  const store = createStore();
  const selection = atom(origin);
  const originCache = createRecordsScopeCache(() =>
    client.listVisibleAggregates(origin.organizationId, origin.locationId)
  );
  requests.shift()!.resolve(Response.json([familyWire]));
  const destinationCache = createRecordsScopeCache(() =>
    Promise.resolve(initial)
  );
  await store.get(originCache);
  const cache = (scope: typeof origin) =>
    scope === origin ? originCache : destinationCache;
  return {
    requests,
    store,
    selection,
    originCache,
    destinationCache,
    atomic: (command = unrelated) =>
      runAtomicRecordsCommand(
        client,
        store.get(selection),
        deletedId,
        command,
        (scope, update) => store.set(cache(scope), update)
      ),
    composite: async () => {
      const scope = store.get(selection);
      const updates = await client.submitCompositeRecordsCommand(
        scope.organizationId,
        scope.locationId,
        new AddAdultToFamilyCommand()
      );
      await store.set(cache(scope), (current) =>
        mergeRecordsCommandResult(current, deletedId, updates)
      );
    },
  };
}

const changedFamilyWire = {
  ...familyWire,
  family: {
    ...familyWire.family,
    family: { id: deletedId, isTestFamily: true },
  },
};

function isTestFamily(records: RecordsAggregate[]) {
  const [record] = records;
  assert.ok(record instanceof FamilyRecordsAggregate);
  return record.family.family.isTestFamily;
}

test('known race: a delayed older command can overwrite a newer aggregate', async () => {
  const { atomic, requests, store, originCache } = await overlappingRequests();
  const older = atomic();
  const newer = atomic();
  requests[1].resolve(Response.json([changedFamilyWire]));
  await newer;
  assert.equal(isTestFamily(await store.get(originCache)), true);
  requests[0].resolve(Response.json([familyWire]));
  await older;
  assert.notEqual(isTestFamily(await store.get(originCache)), true);
});

test('known race: a delayed command can restore an evicted family only in its originating scope', async () => {
  const { atomic, requests, store, selection, originCache, destinationCache } =
    await overlappingRequests();
  const older = atomic();
  const deleted = atomic(deletion);
  store.set(selection, destination);
  requests[1].resolve(Response.json([]));
  await deleted;
  assert.deepEqual(await store.get(originCache), []);
  requests[0].resolve(Response.json([familyWire]));
  await older;
  assert.deepEqual(
    (await store.get(originCache)).map((record) => record.id),
    [deletedId]
  );
  assert.equal(await store.get(destinationCache), initial);
});

for (const kind of ['atomic', 'composite'] as const) {
  test(`a ${kind} merge waits for an already-installed refresh promise`, async () => {
    const fixture = await overlappingRequests();
    const { requests, store, originCache } = fixture;
    await store.set(originCache, { type: 'refresh' });
    const updated = fixture[kind]();
    requests[1].resolve(Response.json([changedFamilyWire]));
    requests[0].resolve(Response.json([familyWire]));
    await updated;
    assert.equal(isTestFamily(await store.get(originCache)), true);
  });

  test(`known race: an older delayed ${kind} response can overwrite a newer refresh`, async () => {
    const fixture = await overlappingRequests();
    const { requests, store, originCache } = fixture;
    const older = fixture[kind]();
    await store.set(originCache, { type: 'refresh' });
    requests[1].resolve(Response.json([changedFamilyWire]));
    assert.equal(isTestFamily(await store.get(originCache)), true);
    requests[0].resolve(Response.json([familyWire]));
    await older;
    assert.notEqual(isTestFamily(await store.get(originCache)), true);
  });
}

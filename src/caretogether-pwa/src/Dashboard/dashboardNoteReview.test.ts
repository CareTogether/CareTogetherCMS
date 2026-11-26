import assert from 'node:assert/strict';
import { register } from 'node:module';
import test from 'node:test';
import { atom, createStore } from 'jotai';
import type { Permission as PermissionValue } from '../GeneratedClient';

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
  AccessLevel,
  CombinedFamilyInfo,
  FamilyRecordsAggregate,
  NoteStatus,
  NoteRecordsCommand,
  Permission,
  V1ReferralInfo,
  V1ReferralNoteStatus,
} = await import('../GeneratedClient.ts');
const { buildDashboardNoteReview, filterDashboardNoteReview } = await import(
  './dashboardNoteReview.ts'
);
const { runAtomicRecordsCommand } = await import(
  '../Model/recordsCommandUpdates.ts'
);

const names = (id: string) => (id === 'family-1' ? 'Doe Family' : undefined);
const familyDraft = {
  id: 'note-1',
  status: NoteStatus.Draft,
  contents: 'Draft\n  family note',
  authorPersonId: 'person-1',
  createdTimestampUtc: '2026-11-26T12:00:00Z',
};
const referralDraft = {
  id: 'note-1',
  status: V1ReferralNoteStatus.Draft,
  contents: 'Draft referral note',
  authorId: 'user-1',
  createdTimestampUtc: '2026-11-26T13:00:00Z',
};
const family = (notes: object[], permissions = [Permission.ApproveNotes]) =>
  CombinedFamilyInfo.fromJS({
    family: { id: 'family-1' },
    notes,
    userPermissions: permissions,
  });
const referral = (
  notes: object[],
  permissions = [Permission.ViewV1Referral, Permission.EditV1Referral]
) =>
  V1ReferralInfo.fromJS({
    referral: {
      referralId: 'referral-1',
      familyId: 'family-1',
      title: 'Intake',
      notes,
    },
    userPermissions: permissions,
  });

test('projects each disclosed draft once and filters by its source', () => {
  const items = buildDashboardNoteReview(
    [family([familyDraft, familyDraft])],
    [referral([referralDraft, referralDraft])],
    names
  );
  assert.deepEqual(
    filterDashboardNoteReview(items, 'all').map(({ source, name, preview }) => [
      source,
      name,
      preview,
    ]),
    [
      ['family', 'Doe Family', 'Draft family note'],
      ['referral', 'Intake · Doe Family', 'Draft referral note'],
    ]
  );
  assert.deepEqual(
    filterDashboardNoteReview(items, 'family').map(({ recordId }) => recordId),
    ['family-1']
  );
  assert.deepEqual(
    filterDashboardNoteReview(items, 'referral').map(
      ({ recordId }) => recordId
    ),
    ['referral-1']
  );
  assert.equal(items[0].createdAt?.toISOString(), '2026-11-26T12:00:00.000Z');
  assert.equal(
    items[1].source === 'referral' && items[1].note.authorId,
    'user-1'
  );
});

test('family edit permission is independent of approval, ownership, and access level', () => {
  const edit = (
    permissions: PermissionValue[],
    reviewer?: Parameters<typeof buildDashboardNoteReview>[3]
  ) =>
    buildDashboardNoteReview(
      [
        family(
          [
            {
              ...familyDraft,
              authorUserId: 'author',
              accessLevel: 'Restricted',
            },
          ],
          permissions
        ),
      ],
      [],
      names,
      reviewer
    )[0]?.canEdit;
  const own = [Permission.ApproveNotes, Permission.AddEditOwnDraftNotes];
  const any = [Permission.ApproveNotes, Permission.AddEditDraftNotes];
  const accessLevels = [
    AccessLevel.fromJS({ name: 'Restricted', organizationRoles: ['Reviewer'] }),
  ];
  assert.equal(edit([Permission.ApproveNotes]), false);
  assert.equal(edit(own, { userId: 'author' }), true);
  assert.equal(edit(own, { userId: 'someone-else' }), false);
  assert.equal(edit(any, { userId: 'author', roles: [], accessLevels }), false);
  assert.equal(
    edit(any, { userId: 'reviewer', roles: ['Reviewer'], accessLevels }),
    true
  );
  assert.equal(
    edit([Permission.AddEditDraftNotes], { roles: ['Reviewer'], accessLevels }),
    undefined
  );
  const [item] = buildDashboardNoteReview(
    [],
    [referral([referralDraft])],
    names
  );
  assert.equal(item.canEdit, true);
});

test('excludes approved or unclassified notes even without an approval timestamp', () => {
  const items = buildDashboardNoteReview(
    [
      family([
        { ...familyDraft, status: NoteStatus.Approved },
        { ...familyDraft, status: undefined },
      ]),
    ],
    [
      referral([
        { ...referralDraft, status: V1ReferralNoteStatus.Approved },
        { ...referralDraft, status: 99 },
      ]),
    ],
    names
  );
  assert.deepEqual(items, []);
});

test('requires review permissions and uses only disclosed note content', () => {
  assert.deepEqual(
    buildDashboardNoteReview(
      [family([familyDraft], [Permission.ViewAllNotes])],
      [
        referral([referralDraft], [Permission.ViewV1Referral]),
        referral([referralDraft], [Permission.EditV1Referral]),
      ],
      names
    ),
    []
  );
  const [item] = buildDashboardNoteReview(
    [family([{ ...familyDraft, contents: undefined }])],
    [],
    () => undefined
  );
  assert.equal(item.preview, '');
  assert.equal(item.name, 'Family');
  assert.deepEqual(
    buildDashboardNoteReview([family([])], [referral([])], names),
    []
  );
});

test('reprojects new scoped note data after an approval', () => {
  const families = atom([family([familyDraft])]);
  const referrals = atom([referral([referralDraft])]);
  const queue = atom((get) =>
    buildDashboardNoteReview(get(families), get(referrals), names)
  );
  const store = createStore();
  assert.equal(store.get(queue).length, 2);
  store.set(families, [
    family([{ ...familyDraft, status: NoteStatus.Approved }]),
  ]);
  assert.deepEqual(
    store.get(queue).map(({ source }) => source),
    ['referral']
  );
  store.set(referrals, [
    referral([{ ...referralDraft, status: V1ReferralNoteStatus.Approved }]),
  ]);
  assert.deepEqual(store.get(queue), []);
  store.set(families, [family([{ ...familyDraft, id: 'new-note' }])]);
  assert.deepEqual(
    store.get(queue).map(({ id }) => id),
    ['new-note']
  );
});

test('a rejected approval retains the draft and a successful approval updates only the originating scope', async () => {
  const scope = { organizationId: 'org', locationId: 'origin' };
  const otherScope = { ...scope, locationId: 'other' };
  const draft = FamilyRecordsAggregate.fromJS({
    id: 'family-1',
    family: family([familyDraft]).toJSON(),
  });
  const approved = FamilyRecordsAggregate.fromJS({
    id: 'family-1',
    family: family([{ ...familyDraft, status: NoteStatus.Approved }]).toJSON(),
  });
  const origin = atom([draft]);
  const destination = atom([draft]);
  const store = createStore();
  const command = NoteRecordsCommand.fromJS({
    command: {
      discriminator: 'ApproveNote',
      familyId: 'family-1',
      noteId: familyDraft.id,
    },
  });
  const pending = Promise.withResolvers<(typeof draft)[]>();
  const run = (promise: Promise<(typeof draft)[]>) =>
    runAtomicRecordsCommand(
      { submitAtomicRecordsCommand: () => promise },
      scope,
      'family-1',
      command,
      async (target, update) => {
        const records =
          target.locationId === otherScope.locationId ? destination : origin;
        store.set(records, (current) =>
          update(current).filter(
            (record) => record instanceof FamilyRecordsAggregate
          )
        );
      }
    );
  await assert.rejects(run(Promise.reject(new Error('Approval failed'))));
  assert.equal(store.get(origin)[0], draft);
  const saving = run(pending.promise);
  assert.equal(store.get(origin)[0], draft);
  pending.resolve([approved]);
  await saving;
  assert.deepEqual(
    buildDashboardNoteReview(
      store.get(origin).map((record) => record.family),
      [],
      names
    ),
    []
  );
  assert.equal(store.get(destination)[0], draft);
});

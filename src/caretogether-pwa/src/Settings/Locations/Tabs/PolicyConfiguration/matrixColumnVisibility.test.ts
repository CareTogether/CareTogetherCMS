import assert from 'node:assert/strict';
import test from 'node:test';
import type { EffectiveLocationPolicy } from '../../../../GeneratedClient.ts';
import { matrixScopes, type MatrixScope } from './casePolicyMatrix.ts';
import {
  arrangementColumns,
  arrangementVisibilityModel,
  reconcileHiddenArrangements,
  toggleArrangementVisibility,
} from './matrixColumnVisibility.ts';

const id = (name: string) => JSON.stringify(['arrangement', name]);
const scope = (
  arrangement: string,
  fn?: string,
  variant?: string
): MatrixScope => ({
  arrangement,
  functionName: fn,
  variant,
  field: JSON.stringify([arrangement, fn ?? null, variant ?? null]),
  label: variant ?? 'Base',
});
const scopes = [
  scope('One'),
  scope('One', 'Provider', 'Profile'),
  scope('One', 'Another', 'Profile'),
  scope('Two'),
  scope('Two', 'Provider', 'Profile'),
];

test('visibility groups map arrangements to all their distinct descendants in policy order', () => {
  const groups = arrangementColumns([...scopes, scopes[0]]);
  assert.deepEqual(groups, [
    {
      id: id('One'),
      name: 'One',
      fields: scopes.slice(0, 3).map((item) => item.field),
    },
    {
      id: id('Two'),
      name: 'Two',
      fields: scopes.slice(3).map((item) => item.field),
    },
  ]);
});

test('hiding an arrangement hides every descendant without affecting another arrangement or Actions', () => {
  const groups = arrangementColumns(scopes);
  const model = arrangementVisibilityModel(groups, new Set([id('One')]));
  for (const item of scopes)
    assert.equal(model[item.field], item.arrangement !== 'One');
  assert.equal(model.actionName, true);
});

test('showing an arrangement restores all descendants and does not mutate hidden state', () => {
  const hidden = new Set([id('One')]);
  const shown = toggleArrangementVisibility(hidden, id('One'));
  assert.deepEqual([...hidden], [id('One')]);
  assert.equal(shown.size, 0);
  assert.ok(
    Object.values(
      arrangementVisibilityModel(arrangementColumns(scopes), shown)
    ).every(Boolean)
  );
});

test('all arrangements can be hidden while Actions stays visible, including an empty matrix', () => {
  const model = arrangementVisibilityModel(
    arrangementColumns(scopes),
    new Set([id('One'), id('Two')])
  );
  assert.equal(model.actionName, true);
  for (const item of scopes) assert.equal(model[item.field], false);
  assert.deepEqual(arrangementVisibilityModel([], new Set()), {
    actionName: true,
  });
});

test('new variants inherit arrangement visibility while new arrangements default to visible', () => {
  const added = [
    ...scopes,
    scope('One', 'New function', 'New variant'),
    scope('New arrangement'),
  ];
  const model = arrangementVisibilityModel(
    arrangementColumns(added),
    new Set([id('One')])
  );
  assert.equal(model[added[5].field], false);
  assert.equal(model[added[6].field], true);
});

test('deleted and renamed arrangements are pruned and a later reused name is visible', () => {
  const hidden = new Set([id('One'), id('Two')]);
  const groups = arrangementColumns([scope('Renamed'), scope('Two')]);
  const reconciled = reconcileHiddenArrangements(hidden, groups);
  assert.deepEqual([...reconciled], [id('Two')]);
  assert.equal(reconcileHiddenArrangements(reconciled, groups), reconciled);
  assert.equal(
    arrangementVisibilityModel(
      arrangementColumns([scope('One'), scope('Renamed'), scope('Two')]),
      reconciled
    )[scopes[0].field],
    true
  );
});

test('superseded arrangements are included while ambiguous and blank identities stay excluded', () => {
  const policy = {
    referralPolicy: {
      arrangementPolicies: [
        {
          arrangementType: 'Past',
          supersededAtUtc: '2024-01-01',
          arrangementFunctions: [],
        },
        { arrangementType: 'Duplicate', arrangementFunctions: [] },
        { arrangementType: 'duplicate', arrangementFunctions: [] },
        { arrangementType: '', arrangementFunctions: [] },
        {
          arrangementType: 'Excluded children',
          arrangementFunctions: [
            {
              functionName: 'Repeated',
              variants: [{ variantName: 'Profile' }],
            },
            {
              functionName: 'repeated',
              variants: [{ variantName: 'Profile' }],
            },
          ],
        },
      ],
    },
  } as unknown as EffectiveLocationPolicy;
  const before = JSON.stringify(policy);
  const result = matrixScopes(policy);
  assert.ok(result.issues.length > 0);
  const groups = arrangementColumns(result.scopes);
  assert.deepEqual(
    groups.map((group) => group.name),
    ['Past', 'Excluded children']
  );
  assert.deepEqual(groups[1].fields, [scope('Excluded children').field]);
  assert.equal(JSON.stringify(policy), before);
  assert.equal(
    arrangementVisibilityModel(groups, new Set([id('Past')]))[
      scope('Past').field
    ],
    false
  );
});

test('visibility derivation preserves scope metadata and cannot hide the Actions field', () => {
  const before = JSON.stringify(scopes);
  const groups = arrangementColumns(scopes);
  const model = arrangementVisibilityModel(
    [
      ...groups,
      { id: 'unexpected', name: 'Unexpected', fields: ['actionName'] },
    ],
    new Set(['unexpected'])
  );
  assert.equal(model.actionName, true);
  assert.equal(JSON.stringify(scopes), before);
  assert.equal(groups[0].fields[0], scopes[0].field);
});

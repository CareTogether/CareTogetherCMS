import assert from 'node:assert/strict';
import test from 'node:test';
import type {
  EffectiveLocationPolicy,
  RecurrencePolicy,
} from '../../../../GeneratedClient.ts';
import {
  matrixActions,
  arrangementUsedActions,
  matrixActionChoices,
  matrixOwner,
  matrixCellHasChanges,
  matrixCellPresentation,
  matrixRequirements,
  matrixScopes,
  applyMatrixEdits,
  type MatrixEdit,
} from './casePolicyMatrix.ts';
import {
  defaultMatrixSchedule,
  scheduleValidation,
  wholeScheduleDays,
} from './matrixSchedule.ts';
import {
  createPolicyGridDraft,
  resolvePolicyGridDraft,
  savePolicyGridDraft,
  stagePolicyGridDraft,
  movePolicyGridHistory,
} from './policyGridDraft.ts';

test('cell presentation separates Base from Additional without changing effective contributions or schedules', () => {
  const value = policy();
  const scopes = matrixScopes(value).scopes;
  const shared = matrixRequirements(matrixOwner(value, scopes[0]));
  const own = matrixRequirements(matrixOwner(value, scopes[1]));
  const cell = { shared, own };
  const before = JSON.stringify(value);
  const base = matrixCellPresentation({ own: shared, shared: [] }, false);
  const additional = matrixCellPresentation(cell, true);
  assert.equal(base.requirements, shared);
  assert.equal(base.provenance, 'Base');
  assert.equal(additional.requirements, own);
  assert.equal(additional.provenance, 'Additional');
  assert.deepEqual(
    [...cell.shared, ...additional.requirements],
    [...shared, ...own]
  );
  assert.ok(base.requirements.some((item) => item.phase === 'Monitoring'));
  assert.equal(
    base.requirements.find((item) => item.phase === 'Monitoring')!.recurrence,
    shared.find((item) => item.phase === 'Monitoring')!.recurrence
  );
  assert.equal(JSON.stringify(value), before);
});

test('empty variant presentation describes absence of Additional requirements without denying Base applicability', () => {
  const shared = matrixRequirements(
    matrixOwner(policy(), matrixScopes(policy()).scopes[0])
  );
  const cell = { own: [], shared };
  const display = matrixCellPresentation(cell, true);
  assert.equal(display.requirements, cell.own);
  assert.equal(display.requirements.length, 0);
  assert.match(
    display.emptyLabel,
    /^Not used for additional requirements; Base requirements apply/
  );
  assert.ok(cell.shared.length > 0);
  assert.equal(
    matrixCellPresentation({ own: [], shared: [] }, true).emptyLabel,
    'Not used for additional requirements'
  );
  assert.equal(
    matrixCellPresentation({ own: [], shared: [] }, false).emptyLabel,
    'Not used'
  );
});

test('arrangement rows exclude volunteer-only, unused and historical-only definitions without changing their policy data', () => {
  const value = policy();
  Object.assign(value.actionDefinitions, {
    VolunteerOnly: {},
    Unused: {},
    HistoricalOnly: {},
  });
  Object.assign(value, {
    volunteerPolicy: {
      volunteerRoles: {
        Volunteer: {
          policyVersions: [
            {
              requirements: [
                { actionName: 'VolunteerOnly' },
                { actionName: 'Form' },
              ],
            },
          ],
        },
      },
    },
  });
  const historical =
    value.referralPolicy.arrangementPolicies[0].policyVersions![0];
  Object.assign(historical, {
    requiredSetupActions: [
      ...historical.requiredSetupActions!,
      { actionName: 'HistoricalOnly', isRequired: true },
    ],
  });
  const before = JSON.stringify(value);
  assert.deepEqual(arrangementUsedActions(value), ['Form', 'Other']);
  assert.ok(matrixActions(value).includes('VolunteerOnly'));
  assert.ok(matrixActionChoices(value).includes('VolunteerOnly'));
  assert.equal(JSON.stringify(value), before);
});

test('arrangement rows include every phase, variant-only, legacy and missing references in catalog order', () => {
  const value = policy();
  const owner = value.referralPolicy.arrangementPolicies[0];
  owner.requiredSetupActionNames = ['Legacy'];
  Object.assign(owner, {
    requiredCloseoutActions: [{ actionName: 'Missing', isRequired: false }],
    requiredMonitoringActions: [
      { actionName: 'Legacy monitoring', recurrence: recurrence() },
    ],
  });
  assert.deepEqual(arrangementUsedActions(value), [
    'Form',
    'Other',
    'Legacy',
    'Legacy monitoring',
    'Missing',
  ]);
  assert.ok(!matrixActionChoices(value).includes('Missing'));
});

test('genuine compatibility-only references remain visible while stale mirrors do not resurrect removed usage', () => {
  const baseline = policy();
  const original = baseline.referralPolicy.arrangementPolicies[0];
  Object.assign(original, {
    requiredMonitoringActionsNew: [],
    arrangementFunctions: [],
    requiredSetupActions_PRE_MIGRATION: [
      { actionName: 'Form', isRequired: true },
      { actionName: 'Compatibility only', isRequired: true },
    ],
  });
  const value = {
    ...baseline,
    referralPolicy: {
      ...baseline.referralPolicy,
      arrangementPolicies: [{ ...original, requiredSetupActions: [] }],
    },
  } as unknown as EffectiveLocationPolicy;
  assert.deepEqual(arrangementUsedActions(value, baseline, baseline), [
    'Form',
    'Compatibility only',
  ]);
  assert.deepEqual(arrangementUsedActions(value, value, baseline), [
    'Compatibility only',
  ]);
});

test('superseded and excluded ambiguous scopes retain configured references', () => {
  const value = policy();
  const original = value.referralPolicy.arrangementPolicies[0];
  original.supersededAtUtc = new Date('2024-01-01');
  Object.assign(value.referralPolicy, {
    arrangementPolicies: [
      original,
      {
        ...original,
        requiredSetupActions: [
          { actionName: 'Ambiguous scope action', isRequired: true },
        ],
      },
    ],
  });
  assert.ok(matrixScopes(value).issues.length > 0);
  assert.ok(arrangementUsedActions(value).includes('Ambiguous scope action'));
  assert.ok(arrangementUsedActions(value).includes('Other'));
});

test('picker choices preserve exact names and reject blank, case and whitespace collisions', () => {
  const value = policy();
  Object.assign(value.actionDefinitions, {
    ' form ': {},
    Blank: {},
    '': {},
    '   ': {},
    OTHER: {},
  });
  assert.deepEqual(matrixActionChoices(value), ['Blank']);
  assert.ok(matrixActions(value).includes(' form '));
});

test('new arrangement usage appears through immutable draft history and disappears on Undo without losing hidden fields', () => {
  const original = policy();
  const initial = createPolicyGridDraft(original, 'location');
  Object.assign(original.actionDefinitions, { New: {} });
  const scope = matrixScopes(original).scopes[0];
  const value = applyMatrixEdits(
    original,
    original,
    scope,
    'New',
    [{ id: 'new', phase: 'Closeout', isRequired: false }],
    materialize('New')
  );
  const draft = stagePolicyGridDraft(initial, value, true);
  assert.ok(arrangementUsedActions(draft.value, draft.base).includes('New'));
  assert.equal(draft.value.actionDefinitions, original.actionDefinitions);
  assert.equal(draft.value.customFamilyFields, original.customFamilyFields);
  assert.equal(
    draft.value.referralPolicy.arrangementPolicies[0].policyVersions,
    original.referralPolicy.arrangementPolicies[0].policyVersions
  );
  assert.equal(draft.past.length, 1);
  assert.equal(stagePolicyGridDraft(draft, value, true), draft);
  const undone = movePolicyGridHistory(draft, 'undo');
  assert.ok(!arrangementUsedActions(undone.value, undone.base).includes('New'));
  assert.equal(movePolicyGridHistory(undone, 'redo').value, value);
});

const recurrence = (value = defaultMatrixSchedule()) =>
  ({ toJSON: () => value }) as RecurrencePolicy;
function policy() {
  return {
    actionDefinitions: { Form: {}, Other: {} },
    referralPolicy: {
      arrangementPolicies: [
        {
          arrangementType: 'Dynamic arrangement',
          requiredSetupActions: [{ actionName: 'Form', isRequired: true }],
          requiredMonitoringActionsNew: [
            {
              action: { actionName: 'Form', isRequired: false },
              recurrence: recurrence(),
            },
          ],
          requiredCloseoutActions: [],
          policyVersions: [
            {
              version: 'Past',
              requiredSetupActions: [{ actionName: 'Other', isRequired: true }],
            },
          ],
          arrangementFunctions: [
            {
              functionName: 'Provider',
              variants: [
                {
                  variantName: 'One',
                  requiredSetupActions: [
                    { actionName: 'Form', isRequired: false },
                  ],
                },
                {
                  variantName: 'Two',
                  requiredCloseoutActions: [
                    { actionName: 'Other', isRequired: true },
                  ],
                },
              ],
            },
          ],
        },
      ],
    },
    customFamilyFields: [{ name: 'Unrelated' }],
  } as unknown as EffectiveLocationPolicy;
}
function materialize(
  actionName = 'Form'
): Parameters<typeof applyMatrixEdits>[5] {
  return (edit) =>
    (edit.phase === 'Monitoring'
      ? {
          action: { actionName, isRequired: edit.isRequired },
          recurrence: edit.schedule
            ? recurrence(edit.schedule)
            : edit.recurrence,
        }
      : { actionName, isRequired: edit.isRequired }) as ReturnType<
      Parameters<typeof applyMatrixEdits>[5]
    >;
}

test('dirty cells compare their own sources without marking inherited shared copies or other actions', () => {
  const base = policy();
  const scopes = matrixScopes(base).scopes;
  const rows = matrixRequirements(matrixOwner(base, scopes[0]));
  const value = applyMatrixEdits(
    base,
    base,
    scopes[0],
    'Form',
    rows.map((row) => ({
      ...row,
      isRequired: row.phase === 'Setup' ? false : row.isRequired,
    })),
    materialize()
  );
  assert.deepEqual(
    scopes.map((scope) =>
      matrixCellHasChanges(
        matrixOwner(base, scope),
        matrixOwner(value, scope),
        'Form'
      )
    ),
    [true, false, false]
  );
  assert.equal(
    matrixCellHasChanges(
      matrixOwner(base, scopes[0]),
      matrixOwner(value, scopes[0]),
      'Other'
    ),
    false
  );
  const reverted = applyMatrixEdits(
    value,
    base,
    scopes[0],
    'Form',
    matrixRequirements(
      matrixOwner(value, scopes[0]),
      matrixOwner(base, scopes[0])
    ).map((row) => ({
      ...row,
      isRequired: row.phase === 'Setup' ? true : row.isRequired,
    })),
    materialize()
  );
  assert.equal(
    matrixCellHasChanges(
      matrixOwner(base, scopes[0]),
      matrixOwner(reverted, scopes[0]),
      'Form'
    ),
    false
  );
});

test('variant dirty cells include multiple phases and remain independent of shared and sibling requirements', () => {
  const base = policy();
  base.referralPolicy.arrangementPolicies[0].arrangementFunctions[0].variants[0].requiredCloseoutActions =
    [
      { actionName: 'Form', isRequired: true },
    ] as (typeof base.referralPolicy.arrangementPolicies)[0]['requiredCloseoutActions'];
  const scopes = matrixScopes(base).scopes;
  const value = applyMatrixEdits(
    base,
    base,
    scopes[1],
    'Form',
    [
      {
        id: JSON.stringify(['Setup', 'Current', 0]),
        phase: 'Setup',
        isRequired: true,
      },
      {
        id: JSON.stringify(['Closeout', 'Current', 0]),
        phase: 'Closeout',
        isRequired: false,
      },
    ],
    materialize()
  );
  assert.deepEqual(
    scopes.map((scope) =>
      matrixCellHasChanges(
        matrixOwner(base, scope),
        matrixOwner(value, scope),
        'Form'
      )
    ),
    [false, true, false]
  );
  const before = matrixOwner(base, scopes[0]);
  const after = {
    ...before,
    requiredSetupActions: [
      { actionName: 'Other', isRequired: true },
      ...(before.requiredSetupActions ?? []),
    ],
  } as typeof before;
  assert.equal(matrixCellHasChanges(before, after, 'Form'), false);
  assert.equal(matrixCellHasChanges(before, after, 'Other'), true);
});

test('dirty schedule comparisons preserve structured stage values instead of comparing summaries', () => {
  const before = matrixOwner(policy(), matrixScopes(policy()).scopes[0]);
  const schedule = {
    discriminator: 'DurationStagesRecurrencePolicy',
    stages: [
      { delay: '2.00:00:00', maxOccurrences: 3 },
      { delay: '7.00:00:00', maxOccurrences: null },
    ],
  };
  const withSchedule = (value: typeof schedule) =>
    ({
      ...before,
      requiredMonitoringActionsNew: [
        {
          action: { actionName: 'Form', isRequired: true },
          recurrence: recurrence(value),
        },
      ],
    }) as typeof before;
  const base = withSchedule(schedule);
  const serialized = JSON.stringify(base);
  assert.equal(
    matrixCellHasChanges(
      base,
      withSchedule({
        ...schedule,
        stages: schedule.stages.map((stage) => ({ ...stage })),
      }),
      'Form'
    ),
    false
  );
  assert.equal(
    matrixCellHasChanges(
      base,
      withSchedule({
        ...schedule,
        stages: [
          { ...schedule.stages[0], maxOccurrences: 4 },
          schedule.stages[1],
        ],
      }),
      'Form'
    ),
    true
  );
  assert.equal(
    matrixCellHasChanges(
      base,
      withSchedule({ ...schedule, stages: [...schedule.stages].reverse() }),
      'Form'
    ),
    true
  );
  assert.equal(JSON.stringify(base), serialized);
});

test('compatibility mirrors and shifted source indices cannot create false dirty markers', () => {
  const base = matrixOwner(policy(), matrixScopes(policy()).scopes[0]);
  const value = {
    ...base,
    requiredSetupActions_PRE_MIGRATION: [],
    requiredMonitoringActions_PRE_MIGRATION: [],
    requiredCloseoutActionNames_PRE_MIGRATION: [],
  } as unknown as typeof base;
  assert.equal(matrixCellHasChanges(base, value, 'Form'), false);
  const empty = {
    ...base,
    requiredSetupActions: null,
    requiredSetupActionNames: undefined,
    requiredMonitoringActions: null,
    requiredMonitoringActionsNew: [],
    requiredCloseoutActionNames: [],
    requiredCloseoutActions: undefined,
  } as unknown as typeof base;
  assert.equal(
    matrixCellHasChanges(
      empty,
      {
        ...empty,
        requiredSetupActions: [],
        requiredMonitoringActions: undefined,
      } as unknown as typeof base,
      'Form'
    ),
    false
  );
});

test('dirty markers follow successful saves, failed saves, Cancel, reloads and location-scoped baselines', async () => {
  const base = policy();
  const scope = matrixScopes(base).scopes[1];
  const value = applyMatrixEdits(
    base,
    base,
    scope,
    'Form',
    matrixRequirements(matrixOwner(base, scope)).map((row) => ({
      ...row,
      isRequired: !row.isRequired,
    })),
    materialize()
  );
  const staged = { ...createPolicyGridDraft(base, 'org/location-a'), value };
  const changed = (state: typeof staged) =>
    matrixCellHasChanges(
      matrixOwner(state.base, scope),
      matrixOwner(state.value, scope),
      'Form'
    );
  assert.equal(changed(staged), true);
  await assert.rejects(
    savePolicyGridDraft(staged, base, async () => false),
    /retained/
  );
  assert.equal(changed(staged), true);
  const saved = await savePolicyGridDraft(staged, base, async () => true);
  assert.equal(changed(saved), false);
  assert.equal(changed({ ...staged, value: staged.base }), false);
  assert.equal(
    changed(resolvePolicyGridDraft(saved, policy(), 'org/location-a')),
    false
  );
  assert.equal(
    changed(resolvePolicyGridDraft(staged, policy(), 'org/location-b')),
    false
  );
});

test('matrix identifiers follow dynamic names and remain stable across arrangement reordering', () => {
  const value = policy();
  const { scopes, issues } = matrixScopes(value);
  assert.equal(scopes.length, 3);
  assert.deepEqual(issues, []);
  assert.equal(scopes[0].label, 'Base');
  assert.equal(
    scopes[0].field,
    JSON.stringify(['Dynamic arrangement', null, null])
  );
  assert.equal(
    scopes[1].field,
    JSON.stringify(['Dynamic arrangement', 'Provider', 'One'])
  );
  assert.deepEqual(matrixActions(value), ['Form', 'Other']);
  const other = {
    ...value.referralPolicy.arrangementPolicies[0],
    arrangementType: 'Another',
  };
  const changed = {
    ...value,
    referralPolicy: {
      ...value.referralPolicy,
      arrangementPolicies: [other, ...value.referralPolicy.arrangementPolicies],
    },
  } as EffectiveLocationPolicy;
  assert.equal(matrixScopes(changed).scopes[3].field, scopes[0].field);
});

test('shared changes synchronize by projection without writing copies into variants', () => {
  const value = policy();
  const before = JSON.stringify(value);
  const scope = matrixScopes(value).scopes[0];
  const rows = matrixRequirements(matrixOwner(value, scope));
  const edits: MatrixEdit[] = rows.map((row) => ({
    id: row.id,
    phase: row.phase,
    isRequired: false,
    recurrence: row.recurrence,
  }));
  const next = applyMatrixEdits(
    value,
    value,
    scope,
    'Form',
    edits,
    materialize()
  );
  assert.equal(
    next.referralPolicy.arrangementPolicies[0].requiredSetupActions?.[0]
      .isRequired,
    false
  );
  assert.equal(
    next.referralPolicy.arrangementPolicies[0].arrangementFunctions,
    value.referralPolicy.arrangementPolicies[0].arrangementFunctions
  );
  assert.equal(
    next.referralPolicy.arrangementPolicies[0].policyVersions,
    value.referralPolicy.arrangementPolicies[0].policyVersions
  );
  assert.equal(next.customFamilyFields, value.customFamilyFields);
  assert.equal(JSON.stringify(value), before);
});

test('variant edits preserve shared and sibling contributions, histories and multiple phases', () => {
  const value = policy();
  value.referralPolicy.arrangementPolicies[0].arrangementFunctions[0].variants[0].requiredCloseoutActions =
    [
      { actionName: 'Form', isRequired: true },
    ] as (typeof value.referralPolicy.arrangementPolicies)[0]['requiredCloseoutActions'];
  const scope = matrixScopes(value).scopes[1];
  const owner = matrixOwner(value, scope);
  const original = matrixRequirements(owner);
  const next = applyMatrixEdits(
    value,
    value,
    scope,
    'Form',
    [
      { id: original[0].id, phase: 'Setup', isRequired: true },
      { id: original[1].id, phase: 'Closeout', isRequired: false },
    ],
    materialize()
  );
  const arrangement = next.referralPolicy.arrangementPolicies[0];
  assert.equal(
    arrangement.requiredSetupActions,
    value.referralPolicy.arrangementPolicies[0].requiredSetupActions
  );
  assert.equal(
    arrangement.arrangementFunctions[0].variants[1],
    value.referralPolicy.arrangementPolicies[0].arrangementFunctions[0]
      .variants[1]
  );
  assert.deepEqual(
    matrixRequirements(matrixOwner(next, scope)).map((row) => [
      row.phase,
      row.isRequired,
    ]),
    [
      ['Setup', true],
      ['Closeout', false],
    ]
  );
});

test('Not used removes only editable contributions and no-op edits return the original policy', () => {
  const value = policy();
  value.referralPolicy.arrangementPolicies[0].requiredMonitoringActionsNew = [];
  const scope = matrixScopes(value).scopes[0];
  const rows = matrixRequirements(matrixOwner(value, scope));
  const same = applyMatrixEdits(
    value,
    value,
    scope,
    'Form',
    rows.map((row) => ({
      id: row.id,
      phase: row.phase,
      isRequired: row.isRequired,
      recurrence: row.recurrence,
    })),
    materialize()
  );
  assert.equal(same, value);
  const next = applyMatrixEdits(value, value, scope, 'Form', [], materialize());
  assert.equal(matrixRequirements(matrixOwner(next, scope)).length, 0);
  assert.equal(
    next.referralPolicy.arrangementPolicies[0].arrangementFunctions,
    value.referralPolicy.arrangementPolicies[0].arrangementFunctions
  );
});

test('legacy, mixed sources, compatibility-only, duplicates and unsupported schedules are protected', () => {
  const value = policy();
  const arrangement = value.referralPolicy.arrangementPolicies[0];
  arrangement.requiredSetupActionNames = ['Form'];
  arrangement.requiredCloseoutActionNames_PRE_MIGRATION = [
    { actionName: 'Unknown', isRequired: true },
  ] as typeof arrangement.requiredCloseoutActionNames_PRE_MIGRATION;
  arrangement.requiredMonitoringActionsNew![0].recurrence = recurrence({
    discriminator: 'UnknownPolicy',
    custom: 'Do not discard',
  });
  const scope = matrixScopes(value).scopes[0];
  const rows = matrixRequirements(arrangement);
  assert.ok(rows.every((row) => !!row.readOnlyReason));
  assert.ok(matrixActions(value).includes('Unknown'));
  assert.throws(
    () =>
      applyMatrixEdits(
        value,
        value,
        scope,
        'Form',
        [{ id: 'new', phase: 'Setup', isRequired: false }],
        materialize()
      ),
    /protected/
  );
  assert.throws(
    () =>
      applyMatrixEdits(
        value,
        value,
        scope,
        'Unknown',
        [],
        materialize('Unknown')
      ),
    /Unknown/
  );
  const next = applyMatrixEdits(
    value,
    value,
    scope,
    'Other',
    [{ id: 'new', phase: 'Closeout', isRequired: true }],
    materialize('Other')
  );
  assert.equal(
    next.referralPolicy.arrangementPolicies[0].requiredMonitoringActionsNew,
    arrangement.requiredMonitoringActionsNew
  );
  assert.equal(
    matrixRequirements(matrixOwner(next, scope)).filter(
      (row) => row.actionName === 'Form'
    ).length,
    3
  );
});

test('mirrored compatibility arrays do not become duplicate requirements after staged edits', () => {
  const value = policy();
  const arrangement = value.referralPolicy.arrangementPolicies[0];
  arrangement.requiredSetupActions_PRE_MIGRATION = [
    ...arrangement.requiredSetupActions!,
  ];
  const scope = matrixScopes(value).scopes[0];
  const rows = matrixRequirements(arrangement);
  const next = applyMatrixEdits(
    value,
    value,
    scope,
    'Form',
    rows.map((row) => ({
      id: row.id,
      phase: row.phase,
      isRequired: false,
      recurrence: row.recurrence,
    })),
    materialize()
  );
  assert.equal(
    matrixRequirements(matrixOwner(next, scope), arrangement).length,
    2
  );
  assert.equal(
    next.referralPolicy.arrangementPolicies[0]
      .requiredSetupActions_PRE_MIGRATION,
    arrangement.requiredSetupActions_PRE_MIGRATION
  );
});

test('structured schedules preserve stage order and support all production recurrence types', () => {
  for (const kind of [
    'OneTimeRecurrencePolicy',
    'DurationStagesRecurrencePolicy',
    'DurationStagesPerChildLocationRecurrencePolicy',
    'ChildCareOccurrenceBasedRecurrencePolicy',
  ])
    assert.equal(scheduleValidation(defaultMatrixSchedule(kind)), undefined);
  const schedule = {
    discriminator: 'DurationStagesPerChildLocationRecurrencePolicy',
    stages: [
      { delay: '2.00:00:00', maxOccurrences: 1 },
      { delay: '7.00:00:00', maxOccurrences: null },
    ],
  };
  const value = policy();
  const scope = matrixScopes(value).scopes[0];
  const rows = matrixRequirements(matrixOwner(value, scope));
  const next = applyMatrixEdits(
    value,
    value,
    scope,
    'Form',
    rows.map((row) => ({
      id: row.id,
      phase: row.phase,
      isRequired: row.isRequired,
      recurrence: row.recurrence,
      schedule: row.phase === 'Monitoring' ? schedule : undefined,
    })),
    materialize()
  );
  assert.deepEqual(
    next.referralPolicy.arrangementPolicies[0].requiredMonitoringActionsNew?.[0].recurrence.toJSON(),
    schedule
  );
  assert.equal(wholeScheduleDays('2.00:00:00'), 2);
  assert.equal(wholeScheduleDays('00:12:00'), undefined);
  assert.ok(
    scheduleValidation({
      discriminator: 'DurationStagesRecurrencePolicy',
      stages: [{ delay: '1.00:00:00', maxOccurrences: 2147483648 }],
    })
  );
  assert.ok(
    scheduleValidation({
      ...defaultMatrixSchedule('ChildCareOccurrenceBasedRecurrencePolicy'),
      frequency: 2147483648,
    })
  );
  assert.ok(
    scheduleValidation({
      discriminator: 'OneTimeRecurrencePolicy',
      delay: '00:00:00.1234567',
    })
  );
  assert.ok(
    scheduleValidation({
      discriminator: 'DurationStagesRecurrencePolicy',
      stages: [
        { delay: '1.00:00:00', maxOccurrences: null },
        { delay: '2.00:00:00', maxOccurrences: 1 },
      ],
    })
  );
  assert.ok(
    scheduleValidation({
      ...defaultMatrixSchedule('ChildCareOccurrenceBasedRecurrencePolicy'),
      frequency: 0,
    })
  );
});

test('ambiguous scopes are reported, superseded scopes are read-only and duplicate phases are rejected', () => {
  const value = policy();
  const scope = matrixScopes(value).scopes[0];
  assert.throws(
    () =>
      applyMatrixEdits(
        value,
        value,
        scope,
        'Form',
        [
          { id: 'a', phase: 'Setup', isRequired: true },
          { id: 'b', phase: 'Setup', isRequired: false },
        ],
        materialize()
      ),
    /one current/
  );
  value.referralPolicy.arrangementPolicies[0].supersededAtUtc = new Date();
  assert.ok(matrixScopes(value).scopes.every((item) => !!item.readOnlyReason));
  assert.throws(
    () => applyMatrixEdits(value, value, scope, 'Form', [], materialize()),
    /Superseded/
  );
  value.referralPolicy.arrangementPolicies.push(
    value.referralPolicy.arrangementPolicies[0]
  );
  assert.ok(matrixScopes(value).issues.length);
  assert.equal(matrixScopes(value).scopes.length, 0);
});

test('case or whitespace aliases cannot introduce ambiguous action references', () => {
  const value = policy();
  const scope = matrixScopes(value).scopes[0];
  value.referralPolicy.arrangementPolicies[0].requiredSetupActionNames = [
    ' form ',
  ];
  assert.throws(
    () => applyMatrixEdits(value, value, scope, 'Form', [], materialize()),
    /ambiguous Action Definition/
  );
});

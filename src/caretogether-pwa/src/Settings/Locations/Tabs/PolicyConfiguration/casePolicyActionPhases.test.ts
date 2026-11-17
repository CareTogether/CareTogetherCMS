import assert from 'node:assert/strict';
import test from 'node:test';
import type {
  EffectiveLocationPolicy,
  MonitoringRequirement,
  RequirementDefinition,
  RecurrencePolicy,
} from '../../../../GeneratedClient.ts';
import {
  applyMatrixEdits,
  matrixActionPhase,
  matrixOwner,
  matrixRequirements,
  matrixScopes,
  type MatrixEdit,
  type MatrixPhase,
} from './casePolicyMatrix.ts';
import {
  createPolicyGridDraft,
  stagePolicyGridDraft,
  movePolicyGridHistory,
  cancelPolicyGridDraft,
  savePolicyGridDraft,
  resolvePolicyGridDraft,
} from './policyGridDraft.ts';

function policy() {
  const owner = () => ({
    requiredSetupActions: [],
    requiredMonitoringActionsNew: [],
    requiredCloseoutActions: [],
    requiredSetupActionNames: [],
    requiredMonitoringActions: [],
    requiredCloseoutActionNames: [],
  });
  return {
    actionDefinitions: { Action: {}, Other: {}, Volunteer: {} },
    referralPolicy: {
      arrangementPolicies: [
        {
          ...owner(),
          arrangementType: 'One',
          arrangementFunctions: [
            {
              functionName: 'Provider',
              variants: [{ ...owner(), variantName: 'Profile' }],
            },
          ],
          policyVersions: [
            {
              requiredCloseoutActions: [
                { actionName: 'Action', isRequired: true },
              ],
            },
          ],
        },
        { ...owner(), arrangementType: 'Two', arrangementFunctions: [] },
      ],
      intakeRequirements: [{ actionName: 'Action', isRequired: true }],
    },
    volunteerPolicy: {
      volunteerRoles: {
        Helper: {
          policyVersions: [
            { requirements: [{ actionName: 'Volunteer', stage: 0 }] },
          ],
        },
      },
    },
    organizationApprovalPolicy: { organizationRoles: {} },
  } as unknown as EffectiveLocationPolicy;
}
function add(
  value: EffectiveLocationPolicy,
  scopeIndex: number,
  phase: MatrixPhase,
  actionName = 'Action'
) {
  const owner = matrixOwner(value, matrixScopes(value).scopes[scopeIndex]);
  if (phase === 'Monitoring')
    owner.requiredMonitoringActionsNew!.push({
      action: { actionName, isRequired: true },
      recurrence: recurrence(),
    } as MonitoringRequirement);
  else
    owner[
      phase === 'Setup' ? 'requiredSetupActions' : 'requiredCloseoutActions'
    ]!.push({ actionName, isRequired: true } as RequirementDefinition);
}
function recurrence() {
  const data = {
    discriminator: 'DurationStagesRecurrencePolicy',
    stages: [
      { delay: '2.00:00:00', maxOccurrences: 2 },
      { delay: '5.00:00:00', maxOccurrences: null },
    ],
  };
  return { toJSON: () => data } as unknown as RecurrencePolicy;
}
const materialize = (edit: MatrixEdit) =>
  edit.phase === 'Monitoring'
    ? ({
        action: { actionName: 'Action', isRequired: edit.isRequired },
        recurrence: edit.recurrence,
      } as MonitoringRequirement)
    : ({
        actionName: 'Action',
        isRequired: edit.isRequired,
      } as RequirementDefinition);
function edit(
  value: EffectiveLocationPolicy,
  index: number,
  edits: MatrixEdit[],
  baseline = value
) {
  return applyMatrixEdits(
    value,
    baseline,
    matrixScopes(value).scopes[index],
    'Action',
    edits,
    materialize
  );
}
const first = (phase: MatrixPhase): MatrixEdit => ({
  id: 'new',
  phase,
  isRequired: true,
});

test('unused actions ignore intake, volunteer, approval and historical stages', () => {
  const value = policy();
  for (const name of ['Action', 'Volunteer', 'Other'])
    assert.equal(matrixActionPhase(value, value, name).status, 'unused');
});
test('one phase is resolved across Base, variants and arrangements without matrix visibility input', () => {
  const value = policy();
  for (const scope of [0, 1, 2]) add(value, scope, 'Setup');
  const result = matrixActionPhase(value, value, 'Action');
  assert.equal(result.status, 'single');
  assert.equal(result.phase, 'Setup');
  assert.equal(result.contributions.length, 3);
});
for (const [label, index] of [
  ['one scope', 0],
  ['Base and variant', 1],
  ['different arrangements', 2],
] as const)
  test(`conflicts in ${label} preserve phase and scope provenance`, () => {
    const value = policy();
    add(value, 0, 'Setup');
    add(value, index, 'Closeout');
    const result = matrixActionPhase(value, value, 'Action');
    assert.equal(result.status, 'conflict');
    assert.match(result.message!, /Setup.*One.*Closeout/);
    assert.equal(result.phase, undefined);
  });
test('legacy and compatibility-only references establish phases without counting mirrors twice', () => {
  const value = policy();
  const owner = value.referralPolicy.arrangementPolicies[0];
  owner.requiredSetupActionNames = ['Action'];
  owner.requiredSetupActions_PRE_MIGRATION = [
    { actionName: 'Action', isRequired: true } as RequirementDefinition,
  ];
  assert.equal(
    matrixActionPhase(value, value, 'Action').contributions.length,
    1
  );
  owner.requiredCloseoutActionNames_PRE_MIGRATION = [
    { actionName: 'Other', isRequired: false } as RequirementDefinition,
  ];
  assert.equal(matrixActionPhase(value, value, 'Other').phase, 'Closeout');
});
test('stale compatibility mirrors cannot restore removed ownership', () => {
  const value = policy();
  add(value, 0, 'Setup');
  value.referralPolicy.arrangementPolicies[0].requiredSetupActions_PRE_MIGRATION =
    value.referralPolicy.arrangementPolicies[0].requiredSetupActions!;
  const next = edit(value, 0, []);
  assert.equal(matrixActionPhase(next, value, 'Action').status, 'unused');
});
test('superseded current scopes establish phase while historical versions remain unchanged', () => {
  const value = policy();
  add(value, 2, 'Closeout');
  value.referralPolicy.arrangementPolicies[1].supersededAtUtc = new Date();
  const before = JSON.stringify(value);
  assert.equal(matrixActionPhase(value, value, 'Action').phase, 'Closeout');
  assert.equal(JSON.stringify(value), before);
});
test('unresolved, colliding names, aliases and excluded scopes are ambiguous rather than inferred', () => {
  const value = policy();
  assert.equal(matrixActionPhase(value, value, 'Missing').status, 'ambiguous');
  value.actionDefinitions[' action '] = value.actionDefinitions.Action;
  assert.equal(matrixActionPhase(value, value, 'Action').status, 'ambiguous');
  delete value.actionDefinitions[' action '];
  value.actionDefinitions.Action.alternateNames = ['Alias'];
  value.referralPolicy.arrangementPolicies[0].requiredSetupActionNames = [
    'Alias',
  ];
  assert.equal(matrixActionPhase(value, value, 'Action').status, 'ambiguous');
  value.referralPolicy.arrangementPolicies[0].requiredSetupActionNames = [
    'Action',
  ];
  value.referralPolicy.arrangementPolicies.push(
    value.referralPolicy.arrangementPolicies[0]
  );
  assert.equal(matrixActionPhase(value, value, 'Action').status, 'ambiguous');
});
test('duplicate sources are ambiguous and cannot be changed or reassigned', () => {
  const value = policy();
  add(value, 0, 'Setup');
  add(value, 0, 'Setup');
  assert.equal(matrixActionPhase(value, value, 'Action').status, 'ambiguous');
  assert.throws(() => edit(value, 2, [first('Setup')]), /ambiguous/);
});
test('same-phase additions are accepted immutably and cross-phase additions and moves are rejected', () => {
  const value = policy();
  add(value, 0, 'Setup');
  const before = JSON.stringify(value);
  const next = edit(value, 1, [first('Setup')]);
  assert.equal(matrixActionPhase(next, value, 'Action').phase, 'Setup');
  assert.equal(JSON.stringify(value), before);
  assert.equal(next.volunteerPolicy, value.volunteerPolicy);
  assert.equal(
    next.organizationApprovalPolicy,
    value.organizationApprovalPolicy
  );
  assert.equal(
    next.referralPolicy.arrangementPolicies[0].policyVersions,
    value.referralPolicy.arrangementPolicies[0].policyVersions
  );
  assert.throws(() => edit(value, 1, [first('Closeout')]), /established/);
  assert.throws(() => edit(value, 0, [first('Closeout')]), /established/);
});
test('first assignments require a single phase and apply immediately to later draft edits', () => {
  const value = policy();
  assert.throws(
    () => edit(value, 0, [first('Setup'), first('Closeout')]),
    /Choose one/
  );
  const next = edit(value, 0, [first('Closeout')]);
  assert.throws(() => edit(next, 1, [first('Setup')], value), /established/);
  assert.equal(
    matrixActionPhase(edit(next, 0, [], value), value, 'Action').status,
    'unused'
  );
});
test('existing conflicts permit applicability changes without additions, removal or phase migration', () => {
  const value = policy();
  add(value, 0, 'Setup');
  add(value, 1, 'Closeout');
  const row = matrixRequirements(
    matrixOwner(value, matrixScopes(value).scopes[0])
  )[0];
  const next = edit(value, 0, [{ ...row, isRequired: false }]);
  assert.equal(matrixActionPhase(next, value, 'Action').status, 'conflict');
  assert.equal(
    next.referralPolicy.arrangementPolicies[0].arrangementFunctions,
    value.referralPolicy.arrangementPolicies[0].arrangementFunctions
  );
  assert.throws(() => edit(value, 2, [first('Setup')]), /Conflicting/);
  assert.throws(() => edit(value, 0, []), /Conflicting/);
});
test('unrelated edits and saves preserve conflicts and full hidden policy sections', async () => {
  const value = policy();
  add(value, 0, 'Setup', 'Other');
  add(value, 1, 'Monitoring', 'Other');
  const original =
    value.referralPolicy.arrangementPolicies[0].arrangementFunctions;
  const next = edit(value, 2, [first('Setup')]);
  const saved = await savePolicyGridDraft(
    stagePolicyGridDraft(createPolicyGridDraft(value, 'a'), next, true),
    value,
    async (payload) => {
      assert.equal(payload, next);
      assert.equal(payload.volunteerPolicy, value.volunteerPolicy);
      return true;
    }
  );
  assert.equal(
    saved.value.referralPolicy.arrangementPolicies[0].arrangementFunctions,
    original
  );
  assert.equal(
    matrixActionPhase(saved.value, saved.value, 'Other').status,
    'conflict'
  );
});
test('applicability-only edits preserve exact staged recurrence objects and model references', () => {
  const value = policy();
  add(value, 0, 'Monitoring');
  const row = matrixRequirements(
    value.referralPolicy.arrangementPolicies[0]
  )[0];
  const next = edit(value, 0, [{ ...row, isRequired: false }]);
  assert.equal(
    next.referralPolicy.arrangementPolicies[0].requiredMonitoringActionsNew![0]
      .recurrence,
    row.recurrence
  );
  assert.equal(matrixActionPhase(next, value, 'Action').phase, 'Monitoring');
  assert.equal(edit(next, 0, [{ ...row, isRequired: false }], value), next);
});
test('history, cancel, failed and successful saves and location replacement derive ownership from their draft', async () => {
  const value = policy();
  const initial = createPolicyGridDraft(value, 'a');
  const next = stagePolicyGridDraft(
    initial,
    edit(value, 0, [first('Setup')]),
    true
  );
  const undone = movePolicyGridHistory(next, 'undo');
  assert.equal(
    matrixActionPhase(undone.value, value, 'Action').status,
    'unused'
  );
  const redone = movePolicyGridHistory(undone, 'redo');
  assert.equal(matrixActionPhase(redone.value, value, 'Action').phase, 'Setup');
  await assert.rejects(savePolicyGridDraft(redone, value, async () => false));
  assert.equal(redone.past.length, 1);
  const saved = await savePolicyGridDraft(redone, value, async () => true);
  assert.equal(saved.past.length, 0);
  assert.equal(
    matrixActionPhase(saved.value, saved.value, 'Action').phase,
    'Setup'
  );
  assert.equal(
    matrixActionPhase(
      cancelPolicyGridDraft(redone, value).value,
      value,
      'Action'
    ).status,
    'unused'
  );
  assert.equal(
    matrixActionPhase(
      resolvePolicyGridDraft(redone, policy(), 'b').value,
      value,
      'Action'
    ).status,
    'unused'
  );
  assert.equal(stagePolicyGridDraft(next, next.value, true), next);
});

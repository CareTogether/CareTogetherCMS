import assert from 'node:assert/strict';
import test from 'node:test';
import type { ArrangementPolicy } from '../../../../GeneratedClient.ts';
import {
  arrangementRequirementRows,
  assertRequirementCanBeAdded,
} from './arrangementRequirementRows.ts';

const policy = (values: object) => values as ArrangementPolicy;

test('projects dynamic Setup, Monitoring and Closeout requirements without mutating their sources', () => {
  const recurrence = Object.freeze({
    discriminator: 'StagedRecurrencePolicy',
    stages: [{ delay: '2.00:00:00', maxOccurrences: 3 }],
  });
  const value = Object.freeze({
    requiredSetupActions: Object.freeze([
      { actionName: 'Organization setup', isRequired: true },
    ]),
    requiredMonitoringActionsNew: Object.freeze([
      {
        action: { actionName: 'Organization monitoring', isRequired: false },
        recurrence,
      },
    ]),
    requiredCloseoutActions: Object.freeze([
      { actionName: 'Organization closeout', isRequired: true },
    ]),
  });
  for (const phase of ['Setup', 'Monitoring', 'Closeout'] as const) {
    const rows = arrangementRequirementRows(policy(value), phase, [
      `Organization ${phase.toLowerCase()}`,
    ]);
    assert.equal(rows.length, 1);
    assert.equal(rows[0].source, 'newer');
    assert.equal(rows[0].readOnlyReason, undefined);
    assert.equal(rows[0].isRequired, phase !== 'Monitoring');
    if (phase === 'Monitoring') assert.equal(rows[0].recurrence, recurrence);
  }
});

test('legacy and compatibility-only references remain visible and read-only beside explicit empty newer arrays', () => {
  const rows = arrangementRequirementRows(
    policy({
      requiredSetupActions: [],
      requiredSetupActionNames: ['Legacy'],
      requiredSetupActions_PRE_MIGRATION: [
        { actionName: 'Legacy', isRequired: true },
        { actionName: 'Compatibility', isRequired: true },
      ],
    }),
    'Setup',
    ['Legacy', 'Compatibility']
  );
  assert.deepEqual(
    rows.map((row) => row.source),
    ['legacy', 'compatibility']
  );
  assert.ok(rows.every((row) => row.readOnlyReason));
});

test('duplicate, mixed-source, unresolved and superseded requirements are read-only', () => {
  const value = {
    requiredCloseoutActions: [
      { actionName: 'Duplicate', isRequired: true },
      { actionName: 'Duplicate', isRequired: false },
      { actionName: 'Mixed', isRequired: true },
      { actionName: 'Unknown', isRequired: true },
    ],
    requiredCloseoutActionNames: ['Mixed'],
  };
  const rows = arrangementRequirementRows(policy(value), 'Closeout', [
    'Duplicate',
    'Mixed',
  ]);
  assert.equal(new Set(rows.map((row) => row.id)).size, rows.length);
  assert.ok(rows.every((row) => row.readOnlyReason));
  const superseded = arrangementRequirementRows(
    policy({
      requiredSetupActions: [{ actionName: 'Known', isRequired: true }],
      supersededAtUtc: new Date(),
    }),
    'Setup',
    ['Known']
  );
  assert.match(superseded[0].readOnlyReason!, /Superseded/);
});

test('adding uses dynamic definitions and rejects duplicate and unknown action references', () => {
  const rows = arrangementRequirementRows(
    policy({
      requiredSetupActions: [{ actionName: 'Existing', isRequired: true }],
    }),
    'Setup',
    ['Existing', 'New action']
  );
  assert.doesNotThrow(() =>
    assertRequirementCanBeAdded(rows, ['Existing', 'New action'], 'New action')
  );
  assert.throws(
    () => assertRequirementCanBeAdded(rows, ['Existing'], 'Existing'),
    /already referenced/
  );
  assert.throws(
    () => assertRequirementCanBeAdded(rows, ['Existing'], 'Unknown'),
    /Action Definitions/
  );
});

test('missing collections are empty and variant or historical requirements are not projected', () => {
  const value = policy({
    arrangementFunctions: [
      {
        variants: [
          {
            requiredSetupActions: [{ actionName: 'Variant', isRequired: true }],
          },
        ],
      },
    ],
    policyVersions: [
      {
        requiredSetupActions: [{ actionName: 'Historical', isRequired: true }],
      },
    ],
  });
  for (const phase of ['Setup', 'Monitoring', 'Closeout'] as const)
    assert.deepEqual(
      arrangementRequirementRows(value, phase, ['Variant', 'Historical']),
      []
    );
});

test('row identities remain stable when another requirement is removed', () => {
  const first = policy({
    requiredSetupActions: [
      { actionName: 'First', isRequired: true },
      { actionName: 'Second', isRequired: true },
    ],
  });
  const second = policy({
    requiredSetupActions: [{ actionName: 'Second', isRequired: true }],
  });
  assert.equal(
    arrangementRequirementRows(first, 'Setup', ['First', 'Second'])[1].id,
    arrangementRequirementRows(second, 'Setup', ['First', 'Second'])[0].id
  );
});

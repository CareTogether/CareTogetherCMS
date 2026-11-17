import assert from 'node:assert/strict';
import test from 'node:test';
import type {
  ArrangementFunctionVariant,
  RecurrencePolicy,
} from '../../../../GeneratedClient.ts';
import {
  recurrenceDelayLabel,
  variantRequirementRows,
  variantScheduleSummary,
} from './arrangementVariantRequirements.ts';

const variant = (data: object) => data as ArrangementFunctionVariant;
const schedule = (data: object) => ({ toJSON: () => data }) as RecurrencePolicy;

test('projects only the selected variant phases without mutating data or recurrence', () => {
  const recurrence = Object.freeze(
    schedule({
      discriminator: 'DurationStagesRecurrencePolicy',
      stages: [
        { delay: '2.00:00:00', maxOccurrences: 1 },
        { delay: '7.00:00:00', maxOccurrences: null },
      ],
    })
  );
  const value = Object.freeze(
    variant({
      requiredSetupActions: Object.freeze([
        { actionName: 'Variant setup', isRequired: true },
      ]),
      requiredMonitoringActionsNew: Object.freeze([
        {
          action: { actionName: 'Variant monitoring', isRequired: false },
          recurrence,
        },
      ]),
      requiredCloseoutActions: Object.freeze([
        { actionName: 'Variant closeout', isRequired: true },
      ]),
    })
  );
  const before = JSON.stringify(value);
  assert.equal(
    variantRequirementRows(value, 'Setup')[0].actionName,
    'Variant setup'
  );
  assert.equal(
    variantRequirementRows(value, 'Monitoring')[0].recurrence,
    recurrence
  );
  assert.equal(
    variantRequirementRows(value, 'Monitoring')[0].isRequired,
    false
  );
  assert.equal(
    variantRequirementRows(value, 'Closeout')[0].actionName,
    'Variant closeout'
  );
  assert.equal(JSON.stringify(value), before);
});

test('combines source contributions without doubling compatibility mirrors and keeps discrepancies visible', () => {
  const value = variant({
    requiredSetupActionNames: ['Legacy'],
    requiredSetupActions: [{ actionName: 'Current', isRequired: false }],
    requiredSetupActionNames_PRE_MIGRATION: [
      { actionName: 'Legacy', isRequired: true },
      { actionName: 'Current', isRequired: false },
      { actionName: 'Stored only', isRequired: true },
    ],
  });
  const rows = variantRequirementRows(value, 'Setup');
  assert.deepEqual(
    rows.map((row) => [row.actionName, row.source]),
    [
      ['Current', 'Current'],
      ['Legacy', 'Legacy'],
      ['Stored only', 'Stored compatibility'],
    ]
  );
  assert.equal(new Set(rows.map((row) => row.id)).size, rows.length);
  assert.deepEqual(
    variantRequirementRows(
      variant({
        requiredSetupActions: [],
        requiredSetupActionNames: ['Legacy'],
      }),
      'Setup'
    ).map((row) => row.actionName),
    ['Legacy']
  );
});

test('empty variants have no additional requirements in any phase', () => {
  for (const phase of ['Setup', 'Monitoring', 'Closeout'] as const)
    assert.deepEqual(variantRequirementRows(variant({}), phase), []);
});

test('stage summaries preserve timing, limits and placement scope', () => {
  const data = {
    discriminator: 'DurationStagesPerChildLocationRecurrencePolicy',
    stages: [
      { delay: '0.12:30:00', maxOccurrences: 2 },
      { delay: '14.00:00:00', maxOccurrences: null },
    ],
  };
  const before = JSON.stringify(data);
  const lines = variantScheduleSummary(schedule(data));
  assert.match(lines[0], /child placement/);
  assert.equal(lines[1], 'Stage 1: 12 hours, 30 minutes; 2 occurrence(s)');
  assert.equal(lines[2], 'Stage 2: 14 days; unlimited occurrences');
  assert.equal(JSON.stringify(data), before);
});

test('summaries cover one-time, occurrence-based, missing and unrecognized schedules accurately', () => {
  assert.deepEqual(
    variantScheduleSummary(
      schedule({
        discriminator: 'OneTimeRecurrencePolicy',
        delay: '2.00:00:00',
      })
    ),
    ['Once after 2 days']
  );
  assert.match(
    variantScheduleSummary(
      schedule({
        discriminator: 'ChildCareOccurrenceBasedRecurrencePolicy',
        frequency: 3,
        initialSkipCount: 1,
        positive: false,
        delay: '00:02:00',
      })
    )[0],
    /frequency 3, initial skip 1, non-matching occurrences; delay 2 minutes/
  );
  assert.deepEqual(variantScheduleSummary(), ['No schedule configured']);
  assert.match(
    variantScheduleSummary(schedule({ discriminator: 'Unknown' }))[0],
    /cannot be summarized/
  );
  assert.equal(recurrenceDelayLabel('00:00:00.1234567'), '00:00:00.1234567');
});

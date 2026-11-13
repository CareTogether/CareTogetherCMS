import { expect, test } from '@playwright/test';
import {
  ActionRequirement,
  DocumentLinkRequirement,
  EffectiveLocationPolicy,
  NoteEntryRequirement,
  ArrangementPolicy,
  OneTimeRecurrencePolicy,
} from '../src/GeneratedClient';
import {
  addArrangementRequirement,
  replaceArrangementRequirement,
  canEditMonitoringSchedule,
} from '../src/Settings/Locations/Tabs/PolicyConfiguration/arrangementRequirementUpdates';
import { arrangementRequirementRows } from '../src/Settings/Locations/Tabs/PolicyConfiguration/arrangementRequirementRows';
import {
  buildActionDefinitionGridColumns,
  buildActionDefinitionGridRows,
  actionDefinitionFromGridRow,
  canEditActionValidity,
} from '../src/Settings/Locations/Tabs/PolicyConfiguration/actionDefinitionsDataGrid';
import {
  clonePolicyWithActionDefinition,
  clonePolicyWithActionDefinitionOrder,
  toTimeSpanString,
} from '../src/Settings/Locations/Tabs/PolicyConfiguration/policyUtils';
import { getRequirementUsage } from '../src/Settings/Locations/Tabs/PolicyConfiguration/policyReferences';

function action() {
  return ActionRequirement.fromJS({
    documentLink: DocumentLinkRequirement.None,
    noteEntry: NoteEntryRequirement.None,
  });
}

test('arrangement requirement edits preserve recurrence, variants, history and unrelated collections', () => {
  const arrangement = ArrangementPolicy.fromJS({
    arrangementType: 'Dynamic arrangement',
    requiredSetupActionNames: ['Legacy setup'],
    requiredSetupActions: [{ actionName: 'Setup', isRequired: true }],
    requiredCloseoutActions: [{ actionName: 'Closeout', isRequired: true }],
    requiredMonitoringActionsNew: [
      {
        action: { actionName: 'Monitoring', isRequired: true },
        recurrence: {
          discriminator: 'DurationStagesRecurrencePolicy',
          stages: [{ delay: '2.00:00:00', maxOccurrences: 3 }],
        },
      },
    ],
    arrangementFunctions: [
      {
        functionName: 'Function',
        variants: [
          {
            variantName: 'Variant',
            requiredSetupActions: [
              { actionName: 'Variant action', isRequired: true },
            ],
          },
        ],
      },
    ],
    policyVersions: [
      {
        version: 'Historical',
        requiredSetupActions: [
          { actionName: 'Historical action', isRequired: true },
        ],
      },
    ],
  });
  const before = JSON.stringify(arrangement.toJSON());
  for (const phase of ['Setup', 'Monitoring', 'Closeout'] as const) {
    const row = arrangementRequirementRows(arrangement, phase, [
      'Setup',
      'Monitoring',
      'Closeout',
    ]).find((row) => row.source === 'newer')!;
    const updated = replaceArrangementRequirement(
      arrangement,
      phase,
      row,
      false
    );
    expect(updated.arrangementFunctions).toBe(arrangement.arrangementFunctions);
    expect(updated.policyVersions).toBe(arrangement.policyVersions);
    expect(updated.requiredSetupActionNames).toBe(
      arrangement.requiredSetupActionNames
    );
    expect(updated.requiredMonitoringActionsNew![0].recurrence).toBe(
      arrangement.requiredMonitoringActionsNew![0].recurrence
    );
    expect(
      arrangementRequirementRows(updated, phase, [
        'Setup',
        'Monitoring',
        'Closeout',
      ]).find((item) => item.source === 'newer')?.isRequired
    ).toBe(false);
    expect(replaceArrangementRequirement(arrangement, phase, row, true)).toBe(
      arrangement
    );
    expect(JSON.stringify(arrangement.toJSON())).toBe(before);
  }
  const added = addArrangementRequirement(
    arrangement,
    'Setup',
    ['Setup', 'New action', 'Legacy setup'],
    'New action',
    false
  );
  expect(added.requiredSetupActions?.map((item) => item.actionName)).toEqual([
    'Setup',
    'New action',
  ]);
  expect(added.requiredSetupActionNames).toBe(
    arrangement.requiredSetupActionNames
  );
  expect(() =>
    addArrangementRequirement(arrangement, 'Setup', ['Setup'], 'Setup', true)
  ).toThrow(/already referenced/);
  expect(() =>
    addArrangementRequirement(arrangement, 'Setup', ['Setup'], 'Unknown', true)
  ).toThrow(/Action Definitions/);
  expect(
    canEditMonitoringSchedule(
      arrangement.requiredMonitoringActionsNew![0].recurrence
    )
  ).toBe(false);
  expect(
    canEditMonitoringSchedule(
      OneTimeRecurrencePolicy.fromJS({ delay: '2.00:00:00' })
    )
  ).toBe(true);
  expect(
    canEditMonitoringSchedule(
      OneTimeRecurrencePolicy.fromJS({ delay: '00:30:00' })
    )
  ).toBe(false);
});

function policyWithActionDefinitions(actionNames: string[]) {
  return EffectiveLocationPolicy.fromJS({
    actionDefinitions: Object.fromEntries(
      actionNames.map((actionName) => [actionName, action().toJSON()])
    ),
  });
}

test('keeps action definition order when renaming an existing action', () => {
  const policy = policyWithActionDefinitions([
    'Family assessment',
    'Background check',
    'Home visit',
  ]);

  const updatedPolicy = clonePolicyWithActionDefinition(
    policy,
    'Background check',
    'Reference check',
    action()
  );

  expect(Object.keys(updatedPolicy.actionDefinitions ?? {})).toEqual([
    'Family assessment',
    'Reference check',
    'Home visit',
  ]);
});

test('appends newly added action definitions', () => {
  const policy = policyWithActionDefinitions([
    'Family assessment',
    'Background check',
  ]);

  const updatedPolicy = clonePolicyWithActionDefinition(
    policy,
    undefined,
    'Home visit',
    action()
  );

  expect(Object.keys(updatedPolicy.actionDefinitions ?? {})).toEqual([
    'Family assessment',
    'Background check',
    'Home visit',
  ]);
});

test('restores the editor order after the server reorders action definitions', () => {
  const savedPolicy = policyWithActionDefinitions([
    'Home visit',
    'Family assessment',
    'Background check',
  ]);

  const orderedPolicy = clonePolicyWithActionDefinitionOrder(savedPolicy, [
    'Family assessment',
    'Background check',
    'Home visit',
  ]);

  expect(Object.keys(orderedPolicy.actionDefinitions ?? {})).toEqual([
    'Family assessment',
    'Background check',
    'Home visit',
  ]);
});

test('projects action definitions into human-readable grid rows', () => {
  const policy = EffectiveLocationPolicy.fromJS({
    actionDefinitions: {
      'Background check': {
        alternateNames: ['Criminal check', 'Screening'],
        documentLink: DocumentLinkRequirement.Required,
        infoLink: 'https://example.test/background-check',
        instructions: 'Request a current report.',
        noteEntry: NoteEntryRequirement.Allowed,
        validity: '365.00:00:00',
      },
    },
  });

  expect(
    buildActionDefinitionGridRows(policy, getRequirementUsage(policy))
  ).toEqual([
    expect.objectContaining({
      id: 'Background check',
      actionName: 'Background check',
      alternateNames: 'Criminal check, Screening',
      document: DocumentLinkRequirement.Required,
      instructions: 'Request a current report.',
      note: NoteEntryRequirement.Allowed,
      url: 'https://example.test/background-check',
      usage: 0,
      validity: '365.00:00:00',
    }),
  ]);
});

test('inline action edits preserve all unrelated definition fields and policy values', () => {
  const policy = EffectiveLocationPolicy.fromJS({
    actionDefinitions: {
      DynamicAction: {
        documentLink: DocumentLinkRequirement.None,
        noteEntry: NoteEntryRequirement.None,
        instructions: '  unchanged instructions  ',
        infoLink: 'https://example.test/original',
        validity: '00:30:00',
        alternateNames: ['Alias'],
        canView: 'view permission',
        canEdit: 'edit permission',
      },
      OtherAction: {
        documentLink: DocumentLinkRequirement.Required,
        noteEntry: NoteEntryRequirement.Allowed,
      },
    },
  });
  const original = buildActionDefinitionGridRows(
    policy,
    getRequirementUsage(policy)
  )[0];
  const edits = [
    { document: DocumentLinkRequirement.Required },
    { note: NoteEntryRequirement.Allowed },
    { instructions: 'Updated instructions' },
    { url: 'https://example.test/new' },
    { validity: toTimeSpanString(true, '2', 'months') },
  ];
  const originalJson = JSON.stringify(policy.toJSON());
  for (const edit of edits) {
    const updated = actionDefinitionFromGridRow({ ...original, ...edit });
    const expected = {
      ...original.action.toJSON(),
      ...('document' in edit ? { documentLink: edit.document } : {}),
      ...('note' in edit ? { noteEntry: edit.note } : {}),
      ...('instructions' in edit ? { instructions: edit.instructions } : {}),
      ...('url' in edit ? { infoLink: edit.url } : {}),
      ...('validity' in edit ? { validity: edit.validity } : {}),
    };
    expect(updated.toJSON()).toEqual(expected);
    const next = clonePolicyWithActionDefinition(
      policy,
      'DynamicAction',
      'DynamicAction',
      updated
    );
    expect(next.actionDefinitions.OtherAction).toBe(
      policy.actionDefinitions.OtherAction
    );
    expect(policy.actionDefinitions.DynamicAction).toBe(original.action);
    expect(JSON.stringify(policy.toJSON())).toBe(originalJson);
  }
});

test('inline enum choices use domain values and only supported fields are editable', () => {
  const columns = buildActionDefinitionGridColumns(() => undefined);
  for (const [field, values] of [
    [
      'document',
      [
        DocumentLinkRequirement.None,
        DocumentLinkRequirement.Allowed,
        DocumentLinkRequirement.Required,
      ],
    ],
    [
      'note',
      [
        NoteEntryRequirement.None,
        NoteEntryRequirement.Allowed,
        NoteEntryRequirement.Required,
      ],
    ],
  ] as const) {
    expect(columns.find((column) => column.field === field)).toMatchObject({
      editable: true,
      type: 'singleSelect',
      valueOptions: [
        { value: values[0], label: 'None' },
        { value: values[1], label: 'Allowed' },
        { value: values[2], label: 'Required' },
      ],
    });
  }
  expect(
    columns.filter((column) => column.editable).map((column) => column.field)
  ).toEqual(['document', 'note', 'instructions', 'url', 'validity']);
});

test('validity uses existing day, month and year conversion without flattening subday durations', () => {
  expect(toTimeSpanString(true, '2', 'days')).toBe('2.00:00:00');
  expect(toTimeSpanString(true, '2', 'months')).toBe('60.00:00:00');
  expect(toTimeSpanString(true, '2', 'years')).toBe('730.00:00:00');
  expect(toTimeSpanString(false, '2', 'days')).toBeUndefined();
  expect(toTimeSpanString(true, '-1', 'days')).toBeUndefined();
  expect(toTimeSpanString(true, '1.5', 'days')).toBeUndefined();
  expect(canEditActionValidity('00:30:00')).toBe(false);
  expect(canEditActionValidity('2.01:00:00')).toBe(false);
  expect(canEditActionValidity('60.00:00:00')).toBe(true);
  const policy = EffectiveLocationPolicy.fromJS({
    actionDefinitions: { Activity: action().toJSON() },
  });
  const row = buildActionDefinitionGridRows(
    policy,
    getRequirementUsage(policy)
  )[0];
  expect(() =>
    actionDefinitionFromGridRow({ ...row, validity: 'invalid' })
  ).toThrow(/Validity/);
  expect(() =>
    actionDefinitionFromGridRow({
      ...row,
      document: 'Required' as unknown as DocumentLinkRequirement,
    })
  ).toThrow(/Select/);
});

test('keeps action-definition grid columns operational', () => {
  const columns = buildActionDefinitionGridColumns(() => undefined);
  const columnsByField = new Map(
    columns.map((column) => [column.field, column])
  );

  expect(columns.map((column) => column.field)).toEqual([
    'actionName',
    'document',
    'note',
    'instructions',
    'url',
    'validity',
    'alternateNames',
    'usage',
    'actions',
  ]);
  expect(columns.find((column) => column.field === 'usage')).toMatchObject({
    type: 'number',
    aggregable: false,
    chartable: false,
    groupable: false,
    pivotable: false,
  });
  expect(columns.find((column) => column.field === 'actions')).toMatchObject({
    disableExport: true,
    filterable: false,
    sortable: false,
  });
  ['actionName', 'instructions', 'url', 'alternateNames'].forEach((field) => {
    expect(columnsByField.get(field)).toMatchObject({
      flex: expect.any(Number),
      minWidth: expect.any(Number),
    });
  });
});

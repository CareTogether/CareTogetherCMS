import { expect, test } from '@playwright/test';
import {
  ActionRequirement,
  DocumentLinkRequirement,
  EffectiveLocationPolicy,
  NoteEntryRequirement,
} from '../src/GeneratedClient';
import {
  buildActionDefinitionGridColumns,
  buildActionDefinitionGridRows,
} from '../src/Settings/Locations/Tabs/PolicyConfiguration/actionDefinitionsDataGrid';
import {
  clonePolicyWithActionDefinition,
  clonePolicyWithActionDefinitionOrder,
} from '../src/Settings/Locations/Tabs/PolicyConfiguration/policyUtils';
import { getRequirementUsage } from '../src/Settings/Locations/Tabs/PolicyConfiguration/policyReferences';

function action() {
  return ActionRequirement.fromJS({
    documentLink: DocumentLinkRequirement.None,
    noteEntry: NoteEntryRequirement.None,
  });
}

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
      document: 'Required',
      instructions: 'Request a current report.',
      note: 'Allowed',
      url: 'https://example.test/background-check',
      usage: 0,
      validity: '1 year',
    }),
  ]);
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

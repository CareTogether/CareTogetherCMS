import { expect, test } from '@playwright/test';
import {
  ActionRequirement,
  EffectiveLocationPolicy,
} from '../src/GeneratedClient';
import { clonePolicyWithActionDefinition } from '../src/Settings/Locations/Tabs/PolicyConfiguration/policyUtils';

function action() {
  return new ActionRequirement({});
}

function policyWithActionDefinitions(actionNames: string[]) {
  return new EffectiveLocationPolicy({
    actionDefinitions: Object.fromEntries(
      actionNames.map((actionName) => [actionName, action()])
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

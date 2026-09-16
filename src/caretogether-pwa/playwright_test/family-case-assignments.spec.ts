import type { Page } from '@playwright/test';
import { expect, test } from './support/fixtures';
import { ATLANTIS_ROUTE } from './support/constants';
import {
  AssignedIndividualVolunteer,
  FamilyRecordsAggregate,
  Permission,
  RecordsAggregate,
} from '../src/GeneratedClient';
import {
  FAMILY_SCREEN_V2_EARLY_ACCESS_FEATURE_FLAG,
  FUNCTION_ASSIGNMENTS_FEATURE_FLAG,
} from '../src/featureFlags';

const familyId = '11111111-1111-1111-1111-111111111111';
const historicalCaseId = familyId;
const openCaseId = '22222222-2222-2222-2222-222222222222';
const firstPersonId = '55555555-5555-5555-5555-555555555555';
const secondPersonId = '66666666-6666-6666-6666-666666666666';
const assignmentRole = 'Case Manager';
const coordinatorRole = 'Case Coordinator';

function assignmentField(page: Page, role = assignmentRole) {
  return page.getByRole('group', { name: role, exact: true });
}

async function clearAssignedPerson(page: Page, expectedName: string) {
  const input = page.getByRole('combobox', { name: 'Assigned person' });
  await expect(input).toHaveValue(expectedName);
  await input.focus();
  await page.getByRole('button', { name: 'Clear', exact: true }).click();
}

const featureFlags = {
  [FAMILY_SCREEN_V2_EARLY_ACCESS_FEATURE_FLAG]: true,
  [FUNCTION_ASSIGNMENTS_FEATURE_FLAG]: true,
};

type AssignmentCommand = {
  discriminator: string;
  familyId: string;
  referralId: string;
  personId: string;
  assignmentRole: string;
};

// Keep normal authenticated application loading, but isolate assignment
// scenarios and writes from the shared development dataset.
async function prepareAssignments(
  page: Page,
  access: 'edit' | 'view' | 'none' = 'edit',
  options: {
    unassigned?: boolean;
    noCase?: boolean;
    noPolicy?: boolean;
    commandRole?: string;
  } = {}
) {
  const commands: AssignmentCommand[] = [];
  let target: FamilyRecordsAggregate;
  if (options.noPolicy) {
    await page.route('**/Configuration/policy', async (route) => {
      const response = await route.fetch();
      const policy = await response.json();
      policy.referralPolicy!.functionAssignmentPolicies =
        policy.referralPolicy!.functionAssignmentPolicies.filter(
          (policy: { assignmentRole: string }) =>
            policy.assignmentRole !== assignmentRole
        );
      await route.fulfill({ response, json: policy });
    });
  }
  await page.route('**/Records', async (route) => {
    const response = await route.fetch();
    const records = (await response.json()).map(
      RecordsAggregate.fromJS
    ) as RecordsAggregate[];
    target = records.find(
      (record) =>
        record instanceof FamilyRecordsAggregate &&
        record.family?.family?.id === familyId
    ) as FamilyRecordsAggregate;
    expect(target, 'Seeded Doe family exists').toBeTruthy();
    const family = target.family!;
    family.userPermissions = (family.userPermissions ?? []).filter(
      (permission) =>
        permission !== Permission.ViewV1CaseFunctionAssignments &&
        permission !== Permission.EditV1CaseFunctionAssignments
    );
    if (access !== 'none')
      family.userPermissions.push(Permission.ViewV1CaseFunctionAssignments);
    if (access === 'edit')
      family.userPermissions.push(Permission.EditV1CaseFunctionAssignments);
    const openCase = family.partneringFamilyInfo!.openV1Case!;
    if (options.unassigned) {
      openCase.assignedIndividualVolunteers =
        openCase.assignedIndividualVolunteers?.filter(
          (assignment) => assignment.assignmentRole !== assignmentRole
        ) ?? [];
    }
    if (options.noCase) {
      family.partneringFamilyInfo!.openV1Case = undefined;
      family.partneringFamilyInfo!.closedV1Cases = [];
    }
    await route.fulfill({ response, json: records });
  });
  await page.route('**/Records/atomicRecordsCommand', async (route) => {
    const body = route.request().postDataJSON();
    expect(body.discriminator).toBe('ReferralRecordsCommand');
    const command = body.command as AssignmentCommand;
    commands.push(command);
    expect(command.familyId).toBe(familyId);
    expect(command.assignmentRole).toBe(options.commandRole ?? assignmentRole);
    const info = target.family!.partneringFamilyInfo!;
    const selectedCase = [info.openV1Case!, ...info.closedV1Cases!].find(
      (v1Case) => v1Case.id === command.referralId
    )!;
    expect(selectedCase, 'Command targets an existing case').toBeTruthy();
    const assignments = selectedCase.assignedIndividualVolunteers ?? [];
    if (command.discriminator === 'UnassignIndividualVolunteer') {
      selectedCase.assignedIndividualVolunteers = assignments.filter(
        (assignment) =>
          assignment.personId !== command.personId ||
          assignment.assignmentRole !== command.assignmentRole
      );
    } else {
      expect(command.discriminator).toBe('AssignIndividualVolunteer');
      selectedCase.assignedIndividualVolunteers = assignments.concat(
        AssignedIndividualVolunteer.fromJS({
          ...command,
          assignedAtUtc: new Date().toISOString(),
        })
      );
    }
    await route.fulfill({ json: [target] });
  });
  return commands;
}

async function openFamily(page: Page, caseId = openCaseId) {
  await page.goto(`${ATLANTIS_ROUTE}families/${familyId}?v1CaseId=${caseId}`);
  await expect(page.getByRole('tab', { name: /Case History/ })).toBeVisible();
}

test.describe('UIV2 case function assignments @pr', () => {
  test.use({ featureFlags });

  for (const caseId of [openCaseId, historicalCaseId]) {
    test(`displays, changes and clears Case Manager on case ${caseId}`, async ({
      page,
    }) => {
      const commands = await prepareAssignments(page);
      const historical = caseId === historicalCaseId;
      const originalName = historical ? 'Leia Skywalker' : 'Han Solo';
      const replacementName = historical ? 'Han Solo' : 'Leia Skywalker';
      const originalId = historical ? secondPersonId : firstPersonId;
      const replacementId = historical ? firstPersonId : secondPersonId;
      await openFamily(page, caseId);
      await expect(assignmentField(page, 'Historical Support')).toHaveCount(
        historical ? 1 : 0
      );
      if (historical) {
        await expect(
          assignmentField(page, 'Historical Support').getByText('Han Solo', {
            exact: true,
          })
        ).toBeVisible();
        await expect(
          assignmentField(page, coordinatorRole).getByText('Not assigned', {
            exact: true,
          })
        ).toBeVisible();
      }
      await expect(
        page.getByText('Case Manager', { exact: true })
      ).toBeVisible();
      const original = assignmentField(page).getByText(originalName, {
        exact: true,
      });
      await expect(original).toBeVisible();
      expect(
        await original.evaluate((element) => !!element.closest('.ph-unmask'))
      ).toBe(false);
      await page
        .getByRole('button', { name: 'Edit Case Manager', exact: true })
        .click();
      await expect(
        page.getByRole('heading', { name: 'Edit Case Manager', exact: true })
      ).toBeVisible();
      const input = page.getByRole('combobox', { name: 'Assigned person' });
      await expect(input).toHaveValue(originalName);
      // Other configured and assigned roles must not enter this focused editor.
      await expect(page.getByRole('combobox')).toHaveCount(1);

      expect(
        await input.evaluate((element) => !!element.closest('.ph-unmask'))
      ).toBe(false);
      await input.fill(replacementName);
      const option = page.getByRole('option', {
        name: replacementName,
        exact: true,
      });
      expect(
        await option.evaluate((element) => !!element.closest('.ph-unmask'))
      ).toBe(false);
      await option.click();
      await page.getByRole('button', { name: 'Save', exact: true }).click();
      await expect(
        page.getByRole('heading', { name: 'Edit Case Manager' })
      ).toHaveCount(0);
      await expect(
        assignmentField(page).getByText(replacementName, { exact: true })
      ).toBeVisible();
      expect(
        commands.map(({ discriminator, referralId, personId }) => ({
          discriminator,
          referralId,
          personId,
        }))
      ).toEqual([
        {
          discriminator: 'UnassignIndividualVolunteer',
          referralId: caseId,
          personId: originalId,
        },
        {
          discriminator: 'AssignIndividualVolunteer',
          referralId: caseId,
          personId: replacementId,
        },
      ]);
      await page
        .getByRole('button', { name: 'Edit Case Manager', exact: true })
        .click();
      await clearAssignedPerson(page, replacementName);
      await page.getByRole('button', { name: 'Save', exact: true }).click();
      await expect(
        page.getByRole('heading', { name: 'Edit Case Manager' })
      ).toHaveCount(0);
      await expect(
        assignmentField(page).getByText('Not assigned', { exact: true })
      ).toBeVisible();
      if (!historical)
        await expect(
          assignmentField(page, coordinatorRole).getByText('Han Solo', {
            exact: true,
          })
        ).toBeVisible();
      expect(commands).toHaveLength(3);
      expect(commands[2]).toMatchObject({
        discriminator: 'UnassignIndividualVolunteer',
        referralId: caseId,
        personId: replacementId,
      });
    });
  }

  test('assigns a Case Manager when none is assigned', async ({ page }) => {
    const commands = await prepareAssignments(page, 'edit', {
      unassigned: true,
    });
    await openFamily(page);
    await expect(
      assignmentField(page).getByText('Not assigned', { exact: true })
    ).toBeVisible();
    await page
      .getByRole('button', { name: 'Edit Case Manager', exact: true })
      .click();
    await page.getByRole('combobox', { name: 'Assigned person' }).fill('Leia');
    await page
      .getByRole('option', { name: 'Leia Skywalker', exact: true })
      .click();
    await page.getByRole('button', { name: 'Save', exact: true }).click();
    await expect(
      page.getByRole('heading', { name: 'Edit Case Manager' })
    ).toHaveCount(0);
    await expect(
      assignmentField(page).getByText('Leia Skywalker', { exact: true })
    ).toBeVisible();
    expect(commands).toHaveLength(1);
    expect(commands[0]).toMatchObject({
      discriminator: 'AssignIndividualVolunteer',
      referralId: openCaseId,
      personId: secondPersonId,
    });
  });

  for (const access of ['view', 'none'] as const) {
    test(`${access} permission respects assignment visibility and editing`, async ({
      page,
    }) => {
      const commands = await prepareAssignments(page, access);
      await openFamily(page);
      await expect(page.getByText('Case Manager', { exact: true })).toHaveCount(
        access === 'view' ? 1 : 0
      );
      await expect(
        page.getByRole('button', { name: 'Edit Case Manager', exact: true })
      ).toHaveCount(0);
      await expect(
        assignmentField(page).getByText('Han Solo', { exact: true })
      ).toHaveCount(access === 'view' ? 1 : 0);
      await expect(assignmentField(page, coordinatorRole)).toHaveCount(
        access === 'view' ? 1 : 0
      );
      await expect(
        page.getByRole('button', { name: 'Edit Case Coordinator', exact: true })
      ).toHaveCount(0);
      expect(commands).toHaveLength(0);
    });
  }

  test('hides assignment fields when there is no case', async ({ page }) => {
    await prepareAssignments(page, 'edit', { noCase: true });
    await openFamily(page);
    await expect(assignmentField(page)).toHaveCount(0);
    await expect(assignmentField(page, coordinatorRole)).toHaveCount(0);
    await expect(
      page.getByRole('button', { name: 'Edit Case Manager', exact: true })
    ).toHaveCount(0);
  });

  test('renders and edits another configured role independently', async ({
    page,
  }) => {
    const commands = await prepareAssignments(page, 'edit', {
      commandRole: coordinatorRole,
    });
    await openFamily(page);
    const coordinator = assignmentField(page, coordinatorRole);
    await expect(coordinator).toBeVisible();
    await expect(
      coordinator.getByText('Han Solo', { exact: true })
    ).toBeVisible();
    await coordinator
      .getByRole('button', { name: 'Edit Case Coordinator', exact: true })
      .click();
    await expect(
      page.getByRole('heading', { name: 'Edit Case Coordinator', exact: true })
    ).toBeVisible();
    await expect(page.getByRole('combobox')).toHaveCount(1);
    await page.getByRole('combobox', { name: 'Assigned person' }).fill('Leia');
    await page
      .getByRole('option', { name: 'Leia Skywalker', exact: true })
      .click();
    await page.getByRole('button', { name: 'Save', exact: true }).click();
    await expect(
      page.getByRole('heading', { name: 'Edit Case Coordinator' })
    ).toHaveCount(0);
    await expect(
      coordinator.getByText('Leia Skywalker', { exact: true })
    ).toBeVisible();
    await expect(
      assignmentField(page).getByText('Han Solo', { exact: true })
    ).toBeVisible();
    expect(commands).toMatchObject([
      {
        discriminator: 'UnassignIndividualVolunteer',
        referralId: openCaseId,
        personId: firstPersonId,
        assignmentRole: coordinatorRole,
      },
      {
        discriminator: 'AssignIndividualVolunteer',
        referralId: openCaseId,
        personId: secondPersonId,
        assignmentRole: coordinatorRole,
      },
    ]);
    expect(commands).toHaveLength(2);
  });

  test('preserves a role without a policy without offering eligibility', async ({
    page,
  }) => {
    const commands = await prepareAssignments(page, 'edit', { noPolicy: true });
    await openFamily(page);
    await expect(
      assignmentField(page).getByText('Han Solo', { exact: true })
    ).toBeVisible();
    await expect(assignmentField(page).getByRole('button')).toHaveCount(0);
    await expect(
      assignmentField(page, coordinatorRole).getByRole('button', {
        name: 'Edit Case Coordinator',
      })
    ).toBeVisible();
    expect(commands).toHaveLength(0);
  });

  test('switching selected cases discards an open assignment draft', async ({
    page,
  }) => {
    const commands = await prepareAssignments(page);
    await openFamily(page);
    await page.getByRole('tab', { name: /Case History/ }).click();
    await page.getByRole('button', { name: /Closed Case/ }).click();
    await expect(page).toHaveURL(new RegExp(historicalCaseId));
    await page
      .getByRole('button', { name: 'Edit Case Manager', exact: true })
      .click();
    await clearAssignedPerson(page, 'Leia Skywalker');
    // Exercise a selection change while the modal owns focus; ordinary clicks
    // on the history list are blocked by the drawer backdrop.
    await page
      .getByRole('button', { name: /Open Case/, includeHidden: true })
      .dispatchEvent('click');
    await expect(page).not.toHaveURL(new RegExp(historicalCaseId));
    await expect(
      page.getByRole('heading', { name: 'Edit Case Manager' })
    ).toHaveCount(0);
    await page
      .getByRole('button', { name: 'Edit Case Manager', exact: true })
      .click();
    await expect(
      page.getByRole('combobox', { name: 'Assigned person' })
    ).toHaveValue('Han Solo');
    await page.getByRole('button', { name: 'Cancel', exact: true }).click();
    expect(commands).toHaveLength(0);
  });
});

test.describe('assignment feature flag disabled', () => {
  test.use({
    featureFlags: {
      ...featureFlags,
      [FUNCTION_ASSIGNMENTS_FEATURE_FLAG]: false,
    },
  });
  test('hides assignments even with edit permission', async ({ page }) => {
    await prepareAssignments(page);
    await openFamily(page);
    await expect(assignmentField(page, coordinatorRole)).toHaveCount(0);
    await expect(page.getByText('Case Manager', { exact: true })).toHaveCount(
      0
    );
    await expect(
      page.getByRole('button', { name: 'Edit Case Manager', exact: true })
    ).toHaveCount(0);
  });
});

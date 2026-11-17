import { type Page } from '@playwright/test';
import { expect, test } from './support/fixtures';
import { SELF_SERVICE_POLICY_FEATURE_FLAG } from '../src/featureFlags';
import { fileURLToPath } from 'node:url';
import { readFileSync } from 'node:fs';
import { EffectiveLocationPolicy } from '../src/GeneratedClient';
import { EL_DORADO_LOCATION_ID } from './support/constants';
import {
  type PolicyJson,
  locationPolicyPath,
  locationSettingsPath,
  stubLocationPolicy,
  stubPolicyValidation,
} from './support/policyApi';

const warning =
  "Function Policy 'Host Family or Friend' references unknown volunteer role 'Parent Ally'.";
const blockingError =
  "Case Policies Intake Requirements references unknown action 'Missing Action'.";

test.use({ featureFlags: { [SELF_SERVICE_POLICY_FEATURE_FLAG]: true } });

// Replaces the case policy sections the tests edit with known, empty ones.
function withTestCasePolicy(policy: PolicyJson): PolicyJson {
  const [template] = policy.referralPolicy.arrangementPolicies;
  policy.referralPolicy.arrangementPolicies = [
    {
      ...template,
      arrangementType: 'Hosting',
      supersededAtUtc: undefined,
      arrangementFunctions: [],
    },
  ];
  policy.referralPolicy.functionPolicies = [];
  policy.referralPolicy.functionAssignmentPolicies = [];
  policy.volunteerPolicy.volunteerRoles['Family Friend'] = {
    volunteerRoleType: 'Family Friend',
    policyVersions: [],
  };
  return policy;
}

async function mount(page: Page, tab = 'basic') {
  await page.goto(locationSettingsPath(undefined, tab));
}

// The open drawer is modal, so switch locations through history like the back button.
function switchTo(page: Page, locationId: string | undefined, tab: string) {
  return page.evaluate(
    (target) => {
      window.history.pushState({}, '', target);
      window.dispatchEvent(new PopStateEvent('popstate'));
    },
    locationSettingsPath(locationId, tab)
  );
}

// Warnings clear after the first successful save unless keepWarnings is set.
async function backend(page: Page, saveFails = false, keepWarnings = false) {
  const policy = await stubLocationPolicy(page, { policy: withTestCasePolicy });
  if (saveFails)
    await page.route(
      (url) => url.pathname === locationPolicyPath(),
      (route) =>
        route.request().method() === 'PUT'
          ? route.fulfill({ status: 400, json: { errors: [blockingError] } })
          : route.fallback()
    );
  let puts = 0;
  page.on('request', (request) => {
    if (
      request.method() === 'PUT' &&
      new URL(request.url()).pathname === locationPolicyPath()
    )
      puts++;
  });
  const validation = await stubPolicyValidation(page, () => ({
    errors: [],
    warnings: puts && !saveFails && !keepWarnings ? [] : [warning],
  }));
  return { ...policy, puts: () => puts, validations: validation.validations };
}

function alertWith(page: Page, message: string) {
  return page.getByRole('alert').filter({ hasText: message });
}

async function addFunction(
  page: Page,
  arrangement = 'Hosting',
  role = 'Family Friend'
) {
  await page.getByText('Arrangements', { exact: true }).click();
  await page.getByText(arrangement, { exact: true }).click();
  await page.getByText('Arrangement Functions', { exact: true }).click();
  const section = page
    .locator('.MuiAccordion-root')
    .filter({ has: page.getByText('Arrangement Functions', { exact: true }) })
    .last();
  await section.getByRole('button', { name: 'Add', exact: true }).click();
  await page
    .getByRole('textbox', { name: 'Function', exact: true })
    .fill('New Function');
  await page
    .getByRole('combobox', { name: 'Eligible Individual Volunteer Roles' })
    .click();
  await page.getByRole('option', { name: role, exact: true }).click();
  await page.getByRole('textbox', { name: 'Function', exact: true }).click();
}

async function addCaseFunctionAssignment(page: Page) {
  const section = page
    .locator('.MuiAccordion-root')
    .filter({ has: page.getByText('Functions', { exact: true }) })
    .first();
  await section.getByRole('button', { name: 'Add', exact: true }).click();
  await page
    .getByRole('textbox', { name: 'Function', exact: true })
    .fill('Case Coordinator');
  await page
    .getByRole('combobox', { name: 'Eligible Individual Volunteer Roles' })
    .click();
  await page
    .getByRole('option', { name: 'Family Friend', exact: true })
    .click();
  await page.getByRole('textbox', { name: 'Function', exact: true }).click();
}

test.describe('policy validation @pr', () => {
  test('initial Basic Settings shows warnings once and never saves', async ({
    page,
  }) => {
    const requests = await backend(page);
    await mount(page);
    await expect(alertWith(page, warning)).toHaveCount(1);
    await expect(page.getByText(warning, { exact: true })).toHaveCount(1);
    expect(
      await page
        .getByText(warning, { exact: true })
        .evaluate((element) => element.closest('.ph-unmask') !== null)
    ).toBe(true);
    expect(requests.puts()).toBe(0);
    expect(requests.validations()).toBe(1);
  });

  test('initial semantic errors and warnings are separate alerts', async ({
    page,
  }) => {
    await backend(page);
    await stubPolicyValidation(page, () => ({
      errors: [blockingError],
      warnings: [warning],
    }));
    await mount(page);
    await expect(alertWith(page, blockingError)).toHaveCount(1);
    await expect(alertWith(page, warning)).toHaveCount(1);
    await expect(alertWith(page, blockingError)).not.toContainText(warning);
  });

  test('failed save keeps the drawer values and existing warnings', async ({
    page,
  }) => {
    const requests = await backend(page, true);
    await mount(page, 'casePolicy');
    await expect(page.getByText(warning, { exact: true })).toBeVisible();
    await addFunction(page);
    await page.getByRole('button', { name: 'Save', exact: true }).click();
    await expect(page.getByTestId('policy-save-errors')).toContainText(
      blockingError
    );
    await expect(
      page.getByRole('textbox', { name: 'Function', exact: true })
    ).toHaveValue('New Function');
    await expect(page.getByText(warning, { exact: true })).toHaveCount(1);
    expect(requests.puts()).toBe(1);
    expect(requests.validations()).toBe(1);
  });

  test('failed function assignment save keeps the drawer open with its values', async ({
    page,
  }) => {
    const requests = await backend(page, true);
    await mount(page, 'casePolicy');
    await expect(page.getByText(warning, { exact: true })).toBeVisible();
    await addCaseFunctionAssignment(page);
    await page.getByRole('button', { name: 'Save', exact: true }).click();
    const saveFailed = page.getByText(
      'The changes could not be saved. Review the policy errors and try again.'
    );
    await expect(saveFailed).toBeVisible();
    await expect(
      page.getByRole('textbox', { name: 'Function', exact: true })
    ).toHaveValue('Case Coordinator');
    await expect(
      page.getByRole('button', { name: 'Save', exact: true })
    ).toBeEnabled();
    // Side panels render in a portal, so they need their own ph-unmask scope.
    expect(
      await saveFailed.evaluate(
        (element) => element.closest('.ph-unmask') !== null
      )
    ).toBe(true);
    expect(requests.puts()).toBe(1);
  });

  test('successful function assignment save closes the drawer', async ({
    page,
  }) => {
    const requests = await backend(page);
    await mount(page, 'casePolicy');
    await expect(page.getByText(warning, { exact: true })).toBeVisible();
    await addCaseFunctionAssignment(page);
    await page.getByRole('button', { name: 'Save', exact: true }).click();
    await expect(
      page.getByRole('textbox', { name: 'Function', exact: true })
    ).not.toBeVisible();
    await expect(page.getByText('Case Coordinator')).toBeVisible();
    expect(requests.puts()).toBe(1);
  });

  test('warning-only save closes the drawer and refreshes warnings', async ({
    page,
  }) => {
    const requests = await backend(page);
    await mount(page, 'casePolicy');
    await expect(page.getByText(warning, { exact: true })).toBeVisible();
    await addFunction(page);
    await page.getByRole('button', { name: 'Save', exact: true }).click();
    await expect(
      page.getByRole('textbox', { name: 'Function', exact: true })
    ).not.toBeVisible();
    await expect(page.getByText(/^New Function -/)).toBeVisible();
    await expect(page.getByText(warning, { exact: true })).toHaveCount(0);
    expect(requests.puts()).toBe(1);
    expect(requests.validations()).toBe(2);
  });

  test('location switch ignores an older validation response', async ({
    page,
  }) => {
    await backend(page);
    await stubLocationPolicy(page, { locationId: EL_DORADO_LOCATION_ID });
    await stubPolicyValidation(
      page,
      () => ({ errors: [], warnings: ['Location B warning'] }),
      { locationId: EL_DORADO_LOCATION_ID }
    );
    let release!: () => void;
    const delayed = new Promise<void>((resolve) => {
      release = resolve;
    });
    let started = false;
    await stubPolicyValidation(page, async () => {
      started = true;
      await delayed;
      return { errors: [], warnings: [warning] };
    });

    await mount(page);
    await expect.poll(() => started).toBe(true);
    await switchTo(page, EL_DORADO_LOCATION_ID, 'basic');
    await expect(
      page.getByText('Location B warning', { exact: true })
    ).toBeVisible();
    const oldResponse = page.waitForResponse(
      (response) =>
        new URL(response.url()).pathname ===
        `${locationPolicyPath()}/validation`
    );
    release();
    await oldResponse;
    await expect(page.getByText(warning, { exact: true })).toHaveCount(0);
    await expect(
      page.getByText('Location B warning', { exact: true })
    ).toHaveCount(1);
  });

  test('validation network failure is distinct from semantic diagnostics', async ({
    page,
  }) => {
    await backend(page);
    await page.route(
      (url) => url.pathname === `${locationPolicyPath()}/validation`,
      (route) => route.fulfill({ status: 503, body: 'Unavailable' })
    );
    await mount(page);
    await expect(
      alertWith(page, 'Policy validation could not be loaded')
    ).toBeVisible();
    await expect(page.getByText(warning, { exact: true })).toHaveCount(0);
  });

  test('validation failure can be retried', async ({ page }) => {
    await backend(page);
    let validations = 0;
    await page.route(
      (url) => url.pathname === `${locationPolicyPath()}/validation`,
      (route) =>
        ++validations === 1
          ? route.fulfill({ status: 503, body: 'Unavailable' })
          : route.fulfill({ json: { errors: [], warnings: [warning] } })
    );
    await mount(page);
    await expect(
      alertWith(page, 'Policy validation could not be loaded')
    ).toBeVisible();
    await page.getByRole('button', { name: 'Try again', exact: true }).click();
    await expect(page.getByText(warning, { exact: true })).toBeVisible();
    await expect(
      page.getByText('Policy validation could not be loaded')
    ).toHaveCount(0);
    expect(validations).toBe(2);
  });

  test('saving disables duplicate submissions until persistence completes', async ({
    page,
  }) => {
    await backend(page);
    let release!: () => void;
    const pending = new Promise<void>((resolve) => {
      release = resolve;
    });
    let puts = 0;
    await page.route(
      (url) => url.pathname === locationPolicyPath(),
      async (route) => {
        if (route.request().method() !== 'PUT') {
          await route.fallback();
          return;
        }
        puts++;
        await pending;
        await route.fulfill({ status: 400, json: { errors: [blockingError] } });
      }
    );
    await mount(page, 'casePolicy');
    await expect(page.getByText(warning, { exact: true })).toBeVisible();
    await addFunction(page);
    const save = page.getByRole('button', { name: 'Save', exact: true });
    await save.click();
    await expect(save).toBeDisabled();
    await expect(
      page.getByRole('textbox', { name: 'Function', exact: true })
    ).toHaveValue('New Function');
    await save.evaluate((button) =>
      button
        .closest('form')!
        .dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))
    );
    expect(puts).toBe(1);
    release();
    await expect(save).toBeEnabled();
    await expect(
      page.getByRole('textbox', { name: 'Function', exact: true })
    ).toHaveValue('New Function');
  });

  test('save that finishes after a location switch refreshes the saved location', async ({
    page,
  }) => {
    await backend(page);
    await stubLocationPolicy(page, {
      locationId: EL_DORADO_LOCATION_ID,
      policy: withTestCasePolicy,
    });
    await stubPolicyValidation(page, () => ({ errors: [], warnings: [] }), {
      locationId: EL_DORADO_LOCATION_ID,
    });
    let release!: () => void;
    const pending = new Promise<void>((resolve) => {
      release = resolve;
    });
    await page.route(
      (url) => url.pathname === locationPolicyPath(),
      async (route) => {
        if (route.request().method() === 'PUT') await pending;
        await route.fallback();
      }
    );

    await mount(page, 'casePolicy');
    await expect(page.getByText(warning, { exact: true })).toBeVisible();
    const heading = page.getByRole('heading', { level: 1 });
    const savedLocationHeading = await heading.textContent();
    await addFunction(page);
    await page.getByRole('button', { name: 'Save', exact: true }).click();
    await expect(
      page.getByRole('button', { name: 'Save', exact: true })
    ).toBeDisabled();
    await switchTo(page, EL_DORADO_LOCATION_ID, 'casePolicy');
    await expect(heading).not.toHaveText(savedLocationHeading!);
    const saved = page.waitForResponse(
      (response) =>
        new URL(response.url()).pathname === locationPolicyPath() &&
        response.request().method() === 'PUT'
    );
    release();
    await saved;

    await switchTo(page, undefined, 'casePolicy');
    await expect(heading).toHaveText(savedLocationHeading!);
    // The accordions keep their expanded state across the location switch.
    for (const section of [
      'Arrangements',
      'Hosting',
      'Arrangement Functions',
    ]) {
      const header = page
        .locator('.MuiAccordionSummary-root')
        .filter({ has: page.getByText(section, { exact: true }) })
        .first();
      if ((await header.getAttribute('aria-expanded')) !== 'true')
        await header.click();
    }
    await expect(page.getByText(/^New Function -/)).toBeVisible();
    await expect(page.getByTestId('policy-save-errors')).toHaveCount(0);
  });

  test('revalidation replaces warnings rather than duplicating them', async ({
    page,
  }) => {
    const requests = await backend(page, false, true);
    await mount(page, 'casePolicy');
    await expect(page.getByText(warning, { exact: true })).toBeVisible();
    await addFunction(page);
    await page.getByRole('button', { name: 'Save', exact: true }).click();
    await expect(
      page.getByRole('textbox', { name: 'Function', exact: true })
    ).not.toBeVisible();
    await expect.poll(requests.validations).toBe(2);
    await expect(page.getByText(warning, { exact: true })).toHaveCount(1);
  });

  test('successful update supersedes an unfinished initial validation', async ({
    page,
  }) => {
    await backend(page);
    let release!: () => void;
    const pending = new Promise<void>((resolve) => {
      release = resolve;
    });
    const validation = await stubPolicyValidation(
      page,
      async (_policy, validationNumber) => {
        const initial = validationNumber === 1;
        if (initial) await pending;
        return { errors: [], warnings: initial ? [warning] : [] };
      }
    );
    const checking = page.getByText('Checking policy configuration...');
    await mount(page, 'casePolicy');
    await expect(checking).toBeVisible();
    await addFunction(page);
    await page.getByRole('button', { name: 'Save', exact: true }).click();
    await expect.poll(validation.validations).toBe(2);
    await expect(checking).toHaveCount(0);
    const response = page.waitForResponse((result) =>
      result.url().endsWith('/policy/validation')
    );
    release();
    await response;
    await expect(page.getByText(warning, { exact: true })).toHaveCount(0);
  });

  test('supplied-policy regression persists a new function through reload with all warnings intact', async ({
    page,
  }) => {
    const fixture = JSON.parse(
      readFileSync(
        fileURLToPath(
          new URL(
            '../../../test/CareTogether.Core.Test/Fixtures/asf-role-reference-policy.json',
            import.meta.url
          )
        ),
        'utf8'
      )
    );
    const functionReferences = (policy: EffectiveLocationPolicy) =>
      policy.referralPolicy.functionPolicies!.map((functionPolicy) => ({
        name: functionPolicy.functionName,
        roles: functionPolicy.eligibility.eligibleIndividualVolunteerRoles,
      }));
    const diagnostics = (policy: EffectiveLocationPolicy) => {
      const roles = Object.keys(policy.volunteerPolicy.volunteerRoles);
      return policy.referralPolicy.functionPolicies!.flatMap((functionPolicy) =>
        functionPolicy.eligibility.eligibleIndividualVolunteerRoles
          .filter(
            (role) =>
              !roles.some((known) => known.toLowerCase() === role.toLowerCase())
          )
          .map(
            (role) =>
              `Function Policy '${functionPolicy.functionName}' references unknown volunteer role '${role}'.`
          )
      );
    };
    const original = EffectiveLocationPolicy.fromJS(fixture);
    const originalReferences = functionReferences(original);
    const expected = diagnostics(original);
    expect(expected).toHaveLength(15);

    const policy = await stubLocationPolicy(page, { policy: () => fixture });
    const validation = await stubPolicyValidation(page, (candidate) => ({
      errors: [],
      warnings: diagnostics(EffectiveLocationPolicy.fromJS(candidate)),
    }));

    await mount(page);
    for (const message of expected)
      await expect(page.getByText(message, { exact: true })).toHaveCount(1);
    expect(policy.puts()).toBe(0);
    await page.getByText('Case Policies', { exact: true }).click();
    await addFunction(page, 'Overnight Hosting', 'Community Friend');
    await page.getByRole('button', { name: 'Save', exact: true }).click();
    await expect(
      page.getByRole('textbox', { name: 'Function', exact: true })
    ).not.toBeVisible();
    await expect(page.getByText(/^New Function -/)).toBeVisible();
    await expect.poll(validation.validations).toBe(2);
    for (const message of expected)
      await expect(page.getByText(message, { exact: true })).toHaveCount(1);
    expect(policy.puts()).toBe(1);
    expect(
      functionReferences(EffectiveLocationPolicy.fromJS(policy.stored()))
    ).toEqual(originalReferences);

    await page.reload();
    await expect.poll(validation.validations).toBe(3);
    for (const message of expected)
      await expect(page.getByText(message, { exact: true })).toHaveCount(1);
    await page.getByText('Arrangements', { exact: true }).click();
    await page.getByText('Overnight Hosting', { exact: true }).click();
    await page.getByText('Arrangement Functions', { exact: true }).click();
    await expect(page.getByText(/^New Function -/)).toBeVisible();
    expect(policy.puts()).toBe(1);
  });
});

test.describe('policy self-service disabled @pr', () => {
  test.use({ featureFlags: { [SELF_SERVICE_POLICY_FEATURE_FLAG]: false } });

  test('does not validate or save while the feature is disabled', async ({
    page,
  }) => {
    const requests = await backend(page);
    await mount(page);
    await expect(
      page.getByRole('heading', { name: /^Editing .+ configuration$/ })
    ).toBeVisible();
    await expect(
      page.getByText('Checking policy configuration...')
    ).toHaveCount(0);
    await expect(page.getByText(warning, { exact: true })).toHaveCount(0);
    expect(requests.validations()).toBe(0);
    expect(requests.puts()).toBe(0);
  });
});

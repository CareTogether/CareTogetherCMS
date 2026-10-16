import { type Page } from '@playwright/test';
import { expect, test } from './support/fixtures';
import { SELF_SERVICE_POLICY_FEATURE_FLAG } from '../src/featureFlags';
import { build } from 'rolldown';
import { fileURLToPath } from 'node:url';
import { readFileSync } from 'node:fs';
import { EffectiveLocationPolicy } from '../src/GeneratedClient';

let bundle: string;
const warning =
  "Function Policy 'Host Family or Friend' references unknown volunteer role 'Parent Ally'.";
const blockingError =
  "Case Policies Intake Requirements references unknown action 'Missing Action'.";

test.use({
  storageState: { cookies: [], origins: [] },
  video: 'off',
  featureFlags: { [SELF_SERVICE_POLICY_FEATURE_FLAG]: true },
});

test.beforeAll(async () => {
  const mocks: Record<string, string> = {
    ConfigurationModel: `export function useOrganizationConfiguration() { return { locations: [{id:'a',name:'Location A'}, {id:'b',name:'Location B'}], roles: [] }; }`,
    SessionModel: `export function useGlobalPermissions() { return () => true; }`,
    Data: `export function useRequiredSelectedLocationContext() { return { organizationId: 'org', locationId: 'a' }; }
      export function useSelectedLocationContext() { return useRequiredSelectedLocationContext(); }
      const families = []; export function useVisibleFamilies() { return families; }`,
    AuthenticatedHttp: `export const authenticatingFetch = { fetch: (...args) => window.fetch(...args) };`,
    ShellScreenTitle: `export function useScreenTitle() {}`,
    useAppNavigate: `export function useAppNavigate() { return { dashboard() {} }; }`,
    BasicConfiguration: `export default function BasicConfiguration() { return 'Basic configuration'; }`,
    AccessLevels: `export default function AccessLevels() { return null; }`,
    'posthog-js/react': `export function useFeatureFlagEnabled(flag) { return window.__CARETOGETHER_E2E_FEATURE_FLAGS__?.[flag] ?? true; }
      const posthog = { featureFlags: { hasLoadedFlags: true } }; export function usePostHog() { return posthog; }`,
  };
  for (const name of [
    'ActionDefinitionsTab',
    'CustomFamilyFieldsTab',
    'V1ReferralPolicyTab',
    'VolunteerPolicyTab',
    'OrganizationPolicyTab',
  ])
    mocks[name] = `export function ${name}() { return null; }`;

  const result = await build({
    input: fileURLToPath(
      new URL('./policy-validation-harness.tsx', import.meta.url)
    ),
    platform: 'browser',
    tsconfig: false,
    transform: {
      jsx: { runtime: 'automatic' },
      define: {
        'process.env.NODE_ENV': JSON.stringify('development'),
        'import.meta.hot': 'undefined',
        'import.meta.env': JSON.stringify({ VITE_APP_API_HOST: '' }),
      },
    },
    plugins: [
      {
        name: 'policy-test-boundaries',
        resolveId(source) {
          if (source.includes('.local'))
            throw new Error('Excluded local configuration');
          const name =
            source === 'posthog-js/react' ? source : source.split('/').at(-1);
          return name && name in mocks ? `virtual:${name}` : null;
        },
        load(id) {
          return id.startsWith('virtual:') ? mocks[id.slice(8)] : null;
        },
      },
    ],
    output: { format: 'iife' },
    write: false,
  });
  const output = result.output.find((item) => item.type === 'chunk');
  if (!output || output.type !== 'chunk')
    throw new Error('Missing browser bundle');
  bundle = output.code;
});

function policy() {
  return {
    actionDefinitions: {},
    customFamilyFields: [],
    volunteerPolicy: {
      volunteerRoles: {
        'Family Friend': {
          volunteerRoleType: 'Family Friend',
          policyVersions: [],
        },
      },
      volunteerFamilyRoles: {},
    },
    referralPolicy: {
      functionPolicies: [],
      functionAssignmentPolicies: [],
      customFields: [],
      arrangementPolicies: [
        {
          arrangementType: 'Hosting',
          arrangementFunctions: [],
          requiredSetupActions: [],
          requiredMonitoringActionsNew: [],
          requiredCloseoutActions: [],
        },
      ],
    },
  };
}

async function mount(page: Page, tab = 'basic') {
  await page.route('**/settings/locations/*', (route) =>
    route.fulfill({
      contentType: 'text/html',
      body: '<html><body><div id="root"></div></body></html>',
    })
  );
  await page.goto(`/org/org/a/settings/locations/a?tab=${tab}`);
  await page.addScriptTag({ content: bundle });
}

async function backend(page: Page, saveFails = false, keepWarnings = false) {
  let stored = policy();
  let puts = 0;
  let validations = 0;
  await page.route('**/Configuration/policy', async (route) => {
    if (route.request().method() === 'PUT') {
      puts++;
      if (saveFails) {
        await route.fulfill({ status: 400, json: { errors: [blockingError] } });
        return;
      }
      stored = route.request().postDataJSON();
    }
    await route.fulfill({ json: stored });
  });
  await page.route('**/Configuration/policy/validation', async (route) => {
    validations++;
    await route.fulfill({
      json: {
        errors: [],
        warnings: puts && !saveFails && !keepWarnings ? [] : [warning],
      },
    });
  });
  return { puts: () => puts, validations: () => validations };
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

test('initial Basic Settings shows warnings once and never saves', async ({
  page,
}) => {
  const requests = await backend(page);
  await mount(page);
  await expect(
    page.getByText('Basic configuration', { exact: true })
  ).toBeVisible();
  await expect(page.getByRole('alert')).toContainText(warning);
  await expect(page.getByText(warning, { exact: true })).toHaveCount(1);
  expect(
    await page
      .getByText(warning, { exact: true })
      .evaluate((element) => element.closest('.ph-unmask') === null)
  ).toBe(true);
  expect(requests.puts()).toBe(0);
  expect(requests.validations()).toBe(1);
});

test('initial semantic errors and warnings are separate alerts', async ({
  page,
}) => {
  await backend(page);
  await page.route('**/Configuration/policy/validation', (route) =>
    route.fulfill({ json: { errors: [blockingError], warnings: [warning] } })
  );
  await mount(page);
  await expect(
    page.getByRole('alert').filter({ hasText: blockingError })
  ).toHaveCount(1);
  await expect(
    page.getByRole('alert').filter({ hasText: warning })
  ).toHaveCount(1);
  await expect(page.getByRole('alert')).toHaveCount(2);
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

test('failed function assignment save keeps the drawer open with its values', async ({
  page,
}) => {
  const requests = await backend(page, true);
  await mount(page, 'casePolicy');
  await expect(page.getByText(warning, { exact: true })).toBeVisible();
  await addCaseFunctionAssignment(page);
  await page.getByRole('button', { name: 'Save', exact: true }).click();
  await expect(page.getByTestId('policy-save-errors')).toContainText(
    blockingError
  );
  await expect(
    page.getByText(
      'The changes could not be saved. Review the policy errors and try again.'
    )
  ).toBeVisible();
  await expect(
    page.getByRole('textbox', { name: 'Function', exact: true })
  ).toHaveValue('Case Coordinator');
  await expect(
    page.getByRole('button', { name: 'Save', exact: true })
  ).toBeEnabled();
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
  let release!: () => void;
  const delayed = new Promise<void>((resolve) => {
    release = resolve;
  });
  let started = false;
  await page.route('**/Configuration/policy/validation', async (route) => {
    const isA = route.request().url().includes('/a/Configuration');
    if (isA) {
      started = true;
      await delayed;
    }
    await route.fulfill({
      json: { errors: [], warnings: [isA ? warning : 'Location B warning'] },
    });
  });
  await mount(page);
  await expect.poll(() => started).toBe(true);
  await page.getByRole('link', { name: 'Location B', exact: true }).click();
  await expect(
    page.getByText('Location B warning', { exact: true })
  ).toBeVisible();
  const oldResponse = page.waitForResponse((response) =>
    response.url().includes('/a/Configuration/policy/validation')
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
  await page.route('**/Configuration/policy/validation', (route) =>
    route.fulfill({ status: 503, body: 'Unavailable' })
  );
  await mount(page);
  await expect(page.getByRole('alert')).toContainText(
    'Policy validation could not be loaded'
  );
  await expect(page.getByText(warning, { exact: true })).toHaveCount(0);
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
  await page.route('**/Configuration/policy', async (route) => {
    if (route.request().method() !== 'PUT') {
      await route.fallback();
      return;
    }
    puts++;
    await pending;
    await route.fulfill({ status: 400, json: { errors: [blockingError] } });
  });
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
  let validations = 0;
  await page.route('**/Configuration/policy/validation', async (route) => {
    const initial = ++validations === 1;
    if (initial) await pending;
    await route.fulfill({
      json: { errors: [], warnings: initial ? [warning] : [] },
    });
  });
  await mount(page, 'casePolicy');
  await expect(page.getByRole('status')).toHaveText(
    'Checking policy configuration...'
  );
  await addFunction(page);
  await page.getByRole('button', { name: 'Save', exact: true }).click();
  await expect.poll(() => validations).toBe(2);
  await expect(page.getByRole('status')).toHaveCount(0);
  const response = page.waitForResponse((result) =>
    result.url().endsWith('/policy/validation')
  );
  release();
  await response;
  await expect(page.getByText(warning, { exact: true })).toHaveCount(0);
});

test.describe('policy self-service disabled', () => {
  test.use({ featureFlags: { [SELF_SERVICE_POLICY_FEATURE_FLAG]: false } });
  test('does not validate or save while the feature is disabled', async ({
    page,
  }) => {
    const requests = await backend(page);
    await mount(page);
    await expect(
      page.getByText('Basic configuration', { exact: true })
    ).toBeVisible();
    await expect(page.getByRole('status')).toHaveCount(0);
    await expect(page.getByRole('alert')).toHaveCount(0);
    expect(requests.validations()).toBe(0);
    expect(requests.puts()).toBe(0);
  });
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
  let stored = EffectiveLocationPolicy.fromJS(fixture);
  const originalReferences = stored.referralPolicy.functionPolicies.map(
    (functionPolicy) => ({
      name: functionPolicy.functionName,
      roles: functionPolicy.eligibility.eligibleIndividualVolunteerRoles,
    })
  );
  const diagnostics = (policy: EffectiveLocationPolicy) => {
    const roles = Object.keys(policy.volunteerPolicy.volunteerRoles);
    return policy.referralPolicy.functionPolicies.flatMap((functionPolicy) =>
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
  const expected = diagnostics(stored);
  expect(expected).toHaveLength(15);
  let puts = 0;
  let validations = 0;

  // Reject any unmocked API traffic; this workflow never reaches real storage.
  await page.route('**/api/**', (route) => route.abort());
  await page.route('**/Configuration/policy', async (route) => {
    if (route.request().method() === 'PUT') {
      stored = EffectiveLocationPolicy.fromJS(route.request().postDataJSON());
      puts++;
    }
    await route.fulfill({ json: stored.toJSON() });
  });
  await page.route('**/Configuration/policy/validation', async (route) => {
    validations++;
    const candidate = EffectiveLocationPolicy.fromJS(
      route.request().postDataJSON()
    );
    await route.fulfill({
      json: { errors: [], warnings: diagnostics(candidate) },
    });
  });

  await mount(page);
  for (const message of expected)
    await expect(page.getByText(message, { exact: true })).toHaveCount(1);
  expect(puts).toBe(0);
  await page.getByText('Case Policies', { exact: true }).click();
  await addFunction(page, 'Overnight Hosting', 'Community Friend');
  await page.getByRole('button', { name: 'Save', exact: true }).click();
  await expect(
    page.getByRole('textbox', { name: 'Function', exact: true })
  ).not.toBeVisible();
  await expect(page.getByText(/^New Function -/)).toBeVisible();
  await expect.poll(() => validations).toBe(2);
  for (const message of expected)
    await expect(page.getByText(message, { exact: true })).toHaveCount(1);
  expect(puts).toBe(1);
  expect(
    stored.referralPolicy.functionPolicies.map((functionPolicy) => ({
      name: functionPolicy.functionName,
      roles: functionPolicy.eligibility.eligibleIndividualVolunteerRoles,
    }))
  ).toEqual(originalReferences);

  await page.reload();
  await page.addScriptTag({ content: bundle });
  await expect.poll(() => validations).toBe(3);
  for (const message of expected)
    await expect(page.getByText(message, { exact: true })).toHaveCount(1);
  await page.getByText('Arrangements', { exact: true }).click();
  await page.getByText('Overnight Hosting', { exact: true }).click();
  await page.getByText('Arrangement Functions', { exact: true }).click();
  await expect(page.getByText(/^New Function -/)).toBeVisible();
  expect(puts).toBe(1);
});

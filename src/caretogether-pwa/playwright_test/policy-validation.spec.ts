import {
  settingsSections,
  settingsSectionPath,
} from '../src/Settings/settingsSections';
import { type Page } from '@playwright/test';
import { expect, test } from './support/fixtures';
import {
  SELF_SERVICE_POLICY_FEATURE_FLAG,
  ORGANIZATION_CATEGORIES_FEATURE_FLAG,
} from '../src/featureFlags';
import { build } from 'rolldown';
import { fileURLToPath } from 'node:url';
import { readFileSync } from 'node:fs';
import {
  EffectiveLocationPolicy,
  DocumentLinkRequirement,
  NoteEntryRequirement,
} from '../src/GeneratedClient';

let bundle: string;
const warning =
  "Function Policy 'Host Family or Friend' references unknown volunteer role 'Parent Ally'.";
const blockingError =
  "Case Policies Intake Requirements references unknown action 'Missing Action'.";

test.use({
  storageState: { cookies: [], origins: [] },
  video: 'off',
  featureFlags: {
    [SELF_SERVICE_POLICY_FEATURE_FLAG]: true,
  },
});

test.beforeAll(async () => {
  const mocks: Record<string, string> = {
    ConfigurationModel: `import { atom } from 'jotai'; export const organizationConfigurationEdited = atom(null); export function useOrganizationConfiguration() { return { locations: [{id:'a',name:'Location A'}, {id:'b',name:'Location B'}], roles: window.__QA_ROLES__ ?? [] }; } export const useOrganizationConfigurationLoadable = useOrganizationConfiguration;`,
    SessionModel: `export function useGlobalPermissions() { return () => window.__QA_ALLOWED__ !== false; } export function useUserIsOrganizationAdministrator() { return window.__QA_ADMIN__ === true; } export const useGlobalPermissionsLoadable = useGlobalPermissions; export const useUserIsOrganizationAdministratorLoadable = useUserIsOrganizationAdministrator;`,
    Data: `import { useParams, useLocation } from 'react-router-dom'; export function useRequiredSelectedLocationContext() { const params = useParams(); const parts = useLocation().pathname.split('/'); return { organizationId: params.organizationId ?? parts[2] ?? 'org', locationId: params.locationId ?? parts[3] ?? 'a' }; }
      export function useSelectedLocationContext() { return useRequiredSelectedLocationContext(); }
      const families = []; export function useVisibleFamilies() { return window.__QA_VISIBLE_FAMILIES__ ?? families; }`,
    AuthenticatedHttp: `export const authenticatingFetch = { fetch: (...args) => window.fetch(...args) };`,
    ShellScreenTitle: `export function useScreenTitle() {}`,
    'posthog-js/react': `export function useFeatureFlagEnabled(flag) { return window.__CARETOGETHER_E2E_FEATURE_FLAGS__?.[flag] ?? true; }
      const posthog = { featureFlags: { hasLoadedFlags: true } }; export function usePostHog() { return posthog; }`,
  };
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
    output: { format: 'iife', name: 'PolicySettingsHarness' },
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

async function mount(
  page: Page,
  tab = 'basic',
  initialUrl?: string,
  matrix = false
) {
  await page.route('**/settings**', (route) =>
    route.fulfill({
      contentType: 'text/html',
      body: '<html><body><div id="root"></div></body></html>',
    })
  );
  await page.goto(
    initialUrl ??
      settingsSectionPath(
        'org',
        'a',
        tab === 'basic'
          ? 'actionDefinitions'
          : (tab as (typeof settingsSections)[number]['id'])
      )
  );
  await page.addScriptTag({ content: bundle });
  if (tab === 'casePolicy' && !matrix) {
    const action = page.getByRole('button', {
      name: 'Manage Arrangements & Functions',
      exact: true,
    });
    await expect(
      action
        .or(
          page
            .getByRole('alert')
            .filter({ hasText: 'This location is restricted or unavailable.' })
        )
        .or(page.getByRole('heading', { name: 'Settings', level: 1 }))
    ).toBeVisible();
    if (await action.isVisible()) await openCaseAdministration(page);
  }
}
async function backend(
  page: Page,
  saveFails = false,
  keepWarnings = false,
  initialPolicy = policy()
) {
  await page.route('**/api/**', (route) => route.abort());
  let stored = initialPolicy;
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

async function policyDecision(page: Page, leave: boolean) {
  const dialog = page.getByRole('dialog', {
    name: 'Unsaved changes',
    exact: true,
  });
  await expect(dialog).toBeVisible();
  await dialog
    .getByRole('button', {
      name: leave ? 'Discard & Leave' : 'Keep Editing',
      exact: true,
    })
    .click();
  await expect(dialog).toBeHidden();
}

async function keepDuringSave(page: Page) {
  const dialog = page.getByRole('dialog', {
    name: 'Save in progress',
    exact: true,
  });
  await expect(dialog).toBeVisible();
  await expect(
    dialog.getByRole('button', { name: 'Discard & Leave', exact: true })
  ).toHaveCount(0);
  await dialog
    .getByRole('button', { name: 'Keep Editing', exact: true })
    .click();
  await expect(dialog).toBeHidden();
}

async function cancelPolicyForm(page: Page) {
  await page.getByRole('button', { name: 'Cancel', exact: true }).click();
  const dialog = page.getByRole('dialog', {
    name: 'Unsaved changes',
    exact: true,
  });
  if (await dialog.isVisible()) await policyDecision(page, true);
}
async function openCaseAdministration(page: Page) {
  const action = page.getByRole('button', {
    name: 'Manage Arrangements & Functions',
    exact: true,
  });
  const drawer = page.getByRole('dialog', {
    name: 'Manage Arrangements & Functions',
    exact: true,
  });
  await expect(action.or(drawer)).toBeVisible();
  if (await action.isVisible()) await action.click();
  await expect(drawer).toBeVisible();
}
async function addFunction(
  page: Page,
  arrangement = 'Hosting',
  role = 'Family Friend'
) {
  await openCaseAdministration(page);
  const management = page.getByRole('dialog', {
    name: 'Manage Arrangements & Functions',
    exact: true,
  });
  await management.getByText('Arrangements', { exact: true }).click();
  await management.getByText(arrangement, { exact: true }).click();
  await management.getByText('Arrangement Functions', { exact: true }).click();
  const section = management
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

function requirementPolicy() {
  const initial = policy();
  Object.assign(initial.actionDefinitions, {
    Form: { documentLink: 0, noteEntry: 0 },
    'New activity': { documentLink: 0, noteEntry: 0 },
  });
  Object.assign(initial.referralPolicy.arrangementPolicies[0], {
    requiredSetupActions: [{ actionName: 'Form', isRequired: true }],
    requiredCloseoutActions: [{ actionName: 'Form', isRequired: true }],
    requiredMonitoringActionsNew: [
      {
        action: { actionName: 'Form', isRequired: true },
        recurrence: {
          discriminator: 'DurationStagesRecurrencePolicy',
          stages: [{ delay: '2.00:00:00', maxOccurrences: 3 }],
        },
      },
    ],
    policyVersions: [
      {
        version: 'Historical',
        requiredSetupActions: [{ actionName: 'Form', isRequired: true }],
      },
    ],
  });
  return initial;
}

function variantViewerPolicy() {
  const initial = requirementPolicy();
  Object.assign(initial.referralPolicy.arrangementPolicies[0], {
    arrangementFunctions: [
      {
        functionName: 'Provider function',
        requirement: 0,
        variants: [
          {
            variantName: 'First profile',
            requiredSetupActions: [
              { actionName: 'First setup', isRequired: true },
            ],
            requiredMonitoringActionsNew: [
              {
                action: { actionName: 'First monitoring', isRequired: false },
                recurrence: {
                  discriminator:
                    'DurationStagesPerChildLocationRecurrencePolicy',
                  stages: [
                    { delay: '2.00:00:00', maxOccurrences: 1 },
                    { delay: '7.00:00:00', maxOccurrences: null },
                  ],
                },
              },
            ],
            requiredCloseoutActions: [
              { actionName: 'First closeout', isRequired: true },
            ],
          },
          {
            variantName: 'Second profile',
            requiredSetupActions: [
              { actionName: 'Second setup', isRequired: true },
            ],
            requiredMonitoringActionsNew: [
              {
                action: { actionName: 'Second monitoring', isRequired: true },
                recurrence: {
                  discriminator: 'OneTimeRecurrencePolicy',
                  delay: '3.00:00:00',
                },
              },
            ],
            requiredCloseoutActions: [],
          },
          {
            variantName: 'Empty profile',
            requiredSetupActions: [],
            requiredMonitoringActionsNew: [],
            requiredCloseoutActions: [],
          },
        ],
      },
      {
        functionName: 'Coordinator function',
        requirement: 0,
        variants: [
          {
            variantName: 'Coordinator profile',
            requiredSetupActions: [
              { actionName: 'Coordinator setup', isRequired: true },
            ],
          },
        ],
      },
      { functionName: 'No variants function', requirement: 0, variants: [] },
    ],
  });
  return initial;
}

function editableVariantPolicy() {
  const value = variantViewerPolicy();
  const model = EffectiveLocationPolicy.fromJS(value);
  for (const arrangement of model.referralPolicy.arrangementPolicies)
    for (const fn of arrangement.arrangementFunctions)
      for (const variant of fn.variants) {
        for (const item of [
          ...(variant.requiredSetupActions ?? []),
          ...(variant.requiredCloseoutActions ?? []),
          ...(variant.requiredMonitoringActionsNew ?? []).map(
            (item) => item.action
          ),
        ])
          Object.assign(value.actionDefinitions, {
            [item.actionName]: { documentLink: 0, noteEntry: 0 },
          });
      }
  return value;
}

for (const section of settingsSections)
  test(
    'dedicated Settings route renders ' + section.label,
    async ({ page }) => {
      const requests = await backend(page);
      await mount(page, section.id, undefined, section.id === 'casePolicy');
      await expect(
        page
          .getByRole('navigation', { name: 'breadcrumb' })
          .getByText(section.label, { exact: true })
      ).toBeVisible();
      await expect(page.getByText(/^Location:/)).toHaveCount(0);
      await expect(
        page.getByRole('heading', { name: section.label, exact: true })
      ).toHaveCount(0);
      await expect(
        page.getByRole('region', { name: section.label, exact: true })
      ).toBeVisible();
      const content = {
        actionDefinitions: () =>
          page.getByRole('grid', { name: 'Action Definitions', exact: true }),
        customFamilyFields: () =>
          page.getByRole('button', { name: 'Add', exact: true }),
        casePolicy: () =>
          page.getByRole('grid', {
            name: 'Case Policies requirements matrix',
            exact: true,
          }),
        v1ReferralPolicy: () =>
          page.getByText('Intake Requirements', { exact: true }),
        volunteerPolicy: () =>
          page.getByText('Volunteer Roles', { exact: true }),
        organizationPolicy: () =>
          page.getByRole('heading', {
            name: 'Organization approval roles',
            exact: true,
          }),
        accessLevels: () =>
          page.getByText('No access levels yet for this location.', {
            exact: true,
          }),
      };
      await expect(content[section.id]()).toBeVisible();
      expect(requests.puts()).toBe(0);
    }
  );

test('Case Policies opens integrated administration without leaving the matrix', async ({
  page,
}) => {
  const requests = await backend(page);
  await mount(page, 'casePolicy', undefined, true);
  for (const name of ['Add Arrangement', 'Manage Arrangements & Functions']) {
    await expect(page.getByRole('button', { name, exact: true })).toHaveClass(
      /(?=.*MuiButton-contained)(?=.*MuiButton-colorPrimary)/
    );
  }
  await expect(
    page.getByRole('group', { name: 'Case Policies view' })
  ).toHaveCount(0);
  await expect(
    page.getByRole('button', { name: /^(Requirements matrix|Policy editor)$/i })
  ).toHaveCount(0);
  await expect(
    page.getByRole('heading', { name: /Requirements matrix/i })
  ).toHaveCount(0);
  await expect(
    page.getByRole('grid', {
      name: 'Case Policies requirements matrix',
      exact: true,
    })
  ).toBeVisible();
  await page
    .getByRole('button', {
      name: 'Manage Arrangements & Functions',
      exact: true,
    })
    .click();
  await expect(page).toHaveURL('/org/org/a/settings/case-policies');
  await expect(
    page.getByRole('dialog', {
      name: 'Manage Arrangements & Functions',
      exact: true,
    })
  ).toBeVisible();
  await expect(page.getByText('Arrangements', { exact: true })).toBeVisible();
  const management = page.getByRole('dialog', {
    name: 'Manage Arrangements & Functions',
    exact: true,
  });
  await expect(management.getByRole('grid')).toHaveCount(0);
  await expect(
    management.getByRole('button', { name: 'Save changes', exact: true })
  ).toHaveCount(0);
  await expect(
    management.getByText(/Required (Setup|Monitoring|Closeout) Actions/)
  ).toHaveCount(0);
  await expect(
    page.getByRole('button', { name: 'Back to Case Policies', exact: true })
  ).toHaveCount(0);
  await expect(
    page.getByRole('link', { name: 'Open administration page', exact: true })
  ).toHaveCount(0);
  await expect(
    page.getByRole('heading', { name: 'Case Policies', exact: true })
  ).toHaveCount(0);
  await page
    .getByRole('button', { name: 'Close administration', exact: true })
    .click();
  await expect(page).toHaveURL('/org/org/a/settings/case-policies');
  await expect(
    page.getByRole('grid', {
      name: 'Case Policies requirements matrix',
      exact: true,
    })
  ).toBeVisible();
  expect(requests.puts()).toBe(0);
});

test('administration retains arrangement forms, eligibility and case function controls', async ({
  page,
}) => {
  const requests = await backend(page);
  await mount(
    page,
    'casePolicy',
    '/org/org/a/settings/case-policies/administration'
  );
  await expect(page.getByText('Functions', { exact: true })).toBeVisible();
  await page.getByText('Arrangements', { exact: true }).click();
  const arrangements = page
    .locator('.MuiAccordion-root')
    .filter({ has: page.getByText('Arrangements', { exact: true }) })
    .first();
  await arrangements.getByRole('button', { name: 'Add', exact: true }).click();
  await expect(
    page.getByRole('textbox', { name: 'Arrangement Type', exact: true })
  ).toBeVisible();
  await expect(
    page.getByRole('combobox', { name: 'Child Involvement', exact: true })
  ).toBeVisible();
  await expect(page.getByLabel('Superseded', { exact: true })).toBeVisible();
  await cancelPolicyForm(page);
  await page.getByText('Arrangements', { exact: true }).click();
  await addFunction(page);
  await expect(
    page.getByRole('combobox', { name: 'Requirement', exact: true })
  ).toBeVisible();
  await expect(
    page.getByRole('combobox', {
      name: 'Eligible Individual Volunteer Roles',
      exact: true,
    })
  ).toBeVisible();
  await expect(
    page.getByRole('combobox', {
      name: 'Eligible Volunteer Family Roles',
      exact: true,
    })
  ).toBeVisible();
  await cancelPolicyForm(page);
  expect(requests.puts()).toBe(0);
});

test('arrangement metadata saves preserve historical versions and duplication keeps existing semantics', async ({
  page,
}) => {
  const initial = caseMatrixPolicy();
  const original = initial.referralPolicy.arrangementPolicies[0];
  original.policyVersions = [
    {
      ...original,
      version: 'historic',
      supersededAtUtc: '2024-01-01T00:00:00Z',
      policyVersions: undefined,
    },
  ];
  original.supersededAtUtc = '2025-01-01T00:00:00Z';
  const expected =
    EffectiveLocationPolicy.fromJS(initial).toJSON().referralPolicy
      .arrangementPolicies[0];
  const requests = await backend(page, false, false, initial);
  let payload: ReturnType<typeof caseMatrixPolicy> | undefined;
  page.on('request', (request) => {
    if (request.method() === 'PUT') payload = request.postDataJSON();
  });
  await mount(page, 'casePolicy');
  await page.getByText('Arrangements', { exact: true }).click();
  await page.getByRole('button', { name: 'Edit', exact: true }).click();
  await page
    .getByRole('textbox', { name: 'Arrangement Type', exact: true })
    .fill('Renamed Hosting');
  await page
    .getByRole('combobox', { name: 'Child Involvement', exact: true })
    .click();
  await page
    .getByRole('option', { name: 'No Child Involvement', exact: true })
    .click();
  await page.getByLabel('Superseded', { exact: true }).uncheck();
  await page.getByRole('button', { name: 'Save', exact: true }).click();
  await expect.poll(requests.puts).toBe(1);
  await expect(
    page.getByRole('textbox', { name: 'Arrangement Type', exact: true })
  ).toHaveCount(0);
  const saved =
    EffectiveLocationPolicy.fromJS(payload).toJSON().referralPolicy
      .arrangementPolicies[0];
  expect(saved.policyVersions).toEqual(expected.policyVersions);
  expect(saved.arrangementFunctions).toEqual(expected.arrangementFunctions);
  expect(saved.requiredMonitoringActionsNew).toEqual(
    expected.requiredMonitoringActionsNew
  );
  expect(saved.arrangementType).toBe('Renamed Hosting');
  expect(saved.childInvolvement).not.toBe(expected.childInvolvement);
  expect(saved.supersededAtUtc).toBeUndefined();
  await page
    .getByRole('button', { name: 'Duplicate Renamed Hosting', exact: true })
    .click();
  await page.getByRole('button', { name: 'Yes', exact: true }).click();
  await expect.poll(requests.puts).toBe(2);
  const copies =
    EffectiveLocationPolicy.fromJS(payload).toJSON().referralPolicy
      .arrangementPolicies;
  expect(copies).toHaveLength(2);
  expect(copies[1].policyVersions).toEqual(expected.policyVersions);
  expect(copies[0]).toEqual(saved);
  const arrangements = page
    .locator('.MuiAccordion-root')
    .filter({ has: page.getByText('Arrangements', { exact: true }) })
    .first();
  await arrangements
    .getByRole('button', { name: 'Add', exact: true })
    .first()
    .click();
  await page
    .getByRole('textbox', { name: 'Arrangement Type', exact: true })
    .fill('Brand new arrangement');
  await page.getByRole('button', { name: 'Save', exact: true }).click();
  await expect.poll(requests.puts).toBe(3);
  const created = payload!.referralPolicy.arrangementPolicies.find(
    (item: { arrangementType: string }) =>
      item.arrangementType === 'Brand new arrangement'
  );
  expect(created.policyVersions).toBeUndefined();
});

test('matrix administration requires Save or Cancel for active and staged edits', async ({
  page,
}) => {
  const requests = await backend(page, false, false, caseMatrixPolicy());
  await mount(page, 'casePolicy', undefined, true);
  const editor = await openMatrixCell(page);
  await page
    .getByRole('button', {
      name: 'Manage Arrangements & Functions',
      exact: true,
    })
    .click();
  await expect(editor).toBeVisible();
  await expect(page).toHaveURL('/org/org/a/settings/case-policies');
  await editor
    .getByRole('button', { name: 'Cancel cell', exact: true })
    .click();
  await applyApplicability(page, 'Optional');

  await page
    .getByRole('button', {
      name: 'Manage Arrangements & Functions',
      exact: true,
    })
    .click();
  await expect(
    page.getByRole('dialog', { name: 'Unsaved changes', exact: true })
  ).toHaveCount(0);
  await expect(matrixCell(page, 'Form')).toHaveClass(/policy-cell-unsaved/);

  await cancelPolicyForm(page);
  await page
    .getByRole('button', {
      name: 'Manage Arrangements & Functions',
      exact: true,
    })
    .click();
  await expect(page).toHaveURL('/org/org/a/settings/case-policies');
  await expect(
    page.getByRole('dialog', {
      name: 'Manage Arrangements & Functions',
      exact: true,
    })
  ).toBeVisible();
  expect(requests.puts()).toBe(0);
});

test('pending matrix saves block administration, browser back and location navigation without discard prompts', async ({
  page,
}) => {
  const initial = caseMatrixPolicy();
  await backend(page, false, false, initial);
  let release!: () => void;
  let writes = 0;
  let stored = initial;
  const pending = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route('**/Configuration/policy', async (route) => {
    if (route.request().method() === 'PUT') {
      writes++;
      expect(route.request().url()).toContain('/org/a/');
      await pending;
      stored = route.request().postDataJSON();
    }
    await route.fulfill({ json: stored });
  });
  await mount(page, 'casePolicy', undefined, true);
  await page.getByRole('link', { name: 'Location B', exact: true }).click();
  await page.getByRole('link', { name: 'Location A', exact: true }).click();
  await applyApplicability(page, 'Optional');
  await page.getByRole('button', { name: 'Save changes', exact: true }).click();
  await expect.poll(() => writes).toBe(1);
  await page
    .getByRole('button', {
      name: 'Manage Arrangements & Functions',
      exact: true,
    })
    .click();
  await keepDuringSave(page);
  await page.getByRole('link', { name: 'Location B', exact: true }).click();
  await keepDuringSave(page);
  await page.goBack();
  await keepDuringSave(page);
  await expect(page).toHaveURL('/org/org/a/settings/case-policies');
  release();
  await expect(
    page.getByRole('button', { name: 'Save changes', exact: true })
  ).toBeDisabled();
  await page
    .getByRole('button', {
      name: 'Manage Arrangements & Functions',
      exact: true,
    })
    .click();
  await expect(
    page.getByRole('dialog', {
      name: 'Manage Arrangements & Functions',
      exact: true,
    })
  ).toBeVisible();
  expect(writes).toBe(1);
});

test('integrated arrangement CRUD refreshes matrix columns and preserves search and history', async ({
  page,
}) => {
  const initial = requirementPolicy();
  const requests = await backend(page, false, false, initial);
  let stored: ReturnType<typeof caseMatrixPolicy> = initial;
  page.on('request', (request) => {
    if (request.method() === 'PUT') {
      expect(request.url()).toContain('/org/a/');
      stored = request.postDataJSON();
    }
  });
  await mount(page, 'casePolicy', undefined, true);
  await page.getByRole('button', { name: 'Search', exact: true }).click();
  await page.getByRole('searchbox').fill('Form');
  await page
    .getByRole('button', { name: 'Add Arrangement', exact: true })
    .click();
  await page
    .getByRole('textbox', { name: 'Arrangement Type', exact: true })
    .fill('New arrangement');
  await page.getByRole('button', { name: 'Save', exact: true }).click();
  await expect.poll(requests.puts).toBe(1);
  await expect(
    page.getByRole('textbox', { name: 'Arrangement Type', exact: true })
  ).toHaveCount(0);
  await expect(page.locator('.MuiDrawer-root')).toHaveCount(0);
  await expect(page.getByRole('searchbox')).toHaveValue('Form');
  const matrix = page.getByRole('grid', {
    name: 'Case Policies requirements matrix',
    exact: true,
  });
  await expect(
    matrix.getByText('New arrangement', { exact: true })
  ).toBeVisible();
  await page
    .getByRole('button', {
      name: 'Manage Arrangements & Functions',
      exact: true,
    })
    .click();
  await page.getByText('Arrangements', { exact: true }).click();
  await page.getByRole('button', { name: 'Edit', exact: true }).first().click();
  await page
    .getByRole('textbox', { name: 'Arrangement Type', exact: true })
    .fill('Renamed Hosting');
  await page.getByRole('button', { name: 'Save', exact: true }).click();
  await expect.poll(requests.puts).toBe(2);
  expect(stored.referralPolicy.arrangementPolicies[0].policyVersions).toEqual(
    EffectiveLocationPolicy.fromJS(initial).toJSON().referralPolicy
      .arrangementPolicies[0].policyVersions
  );
  await page
    .getByRole('button', { name: 'Duplicate Renamed Hosting', exact: true })
    .click();
  await page.getByRole('button', { name: 'Yes', exact: true }).click();
  await expect.poll(requests.puts).toBe(3);
  await page
    .getByRole('button', { name: 'Delete Renamed Hosting Copy', exact: true })
    .click();
  const refreshed = page.waitForResponse(
    (response) =>
      response.request().method() === 'GET' &&
      response.url().endsWith('/Configuration/policy')
  );
  const deleted = page.waitForResponse(
    (response) =>
      response.request().method() === 'PUT' &&
      response.url().endsWith('/Configuration/policy')
  );
  await page.getByRole('button', { name: 'Yes', exact: true }).click();
  await deleted;
  await refreshed;
  await expect.poll(requests.puts).toBe(4);
  await expect(
    page.getByRole('button', {
      name: 'Delete Renamed Hosting Copy',
      exact: true,
    })
  ).toHaveCount(0);
  await page
    .getByRole('button', { name: 'Close administration', exact: true })
    .click();
  await expect(
    matrix.getByText('Renamed Hosting', { exact: true })
  ).toBeVisible();
  await expect(matrix.getByText('Hosting', { exact: true })).toHaveCount(0);
  await expect(
    matrix.getByText('Renamed Hosting Copy', { exact: true })
  ).toHaveCount(0);
  await expect(page.getByRole('searchbox')).toHaveValue('Form');
  expect(stored.referralPolicy.arrangementPolicies).toHaveLength(2);
});

test('integrated function and case assignment CRUD reuse eligibility forms and preserve siblings', async ({
  page,
}) => {
  await page.addInitScript(() => {
    Reflect.set(window, '__QA_ROLES__', [{ roleName: 'QA Coordinator' }]);
    Reflect.set(window, '__QA_VISIBLE_FAMILIES__', [
      {
        family: {
          adults: [
            {
              item1: {
                id: '22222222-2222-4222-8222-222222222222',
                firstName: 'QA',
                lastName: 'Person',
              },
            },
          ],
          children: [],
        },
      },
    ]);
  });
  const initial = policy();
  Object.assign(initial.volunteerPolicy.volunteerFamilyRoles, {
    Household: { volunteerFamilyRoleType: 'Household', policyVersions: [] },
  });
  const requests = await backend(page, false, false, initial);
  let stored: ReturnType<typeof caseMatrixPolicy> = initial;
  page.on('request', (request) => {
    if (request.method() === 'PUT') stored = request.postDataJSON();
  });
  await mount(page, 'casePolicy', undefined, true);
  await page
    .getByRole('button', {
      name: 'Manage Arrangements & Functions',
      exact: true,
    })
    .click();
  const management = page.getByRole('dialog', {
    name: 'Manage Arrangements & Functions',
    exact: true,
  });
  await management.getByText('Arrangements', { exact: true }).click();
  await management.getByText('Hosting', { exact: true }).click();
  await management.getByText('Arrangement Functions', { exact: true }).click();
  const functions = management
    .locator('.MuiAccordion-root')
    .filter({ has: page.getByText('Arrangement Functions', { exact: true }) })
    .last();
  await functions.getByRole('button', { name: 'Add', exact: true }).click();
  await page
    .getByRole('textbox', { name: 'Function', exact: true })
    .fill('Local function');
  await page
    .getByRole('combobox', {
      name: 'Eligible Individual Volunteer Roles',
      exact: true,
    })
    .click();
  await page
    .getByRole('option', { name: 'Family Friend', exact: true })
    .click();
  await page.getByRole('textbox', { name: 'Function', exact: true }).click();
  await expect(
    page.getByRole('combobox', {
      name: 'Eligible Volunteer Family Roles',
      exact: true,
    })
  ).toBeVisible();
  await page
    .getByRole('combobox', {
      name: 'Eligible Volunteer Family Roles',
      exact: true,
    })
    .click();
  await page.getByRole('option', { name: 'Household', exact: true }).click();
  await page.getByRole('textbox', { name: 'Function', exact: true }).click();
  await expect(
    page.getByRole('combobox', { name: 'Eligible People', exact: true })
  ).toBeVisible();
  await page
    .getByRole('combobox', { name: 'Eligible People', exact: true })
    .click();
  await page.getByRole('option', { name: 'QA Person', exact: true }).click();
  await page.getByRole('textbox', { name: 'Function', exact: true }).click();
  await page.getByRole('button', { name: 'Save', exact: true }).click();
  await expect.poll(requests.puts).toBe(1);
  expect(
    stored.referralPolicy.arrangementPolicies[0].arrangementFunctions[0]
      .eligibleIndividualVolunteerRoles
  ).toEqual(['Family Friend']);
  expect(
    stored.referralPolicy.arrangementPolicies[0].arrangementFunctions[0]
      .eligibleVolunteerFamilyRoles
  ).toEqual(['Household']);
  expect(
    stored.referralPolicy.arrangementPolicies[0].arrangementFunctions[0]
      .eligiblePeople
  ).toEqual(['22222222-2222-4222-8222-222222222222']);
  await functions
    .getByText('Local function - Zero Or More', { exact: true })
    .click();
  await page
    .getByRole('textbox', { name: 'Function', exact: true })
    .fill('Edited function');
  await page.getByRole('button', { name: 'Save', exact: true }).click();
  await expect.poll(requests.puts).toBe(2);
  await page
    .getByRole('button', { name: 'Duplicate Edited function', exact: true })
    .click();
  await page.getByRole('button', { name: 'Yes', exact: true }).click();
  await expect.poll(requests.puts).toBe(3);
  await page
    .getByRole('button', { name: 'Delete Edited function Copy', exact: true })
    .click();
  const functionRefresh = page.waitForResponse(
    (response) =>
      response.request().method() === 'GET' &&
      response.url().endsWith('/Configuration/policy')
  );
  await page.getByRole('button', { name: 'Yes', exact: true }).click();
  await expect.poll(requests.puts).toBe(4);
  await functionRefresh;
  await expect(
    page.getByRole('button', {
      name: 'Delete Edited function Copy',
      exact: true,
    })
  ).toHaveCount(0);
  const assignments = management
    .locator('.MuiAccordion-root')
    .filter({ has: page.getByText('Functions', { exact: true }) })
    .first();
  await assignments.getByRole('button', { name: 'Add', exact: true }).click();
  await page
    .getByRole('textbox', { name: 'Function', exact: true })
    .fill('Case coordinator');
  await page
    .getByRole('combobox', { name: 'Eligible Location Roles', exact: true })
    .click();
  await page
    .getByRole('option', { name: 'QA Coordinator', exact: true })
    .click();
  await page.getByRole('textbox', { name: 'Function', exact: true }).click();
  await page
    .getByRole('combobox', { name: 'Eligible People', exact: true })
    .click();
  await page.getByRole('option', { name: 'QA Person', exact: true }).click();
  await page.getByRole('textbox', { name: 'Function', exact: true }).click();
  await page
    .getByRole('combobox', {
      name: 'Eligible Individual Volunteer Roles',
      exact: true,
    })
    .click();
  await page
    .getByRole('option', { name: 'Family Friend', exact: true })
    .click();
  await page.getByRole('textbox', { name: 'Function', exact: true }).click();
  await page.getByRole('button', { name: 'Save', exact: true }).click();
  await expect.poll(requests.puts).toBe(5);
  expect(
    stored.referralPolicy.functionAssignmentPolicies[0].eligibility
      .eligibleLocationRoles
  ).toEqual(['QA Coordinator']);
  expect(
    stored.referralPolicy.functionAssignmentPolicies[0].eligibility
      .eligiblePeople
  ).toEqual(['22222222-2222-4222-8222-222222222222']);
  await assignments.getByText('Case coordinator', { exact: true }).click();
  await page
    .getByRole('textbox', { name: 'Function', exact: true })
    .fill('Edited coordinator');
  await page.getByRole('button', { name: 'Save', exact: true }).click();
  await expect.poll(requests.puts).toBe(6);
  await page
    .getByRole('button', { name: 'Duplicate Edited coordinator', exact: true })
    .click();
  await page.getByRole('button', { name: 'Yes', exact: true }).click();
  await expect.poll(requests.puts).toBe(7);
  await page
    .getByRole('button', {
      name: 'Delete Edited coordinator Copy',
      exact: true,
    })
    .click();
  await page.getByRole('button', { name: 'Yes', exact: true }).click();
  await expect.poll(requests.puts).toBe(8);
  expect(stored.referralPolicy.functionAssignmentPolicies).toHaveLength(1);
  expect(
    stored.referralPolicy.arrangementPolicies[0].arrangementFunctions
  ).toHaveLength(1);
  await page
    .getByRole('button', { name: 'Close administration', exact: true })
    .click();
  await expect(page).toHaveURL('/org/org/a/settings/case-policies');
});

test('function metadata preserves inherited and explicitly empty eligibility', async ({
  page,
}) => {
  const initial = policy();
  Object.assign(initial.referralPolicy, {
    functionPolicies: [
      {
        functionName: 'Inherited',
        eligibility: {
          eligibleIndividualVolunteerRoles: ['Family Friend'],
          eligibleVolunteerFamilyRoles: [],
          eligiblePeople: [],
        },
      },
    ],
  });
  const empty = {
    eligibleIndividualVolunteerRoles: [],
    eligibleVolunteerFamilyRoles: [],
    eligiblePeople: [],
  };
  Object.assign(initial.referralPolicy.arrangementPolicies[0], {
    arrangementFunctions: [
      { functionName: 'Inherited', requirement: 0, variants: [] },
      {
        functionName: 'Explicit empty',
        requirement: 0,
        variants: [],
        ...empty,
      },
    ],
  });
  const requests = await backend(page, false, false, initial);
  let stored: ReturnType<typeof caseMatrixPolicy> = initial;
  page.on('request', (request) => {
    if (request.method() === 'PUT') stored = request.postDataJSON();
  });
  await mount(page, 'casePolicy');
  const management = page.getByRole('dialog', {
    name: 'Manage Arrangements & Functions',
    exact: true,
  });
  await management.getByText('Arrangements', { exact: true }).click();
  await management.getByText('Hosting', { exact: true }).click();
  await management.getByText('Arrangement Functions', { exact: true }).click();
  for (const [index, name] of ['Inherited', 'Explicit empty'].entries()) {
    await management
      .getByText(name + ' - Zero Or More', { exact: true })
      .click();
    await page
      .getByRole('combobox', { name: 'Requirement', exact: true })
      .click();
    await page
      .getByRole('option', { name: 'Exactly One', exact: true })
      .click();
    await page.getByRole('button', { name: 'Save', exact: true }).click();
    await expect.poll(requests.puts).toBe(index + 1);
    await expect(
      page.getByRole('textbox', { name: 'Function', exact: true })
    ).toHaveCount(0);
  }
  const functions =
    EffectiveLocationPolicy.fromJS(stored).toJSON().referralPolicy
      .arrangementPolicies[0].arrangementFunctions;
  for (const field of Object.keys(empty)) {
    expect(functions[0][field]).toBeUndefined();
    expect(functions[1][field]).toEqual([]);
  }
  expect(
    functions.map((item: { requirement: number }) => item.requirement)
  ).toEqual([1, 1]);
});

test('integrated creation failures retain the form until confirmed discard', async ({
  page,
}) => {
  const requests = await backend(page, true, false, requirementPolicy());
  await mount(page, 'casePolicy', undefined, true);
  await page
    .getByRole('button', { name: 'Add Arrangement', exact: true })
    .click();
  await page
    .getByRole('textbox', { name: 'Arrangement Type', exact: true })
    .fill('Retained arrangement');
  await page.getByRole('button', { name: 'Save', exact: true }).click();
  await expect.poll(requests.puts).toBe(1);
  await expect(
    page.getByRole('textbox', { name: 'Arrangement Type', exact: true })
  ).toHaveValue('Retained arrangement');
  await expect(page.getByText(/The changes could not be saved/)).toBeVisible();
  await cancelPolicyForm(page);
  await expect(page.locator('.MuiDrawer-root')).toHaveCount(0);
  await expect(matrixCell(page, 'Form')).not.toHaveClass(/policy-cell-unsaved/);
  expect(requests.puts()).toBe(1);
});
test('management close control blocks closing during an administration save', async ({
  page,
}) => {
  const initial = policy();
  await backend(page, false, false, initial);
  let stored = initial;
  let writes = 0;
  let release!: () => void;
  const pending = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route('**/Configuration/policy', async (route) => {
    if (route.request().method() === 'PUT') {
      writes++;
      await pending;
      stored = route.request().postDataJSON();
    }
    await route.fulfill({ json: stored });
  });
  await mount(page, 'casePolicy', undefined, true);
  await page
    .getByRole('button', {
      name: 'Manage Arrangements & Functions',
      exact: true,
    })
    .click();
  await page.getByText('Arrangements', { exact: true }).click();
  await page
    .getByRole('button', { name: 'Duplicate Hosting', exact: true })
    .click();
  await page.getByRole('button', { name: 'Yes', exact: true }).click();
  await expect.poll(() => writes).toBe(1);
  const close = page.getByRole('button', {
    name: 'Close administration',
    exact: true,
  });
  await close.click();
  await keepDuringSave(page);
  await expect(close).toBeVisible();
  const refreshed = page.waitForResponse(
    (response) =>
      response.request().method() === 'GET' &&
      response.url().endsWith('/Configuration/policy')
  );
  release();
  await refreshed;
  await close.click();
  await expect(page.locator('.MuiDrawer-root')).toHaveCount(0);
  await expect(
    page.getByRole('grid', {
      name: 'Case Policies requirements matrix',
      exact: true,
    })
  ).toBeVisible();
  expect(writes).toBe(1);
});

test('administration drawer edits are protected by browser back and retained when navigation is canceled', async ({
  page,
}) => {
  const requests = await backend(page);
  await mount(page, 'casePolicy', undefined, true);
  await page.getByRole('link', { name: 'Location B', exact: true }).click();
  await page.getByRole('link', { name: 'Location A', exact: true }).click();
  await openCaseAdministration(page);
  await addFunction(page);
  const decision0 = policyDecision(page, false);
  await page.goBack();
  await decision0;
  await expect(page).toHaveURL('/org/org/a/settings/case-policies');
  await expect(
    page.getByRole('textbox', { name: 'Function', exact: true })
  ).toHaveValue('New Function');
  await cancelPolicyForm(page);
  await page
    .getByRole('button', { name: 'Close administration', exact: true })
    .click();
  await expect(page).toHaveURL('/org/org/a/settings/case-policies');
  expect(requests.puts()).toBe(0);
});

test('legacy administration links replace history, preserve scope and open only the matrix', async ({
  page,
}) => {
  const requests = await backend(page);
  await mount(
    page,
    'casePolicy',
    '/org/tenant/b/settings/location-settings',
    true
  );
  const historyLength = await page.evaluate(() => window.history.length);
  await page.goto('/org/tenant/b/settings/case-policies/administration');
  await page.addScriptTag({ content: bundle });
  await expect(page).toHaveURL('/org/tenant/b/settings/case-policies');
  await expect(
    page.getByRole('grid', {
      name: 'Case Policies requirements matrix',
      exact: true,
    })
  ).toBeVisible();
  await expect(
    page.getByRole('navigation', { name: 'breadcrumb' })
  ).toContainText('Location Settings');
  await expect(
    page.getByRole('link', { name: 'Open administration page', exact: true })
  ).toHaveCount(0);
  await expect(page.locator('.MuiDrawer-root')).toHaveCount(0);
  expect(await page.evaluate(() => window.history.length)).toBe(
    historyLength + 1
  );
  await page.goBack();
  await expect(page).toHaveURL('/org/tenant/b/settings/location-settings');
  await page.goForward();
  await expect(page).toHaveURL('/org/tenant/b/settings/case-policies');
  expect(requests.puts()).toBe(0);
});

test('unsaved function drawers guard location switches and preserve selected scope', async ({
  page,
}) => {
  const requests = await backend(page);
  await mount(page, 'casePolicy', undefined, true);
  await addFunction(page);
  const decision1 = policyDecision(page, false);
  await page
    .getByRole('link', { name: 'Location B', exact: true, includeHidden: true })
    .dispatchEvent('click');
  await decision1;
  await expect(page).toHaveURL('/org/org/a/settings/case-policies');
  await expect(
    page.getByRole('textbox', { name: 'Function', exact: true })
  ).toHaveValue('New Function');
  const decision2 = policyDecision(page, true);
  await page
    .getByRole('link', { name: 'Location B', exact: true, includeHidden: true })
    .dispatchEvent('click');
  await decision2;
  await expect(page).toHaveURL('/org/org/b/settings/case-policies');
  await expect(page.locator('.MuiDrawer-root')).toHaveCount(0);
  await expect(
    page.getByRole('grid', {
      name: 'Case Policies requirements matrix',
      exact: true,
    })
  ).toBeVisible();
  expect(requests.puts()).toBe(0);
});

test('administration direct access rejects restricted users without policy requests', async ({
  page,
}) => {
  const requests = await backend(page);
  await page.addInitScript('window.__QA_ALLOWED__ = false');
  await mount(
    page,
    'casePolicy',
    '/org/org/a/settings/case-policies/administration'
  );
  await expect(page.getByRole('alert')).toContainText(
    'This location is restricted or unavailable.'
  );
  expect(requests.puts()).toBe(0);
  expect(requests.validations()).toBe(0);
});

for (const width of [320, 390, 768, 1440])
  test(
    'matrix and administration navigation fits ' + width + 'px',
    async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      const requests = await backend(page);
      await mount(page, 'casePolicy', undefined, true);
      const action = page.getByRole('button', {
        name: 'Manage Arrangements & Functions',
        exact: true,
      });
      const bounds = (await action.boundingBox())!;
      expect(bounds.x).toBeGreaterThanOrEqual(0);
      expect(bounds.x + bounds.width).toBeLessThanOrEqual(width);
      await action.click();
      const back = page.getByRole('button', {
        name: 'Close administration',
        exact: true,
      });
      await expect(back).toBeVisible();
      const backBounds = (await back.boundingBox())!;
      expect(backBounds.x).toBeGreaterThanOrEqual(0);
      expect(backBounds.x + backBounds.width).toBeLessThanOrEqual(width);
      await back.click();
      await expect(
        page.getByRole('grid', {
          name: 'Case Policies requirements matrix',
          exact: true,
        })
      ).toBeVisible();
      expect(requests.puts()).toBe(0);
    }
  );

for (const width of [320, 390, 768, 1440]) {
  test(`administration uses one accessible drawer for creation, metadata, functions and confirmations at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    const requests = await backend(page);
    await mount(page, 'casePolicy', undefined, true);
    const add = page.getByRole('button', {
      name: 'Add Arrangement',
      exact: true,
    });
    const manage = page.getByRole('button', {
      name: 'Manage Arrangements & Functions',
      exact: true,
    });
    await expect(add).toHaveClass(
      /(?=.*MuiButton-contained)(?=.*MuiButton-colorPrimary)/
    );
    await expect(manage).toHaveClass(
      /(?=.*MuiButton-contained)(?=.*MuiButton-colorPrimary)/
    );
    const drawer = page.getByRole('dialog', {
      name: 'Manage Arrangements & Functions',
      exact: true,
    });
    async function oneDrawer() {
      await expect(
        drawer.getByRole('button', {
          name: 'Back to Case Policies',
          exact: true,
        })
      ).toHaveCount(0);
      await expect(page.locator('.MuiDrawer-root')).toHaveCount(1);
      await expect(page.locator('.MuiBackdrop-root:visible')).toHaveCount(1);
      await expect(page.locator('.MuiDialog-root')).toHaveCount(0);
      const bounds = (await drawer.boundingBox())!;
      expect(bounds.x).toBeGreaterThanOrEqual(-1);
      expect(bounds.x + bounds.width).toBeLessThanOrEqual(width + 1);
      expect(
        await drawer.evaluate(
          (element) => element.scrollWidth <= element.clientWidth
        )
      ).toBe(true);
    }
    await add.click();
    const arrangementName = page.getByRole('textbox', {
      name: 'Arrangement Type',
      exact: true,
    });
    await expect(arrangementName).toBeFocused();
    await oneDrawer();
    await page.keyboard.press('Escape');
    await expect(page.locator('.MuiDrawer-root')).toHaveCount(0);
    await expect(add).toBeFocused();
    await manage.click();
    await oneDrawer();
    await drawer.getByText('Arrangements', { exact: true }).click();
    const edit = drawer.getByRole('button', { name: 'Edit', exact: true });
    await edit.click();
    await expect(arrangementName).toHaveValue('Hosting');
    await oneDrawer();
    await arrangementName.fill('Pending name');
    const decision3 = policyDecision(page, false);
    await page.keyboard.press('Escape');
    await decision3;
    await expect(arrangementName).toHaveValue('Pending name');
    await oneDrawer();
    const decision4 = policyDecision(page, true);
    await page.keyboard.press('Escape');
    await decision4;
    await expect(edit).toBeVisible();
    await expect(edit).toBeFocused();
    await oneDrawer();
    await drawer.getByText('Hosting', { exact: true }).click();
    await drawer.getByText('Arrangement Functions', { exact: true }).click();
    const functions = drawer
      .locator('.MuiAccordion-root')
      .filter({ has: page.getByText('Arrangement Functions', { exact: true }) })
      .last();
    await functions.getByRole('button', { name: 'Add', exact: true }).click();
    await expect(
      page.getByRole('textbox', { name: 'Function', exact: true })
    ).toBeVisible();
    await oneDrawer();
    await cancelPolicyForm(page);
    await expect(functions).toBeVisible();
    await drawer
      .getByRole('button', { name: 'Duplicate Hosting', exact: true })
      .click();
    await expect(
      drawer.getByText('Duplicate Hosting?', { exact: true })
    ).toBeVisible();
    await oneDrawer();
    await drawer.getByRole('button', { name: 'No', exact: true }).click();
    await expect(edit).toBeVisible();
    await drawer
      .getByRole('button', { name: 'Close administration', exact: true })
      .click();
    await expect(page.locator('.MuiDrawer-root')).toHaveCount(0);
    await expect(manage).toBeFocused();
    expect(requests.puts()).toBe(0);
  });
}

test('Location basic configuration retains its separate page heading', async ({
  page,
}) => {
  const requests = await backend(page);
  await mount(page, 'basic', '/org/org/a/settings/locations');
  await expect(
    page.getByRole('heading', {
      name: 'Editing Location A configuration',
      exact: true,
    })
  ).toBeVisible();
  expect(requests.puts()).toBe(0);
});

for (const scenario of [
  { administrator: true, categories: true, policy: true },
  { administrator: false, categories: true, policy: true },
  { administrator: true, categories: false, policy: true },
  { administrator: true, categories: true, policy: false },
])
  test.describe('Settings card ordering ' + JSON.stringify(scenario), () => {
    test.use({
      featureFlags: {
        [SELF_SERVICE_POLICY_FEATURE_FLAG]: scenario.policy,
        [ORGANIZATION_CATEGORIES_FEATURE_FLAG]: scenario.categories,
      },
    });
    test('administration precedes policies and unavailable sections remain hidden', async ({
      page,
    }) => {
      await page.addInitScript((administrator) => {
        Object.assign(window, { __QA_ADMIN__: administrator });
      }, scenario.administrator);
      const requests = await backend(page);
      await mount(page, 'basic', '/org/org/a/settings');
      await expect(page.getByRole('heading', { level: 6 })).toHaveText([
        'Tenant Settings',
        'Location Settings',
      ]);
      await page.getByRole('button', { name: /^Tenant Settings/ }).click();
      await expect(page.getByRole('heading', { level: 6 })).toHaveText([
        'Roles',
        ...(scenario.administrator && scenario.categories
          ? ['Organization Categories']
          : []),
      ]);
      await page.getByRole('button', { name: /^Roles/ }).click();
      await expect(page).toHaveURL('/org/org/a/settings/roles');
      await expect(
        page.getByRole('navigation', { name: 'breadcrumb' })
      ).toHaveText('SettingsTenant SettingsRoles');
      await page.getByRole('link', { name: 'Settings', exact: true }).click();
      await page.getByRole('button', { name: /^Location Settings/ }).click();
      await expect(page.getByRole('heading', { level: 6 })).toHaveText([
        'Location',
        ...(scenario.policy
          ? settingsSections
              .filter((item) => item.id !== 'accessLevels')
              .map((item) => item.label)
          : []),
        'Access Levels',
      ]);
      expect(requests.puts()).toBe(0);
    });
  });

for (const width of [320, 390, 768, 1440])
  test(
    'Settings overview cards navigate at ' + width + 'px',
    async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await backend(page);
      await mount(page, 'basic', '/org/org/a/settings');
      await expect(page.getByRole('heading', { level: 6 })).toHaveText([
        'Tenant Settings',
        'Location Settings',
      ]);
      await page.getByRole('button', { name: /^Location Settings/ }).click();
      for (const section of settingsSections) {
        const card = page.getByRole('button', {
          name: new RegExp(section.label),
        });
        await card.scrollIntoViewIfNeeded();
        const bounds = (await card.boundingBox())!;
        expect(bounds.x).toBeGreaterThanOrEqual(0);
        expect(bounds.x + bounds.width).toBeLessThanOrEqual(width);
        const iconNames = {
          actionDefinitions: 'FactCheckIcon',
          customFamilyFields: 'PlaylistAddIcon',
          casePolicy: 'TuneIcon',
          v1ReferralPolicy: 'AccountTreeIcon',
          volunteerPolicy: 'VolunteerActivismIcon',
          organizationPolicy: 'VerifiedUserIcon',
          accessLevels: 'AdminPanelSettingsIcon',
        };
        const icon = card.getByTestId(iconNames[section.id]);
        await expect(icon).toBeVisible();
        const iconBounds = (await icon.boundingBox())!;
        expect(iconBounds.width).toBe(30);
        expect(iconBounds.height).toBe(30);
        expect(
          Math.abs(
            iconBounds.x + iconBounds.width / 2 - bounds.x - bounds.width / 2
          )
        ).toBeLessThan(2);
        await card.click();
        await expect(page).toHaveURL(
          settingsSectionPath('org', 'a', section.id)
        );
        await expect(
          page
            .getByRole('navigation', { name: 'breadcrumb' })
            .getByText(section.label, { exact: true })
        ).toBeVisible();
        await expect(
          page.getByRole('heading', { name: section.label, exact: true })
        ).toHaveCount(0);
        await expect(page.getByText(/^Location:/)).toHaveCount(0);
        const contentBounds = (await page
          .getByRole('region', { name: section.label, exact: true })
          .boundingBox())!;
        expect(contentBounds.x).toBeGreaterThanOrEqual(0);
        expect(contentBounds.x + contentBounds.width).toBeLessThanOrEqual(
          width
        );
        await page
          .getByRole('link', { name: 'Location Settings', exact: true })
          .click();
      }
    }
  );

test('legacy tabs redirect to the explicitly targeted location', async ({
  page,
}) => {
  const requests = await backend(page);
  const reads: string[] = [];
  page.on('request', (request) => {
    if (
      request.method() === 'GET' &&
      request.url().endsWith('/Configuration/policy')
    )
      reads.push(request.url());
  });
  for (const section of settingsSections) {
    await mount(
      page,
      section.id,
      '/org/org/a/settings/locations/b?tab=' + section.id,
      true
    );
    await expect(page).toHaveURL(settingsSectionPath('org', 'b', section.id));
    await expect(
      page
        .getByRole('navigation', { name: 'breadcrumb' })
        .getByRole('link', { name: 'Settings', exact: true })
    ).toHaveAttribute('href', '/org/org/b/settings');
  }
  expect(
    reads.every((url) => url.includes('/org/b/Configuration/policy'))
  ).toBe(true);
  expect(requests.puts()).toBe(0);
});

test.describe('Settings category navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() =>
      Object.assign(window, {
        __QA_SETTINGS_NAVIGATION__: true,
        __QA_ADMIN__: true,
      })
    );
  });

  test('sidebar exposes only direct category links with descendant highlighting and parent expansion', async ({
    page,
  }) => {
    const requests = await backend(page);
    await mount(page, 'basic', '/org/org/a/settings');
    const sidebar = page.getByRole('complementary', {
      name: 'Settings sidebar',
    });
    const tenant = sidebar.getByRole('link', {
      name: 'Tenant Settings',
      exact: true,
    });
    const location = sidebar.getByRole('link', {
      name: 'Location Settings',
      exact: true,
    });
    await expect(sidebar.getByRole('link')).toHaveText([
      'Settings',
      'Tenant Settings',
      'Location Settings',
    ]);
    await expect(sidebar.getByRole('button', { name: /^Toggle/ })).toHaveCount(
      1
    );
    await expect(
      sidebar.getByRole('button', {
        name: /^Toggle (Tenant|Location) Settings$/,
      })
    ).toHaveCount(0);
    const toggle = sidebar.getByRole('button', {
      name: 'Toggle Settings',
      exact: true,
    });
    await toggle.focus();
    await toggle.press('Enter');
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');
    await expect(tenant).toBeHidden();
    await toggle.press('Enter');
    await expect(tenant).toBeVisible();
    await tenant.click();
    await expect(page).toHaveURL('/org/org/a/settings/tenant');
    await expect(tenant).toHaveAttribute('aria-current', 'page');
    await page.getByRole('button', { name: /^Roles/ }).click();
    await expect(page).toHaveURL('/org/org/a/settings/roles');
    await expect(tenant).toHaveClass(/Mui-selected/);
    await expect(tenant).toHaveAttribute('aria-current', 'location');
    await expect(location).not.toHaveClass(/Mui-selected/);
    await location.click();
    await expect(page).toHaveURL('/org/org/a/settings/location-settings');
    await expect(location).toHaveAttribute('aria-current', 'page');
    await page.getByRole('button', { name: /^Case Policies/ }).click();
    await expect(page).toHaveURL('/org/org/a/settings/case-policies');
    await expect(location).toHaveClass(/Mui-selected/);
    await expect(location).toHaveAttribute('aria-current', 'location');
    await page
      .getByRole('button', {
        name: 'Manage Arrangements & Functions',
        exact: true,
      })
      .click();
    await page
      .getByRole('button', { name: 'Close administration', exact: true })
      .click();
    await expect(page).toHaveURL('/org/org/a/settings/case-policies');
    await expect(location).toHaveClass(/Mui-selected/);
    await expect(tenant).not.toHaveClass(/Mui-selected/);
    await expect(sidebar.getByRole('link')).toHaveText([
      'Settings',
      'Tenant Settings',
      'Location Settings',
    ]);
    expect(requests.puts()).toBe(0);
  });

  test('breadcrumbs, browser history and category location switching retain scope', async ({
    page,
  }) => {
    const requests = await backend(page);
    await mount(page, 'basic', '/org/org/a/settings');
    await page.getByRole('button', { name: /^Tenant Settings/ }).click();
    await expect(
      page.getByRole('navigation', { name: 'breadcrumb' })
    ).toHaveText('SettingsTenant Settings');
    await page
      .getByRole('button', { name: /^Organization Categories/ })
      .click();
    await expect(
      page.getByRole('navigation', { name: 'breadcrumb' })
    ).toHaveText('SettingsTenant SettingsOrganization Categories');
    await page.goBack();
    await expect(page).toHaveURL('/org/org/a/settings/tenant');
    await page.goForward();
    await expect(page).toHaveURL('/org/org/a/settings/organization-categories');
    await page
      .getByRole('navigation', { name: 'breadcrumb' })
      .getByRole('link', { name: 'Tenant Settings', exact: true })
      .click();
    await page.getByRole('link', { name: 'Location B', exact: true }).click();
    await expect(page).toHaveURL('/org/org/b/settings/tenant');
    await expect(
      page
        .getByRole('navigation', { name: 'breadcrumb' })
        .getByRole('link', { name: 'Settings', exact: true })
    ).toHaveAttribute('href', '/org/org/b/settings');
    await page
      .getByRole('complementary', { name: 'Settings sidebar' })
      .getByRole('link', { name: 'Location Settings', exact: true })
      .click();
    await expect(page).toHaveURL('/org/org/b/settings/location-settings');
    await page.getByRole('button', { name: /^Case Policies/ }).click();
    await expect(page).toHaveURL('/org/org/b/settings/case-policies');
    await expect(
      page.getByRole('navigation', { name: 'breadcrumb' })
    ).toHaveText('SettingsLocation SettingsCase Policies');
    expect(requests.puts()).toBe(0);
  });

  test('category sidebar links and breadcrumbs protect pending matrix edits', async ({
    page,
  }) => {
    const requests = await backend(page, false, false, caseMatrixPolicy());
    await mount(page, 'casePolicy', undefined, true);
    const editor = await openMatrixCell(page);
    await editor
      .getByRole('button', {
        name: 'Not used \u2014 remove requirement 1',
        exact: true,
      })
      .click();
    await editor
      .getByRole('button', { name: 'Apply to draft', exact: true })
      .click();
    const sidebar = page.getByRole('complementary', {
      name: 'Settings sidebar',
    });
    const decision5 = policyDecision(page, false);
    await sidebar
      .getByRole('link', { name: 'Tenant Settings', exact: true })
      .click();
    await decision5;
    await expect(page).toHaveURL('/org/org/a/settings/case-policies');
    const decision6 = policyDecision(page, false);
    await page
      .getByRole('navigation', { name: 'breadcrumb' })
      .getByRole('link', { name: 'Location Settings', exact: true })
      .click();
    await decision6;
    await expect(page.getByRole('status')).toContainText('unsaved change');
    await cancelPolicyForm(page);
    await sidebar
      .getByRole('link', { name: 'Tenant Settings', exact: true })
      .click();
    await expect(page).toHaveURL('/org/org/a/settings/tenant');
    expect(requests.puts()).toBe(0);
  });

  for (const width of [320, 390, 768, 1440])
    test(
      'category spacing and direct sidebar labels fit ' + width + 'px',
      async ({ page }) => {
        await page.setViewportSize({ width, height: 900 });
        const requests = await backend(page);
        await mount(page, 'basic', '/org/org/a/settings');
        const cards = page
          .getByRole('region', { name: 'Settings categories', exact: true })
          .getByRole('button');
        await expect(cards).toHaveCount(2);
        for (const card of await cards.all()) {
          const bounds = (await card.boundingBox())!;
          expect(bounds.x).toBeGreaterThanOrEqual(0);
          expect(bounds.x + bounds.width).toBeLessThanOrEqual(width);
        }
        const sidebar = page.getByRole('complementary', {
          name: 'Settings sidebar',
        });
        await expect(sidebar.getByRole('link')).toHaveCount(3);
        await expect(
          sidebar.getByRole('button', { name: /^Toggle/ })
        ).toHaveCount(1);
        const leftEdges: number[] = [];
        for (const label of ['Tenant Settings', 'Location Settings']) {
          const link = sidebar.getByRole('link', { name: label, exact: true });
          const bounds = (await link.boundingBox())!;
          leftEdges.push(bounds.x);
          expect(bounds.x).toBeGreaterThanOrEqual(0);
          expect(bounds.x + bounds.width).toBeLessThanOrEqual(width);
          await expect(link.locator('.MuiListItemText-primary')).toHaveCSS(
            'white-space',
            'normal'
          );
          await link.click();
          const breadcrumb = page.getByRole('navigation', {
            name: 'breadcrumb',
          });
          await expect(
            breadcrumb.getByText(label, { exact: true })
          ).toBeVisible();
          await expect(breadcrumb.locator('..')).toHaveCSS(
            'padding-top',
            width < 600 ? '20px' : '24px'
          );
          const region = page.getByRole('region', { name: label, exact: true });
          const crumbBounds = (await breadcrumb.boundingBox())!;
          const gridBounds = (await region.boundingBox())!;
          expect(Math.abs(gridBounds.x - crumbBounds.x)).toBeLessThan(1);
          expect(gridBounds.y - crumbBounds.y - crumbBounds.height).toBeCloseTo(
            width < 600 ? 16 : 24,
            0
          );
          await expect(region.getByRole('button')).toHaveCount(
            label === 'Tenant Settings' ? 2 : 8
          );
        }
        expect(Math.abs(leftEdges[0] - leftEdges[1])).toBeLessThan(1);
        expect(requests.puts()).toBe(0);
      }
    );
});

test.describe('Settings categories with unavailable sections', () => {
  test.use({
    featureFlags: {
      [SELF_SERVICE_POLICY_FEATURE_FLAG]: false,
      [ORGANIZATION_CATEGORIES_FEATURE_FLAG]: false,
    },
  });
  test('hidden sections are absent from cards and sidebar and restricted category URLs are blocked', async ({
    page,
  }) => {
    await page.addInitScript(() =>
      Object.assign(window, { __QA_SETTINGS_NAVIGATION__: true })
    );
    const requests = await backend(page);
    await mount(page, 'basic', '/org/org/a/settings/location-settings');
    const sidebar = page.getByRole('complementary', {
      name: 'Settings sidebar',
    });
    await expect(page.getByRole('heading', { level: 6 })).toHaveText([
      'Location',
      'Access Levels',
    ]);
    await expect(
      sidebar.getByRole('link', { name: 'Case Policies', exact: true })
    ).toHaveCount(0);
    await sidebar
      .getByRole('link', { name: 'Tenant Settings', exact: true })
      .click();
    await expect(page.getByRole('heading', { level: 6 })).toHaveText(['Roles']);
    await expect(
      sidebar.getByRole('link', {
        name: 'Organization Categories',
        exact: true,
      })
    ).toHaveCount(0);
    await page.addInitScript('window.__QA_ALLOWED__ = false');
    await mount(page, 'basic', '/org/org/a/settings/tenant');
    await expect(page.getByRole('alert')).toHaveText(
      'Settings are restricted or unavailable.'
    );
    await expect(sidebar.getByRole('link')).toHaveCount(0);
    expect(requests.puts()).toBe(0);
    expect(requests.validations()).toBe(0);
  });
});

test('browser back and location switches guard a dirty draft without leaking it', async ({
  page,
}) => {
  const requests = await backend(page, false, false, actionDefinitionPolicy());
  await mount(page, 'basic', '/org/org/a/settings');
  await page.getByRole('button', { name: /^Location Settings/ }).click();
  await page.getByRole('button', { name: /Action Definitions/ }).click();
  const cell = page.locator(
    '[data-id="Dynamic activity"] [data-field="instructions"]'
  );
  await cell.click();
  await cell.locator('input').fill('Only A');
  await cell.locator('input').press('Enter');
  await expect(
    page.getByText('1 unsaved change', { exact: true })
  ).toBeVisible();
  const decision7 = policyDecision(page, false);
  await page.goBack();
  await decision7;
  await expect(page).toHaveURL(/settings\/action-definitions/);
  await expect(cell).toHaveText('Only A');
  const decision8 = policyDecision(page, false);
  await page.getByRole('link', { name: 'Location B', exact: true }).click();
  await decision8;
  await expect(page).toHaveURL('/org/org/a/settings/action-definitions');
  await expect(cell).toHaveText('Only A');
  const decision9 = policyDecision(page, true);
  await page.getByRole('link', { name: 'Location B', exact: true }).click();
  await decision9;
  await expect(page).toHaveURL('/org/org/b/settings/action-definitions');
  await expect(cell).not.toHaveText('Only A');
  expect(requests.puts()).toBe(0);
});

test('Access Levels is read-only unless the current user is an organization administrator', async ({
  page,
}) => {
  await backend(page);
  await mount(page, 'accessLevels');
  await expect(
    page.getByRole('button', { name: 'Add new Access Level', exact: true })
  ).toHaveCount(0);
  await page.addInitScript('window.__QA_ADMIN__ = true');
  await mount(page, 'accessLevels');
  await page
    .getByRole('button', { name: 'Add new Access Level', exact: true })
    .click();
  await expect(
    page.getByRole('heading', { name: 'Add New Access Level', exact: true })
  ).toBeVisible();
  await cancelPolicyForm(page);
});

test('restricted Settings pages never load policy data', async ({ page }) => {
  const requests = await backend(page);
  await page.addInitScript('window.__QA_ALLOWED__ = false');
  await mount(page, 'casePolicy');
  await expect(page.getByRole('alert')).toHaveText(
    'This location is restricted or unavailable.'
  );
  expect(requests.validations()).toBe(0);
  expect(requests.puts()).toBe(0);
});

function caseMatrixPolicy() {
  const value = EffectiveLocationPolicy.fromJS(
    editableVariantPolicy()
  ).toJSON();
  value.referralPolicy.arrangementPolicies[0].arrangementFunctions[0].variants[0].requiredSetupActions =
    [{ actionName: 'Form', isRequired: false }];
  return value;
}

function matrixCell(
  page: Page,
  action: string,
  fn: string | null = null,
  variant: string | null = null
) {
  const field = JSON.stringify(['Hosting', fn, variant]);
  return page
    .getByRole('grid', {
      name: 'Case Policies requirements matrix',
      exact: true,
    })
    .locator('[data-id="' + action + '"] [data-field=\'' + field + "']");
}

async function openMatrixCell(
  page: Page,
  fn: string | null = null,
  variant: string | null = null
) {
  const cell = matrixCell(page, 'Form', fn, variant);
  await cell.scrollIntoViewIfNeeded();
  await cell.click();
  return page.getByRole('dialog', { name: /^Edit Form/ });
}

async function applyApplicability(
  page: Page,
  value: 'Optional' | 'Required',
  fn: string | null = null,
  variant: string | null = null
) {
  const editor = await openMatrixCell(page, fn, variant);
  await editor
    .getByRole('combobox', {
      name: 'Requirement 1 applicability',
      exact: true,
    })
    .click();
  await page.getByRole('option', { name: value, exact: true }).click();
  await editor
    .getByRole('button', { name: 'Apply to draft', exact: true })
    .click();
}

test.describe('Case Policies matrix', () => {
  test('unsaved outlines mark authoritative cells, revert independently and clear only after a successful save', async ({
    page,
  }) => {
    const requests = await backend(page, false, false, caseMatrixPolicy());
    await mount(page, 'casePolicy', undefined, true);
    const grid = page.getByRole('grid', {
      name: 'Case Policies requirements matrix',
      exact: true,
    });
    const shared = matrixCell(page, 'Form');
    const variant = matrixCell(
      page,
      'Form',
      'Provider function',
      'First profile'
    );
    await expect(grid.locator('.policy-cell-unsaved')).toHaveCount(0);
    const editor = await openMatrixCell(page);
    await expect(shared).not.toHaveClass(/policy-cell-unsaved/);
    await editor
      .getByRole('button', { name: 'Cancel cell', exact: true })
      .click();
    await applyApplicability(page, 'Optional');
    await expect(shared).toHaveClass(/policy-cell-unsaved/);
    await expect(shared).toHaveAccessibleName(/Unsaved changes/);
    await expect(
      shared.getByText('Unsaved changes', { exact: true })
    ).toHaveCount(1);
    await expect(variant).not.toHaveClass(/policy-cell-unsaved/);
    await expect(
      matrixCell(page, 'Form', 'Provider function', 'Second profile')
    ).not.toHaveClass(/policy-cell-unsaved/);
    await applyApplicability(
      page,
      'Required',
      'Provider function',
      'First profile'
    );
    await expect(grid.locator('.policy-cell-unsaved')).toHaveCount(2);
    await expect(variant).toHaveClass(/policy-cell-unsaved/);
    await applyApplicability(page, 'Required');
    await expect(shared).not.toHaveClass(/policy-cell-unsaved/);
    await expect(variant).toHaveClass(/policy-cell-unsaved/);
    expect(requests.puts()).toBe(0);
    const dirtyColor = await variant.evaluate(
      (element) => getComputedStyle(element).outlineColor
    );
    await page
      .getByRole('button', { name: 'Save changes', exact: true })
      .click();
    await expect.poll(requests.puts).toBe(1);
    await expect(grid.locator('.policy-cell-unsaved')).toHaveCount(0);
    await expect(variant).not.toHaveAccessibleName(/Unsaved changes/);
    await variant.focus();
    await expect(variant).toHaveCSS('outline-style', 'solid');
    await expect(variant).not.toHaveCSS('outline-color', dirtyColor);
  });

  test('failed saves retain unsaved outlines and Cancel clears them', async ({
    page,
  }) => {
    const requests = await backend(page, true, false, caseMatrixPolicy());
    await mount(page, 'casePolicy', undefined, true);
    const shared = matrixCell(page, 'Form');
    await applyApplicability(page, 'Optional');
    await page
      .getByRole('button', { name: 'Save changes', exact: true })
      .click();
    await expect(page.getByTestId('policy-save-errors')).toContainText(
      blockingError
    );
    await expect(shared).toHaveClass(/policy-cell-unsaved/);
    await expect(shared).toHaveAccessibleName(/Unsaved changes/);
    await cancelPolicyForm(page);
    await expect(shared).not.toHaveClass(/policy-cell-unsaved/);
    await expect(shared).not.toHaveAccessibleName(/Unsaved changes/);
    expect(requests.puts()).toBe(1);
  });

  test('unsaved outlines survive filtering and virtualization with a single red keyboard focus outline', async ({
    page,
  }) => {
    const initial = caseMatrixPolicy();
    for (let index = 0; index < 160; index++)
      initial.actionDefinitions['Extra ' + String(index).padStart(3, '0')] = {
        documentLink: 0,
        noteEntry: 0,
      };
    const requests = await backend(page, false, false, initial);
    await mount(page, 'casePolicy', undefined, true);
    const shared = matrixCell(page, 'Form');
    await shared.focus();
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('ArrowLeft');
    const originalFocus = await shared.evaluate((element) => ({
      width: getComputedStyle(element).outlineWidth,
      color: getComputedStyle(element).outlineColor,
    }));
    await applyApplicability(page, 'Optional');
    await page.getByRole('button', { name: 'Search', exact: true }).focus();
    const dirtyOutline = await shared.evaluate((element) => ({
      width: getComputedStyle(element).outlineWidth,
      color: getComputedStyle(element).outlineColor,
    }));
    expect(dirtyOutline.width).toBe('1px');
    expect(dirtyOutline.color).not.toBe(originalFocus.color);
    const grid = page.getByRole('grid', {
      name: 'Case Policies requirements matrix',
      exact: true,
    });
    await page.getByRole('button', { name: 'Search', exact: true }).click();
    await page.getByRole('searchbox').fill('Extra 159');
    await expect(shared).toHaveCount(0);
    await page.getByRole('searchbox').fill('Form');
    await expect(shared).toHaveClass(/policy-cell-unsaved/);
    await page.getByRole('searchbox').fill('');
    const scroller = grid.locator('.MuiDataGrid-virtualScroller');
    await expect
      .poll(() => scroller.evaluate((element) => element.scrollHeight))
      .toBeGreaterThan(5000);
    await scroller.evaluate((element) => {
      element.scrollTop = element.scrollHeight;
    });
    const lastRow = grid.locator(
      '[data-id="Extra 159"] [data-field="actionName"]'
    );
    await expect(lastRow).toBeVisible();
    await lastRow.click();
    await expect(lastRow).not.toHaveClass(/policy-cell-unsaved/);
    await expect(shared).toHaveCount(0);
    await scroller.evaluate((element) => {
      element.scrollTop = 0;
    });
    await expect(shared).toHaveClass(/policy-cell-unsaved/);
    await shared.focus();
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('ArrowLeft');
    await expect(shared).toBeFocused();
    await expect(shared).toHaveAccessibleName(/Unsaved changes/);
    const appearance = await shared.evaluate((element) => {
      const focus = getComputedStyle(element);
      const ring = getComputedStyle(element, '::after');
      return {
        focusWidth: focus.outlineWidth,
        focusColor: focus.outlineColor,
        focusStyle: focus.outlineStyle,
        boxShadow: focus.boxShadow,
        pseudoContent: ring.content,
      };
    });
    expect(appearance.focusWidth).toBe(dirtyOutline.width);
    expect(appearance.focusColor).toBe(dirtyOutline.color);
    expect(appearance.focusStyle).toBe('solid');
    expect(appearance.boxShadow).toBe('none');
    expect(appearance.pseudoContent).toBe('none');
    await applyApplicability(page, 'Required');
    await shared.focus();
    await expect(shared).not.toHaveClass(/policy-cell-unsaved/);
    await expect(shared).toHaveCSS('outline-color', originalFocus.color);
    await expect(shared).toHaveCSS('outline-width', originalFocus.width);
    expect(requests.puts()).toBe(0);
  });

  test('unsaved outlines cannot leak across locations or a fresh policy load', async ({
    page,
  }) => {
    const requests = await backend(page, false, false, caseMatrixPolicy());
    await mount(page, 'casePolicy', undefined, true);
    await applyApplicability(page, 'Optional');
    await expect(matrixCell(page, 'Form')).toHaveClass(/policy-cell-unsaved/);
    const decision10 = policyDecision(page, true);
    await page.getByRole('link', { name: 'Location B', exact: true }).click();
    await decision10;
    await expect(page).toHaveURL('/org/org/b/settings/case-policies');
    await expect(matrixCell(page, 'Form')).not.toHaveClass(
      /policy-cell-unsaved/
    );
    await page.reload();
    await page.addScriptTag({ content: bundle });
    await expect(matrixCell(page, 'Form')).toBeVisible();
    await expect(page.locator('.policy-cell-unsaved')).toHaveCount(0);
    expect(requests.puts()).toBe(0);
  });

  test('search survives Cancel and unfinished cells guard view and location navigation', async ({
    page,
  }) => {
    const requests = await backend(page, false, false, caseMatrixPolicy());
    await mount(page, 'casePolicy', undefined, true);
    await page.getByRole('button', { name: 'Search', exact: true }).click();
    await page.getByRole('searchbox').fill('Form');
    const editor = await openMatrixCell(page);
    await page
      .getByRole('button', {
        name: 'Manage Arrangements & Functions',
        exact: true,
      })
      .click();
    await expect(editor).toBeVisible();
    const decision11 = policyDecision(page, false);
    await page.getByRole('link', { name: 'Location B', exact: true }).click();
    await decision11;
    await expect(editor).toBeVisible();
    await editor
      .getByRole('button', {
        name: 'Not used \u2014 remove requirement 1',
        exact: true,
      })
      .click();
    await editor
      .getByRole('button', { name: 'Apply to draft', exact: true })
      .click();
    await page
      .getByRole('button', {
        name: 'Manage Arrangements & Functions',
        exact: true,
      })
      .click();
    await expect(page).toHaveURL('/org/org/a/settings/case-policies');
    await cancelPolicyForm(page);
    await expect(page.getByRole('searchbox')).toHaveValue('Form');
    await expect(
      matrixCell(page, 'Form').getByText(
        'Shared \u00b7 Setup \u00b7 Required',
        { exact: true }
      )
    ).toBeVisible();
    expect(requests.puts()).toBe(0);
  });

  test('shared synchronization, additive variant edits and multiple phases save one policy', async ({
    page,
  }) => {
    const initial = caseMatrixPolicy();
    const requests = await backend(page, false, false, initial);
    let saved: EffectiveLocationPolicy | undefined;
    page.on('request', (request) => {
      if (request.method() === 'PUT') saved = request.postDataJSON();
    });
    await mount(page, 'casePolicy', undefined, true);
    const grid = page.getByRole('grid', {
      name: 'Case Policies requirements matrix',
      exact: true,
    });
    await expect(
      grid.getByRole('columnheader', { name: 'Hosting', exact: true })
    ).toBeVisible();
    await expect(
      grid.getByRole('columnheader', { name: 'Provider function', exact: true })
    ).toBeVisible();
    let editor = await openMatrixCell(page);
    await editor
      .getByRole('combobox', {
        name: 'Requirement 1 applicability',
        exact: true,
      })
      .click();
    await page.getByRole('option', { name: 'Optional', exact: true }).click();
    await editor
      .getByRole('button', { name: 'Apply to draft', exact: true })
      .click();
    await expect(
      matrixCell(page, 'Form', 'Provider function', 'First profile').getByText(
        'Shared \u00b7 Setup \u00b7 Optional',
        { exact: true }
      )
    ).toBeVisible();
    await expect(
      matrixCell(page, 'Form', 'Provider function', 'Second profile').getByText(
        'Shared \u00b7 Setup \u00b7 Optional',
        { exact: true }
      )
    ).toBeVisible();
    editor = await openMatrixCell(page, 'Provider function', 'First profile');
    await editor
      .getByRole('combobox', {
        name: 'Requirement 1 applicability',
        exact: true,
      })
      .click();
    await page.getByRole('option', { name: 'Required', exact: true }).click();
    await editor
      .getByRole('button', { name: 'Add Closeout', exact: true })
      .click();
    await editor
      .getByRole('combobox', {
        name: 'Requirement 2 applicability',
        exact: true,
      })
      .click();
    await page.getByRole('option', { name: 'Optional', exact: true }).click();
    await editor
      .getByRole('button', { name: 'Apply to draft', exact: true })
      .click();
    const first = matrixCell(
      page,
      'Form',
      'Provider function',
      'First profile'
    );
    await expect(
      first.getByText('Shared \u00b7 Setup \u00b7 Optional', { exact: true })
    ).toBeVisible();
    await expect(
      first.getByText('Additional \u00b7 Setup \u00b7 Required', {
        exact: true,
      })
    ).toBeVisible();
    await expect(
      first.getByText('Additional \u00b7 Closeout \u00b7 Optional', {
        exact: true,
      })
    ).toBeVisible();
    expect(requests.puts()).toBe(0);
    await page
      .getByRole('button', { name: 'Save changes', exact: true })
      .click();
    await expect.poll(requests.puts).toBe(1);
    const arrangement = saved!.referralPolicy.arrangementPolicies[0];
    expect(arrangement.requiredSetupActions[0].isRequired).toBe(false);
    expect(
      arrangement.arrangementFunctions[0].variants[0].requiredSetupActions[0]
        .isRequired
    ).toBe(true);
    expect(
      arrangement.arrangementFunctions[0].variants[0].requiredCloseoutActions
    ).toEqual([
      ...initial.referralPolicy.arrangementPolicies[0].arrangementFunctions[0]
        .variants[0].requiredCloseoutActions,
      { actionName: 'Form', isRequired: false },
    ]);
    expect(arrangement.arrangementFunctions[0].variants[1]).toEqual(
      initial.referralPolicy.arrangementPolicies[0].arrangementFunctions[0]
        .variants[1]
    );
    expect(arrangement.policyVersions).toEqual(
      initial.referralPolicy.arrangementPolicies[0].policyVersions
    );
  });

  test('structured multi-stage editing stays inside the cell and round-trips as recurrence objects', async ({
    page,
  }) => {
    const initial = caseMatrixPolicy();
    const requests = await backend(page, false, false, initial);
    let saved: EffectiveLocationPolicy | undefined;
    page.on('request', (request) => {
      if (request.method() === 'PUT') saved = request.postDataJSON();
    });
    await mount(page, 'casePolicy', undefined, true);
    const editor = await openMatrixCell(page);
    await editor
      .getByRole('spinbutton', {
        name: 'Stage 1 occurrence limit',
        exact: true,
      })
      .fill('1');
    await editor
      .getByRole('button', { name: 'Add stage', exact: true })
      .click();
    await editor
      .getByRole('spinbutton', { name: 'Stage 2 interval (days)', exact: true })
      .fill('7');
    await editor
      .getByLabel('Unlimited occurrences', { exact: true })
      .nth(1)
      .check();
    await editor
      .getByRole('spinbutton', { name: 'Stage 2 interval (days)', exact: true })
      .press('Enter');
    await expect(editor).toBeVisible();
    await expect(
      page.getByRole('button', { name: 'Save changes', exact: true })
    ).toBeDisabled();
    await editor
      .getByRole('button', { name: 'Apply to draft', exact: true })
      .click();
    await expect(matrixCell(page, 'Form')).toHaveClass(/policy-cell-unsaved/);
    expect(requests.puts()).toBe(0);
    await page
      .getByRole('button', { name: 'Save changes', exact: true })
      .click();
    await expect.poll(requests.puts).toBe(1);
    await expect(matrixCell(page, 'Form')).not.toHaveClass(
      /policy-cell-unsaved/
    );
    expect(
      saved!.referralPolicy.arrangementPolicies[0]
        .requiredMonitoringActionsNew[0].recurrence
    ).toEqual({
      discriminator: 'DurationStagesRecurrencePolicy',
      stages: [
        { delay: '2.00:00:00', maxOccurrences: 1 },
        { delay: '7.00:00:00', maxOccurrences: null },
      ],
    });
    expect(
      saved!.referralPolicy.arrangementPolicies[0].arrangementFunctions
    ).toEqual(
      initial.referralPolicy.arrangementPolicies[0].arrangementFunctions
    );
  });

  test('protected legacy and sub-day schedules remain visible without destructive controls', async ({
    page,
  }) => {
    const initial = caseMatrixPolicy();
    Object.assign(initial.referralPolicy.arrangementPolicies[0], {
      requiredSetupActionNames: ['Form'],
      requiredMonitoringActionsNew: [
        {
          action: { actionName: 'Form', isRequired: true },
          recurrence: {
            discriminator: 'OneTimeRecurrencePolicy',
            delay: '00:12:00',
          },
        },
      ],
    });
    const requests = await backend(page, false, false, initial);
    await mount(page, 'casePolicy', undefined, true);
    const editor = await openMatrixCell(page);
    await expect(editor.getByText(/Duplicate or mixed-source/)).toBeVisible();
    await expect(editor.getByText(/Evaluation uses whole days/)).toBeVisible();
    await expect(
      editor.getByRole('button', { name: 'Add Setup', exact: true })
    ).toHaveCount(0);
    await expect(
      editor.getByRole('button', { name: 'Add Monitoring', exact: true })
    ).toHaveCount(0);
    await editor
      .getByRole('button', { name: 'Cancel cell', exact: true })
      .click();
    expect(requests.puts()).toBe(0);
  });

  test('keyboard Escape, Cancel and failed saves retain the correct draft', async ({
    page,
  }) => {
    const requests = await backend(page, true, false, caseMatrixPolicy());
    await mount(page, 'casePolicy', undefined, true);
    const cell = matrixCell(page, 'Form');
    await cell.click();
    let editor = page.getByRole('dialog', { name: /^Edit Form/ });
    await editor
      .getByRole('combobox', {
        name: 'Requirement 1 applicability',
        exact: true,
      })
      .click();
    await page.getByRole('option', { name: 'Optional', exact: true }).click();
    await editor.press('Escape');
    await expect(
      page.getByRole('button', { name: 'Save changes', exact: true })
    ).toBeDisabled();
    await cell.focus();
    await cell.press('Enter');
    editor = page.getByRole('dialog', { name: /^Edit Form/ });
    await editor
      .getByRole('button', {
        name: 'Not used \u2014 remove requirement 1',
        exact: true,
      })
      .click();
    await editor
      .getByRole('button', { name: 'Apply to draft', exact: true })
      .click();
    await page
      .getByRole('button', { name: 'Save changes', exact: true })
      .click();
    await expect.poll(requests.puts).toBe(1);
    await expect(page.getByTestId('policy-save-errors')).toContainText(
      blockingError
    );
    await expect(
      cell.getByText('Shared \u00b7 Setup \u00b7 Required', { exact: true })
    ).toHaveCount(0);
    await cancelPolicyForm(page);
    await expect(
      cell.getByText('Shared \u00b7 Setup \u00b7 Required', { exact: true })
    ).toBeVisible();
  });

  for (const width of [320, 390, 768, 1440])
    test('expanded matrix cell works at ' + width + 'px', async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      const requests = await backend(page, false, false, caseMatrixPolicy());
      await mount(page, 'casePolicy', undefined, true);
      const cell = matrixCell(page, 'Form');
      await expect(cell).toBeVisible();
      const originalBounds = (await cell.boundingBox())!;
      const editor = await openMatrixCell(page);
      await expect(editor).toBeVisible();
      const bounds = (await editor.boundingBox())!;
      expect(bounds.x).toBeGreaterThanOrEqual(0);
      expect(bounds.x + bounds.width).toBeLessThanOrEqual(width);
      expect(bounds.y).toBeGreaterThanOrEqual(0);
      expect(bounds.y + bounds.height).toBeLessThanOrEqual(900);
      await editor
        .getByRole('button', { name: 'Cancel cell', exact: true })
        .click();
      await expect(cell).not.toHaveClass(/policy-cell-unsaved/);
      await applyApplicability(page, 'Optional');
      await expect(cell).toHaveClass(/policy-cell-unsaved/);
      await expect(cell).toHaveAccessibleName(/Unsaved changes/);
      const changedBounds = (await cell.boundingBox())!;
      expect(changedBounds.width).toBe(originalBounds.width);
      expect(changedBounds.height).toBeCloseTo(originalBounds.height, 0);
      expect(requests.puts()).toBe(0);
    });
});

test('initial Settings policy page shows warnings once and never saves', async ({
  page,
}) => {
  const requests = await backend(page);
  await mount(page);
  await expect(
    page.getByRole('region', { name: 'Action Definitions', exact: true })
  ).toBeVisible();
  await expect(page.getByRole('alert')).toContainText(warning);
  await expect(page.getByText(warning, { exact: true })).toHaveCount(1);
  expect(
    await page
      .getByText(warning, { exact: true })
      .evaluate((element) => element.closest('.ph-unmask') !== null)
  ).toBe(false);
  expect(requests.puts()).toBe(0);
  expect(requests.validations()).toBe(1);
});

function actionDefinitionPolicy() {
  return {
    ...policy(),
    actionDefinitions: {
      'Dynamic activity': {
        documentLink: DocumentLinkRequirement.None,
        noteEntry: NoteEntryRequirement.None,
        instructions: 'Original instructions',
        infoLink: 'https://example.test/original',
        validity: '30.00:00:00',
        alternateNames: ['Original alias'],
        canView: 'ViewPermission',
        canEdit: 'EditPermission',
      },
    },
  };
}

test('action cells stage multiple values, cancel and save once while preserving advanced fields', async ({
  page,
}) => {
  const requests = await backend(page, false, false, actionDefinitionPolicy());
  let saved: unknown;
  page.on('request', (request) => {
    if (request.method() === 'PUT') saved = request.postDataJSON();
  });
  await mount(page, 'actionDefinitions');
  const row = page.locator('[data-id="Dynamic activity"]');
  for (const [field, value] of [
    ['instructions', 'Staged instructions'],
    ['url', 'https://example.test/staged'],
  ]) {
    await row.locator('[data-field="' + field + '"]').click();
    await row.locator('[data-field="' + field + '"] input').fill(value);
    await row.locator('[data-field="' + field + '"] input').press('Tab');
  }
  expect(requests.puts()).toBe(0);
  await expect(page.getByRole('status')).toContainText(/unsaved change/i);
  await expect(
    page.getByText('2 unsaved changes', { exact: true })
  ).toBeVisible();
  await cancelPolicyForm(page);
  await expect(row.locator('[data-field="instructions"]')).toHaveText(
    'Original instructions'
  );
  await row.locator('[data-field="instructions"]').click();
  await row.locator('[data-field="instructions"] input').fill('Saved draft');
  await row.locator('[data-field="instructions"] input').press('Enter');
  await page.getByRole('button', { name: 'Save changes', exact: true }).click();
  await expect.poll(requests.puts).toBe(1);
  expect(saved).toMatchObject({
    actionDefinitions: {
      'Dynamic activity': {
        instructions: 'Saved draft',
        alternateNames: ['Original alias'],
        canView: 'ViewPermission',
        canEdit: 'EditPermission',
        validity: '30.00:00:00',
      },
    },
  });
  await row.locator('[data-field="instructions"]').click();
  await row.locator('[data-field="instructions"] input').press('Enter');
  await expect(
    page.getByRole('button', { name: 'Save changes', exact: true })
  ).toBeDisabled();
  expect(requests.puts()).toBe(1);
  await page
    .getByRole('button', { name: 'Edit details Dynamic activity', exact: true })
    .click();
  await expect(
    page.getByRole('textbox', { name: 'Action Name', exact: true })
  ).toHaveValue('Dynamic activity');
  await page
    .getByRole('textbox', { name: 'Instructions', exact: true })
    .fill('Detailed draft');
  await page
    .getByRole('button', { name: 'Apply to draft', exact: true })
    .click();
  await expect(
    page.getByRole('heading', { name: 'Edit Action Definition' })
  ).toHaveCount(0);
  expect(requests.puts()).toBe(1);
  await cancelPolicyForm(page);
});

test('document notes and validity stage raw domain values without per-cell writes', async ({
  page,
}) => {
  const requests = await backend(page, false, false, actionDefinitionPolicy());
  let saved: unknown;
  page.on('request', (r) => {
    if (r.method() === 'PUT') saved = r.postDataJSON();
  });
  await mount(page, 'actionDefinitions');
  const row = page.locator('[data-id="Dynamic activity"]');
  for (const [field, label] of [
    ['document', 'Required'],
    ['note', 'Allowed'],
  ]) {
    await row.locator('[data-field="' + field + '"]').click();
    await page.getByRole('option', { name: label, exact: true }).click();
    await row
      .locator('[data-field="' + field + '"]')
      .getByRole('combobox')
      .press('Enter');
  }
  await row.locator('[data-field="validity"]').click();
  await page.getByRole('spinbutton', { name: 'Validity amount' }).fill('2');
  await page
    .getByRole('spinbutton', { name: 'Validity amount' })
    .press('Enter');
  expect(requests.puts()).toBe(0);
  await page.getByRole('button', { name: 'Save changes', exact: true }).click();
  await expect.poll(requests.puts).toBe(1);
  expect(saved).toMatchObject({
    actionDefinitions: {
      'Dynamic activity': {
        documentLink: DocumentLinkRequirement.Required,
        noteEntry: NoteEntryRequirement.Allowed,
        validity: '60.00:00:00',
      },
    },
  });
  await row.locator('[data-field="validity"]').click();
  await page.getByRole('spinbutton', { name: 'Validity amount' }).fill('0');
  await page
    .getByRole('spinbutton', { name: 'Validity amount' })
    .press('Enter');
  await expect(
    page.getByRole('button', { name: 'Save changes', exact: true })
  ).toBeDisabled();
  await page
    .getByRole('spinbutton', { name: 'Validity amount' })
    .press('Escape');
  expect(requests.puts()).toBe(1);
});

test('failed action batch save retains staged values and existing error feedback', async ({
  page,
}) => {
  const requests = await backend(page, true, false, actionDefinitionPolicy());
  await mount(page, 'actionDefinitions');
  const cell = page.locator(
    '[data-id="Dynamic activity"] [data-field="instructions"]'
  );
  await cell.click();
  await cell.locator('input').fill('Keep my draft');
  await cell.locator('input').press('Enter');
  expect(requests.puts()).toBe(0);
  await page.getByRole('button', { name: 'Save changes', exact: true }).click();
  await expect(page.getByTestId('policy-save-errors')).toContainText(
    blockingError
  );
  await expect(cell).toHaveText('Keep my draft');
  await expect(
    page.getByRole('button', { name: 'Editing help', exact: true })
  ).toHaveCount(0);
  await expect(
    page.getByRole('alert').filter({ hasText: 'Your draft is retained' })
  ).toBeVisible();
  expect(requests.puts()).toBe(1);
});

test('batch Save prevents duplicate submissions and stays dirty until persistence succeeds', async ({
  page,
}) => {
  await backend(page, false, false, actionDefinitionPolicy());
  let stored = actionDefinitionPolicy();
  let writes = 0;
  let release!: () => void;
  const pending = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route('**/Configuration/policy', async (route) => {
    if (route.request().method() === 'PUT') {
      writes++;
      await pending;
      stored = route.request().postDataJSON();
    }
    await route.fulfill({ json: stored });
  });
  await mount(page, 'actionDefinitions');
  const cell = page.locator(
    '[data-id="Dynamic activity"] [data-field="instructions"]'
  );
  await cell.click();
  await cell.locator('input').fill('Pending batch');
  await cell.locator('input').press('Enter');
  await page.getByRole('button', { name: 'Save changes', exact: true }).click();
  const saving = page.getByRole('button', { name: 'Saving…', exact: true });
  await expect(saving).toBeDisabled();
  await expect(
    page.getByRole('button', { name: 'Editing help', exact: true })
  ).toHaveCount(0);
  await expect(page.getByRole('status')).toContainText(/unsaved change/i);
  await saving.dispatchEvent('click');
  expect(writes).toBe(1);
  release();
  await expect(
    page.getByText('Changes saved successfully', { exact: true })
  ).toBeVisible();
  expect(writes).toBe(1);
});

test('dirty grid navigation warns and Cancel allows navigation without writes', async ({
  page,
}) => {
  const requests = await backend(page, false, false, actionDefinitionPolicy());
  await mount(page, 'actionDefinitions');
  const cell = page.locator(
    '[data-id="Dynamic activity"] [data-field="instructions"]'
  );
  await cell.click();
  await cell.locator('input').fill('Unsaved');
  await cell.locator('input').press('Enter');
  const decision = policyDecision(page, false);
  await page.getByRole('link', { name: 'Settings', exact: true }).click();
  await decision;
  await expect(page).toHaveURL(/settings\/action-definitions/);
  await cancelPolicyForm(page);
  await page.getByRole('link', { name: 'Settings', exact: true }).click();
  await page.getByRole('button', { name: /^Location Settings/ }).click();
  await page.getByRole('button', { name: /Case Policies/ }).click();
  await expect(
    page.getByRole('region', { name: 'Case Policies', exact: true })
  ).toBeVisible();
  expect(requests.puts()).toBe(0);
});

test('Cancel keeps the action grid quick filter while restoring draft values', async ({
  page,
}) => {
  const requests = await backend(page, false, false, actionDefinitionPolicy());
  await mount(page, 'actionDefinitions');
  const cell = page.locator(
    '[data-id="Dynamic activity"] [data-field="instructions"]'
  );
  await cell.click();
  await cell.locator('input').fill('Discard this');
  await cell.locator('input').press('Enter');
  await page.getByRole('button', { name: 'Search', exact: true }).click();
  await page.getByRole('searchbox').fill('Dynamic');
  await cancelPolicyForm(page);
  await expect(page.getByRole('searchbox')).toHaveValue('Dynamic');
  await expect(cell).toHaveText('Original instructions');
  expect(requests.puts()).toBe(0);
});

test('mobile Action Definitions stage a single-click enum edit and save explicitly', async ({
  page,
}) => {
  await page.setViewportSize({ width: 375, height: 850 });
  const requests = await backend(page, false, false, actionDefinitionPolicy());
  await mount(page, 'actionDefinitions');
  const cell = page.locator(
    '[data-id="Dynamic activity"] [data-field="document"]'
  );
  await cell.click();
  await page.getByRole('option', { name: 'Required', exact: true }).click();
  await cell.getByRole('combobox').press('Enter');
  expect(requests.puts()).toBe(0);
  await page.getByRole('button', { name: 'Save changes', exact: true }).click();
  await expect.poll(requests.puts).toBe(1);
  await expect(
    page.getByRole('button', { name: 'Save changes', exact: true })
  ).toBeDisabled();
});

for (const width of [320, 390, 768, 1440]) {
  test(`draft action bars remain readable and contained at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    const requests = await backend(
      page,
      false,
      false,
      actionDefinitionPolicy()
    );
    await mount(page, 'actionDefinitions');
    await expect(
      page.getByRole('status', { name: 'Policy draft status' })
    ).toHaveText(/^\s*$/);
    const save = page.getByRole('button', {
      name: 'Save changes',
      exact: true,
    });
    const cancel = page.getByRole('button', { name: 'Cancel', exact: true });
    await expect(save).toBeDisabled();
    await expect(cancel).toBeDisabled();
    for (const button of [save, cancel]) {
      const bounds = await button.boundingBox();
      expect(bounds).not.toBeNull();
      expect(bounds!.x).toBeGreaterThanOrEqual(0);
      expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(width);
      expect(bounds!.height).toBeGreaterThanOrEqual(40);
      expect(bounds!.height).toBeLessThanOrEqual(44);
    }
    const saveBounds = (await save.boundingBox())!;
    const cancelBounds = (await cancel.boundingBox())!;
    expect(Math.abs(saveBounds.y - cancelBounds.y)).toBeLessThan(2);
    if (width >= 600) {
      const statusBounds = (await page.getByRole('status').boundingBox())!;
      expect(
        Math.abs(
          statusBounds.y +
            statusBounds.height / 2 -
            saveBounds.y -
            saveBounds.height / 2
        )
      ).toBeLessThan(2);
    }
    await expect(
      page.getByRole('button', { name: 'Editing help', exact: true })
    ).toHaveCount(0);
    await page.goto('/org/org/a/settings/case-policies');
    await page.addScriptTag({ content: bundle });
    await expect(
      page.getByRole('grid', {
        name: 'Case Policies requirements matrix',
        exact: true,
      })
    ).toBeVisible();
    const arrangementSave = page.getByRole('button', {
      name: 'Save changes',
      exact: true,
    });
    await expect(arrangementSave).toBeDisabled();
    const arrangementBounds = (await arrangementSave.boundingBox())!;
    expect(arrangementBounds.x).toBeGreaterThanOrEqual(0);
    expect(arrangementBounds.x + arrangementBounds.width).toBeLessThanOrEqual(
      width
    );
    expect(requests.puts()).toBe(0);
  });
}

test('save status is confirmed, transient and scoped without moving controls or appearing on cancel and revert', async ({
  page,
}) => {
  const requests = await backend(page, false, false, actionDefinitionPolicy());
  await mount(page, 'actionDefinitions');
  await page.clock.install();
  const status = page.getByRole('status', { name: 'Policy draft status' });
  const save = page.getByRole('button', { name: 'Save changes', exact: true });
  const cell = page.locator(
    '[data-id="Dynamic activity"] [data-field="instructions"]'
  );
  async function stage(value: string) {
    await cell.click();
    await cell.locator('input').fill(value);
    await cell.locator('input').press('Enter');
  }
  await expect(status).toHaveText(/^\s*$/);
  await expect(page.getByTestId('CheckCircleOutlinedIcon')).toHaveCount(0);
  const clean = (await save.boundingBox())!;
  const row = save.locator('..').locator('..');
  const cleanRow = (await row.boundingBox())!;
  await stage('First saved value');
  await expect(status).toHaveText('1 unsaved change');
  await save.click();
  await expect(status).toHaveText('Changes saved successfully');
  await expect(page.getByTestId('CheckCircleOutlinedIcon')).toBeVisible();
  expect((await save.boundingBox())!.y - (await row.boundingBox())!.y).toBe(
    clean.y - cleanRow.y
  );
  expect((await row.boundingBox())!.height).toBe(cleanRow.height);
  await page.clock.runFor(3100);
  await expect(status).toHaveText(/^\s*$/);
  expect((await save.boundingBox())!.y - (await row.boundingBox())!.y).toBe(
    clean.y - cleanRow.y
  );
  expect((await row.boundingBox())!.height).toBe(cleanRow.height);
  await stage('Second saved value');
  await save.click();
  await expect(status).toHaveText('Changes saved successfully');
  await cell.click();
  await cell.locator('input').fill('Unapplied value');
  await expect(status).toHaveText('Cell edit in progress');
  await cell.locator('input').press('Escape');
  await expect(status).toHaveText(/^\s*$/);
  await stage('Cancel this value');
  await cancelPolicyForm(page);
  await expect(status).toHaveText(/^\s*$/);
  await stage('Revert this value');
  await stage('Second saved value');
  await expect(status).toHaveText(/^\s*$/);
  await expect(save).toBeDisabled();
  expect(requests.puts()).toBe(2);
  await stage('Third saved value');
  await save.click();
  await expect(status).toHaveText('Changes saved successfully');
  await page.getByRole('link', { name: 'Location B', exact: true }).click();
  await expect(page).toHaveURL('/org/org/b/settings/action-definitions');
  await expect(status).toHaveText(/^\s*$/);
  await page.clock.runFor(3100);
  await expect(status).toHaveText(/^\s*$/);
  await page.getByRole('link', { name: 'Settings', exact: true }).click();
  await page.clock.runFor(3100);
  await expect(
    page.getByText('Changes saved successfully', { exact: true })
  ).toHaveCount(0);
});

test('history confirmation restores the current entry and resumes Back and Forward only after discard', async ({
  page,
}) => {
  const requests = await backend(page, false, false, caseMatrixPolicy());
  await mount(page, 'casePolicy', undefined, true);
  await page.getByRole('link', { name: 'Location B', exact: true }).click();
  await page.getByRole('link', { name: 'Location A', exact: true }).click();
  await applyApplicability(page, 'Optional');
  const keepBack = policyDecision(page, false);
  await page.goBack();
  await keepBack;
  await expect(page).toHaveURL('/org/org/a/settings/case-policies');
  await expect(matrixCell(page, 'Form')).toHaveClass(/policy-cell-unsaved/);
  const leaveBack = policyDecision(page, true);
  await page.goBack();
  await leaveBack;
  await expect(page).toHaveURL('/org/org/b/settings/case-policies');
  await applyApplicability(page, 'Optional');
  const keepForward = policyDecision(page, false);
  await page.goForward();
  await keepForward;
  await expect(page).toHaveURL('/org/org/b/settings/case-policies');
  const leaveForward = policyDecision(page, true);
  await page.goForward();
  await leaveForward;
  await expect(page).toHaveURL('/org/org/a/settings/case-policies');
  await expect(matrixCell(page, 'Form')).not.toHaveClass(/policy-cell-unsaved/);
  expect(requests.puts()).toBe(0);
});

test('native beforeunload is present only for unsaved data and refresh preserves the draft when canceled', async ({
  page,
}) => {
  const requests = await backend(page, false, false, caseMatrixPolicy());
  await mount(page, 'casePolicy', undefined, true);
  const protectedUnload = () =>
    page.evaluate(() => {
      const event = new Event('beforeunload', { cancelable: true });
      window.dispatchEvent(event);
      return event.defaultPrevented;
    });
  expect(await protectedUnload()).toBe(false);
  await applyApplicability(page, 'Optional');
  expect(await protectedUnload()).toBe(true);
  let native = false;
  page.once('dialog', async (dialog) => {
    expect(dialog.type()).toBe('beforeunload');
    native = true;
    await dialog.dismiss();
  });
  await page.evaluate(() => window.location.reload());
  await expect.poll(() => native).toBe(true);
  await expect(matrixCell(page, 'Form')).toHaveClass(/policy-cell-unsaved/);
  await expect(
    page.getByRole('dialog', { name: 'Unsaved changes', exact: true })
  ).toHaveCount(0);
  await cancelPolicyForm(page);
  expect(await protectedUnload()).toBe(false);
  expect(requests.puts()).toBe(0);
});

for (const width of [320, 390, 768, 1440]) {
  test(`navigation dialog preserves active edits, the first destination and keyboard focus at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    const requests = await backend(page, false, false, caseMatrixPolicy());
    await mount(page, 'casePolicy', undefined, true);
    const editor = await openMatrixCell(page);
    const applicability = editor.getByRole('combobox', {
      name: 'Requirement 1 applicability',
      exact: true,
    });
    await applicability.click();
    await page.getByRole('option', { name: 'Optional', exact: true }).click();
    await page
      .getByRole('link', {
        name: 'Location B',
        exact: true,
        includeHidden: true,
      })
      .dispatchEvent('click');
    const confirmation = page.getByRole('dialog', {
      name: 'Unsaved changes',
      exact: true,
    });
    await expect(confirmation).toBeVisible();
    await expect(confirmation).toHaveAccessibleDescription(
      'You have unsaved changes. If you leave this page, your changes will be lost.'
    );
    await expect(page.locator('.MuiDialog-root:visible')).toHaveCount(1);
    const bounds = (await confirmation.boundingBox())!;
    expect(bounds.x).toBeGreaterThanOrEqual(0);
    expect(bounds.x + bounds.width).toBeLessThanOrEqual(width);
    await expect(
      confirmation.getByRole('button', { name: 'Keep Editing', exact: true })
    ).toBeFocused();
    await page.keyboard.press('Escape');
    await expect(confirmation).toBeHidden();
    await expect(page).toHaveURL('/org/org/a/settings/case-policies');
    await expect(applicability).toHaveText('Optional');
    await page
      .getByRole('link', {
        name: 'Location B',
        exact: true,
        includeHidden: true,
      })
      .dispatchEvent('click');
    await expect(confirmation).toBeVisible();
    await page
      .getByRole('link', { name: 'Settings', exact: true, includeHidden: true })
      .dispatchEvent('click');
    await expect(page.locator('.MuiDialog-root:visible')).toHaveCount(1);
    await confirmation
      .getByRole('button', { name: 'Discard & Leave', exact: true })
      .click();
    await expect(page).toHaveURL('/org/org/b/settings/case-policies');
    await expect(page.locator('.policy-cell-unsaved')).toHaveCount(0);
    expect(requests.puts()).toBe(0);
  });
}

test('draft status preserves keyboard editing without information controls', async ({
  page,
}) => {
  const requests = await backend(page, false, false, actionDefinitionPolicy());
  await mount(page, 'actionDefinitions');
  const help = page.getByRole('button', { name: 'Editing help', exact: true });
  await expect(help).toHaveCount(0);
  await expect(
    page
      .getByRole('status')
      .locator('..')
      .getByTestId('CheckCircleOutlinedIcon')
  ).toHaveCount(0);
  const cell = page.locator(
    '[data-id="Dynamic activity"] [data-field="instructions"]'
  );
  await cell.click();
  await cell.locator('input').fill('An unapplied edit');
  await expect(page.getByRole('status')).toHaveText('Cell edit in progress');
  await expect(help).toHaveCount(0);
  await expect(
    page.getByRole('status').locator('..').getByTestId('EditOutlinedIcon')
  ).toBeVisible();
  await expect(
    page.getByText('Changes saved successfully', { exact: true })
  ).toHaveCount(0);
  await expect(
    page.getByRole('button', { name: 'Save changes', exact: true })
  ).toBeDisabled();
  await cell.locator('input').press('Escape');
  await expect(page.getByRole('status')).toHaveText(/^\s*$/);
  await cell.click();
  await cell.locator('input').fill('A staged edit');
  await cell.locator('input').press('Enter');
  await expect(page.getByRole('status')).toHaveText('1 unsaved change');
  await expect(help).toHaveCount(0);
  await expect(
    page.getByRole('button', { name: 'Save changes', exact: true })
  ).toBeEnabled();
  await cancelPolicyForm(page);
  await expect(page.getByRole('status')).toHaveText(/^\s*$/);
  expect(requests.puts()).toBe(0);
});

test.describe('touch draft status', () => {
  test.use({ hasTouch: true, viewport: { width: 390, height: 900 } });
  test('matrix status has no information control or instructional popup', async ({
    page,
  }) => {
    const requests = await backend(page);
    await mount(page, 'casePolicy', undefined, true);
    const status = page.getByRole('status', { name: 'Policy draft status' });
    await expect(status).toHaveText(/^\s*$/);
    await expect(
      page.getByRole('button', { name: 'Editing help', exact: true })
    ).toHaveCount(0);
    await status.tap();
    await expect(page.getByRole('tooltip')).toHaveCount(0);
    expect(requests.puts()).toBe(0);
  });
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
  // Side panels render in a portal, so they need their own ph-unmask scope.
  expect(
    await page
      .getByText(
        'The changes could not be saved. Review the policy errors and try again.'
      )
      .evaluate((element) => element.closest('.ph-unmask') !== null)
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

test('validation failure can be retried', async ({ page }) => {
  await backend(page);
  let validations = 0;
  await page.route('**/Configuration/policy/validation', (route) =>
    ++validations === 1
      ? route.fulfill({ status: 503, body: 'Unavailable' })
      : route.fulfill({ json: { errors: [], warnings: [warning] } })
  );
  await mount(page);
  await expect(page.getByRole('alert')).toContainText(
    'Policy validation could not be loaded'
  );
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

test('save that finishes after a location switch refreshes the saved location', async ({
  page,
}) => {
  await backend(page);
  let release!: () => void;
  const pending = new Promise<void>((resolve) => {
    release = resolve;
  });
  const stored: Record<string, unknown> = { a: policy(), b: policy() };
  await page.route('**/Configuration/policy', async (route) => {
    const location = route.request().url().includes('/a/Configuration')
      ? 'a'
      : 'b';
    if (route.request().method() === 'PUT') {
      await pending;
      stored[location] = route.request().postDataJSON();
    }
    await route.fulfill({ json: stored[location] });
  });
  const switchTo = (location: string) =>
    // The open drawer is modal, so switch locations through history like the back button.
    page.evaluate((target) => {
      window.history.pushState({}, '', target);
      window.dispatchEvent(new PopStateEvent('popstate'));
    }, `/org/org/${location}/settings/case-policies`);

  await mount(page, 'casePolicy');
  await expect(page.getByText(warning, { exact: true })).toBeVisible();
  await addFunction(page);
  await page.getByRole('button', { name: 'Save', exact: true }).click();
  await expect(
    page.getByRole('button', { name: 'Save', exact: true })
  ).toBeDisabled();
  await switchTo('b');
  await expect(
    page
      .getByRole('navigation', { name: 'breadcrumb' })
      .getByRole('link', { name: 'Settings', exact: true })
  ).toHaveAttribute('href', '/org/org/b/settings');
  const saved = page.waitForResponse(
    (response) =>
      response.url().includes('/a/Configuration/policy') &&
      response.request().method() === 'PUT'
  );
  release();
  await saved;

  await switchTo('a');
  await expect(
    page
      .getByRole('navigation', { name: 'breadcrumb' })
      .getByRole('link', { name: 'Settings', exact: true })
  ).toHaveAttribute('href', '/org/org/a/settings');
  for (const section of ['Arrangements', 'Hosting', 'Arrangement Functions']) {
    if (section === 'Arrangements')
      await page
        .getByRole('button', {
          name: 'Manage Arrangements & Functions',
          exact: true,
        })
        .click();
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
  let validations = 0;
  await page.route('**/Configuration/policy/validation', async (route) => {
    const initial = ++validations === 1;
    if (initial) await pending;
    await route.fulfill({
      json: { errors: [], warnings: initial ? [warning] : [] },
    });
  });
  await mount(page, 'casePolicy', undefined, true);
  await expect(
    page
      .getByRole('status')
      .filter({ hasText: 'Checking policy configuration...' })
  ).toHaveCount(1);
  await addFunction(page);
  await page.getByRole('button', { name: 'Save', exact: true }).click();
  await expect.poll(() => validations).toBe(2);
  await expect(
    page
      .getByRole('status', { includeHidden: true })
      .filter({ hasText: 'Checking policy configuration...' })
  ).toHaveCount(0);
  const response = page.waitForResponse((result) =>
    result.url().endsWith('/policy/validation')
  );
  release();
  await response;
  await expect(page.getByText(warning, { exact: true })).toHaveCount(0);
});

test.describe('policy self-service disabled', () => {
  test.use({ featureFlags: { [SELF_SERVICE_POLICY_FEATURE_FLAG]: false } });
  test('administration direct URL redirects to Settings without policy requests', async ({
    page,
  }) => {
    const requests = await backend(page);
    await mount(
      page,
      'casePolicy',
      '/org/org/a/settings/case-policies/administration'
    );
    await expect(page).toHaveURL(/\/org\/org\/a\/settings\/?$/);
    expect(requests.validations()).toBe(0);
    expect(requests.puts()).toBe(0);
  });
  test('does not validate or save while the feature is disabled', async ({
    page,
  }) => {
    const requests = await backend(page);
    await mount(page);
    await expect(
      page.getByRole('heading', { name: 'Settings', level: 1 })
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

  await mount(page, 'casePolicy');
  for (const message of expected)
    await expect(page.getByText(message, { exact: true })).toHaveCount(1);
  expect(puts).toBe(0);
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
  await openCaseAdministration(page);
  await expect.poll(() => validations).toBe(3);
  for (const message of expected)
    await expect(page.getByText(message, { exact: true })).toHaveCount(1);
  await page.getByText('Arrangements', { exact: true }).click();
  await page
    .getByRole('dialog', {
      name: 'Manage Arrangements & Functions',
      exact: true,
    })
    .getByText('Overnight Hosting', { exact: true })
    .click();
  await page.getByText('Arrangement Functions', { exact: true }).click();
  await expect(page.getByText(/^New Function -/)).toBeVisible();
  expect(puts).toBe(1);
});

import type { Page } from '@playwright/test';
import { expect, test } from './support/fixtures';
import { SELF_SERVICE_POLICY_FEATURE_FLAG } from '../src/featureFlags';
import {
  type PolicyJson,
  locationSettingsPath,
  stubLocationPolicy,
  stubPolicyValidation,
} from './support/policyApi';

type PolicyKind = 'arrangement' | 'individual' | 'family' | 'organization';

const name = 'Playwright Superseded';
const historicalSupersededAtUtc = '2026-01-02T23:45:00Z';

function roleVersions(supersededAtUtc: string) {
  return [{ version: 'v1', supersededAtUtc, requirements: [] }];
}

// Adds one historical policy of the given kind to the location's real policy.
function withHistoricalPolicy(kind: PolicyKind) {
  return (policy: PolicyJson): PolicyJson => {
    if (kind === 'arrangement') {
      const [template] = policy.referralPolicy.arrangementPolicies;
      policy.referralPolicy.arrangementPolicies = [
        {
          ...template,
          arrangementType: name,
          supersededAtUtc: historicalSupersededAtUtc,
        },
      ];
    }
    if (kind === 'individual')
      policy.volunteerPolicy.volunteerRoles[name] = {
        volunteerRoleType: name,
        policyVersions: roleVersions(historicalSupersededAtUtc),
      };
    if (kind === 'family')
      policy.volunteerPolicy.volunteerFamilyRoles[name] = {
        volunteerFamilyRoleType: name,
        policyVersions: roleVersions(historicalSupersededAtUtc),
      };
    if (kind === 'organization')
      policy.organizationApprovalPolicy.organizationRoles[name] = {
        organizationRoleType: name,
        policyVersions: roleVersions(historicalSupersededAtUtc),
      };
    return policy;
  };
}

function storedSupersededAtUtc(kind: PolicyKind, policy: PolicyJson) {
  const version =
    kind === 'arrangement'
      ? policy.referralPolicy.arrangementPolicies.find(
          (arrangement: PolicyJson) => arrangement.arrangementType === name
        )
      : kind === 'individual'
        ? policy.volunteerPolicy.volunteerRoles[name].policyVersions[0]
        : kind === 'family'
          ? policy.volunteerPolicy.volunteerFamilyRoles[name].policyVersions[0]
          : policy.organizationApprovalPolicy.organizationRoles[name]
              .policyVersions[0];
  return version.supersededAtUtc ?? null;
}

const tabs: Record<PolicyKind, string> = {
  arrangement: 'casePolicy',
  individual: 'volunteerPolicy',
  family: 'volunteerPolicy',
  organization: 'organizationPolicy',
};

// The policy list entry, which also shows whether the policy is superseded.
function policyListEntry(page: Page, kind: PolicyKind) {
  return kind === 'arrangement'
    ? page.locator('.MuiAccordionSummary-root').filter({ hasText: name })
    : page
        .getByRole('row')
        .filter({ has: page.getByRole('cell', { name, exact: true }) });
}

// Loads the page and shows the test policy in its list.
async function openPolicyList(page: Page, kind: PolicyKind) {
  await page.goto(locationSettingsPath(undefined, tabs[kind]));
  if (kind === 'arrangement')
    await page.getByRole('button', { name: 'Arrangements' }).click();
  if (kind === 'family')
    await page.getByRole('button', { name: 'Volunteer Family Roles' }).click();
  return policyListEntry(page, kind);
}

async function openPolicyPanel(page: Page, kind: PolicyKind) {
  const entry = policyListEntry(page, kind);
  if (kind === 'arrangement')
    await entry.getByRole('button', { name: 'Edit', exact: true }).click();
  else await entry.getByRole('cell', { name, exact: true }).click();
}

for (const [kind, timezoneId] of [
  ['arrangement', 'America/Sao_Paulo'],
  ['individual', 'America/New_York'],
  ['family', 'Asia/Tokyo'],
  ['organization', 'UTC'],
] as const) {
  test.describe(`${kind} in ${timezoneId} @pr`, () => {
    test.use({
      timezoneId,
      featureFlags: { [SELF_SERVICE_POLICY_FEATURE_FLAG]: true },
    });

    test('MUI calendar selection, UTC save/reload, invalid input and clearing', async ({
      page,
    }) => {
      const policy = await stubLocationPolicy(page, {
        policy: withHistoricalPolicy(kind),
      });
      await stubPolicyValidation(page, () => ({ errors: [], warnings: [] }));

      const entry = await openPolicyList(page, kind);
      await expect(entry).toContainText(
        kind === 'arrangement' ? 'Superseded' : '01/02/26'
      );
      await openPolicyPanel(page, kind);
      const picker = page.getByRole('group', {
        name: 'Superseded Date',
        exact: true,
      });
      const month = picker.getByRole('spinbutton', {
        name: 'Month',
        exact: true,
      });
      const day = picker.getByRole('spinbutton', { name: 'Day', exact: true });
      const year = picker.getByRole('spinbutton', {
        name: 'Year',
        exact: true,
      });
      const save = page.getByRole('button', { name: 'Save', exact: true });
      await expect(month).toHaveText('01');
      await expect(day).toHaveText('02');

      await month.fill('10');
      await day.fill('15');
      await year.fill('2026');
      await page.getByRole('button', { name: /choose date/i }).click();
      await page.getByRole('gridcell', { name: '16', exact: true }).click();
      await save.click();
      await expect(picker).toHaveCount(0);
      expect(policy.puts()).toBe(1);
      expect(storedSupersededAtUtc(kind, policy.stored()!)).toBe(
        '2026-10-16T00:00:00.000Z'
      );

      // Reloads the page, so the picker shows the saved value as read back.
      await openPolicyList(page, kind);
      await openPolicyPanel(page, kind);
      await expect(month).toHaveText('10');
      await expect(day).toHaveText('16');
      await expect(year).toHaveText('2026');
      await year.fill('0000');
      await expect(save).toBeDisabled();
      await year.fill('2026');
      await expect(save).toBeEnabled();
      await year.fill('');
      await year.press('Tab');
      await expect(save).toBeDisabled();
      await picker.getByRole('button', { name: 'Clear', exact: true }).click();
      await expect(save).toBeEnabled();
      await save.click();
      await expect(picker).toHaveCount(0);
      expect(policy.puts()).toBe(2);
      expect(storedSupersededAtUtc(kind, policy.stored()!)).toBeNull();
      await expect(entry).toContainText('Current');
    });
  });
}

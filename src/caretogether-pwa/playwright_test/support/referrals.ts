import type { Page } from '@playwright/test';
import { expect } from './fixtures';
import { sideNavigation } from './navigation';

type ReferralDraft = {
  title: string;
  comment: string;
};

type ClientFamilyDraft = {
  firstName: string;
  lastName: string;
};

export async function openReferralsFromSideNavigation(
  page: Page
): Promise<void> {
  const navigation = sideNavigation(page);

  await expect(navigation).toBeVisible();
  await navigation.getByRole('button', { name: /referrals/i }).click();
  await expect(
    page.getByRole('button', { name: /add new referral/i })
  ).toBeVisible();
}

export async function createReferral(
  page: Page,
  referral: ReferralDraft
): Promise<void> {
  await page.getByRole('button', { name: /add new referral/i }).click();
  await expect(
    page.getByRole('heading', { name: /open new referral/i })
  ).toBeVisible();
  await page.getByLabel(/referral title/i).fill(referral.title);
  await page.getByLabel(/referral comment/i).fill(referral.comment);
  await page.getByRole('button', { name: /^save$/i }).click();

  await expect(page.getByRole('heading', { name: referral.title })).toBeVisible(
    {
      timeout: 60_000,
    }
  );
  await expect(page.getByText(referral.comment)).toBeVisible();
}

export async function createClientFamilyForReferral(
  page: Page,
  clientFamily: ClientFamilyDraft
): Promise<string> {
  const familyName = `${clientFamily.firstName} ${clientFamily.lastName}`;

  await page.getByRole('button', { name: /add new client family/i }).click();
  await expect(
    page.getByRole('heading', {
      name: /create partnering family - first adult/i,
    })
  ).toBeVisible();
  await page.getByLabel(/first name/i).fill(clientFamily.firstName);
  await page.getByLabel(/last name/i).fill(clientFamily.lastName);
  await page.getByRole('button', { name: /create family/i }).click();

  await expect(page.getByRole('button', { name: familyName })).toBeVisible({
    timeout: 60_000,
  });

  return familyName;
}

export async function openCaseForReferral(page: Page): Promise<void> {
  await page.getByRole('button', { name: /^open case$/i }).click();
  await expect(
    page.getByRole('heading', { name: /open a new case/i })
  ).toBeVisible();
  await page.getByRole('button', { name: /^save$/i }).click();

  await expect(page.getByText(/status:\s*accepted/i)).toBeVisible({
    timeout: 60_000,
  });
  await expect(page.getByRole('button', { name: /^open case$/i })).toBeVisible();
}

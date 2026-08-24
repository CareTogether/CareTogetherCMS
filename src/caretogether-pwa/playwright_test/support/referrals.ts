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
  // TEMP E2E DEBUG - remove after investigation
  page.on('console', (message) => {
    console.log(`[browser:${message.type()}] ${message.text()}`);
  });
  page.on('pageerror', (error) => {
    console.log(`[pageerror] ${error.message}`);
  });
  page.on('requestfailed', (request) => {
    console.log(
      `[requestfailed] ${request.method()} ${request.url()} :: ${request.failure()?.errorText}`
    );
  });
  page.on('response', (response) => {
    if (response.status() >= 400) {
      console.log(
        `[http:${response.status()}] ${response.request().method()} ${response.url()}`
      );
    }
  });

  console.log(`[referral-debug] before click url=${page.url()}`);
  const addButton = page.getByRole('button', { name: /add new referral/i });
  await expect(addButton).toBeVisible();
  console.log(
    `[referral-debug] add button enabled=${await addButton.isEnabled()}`
  );
  await addButton.click();
  console.log(`[referral-debug] click completed url=${page.url()}`);
  console.log(
    `[referral-debug] headingCount=${await page.getByRole('heading', { name: /open new referral/i }).count()}`
  );
  console.log(
    `[referral-debug] initializingCount=${await page.getByText(/initializing/i).count()}`
  );
  console.log(
    `[referral-debug] errorCount=${await page.getByText(/something went wrong/i).count()}`
  );
  console.log(
    `[referral-debug] dialogCount=${await page.locator('[role="dialog"], [role="presentation"]').count()}`
  );
  console.log(`[referral-debug] after click url=${page.url()}`);

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

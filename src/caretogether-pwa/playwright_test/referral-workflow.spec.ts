import { expect, Page, test } from '@playwright/test';

const ATLANTIS_ROUTE =
  '/org/11111111-1111-1111-1111-111111111111/22222222-2222-2222-2222-222222222222/';

async function openAppHome(page: Page): Promise<void> {
  await page.goto(ATLANTIS_ROUTE);
  await page.waitForLoadState('domcontentloaded');
}

async function openReferralsFromSideNavigation(page: Page): Promise<void> {
  const sideNavigation = page.getByRole('list', {
    name: /secondary navigation/i,
  });

  await expect(sideNavigation).toBeVisible();
  await sideNavigation.getByRole('button', { name: /referrals/i }).click();
  await expect(
    page.getByRole('button', { name: /add new referral/i })
  ).toBeVisible();
}

test.describe('referral workflow', () => {
  test('creates a referral, client family, and case', async ({ page }) => {
    test.setTimeout(180_000);

    const timestamp = Date.now();
    const referralTitle = `Playwright Referral ${timestamp}`;
    const referralComment = `Created by Playwright referral workflow ${timestamp}`;
    const adultFirstName = 'Playwright';
    const adultLastName = `Client ${timestamp}`;
    const familyName = `${adultFirstName} ${adultLastName}`;

    await openAppHome(page);
    await openReferralsFromSideNavigation(page);

    await page.getByRole('button', { name: /add new referral/i }).click();
    await expect(
      page.getByRole('heading', { name: /open new referral/i })
    ).toBeVisible();
    await page.getByLabel(/referral title/i).fill(referralTitle);
    await page.getByLabel(/referral comment/i).fill(referralComment);
    await page.getByRole('button', { name: /^save$/i }).click();

    await expect(
      page.getByRole('heading', { name: referralTitle })
    ).toBeVisible({
      timeout: 60_000,
    });
    await expect(page.getByText(referralComment)).toBeVisible();

    await page.getByRole('button', { name: /add new client family/i }).click();
    await expect(
      page.getByRole('heading', {
        name: /create partnering family - first adult/i,
      })
    ).toBeVisible();
    await page.getByLabel(/first name/i).fill(adultFirstName);
    await page.getByLabel(/last name/i).fill(adultLastName);
    await page.getByRole('button', { name: /create family/i }).click();

    await expect(page.getByRole('button', { name: familyName })).toBeVisible({
      timeout: 60_000,
    });

    await page.getByRole('button', { name: /^open case$/i }).click();
    await expect(
      page.getByRole('heading', { name: /open a new case/i })
    ).toBeVisible();
    await page.getByRole('button', { name: /^save$/i }).click();

    await expect(page.getByText(/status:\s*accepted/i)).toBeVisible({
      timeout: 60_000,
    });
    await expect(
      page.getByRole('button', { name: /^open case$/i })
    ).toBeVisible();
  });
});

import { test, expect } from '@playwright/test';

const AUTH_FILE = 'playwright/.auth/admin.json';
const adminEmail = process.env.CT_ADMIN_EMAIL ?? 'test@bynalogic.com';
const adminPassword = process.env.CT_ADMIN_PASSWORD ?? 'P@ssw0rd';

test('authenticate as administrator', async ({ page }) => {
  test.setTimeout(60_000);

  await page.goto('/');
  await page.waitForLoadState('domcontentloaded');

  console.log('Current URL:', page.url());
  console.log('Page title:', await page.title());

  const emailField = page
    .getByLabel(/email/i)
    .or(page.getByPlaceholder(/email/i))
    .or(page.locator('input[type="email"]'))
    .or(page.locator('input[name*="email" i]'))
    .or(page.locator('input[id*="email" i]'));

  const passwordField = page
    .getByLabel(/password/i)
    .or(page.getByPlaceholder(/password/i))
    .or(page.locator('input[type="password"]'));

  const signInButton = page
    .getByRole('button', { name: /sign in|log in|login|next|continue/i })
    .or(page.locator('input[type="submit"]'));

  await expect(emailField.first()).toBeVisible({ timeout: 20_000 });
  await emailField.first().fill(adminEmail);

  await expect(passwordField.first()).toBeVisible({ timeout: 20_000 });
  await passwordField.first().fill(adminPassword);

  await expect(signInButton.first()).toBeVisible({ timeout: 20_000 });
  await signInButton.first().click();

  await expect(
    page.getByRole('list', { name: /secondary navigation/i })
  ).toBeVisible({ timeout: 30_000 });

  await page.context().storageState({ path: AUTH_FILE });
});

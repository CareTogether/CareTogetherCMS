import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

const AUTH_FILE = path.resolve('playwright/.auth/admin.json');

const adminEmail = process.env.CT_ADMIN_EMAIL;
const adminPassword = process.env.CT_ADMIN_PASSWORD;

test('login as administrator', async ({ page, baseURL }) => {
  test.setTimeout(420_000);

  if (!adminEmail || !adminPassword) {
    throw new Error('Missing CT_ADMIN_EMAIL or CT_ADMIN_PASSWORD');
  }

  if (!baseURL) {
    throw new Error('Missing Playwright baseURL');
  }

  const consoleErrors: string[] = [];
  const pageErrors: string[] = [];

  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });

  page.on('pageerror', (error) => {
    pageErrors.push(error.message);
  });

  fs.mkdirSync(path.dirname(AUTH_FILE), { recursive: true });

  const sideNavigation = page.getByRole('list', {
    name: /secondary navigation/i,
  });

  const emailField = page
    .getByPlaceholder(/email address/i)
    .or(page.locator('input[type="email"]'))
    .or(page.locator('input[name*="email" i]'))
    .or(page.locator('input[id*="email" i]'));

  const passwordField = page
    .getByPlaceholder(/password/i)
    .or(page.locator('input[type="password"]'));

  const b2cSignInButton = page.getByRole('button', { name: /^sign in$/i });

  const temporaryError = page.getByText(
    /something went wrong|failed to fetch/i
  );

  await page.goto('/');
  await page.waitForLoadState('domcontentloaded');

  console.log('Current URL:', page.url());
  console.log('Page title:', await page.title());

  await expect
    .poll(
      async () => {
        const url = page.url();

        if (await sideNavigation.isVisible().catch(() => false)) {
          return 'authenticated';
        }

        if (
          url.includes('b2clogin.com') ||
          (await emailField
            .first()
            .isVisible()
            .catch(() => false))
        ) {
          return 'b2c';
        }

        if (
          await temporaryError
            .first()
            .isVisible()
            .catch(() => false)
        ) {
          const errorText = await temporaryError
            .first()
            .textContent()
            .catch(() => '');
          console.log('Temporary error text:', errorText);
          return 'temporary-error';
        }

        return 'loading';
      },
      {
        timeout: 180_000,
        intervals: [1000, 2000, 5000],
      }
    )
    .toMatch(/authenticated|b2c/);

  console.log('URL after auth state wait:', page.url());
  console.log('Title after auth state wait:', await page.title());

  const onB2cPage =
    page.url().includes('b2clogin.com') ||
    (await emailField
      .first()
      .isVisible()
      .catch(() => false));

  if (onB2cPage) {
    await expect(emailField.first()).toBeVisible({ timeout: 60_000 });
    await emailField.first().fill(adminEmail);

    await expect(passwordField.first()).toBeVisible({ timeout: 60_000 });
    await passwordField.first().fill(adminPassword);

    await expect(b2cSignInButton).toBeVisible({ timeout: 60_000 });
    await b2cSignInButton.click();

    await expect
      .poll(
        async () => {
          if (await sideNavigation.isVisible().catch(() => false)) {
            return 'authenticated';
          }

          if (
            await temporaryError
              .first()
              .isVisible()
              .catch(() => false)
          ) {
            const errorText = await temporaryError
              .first()
              .textContent()
              .catch(() => '');
            console.log('Temporary error text after B2C sign-in:', errorText);
            return 'temporary-error';
          }

          return 'loading';
        },
        {
          timeout: 240_000,
          intervals: [1000, 2000, 5000],
        }
      )
      .toBe('authenticated');
  }

  if (
    await temporaryError
      .first()
      .isVisible()
      .catch(() => false)
  ) {
    await temporaryError.first().waitFor({ state: 'hidden', timeout: 240_000 });
  }

  await expect(sideNavigation).toBeVisible({ timeout: 240_000 });

  if (consoleErrors.length > 0) {
    console.log('Console errors:', consoleErrors);
  }

  if (pageErrors.length > 0) {
    console.log('Page errors:', pageErrors);
  }

  await page.context().storageState({ path: AUTH_FILE });
});

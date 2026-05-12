import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

const AUTH_FILE = path.resolve('playwright/.auth/admin.json');
const ATLANTIS_ROUTE =
  '/org/11111111-1111-1111-1111-111111111111/22222222-2222-2222-2222-222222222222/';

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

  const usernameField = page
    .locator('#username')
    .or(page.locator('input[name="username"]'))
    .or(page.getByPlaceholder(/email address/i))
    .or(page.locator('input[type="email"]'))
    .or(page.locator('input[name*="email" i]'))
    .or(page.locator('input[id*="email" i]'))
    .or(page.locator('input[name*="user" i]'))
    .or(page.locator('input[id*="user" i]'));

  const passwordField = page
    .getByPlaceholder(/password/i)
    .or(page.locator('input[type="password"]'));

  const signInButton = page
    .getByRole('button', { name: /^sign in$/i })
    .or(page.locator('input[type="submit"]'))
    .or(page.locator('#kc-login'));

  const temporaryError = page.getByText(
    /something went wrong|failed to fetch/i
  );

  await page.goto(ATLANTIS_ROUTE);
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
          url.includes('/realms/caretogether-local/') ||
          (await usernameField
            .first()
            .isVisible()
            .catch(() => false))
        ) {
          return 'identity-provider';
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
    .toMatch(/authenticated|identity-provider/);

  console.log('URL after auth state wait:', page.url());
  console.log('Title after auth state wait:', await page.title());

  const onIdentityProviderPage =
    page.url().includes('b2clogin.com') ||
    page.url().includes('/realms/caretogether-local/') ||
    (await usernameField
      .first()
      .isVisible()
      .catch(() => false));

  if (onIdentityProviderPage) {
    await expect(usernameField.first()).toBeVisible({ timeout: 60_000 });
    await usernameField.first().fill(adminEmail);

    await expect(passwordField.first()).toBeVisible({ timeout: 60_000 });
    await passwordField.first().fill(adminPassword);

    await expect(signInButton.first()).toBeVisible({ timeout: 60_000 });
    await signInButton.first().click();

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
            console.log(
              'Temporary error text after identity provider sign-in:',
              errorText
            );
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

import { expect, test } from './support/fixtures';
import fs from 'node:fs';
import path from 'node:path';
import { AUTH_FILE, ATLANTIS_ROUTE } from './support/constants';
import {
  completeLocalKeycloakSignInAsync,
  getAdminCredentials,
} from './support/auth';
import { createBrowserFailureCollector } from './support/browserFailures';
import { sideNavigation } from './support/navigation';

const authFilePath = path.resolve(AUTH_FILE);

test('login as administrator @auth', async ({ page, baseURL, request }) => {
  test.setTimeout(420_000);

  const admin = getAdminCredentials();

  if (!baseURL) {
    throw new Error('Missing Playwright baseURL');
  }

  const browserFailures = createBrowserFailureCollector(page);
  fs.mkdirSync(path.dirname(authFilePath), { recursive: true });
  const navigation = sideNavigation(page);

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

  await page
    .waitForURL(/b2clogin\.com|\/realms\/caretogether-local\//, {
      timeout: 30_000,
    })
    .catch(() => {});

  await expect
    .poll(
      async () => {
        const url = page.url();

        if (await navigation.isVisible().catch(() => false)) {
          return 'authenticated';
        }

        if (browserFailures.hasFailures()) {
          return `browser-error: ${browserFailures.summary()}`;
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

  const onIdentityProviderPage =
    page.url().includes('b2clogin.com') ||
    page.url().includes('/realms/caretogether-local/') ||
    (await usernameField
      .first()
      .isVisible()
      .catch(() => false));
  const keycloakSignInUrl = page.url().includes('/realms/caretogether-local/')
    ? page.url()
    : null;

  if (onIdentityProviderPage) {
    await expect(usernameField.first()).toBeVisible({ timeout: 60_000 });
    await usernameField.first().fill(admin.email);

    await expect(passwordField.first()).toBeVisible({ timeout: 60_000 });
    await passwordField.first().fill(admin.password);

    await expect(signInButton.first()).toBeVisible({ timeout: 60_000 });
    if (keycloakSignInUrl) {
      await page.route(
        '**/realms/caretogether-local/protocol/openid-connect/token',
        async (route) => {
          await route.abort('blockedbyclient');
        }
      );
    }

    await signInButton.first().click();

    if (keycloakSignInUrl) {
      await completeLocalKeycloakSignInAsync(
        request,
        page,
        baseURL,
        keycloakSignInUrl
      );
      await page.unroute(
        '**/realms/caretogether-local/protocol/openid-connect/token'
      );
    } else {
      await expect
        .poll(
          async () => {
            if (await navigation.isVisible().catch(() => false)) {
              return 'authenticated';
            }

            if (browserFailures.hasFailures()) {
              return `browser-error: ${browserFailures.summary()}`;
            }

            if (
              await temporaryError
                .first()
                .isVisible()
                .catch(() => false)
            ) {
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
  }

  if (
    await temporaryError
      .first()
      .isVisible()
      .catch(() => false)
  ) {
    await temporaryError.first().waitFor({ state: 'hidden', timeout: 240_000 });
  }

  await expect(navigation).toBeVisible({ timeout: 240_000 });

  await page.context().storageState({ path: authFilePath });
});

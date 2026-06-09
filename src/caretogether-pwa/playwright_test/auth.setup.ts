import { test, expect, APIRequestContext, Page } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

const AUTH_FILE = path.resolve('playwright/.auth/admin.json');
const ATLANTIS_ROUTE =
  '/org/11111111-1111-1111-1111-111111111111/22222222-2222-2222-2222-222222222222/';
const KEYCLOAK_TOKEN_STORAGE_KEY = 'caretogether.keycloak.tokens';
const KEYCLOAK_PKCE_STORAGE_KEY = 'caretogether.keycloak.pkce';

const adminEmail = process.env.CT_ADMIN_EMAIL;
const adminPassword = process.env.CT_ADMIN_PASSWORD;

type KeycloakPkceState = {
  codeVerifier: string;
  state: string;
};

async function completeLocalKeycloakSignInAsync(
  request: APIRequestContext,
  page: Page,
  baseURL: string,
  keycloakSignInUrl: string
) {
  await page.waitForURL(
    (url) => url.toString().startsWith(baseURL) && url.searchParams.has('code'),
    { timeout: 60_000 }
  );

  const callbackUrl = new URL(page.url());
  const code = callbackUrl.searchParams.get('code');
  const state = callbackUrl.searchParams.get('state');
  if (!code || !state) {
    throw new Error(`Missing Keycloak callback code or state: ${callbackUrl}`);
  }

  const storedPkceState = await page.evaluate((storageKey) => {
    return sessionStorage.getItem(storageKey);
  }, KEYCLOAK_PKCE_STORAGE_KEY);
  if (!storedPkceState) {
    throw new Error('Missing Keycloak PKCE state in session storage.');
  }

  const pkceState = JSON.parse(storedPkceState) as KeycloakPkceState;
  if (pkceState.state !== state) {
    throw new Error(
      'The Keycloak callback state did not match the PKCE state.'
    );
  }

  const authorizationUrl = new URL(keycloakSignInUrl);
  const tokenUrl = `${authorizationUrl.origin}/realms/caretogether-local/protocol/openid-connect/token`;
  const redirectUri = authorizationUrl.searchParams.get('redirect_uri');
  if (!redirectUri) {
    throw new Error('Missing Keycloak redirect URI.');
  }

  const tokenResponse = await request.post(tokenUrl, {
    form: {
      client_id: 'caretogether-pwa',
      code,
      code_verifier: pkceState.codeVerifier,
      grant_type: 'authorization_code',
      redirect_uri: redirectUri,
    },
  });

  if (!tokenResponse.ok()) {
    throw new Error(
      `Keycloak token exchange failed with ${tokenResponse.status()}: ${await tokenResponse.text()}`
    );
  }

  const tokenPayload = await tokenResponse.json();
  const storedTokens = {
    accessToken: tokenPayload.access_token,
    idToken: tokenPayload.id_token,
    refreshToken: tokenPayload.refresh_token,
    expiresAt: Date.now() + (tokenPayload.expires_in ?? 300) * 1000,
  };

  await page.addInitScript(
    ([storageKey, storageValue]) => {
      localStorage.setItem(storageKey, storageValue);
    },
    [KEYCLOAK_TOKEN_STORAGE_KEY, JSON.stringify(storedTokens)]
  );

  await page.goto(ATLANTIS_ROUTE);
}

test('login as administrator', async ({ page, baseURL, request }) => {
  test.setTimeout(420_000);

  if (!adminEmail || !adminPassword) {
    throw new Error('Missing CT_ADMIN_EMAIL or CT_ADMIN_PASSWORD');
  }

  if (!baseURL) {
    throw new Error('Missing Playwright baseURL');
  }

  const browserFailures: string[] = [];

  page.on('console', (msg) => {
    if (msg.type() !== 'error') {
      return;
    }

    browserFailures.push(`console: ${msg.text()}`);
  });

  page.on('pageerror', (error) => {
    browserFailures.push(`pageerror: ${error.message}`);
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

  await page
    .waitForURL(/b2clogin\.com|\/realms\/caretogether-local\//, {
      timeout: 30_000,
    })
    .catch(() => {});

  await expect
    .poll(
      async () => {
        const url = page.url();

        if (await sideNavigation.isVisible().catch(() => false)) {
          return 'authenticated';
        }

        if (browserFailures.length > 0) {
          return `browser-error: ${browserFailures.join(' | ')}`;
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
    await usernameField.first().fill(adminEmail);

    await expect(passwordField.first()).toBeVisible({ timeout: 60_000 });
    await passwordField.first().fill(adminPassword);

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
            if (await sideNavigation.isVisible().catch(() => false)) {
              return 'authenticated';
            }

            if (browserFailures.length > 0) {
              return `browser-error: ${browserFailures.join(' | ')}`;
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

  await expect(sideNavigation).toBeVisible({ timeout: 240_000 });

  await page.context().storageState({ path: AUTH_FILE });
});

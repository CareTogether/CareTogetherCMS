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
const maxBootstrapFailures = 20;

function sanitizedUrl(value: string): string {
  try {
    const url = new URL(value);
    return `${url.origin}${url.pathname}`;
  } catch {
    return value.split('?')[0];
  }
}

function sanitizedErrorMessage(value: string): string {
  return value
    .replace(
      /([?&](?:code|state|token|access_token|refresh_token|id_token)=)[^&\s]+/gi,
      '$1[REDACTED]'
    )
    .replace(/(bearer\s+)[^\s]+/gi, '$1[REDACTED]')
    .replace(
      /((?:access_token|refresh_token|id_token|password)\s*[:=]\s*)[^\s,}]+/gi,
      '$1[REDACTED]'
    );
}

function addBootstrapFailure(failures: string[], failure: string): void {
  if (failures.length < maxBootstrapFailures) {
    failures.push(failure);
  }
}

async function visibleApplicationState(
  page: Parameters<typeof sideNavigation>[0]
) {
  const knownStates = [
    ['Keycloak sign-in', page.locator('#username')],
    ['Signing in', page.getByText(/^signing in/i)],
    ['Loading access', page.getByText(/^loading access/i)],
    ['Setting location', page.getByText(/^setting location/i)],
    ['No organization access', page.getByText(/no organization access/i)],
    [
      'Application error',
      page.getByText(
        /unexpected error|something went wrong|application error/i
      ),
    ],
  ] as const;

  for (const [description, locator] of knownStates) {
    if (
      await locator
        .first()
        .isVisible()
        .catch(() => false)
    ) {
      return description;
    }
  }

  return 'No known authentication or application state is visible';
}

async function authenticatedShellDiagnostics({
  browserFailures,
  bootstrapFailures,
  page,
}: {
  browserFailures: ReturnType<typeof createBrowserFailureCollector>;
  bootstrapFailures: string[];
  page: Parameters<typeof sideNavigation>[0];
}): Promise<string> {
  const title = await page.title().catch(() => '(title unavailable)');
  const applicationState = await visibleApplicationState(page);
  const errors = browserFailures
    .getFailures()
    .slice(-maxBootstrapFailures)
    .map(
      (failure) => `${failure.type}: ${sanitizedErrorMessage(failure.message)}`
    );

  return [
    'Authenticated shell diagnostics',
    `URL: ${sanitizedUrl(page.url())}`,
    `Title: ${title}`,
    `Visible state: ${applicationState}`,
    `Browser errors: ${errors.length ? errors.join(' | ') : 'none'}`,
    `Bootstrap request failures: ${
      bootstrapFailures.length ? bootstrapFailures.join(' | ') : 'none'
    }`,
  ].join('\n');
}

test('login as administrator @auth', async ({ page, baseURL, request }) => {
  test.setTimeout(420_000);

  const admin = getAdminCredentials();

  if (!baseURL) {
    throw new Error('Missing Playwright baseURL');
  }

  const browserFailures = createBrowserFailureCollector(page);
  const bootstrapFailures: string[] = [];

  page.on('requestfailed', (request) => {
    addBootstrapFailure(
      bootstrapFailures,
      `${request.method()} ${sanitizedUrl(request.url())} failed: ${sanitizedErrorMessage(
        request.failure()?.errorText ?? 'unknown error'
      )}`
    );
  });
  page.on('response', (response) => {
    if (response.status() >= 400) {
      addBootstrapFailure(
        bootstrapFailures,
        `${response.request().method()} ${sanitizedUrl(response.url())} returned ${response.status()}`
      );
    }
  });

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

  try {
    await expect(navigation).toBeVisible({ timeout: 240_000 });
  } catch (error) {
    const diagnostics = await authenticatedShellDiagnostics({
      browserFailures,
      bootstrapFailures,
      page,
    });
    await test.info().attach('authenticated-shell-diagnostics', {
      body: diagnostics,
      contentType: 'text/plain',
    });
    console.error(diagnostics);
    throw error;
  }

  await page.context().storageState({ path: authFilePath });
});

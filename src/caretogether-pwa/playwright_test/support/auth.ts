import type { APIRequestContext, Page } from '@playwright/test';
import {
  ATLANTIS_ROUTE,
  KEYCLOAK_PKCE_STORAGE_KEY,
  KEYCLOAK_TOKEN_STORAGE_KEY,
} from './constants';

type KeycloakPkceState = {
  codeVerifier: string;
  state: string;
};

export function getAdminCredentials() {
  const email = process.env.CT_ADMIN_EMAIL;
  const password = process.env.CT_ADMIN_PASSWORD;

  if (!email || !password) {
    throw new Error('Missing CT_ADMIN_EMAIL or CT_ADMIN_PASSWORD');
  }

  return { email, password };
}

export async function completeLocalKeycloakSignInAsync(
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

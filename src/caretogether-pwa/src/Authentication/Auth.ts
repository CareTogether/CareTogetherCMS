import {
  PublicClientApplication,
  IPublicClientApplication,
  InteractionRequiredAuthError,
  AuthenticationResult,
} from '@azure/msal-browser';
import { AtomEffect, atom } from 'recoil';
import { loggingEffect } from '../Utilities/loggingEffect';
import { appInsights } from '../ApplicationInsightsService';
import posthog from 'posthog-js';

// MSAL configuration for single page application authorization. For guidance, see
// https://docs.microsoft.com/en-us/azure/active-directory/develop/scenario-spa-app-configuration?tabs=react and
// https://github.com/AzureAD/microsoft-authentication-library-for-js/tree/dev/lib/msal-react.
const config = {
  auth: {
    clientId: import.meta.env.VITE_APP_AUTH_CLIENT_ID,
    authority: import.meta.env.VITE_APP_AUTH_AUTHORITY,
    knownAuthorities: [import.meta.env.VITE_APP_AUTH_KNOWN_AUTHORITY],
    redirectUri: import.meta.env.VITE_APP_AUTH_REDIRECT_URI,
  },
  cache: {
    cacheLocation: 'localStorage',
  },
};

export const globalMsalInstance: IPublicClientApplication =
  new PublicClientApplication(config);

function trace(scope: string, message: string) {
  console.debug(`[${scope}] ${message}`);

  // Send trace to Application Insights
  appInsights.trackTrace({
    message: message,
    properties: {
      'Component Name': scope,
      'Auth Flow': 'MSAL Authentication',
    },
  });

  // Send trace to PostHog
  posthog.capture('auth_trace', {
    scope: scope,
    message: message,
    auth_flow: 'msal_authentication',
  });
}

function renderMsalError(error: unknown) {
  return `${error}`; //TODO: How to log MSAL.js errors?
}

function displayableError(error: Error | unknown) {
  return error; //TODO: Include a user-friendly message that's compatible with the global error boundary.
  //"Something went wrong during sign-in. Try clearing your browser cache and cookies, and report this as a bug if the issue persists."
}

const keycloakAuthEnabled =
  import.meta.env.VITE_APP_AUTH_PROVIDER?.toLowerCase() === 'keycloak';

function withDefaultScopes(scopes: string[]) {
  const defaultScopes = keycloakAuthEnabled
    ? ['openid', 'profile', 'email']
    : ['openid', 'profile', 'offline_access', 'email'];

  // Add the default OpenID Connect scopes and then deduplicate the resulting entries.
  return [...new Set(scopes.concat(defaultScopes))];
}

function parseScopes(scopes: string | undefined) {
  if (!scopes) {
    return [];
  }

  return scopes.split(/\s+/).filter((scope) => scope.length > 0);
}

const scopes = withDefaultScopes(parseScopes(import.meta.env.VITE_APP_AUTH_SCOPES));
const keycloakTokenStorageKey = 'caretogether.keycloak.tokens';
const keycloakPkceStorageKey = 'caretogether.keycloak.pkce';
const keycloakClockSkewMs = 60_000;

type KeycloakTokens = {
  accessToken: string;
  idToken?: string;
  refreshToken?: string;
  expiresAt: number;
};

type KeycloakPkceState = {
  codeVerifier: string;
  state: string;
  returnUrl: string;
};

type AccountInfo = {
  userId: string;
  email?: string;
  name?: string;
};

function keycloakEndpoint(path: string) {
  return `${import.meta.env.VITE_APP_AUTH_AUTHORITY}/protocol/openid-connect/${path}`;
}

function encodeBase64Url(bytes: ArrayBuffer) {
  const binary = String.fromCharCode(...new Uint8Array(bytes));
  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
}

function decodeBase64UrlJson<T>(value: string): T {
  const base64 = value.replace(/-/g, '+').replace(/_/g, '/');
  const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, '=');
  const json = decodeURIComponent(
    atob(padded)
      .split('')
      .map((character) =>
        `%${character.charCodeAt(0).toString(16).padStart(2, '0')}`
      )
      .join('')
  );

  return JSON.parse(json) as T;
}

function decodeJwtClaims(token: string): Record<string, unknown> {
  const [, claims] = token.split('.');
  if (!claims) {
    throw new Error('The token is not a valid JWT.');
  }

  return decodeBase64UrlJson<Record<string, unknown>>(claims);
}

function readStoredKeycloakTokens(): KeycloakTokens | null {
  const storedTokens = localStorage.getItem(keycloakTokenStorageKey);
  if (!storedTokens) {
    return null;
  }

  try {
    return JSON.parse(storedTokens) as KeycloakTokens;
  } catch {
    localStorage.removeItem(keycloakTokenStorageKey);
    return null;
  }
}

function storeKeycloakTokens(response: {
  access_token: string;
  id_token?: string;
  refresh_token?: string;
  expires_in?: number;
}) {
  const tokens: KeycloakTokens = {
    accessToken: response.access_token,
    idToken: response.id_token,
    refreshToken: response.refresh_token,
    expiresAt: Date.now() + (response.expires_in ?? 300) * 1000,
  };

  localStorage.setItem(keycloakTokenStorageKey, JSON.stringify(tokens));
  return tokens;
}

function keycloakTokensAreCurrent(tokens: KeycloakTokens) {
  return tokens.expiresAt - keycloakClockSkewMs > Date.now();
}

function keycloakAccountFromTokens(tokens: KeycloakTokens): AccountInfo {
  const claims = decodeJwtClaims(tokens.idToken ?? tokens.accessToken);
  const userIdClaim =
    claims[
      'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'
    ] ??
    claims.caretogether_user_id ??
    claims.sub;

  if (typeof userIdClaim !== 'string') {
    throw new Error('The Keycloak token does not include a valid user ID claim.');
  }

  return {
    userId: userIdClaim,
    email: typeof claims.email === 'string' ? claims.email : undefined,
    name: typeof claims.name === 'string' ? claims.name : undefined,
  };
}

async function createCodeChallenge(codeVerifier: string) {
  const digest = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(codeVerifier)
  );

  return encodeBase64Url(digest);
}

function createRandomBase64Url(byteLength: number) {
  const bytes = new Uint8Array(byteLength);
  crypto.getRandomValues(bytes);
  return encodeBase64Url(bytes.buffer);
}

async function redirectToKeycloakLoginAsync(): Promise<never> {
  const codeVerifier = createRandomBase64Url(64);
  const state = createRandomBase64Url(32);
  const codeChallenge = await createCodeChallenge(codeVerifier);
  const returnUrl = `${window.location.pathname}${window.location.search}${window.location.hash}`;
  const pkceState: KeycloakPkceState = {
    codeVerifier,
    state,
    returnUrl,
  };

  sessionStorage.setItem(keycloakPkceStorageKey, JSON.stringify(pkceState));

  const authorizationUrl = new URL(keycloakEndpoint('auth'));
  authorizationUrl.searchParams.set(
    'client_id',
    import.meta.env.VITE_APP_AUTH_CLIENT_ID
  );
  authorizationUrl.searchParams.set(
    'redirect_uri',
    import.meta.env.VITE_APP_AUTH_REDIRECT_URI
  );
  authorizationUrl.searchParams.set('response_type', 'code');
  authorizationUrl.searchParams.set('scope', scopes.join(' '));
  authorizationUrl.searchParams.set('state', state);
  authorizationUrl.searchParams.set('code_challenge', codeChallenge);
  authorizationUrl.searchParams.set('code_challenge_method', 'S256');

  setTimeout(() => {
    window.location.assign(authorizationUrl.toString());
  }, 0);

  return await new Promise<never>(() => {});
}

function readKeycloakPkceState(): KeycloakPkceState {
  const storedState = sessionStorage.getItem(keycloakPkceStorageKey);
  if (!storedState) {
    throw new Error('Missing Keycloak sign-in state.');
  }

  return JSON.parse(storedState) as KeycloakPkceState;
}

async function exchangeKeycloakCodeAsync(code: string, codeVerifier: string) {
  const response = await fetch(keycloakEndpoint('token'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      client_id: import.meta.env.VITE_APP_AUTH_CLIENT_ID,
      code,
      code_verifier: codeVerifier,
      grant_type: 'authorization_code',
      redirect_uri: import.meta.env.VITE_APP_AUTH_REDIRECT_URI,
    }),
  });

  if (!response.ok) {
    throw new Error(`Keycloak token exchange failed with ${response.status}.`);
  }

  return storeKeycloakTokens(await response.json());
}

async function handleKeycloakRedirectAsync(): Promise<AccountInfo | null> {
  const query = new URLSearchParams(window.location.search);
  const code = query.get('code');
  const state = query.get('state');
  if (!code || !state) {
    return null;
  }

  const pkceState = readKeycloakPkceState();
  if (pkceState.state !== state) {
    throw new Error('The Keycloak sign-in state did not match.');
  }

  const tokens = await exchangeKeycloakCodeAsync(code, pkceState.codeVerifier);
  sessionStorage.removeItem(keycloakPkceStorageKey);
  window.history.replaceState({}, document.title, pkceState.returnUrl || '/');

  return keycloakAccountFromTokens(tokens);
}

async function refreshKeycloakTokensAsync(tokens: KeycloakTokens) {
  if (!tokens.refreshToken) {
    return null;
  }

  const response = await fetch(keycloakEndpoint('token'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      client_id: import.meta.env.VITE_APP_AUTH_CLIENT_ID,
      grant_type: 'refresh_token',
      refresh_token: tokens.refreshToken,
    }),
  });

  if (!response.ok) {
    localStorage.removeItem(keycloakTokenStorageKey);
    return null;
  }

  return storeKeycloakTokens(await response.json());
}

async function loginAndSetActiveKeycloakAccountAsync(): Promise<AccountInfo> {
  trace(`Login`, `Checking for a Keycloak redirect response...`);
  const redirectedAccount = await handleKeycloakRedirectAsync();
  if (redirectedAccount) {
    return redirectedAccount;
  }

  const storedTokens = readStoredKeycloakTokens();
  if (storedTokens && keycloakTokensAreCurrent(storedTokens)) {
    return keycloakAccountFromTokens(storedTokens);
  }

  if (storedTokens) {
    const refreshedTokens = await refreshKeycloakTokensAsync(storedTokens);
    if (refreshedTokens) {
      return keycloakAccountFromTokens(refreshedTokens);
    }
  }

  await redirectToKeycloakLoginAsync();
  throw new Error('Redirecting to Keycloak for sign-in.');
}

async function loginAndSetActiveAccountAsync(): Promise<AccountInfo> {
  if (keycloakAuthEnabled) {
    return await loginAndSetActiveKeycloakAccountAsync();
  }

  // The ultimate objective of this function is to obtain an AuthenticationResult from Azure AD via MSAL.js
  // and return the local account ID of the authenticated account.
  let result: AuthenticationResult | null = null;

  // Step 1: Initialize the MSAL.js library
  // https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-browser/docs/initialization.md
  trace(`Login`, `Initializing MSAL...`);
  await globalMsalInstance.initialize();

  // Step 2: Since we are using redirect-based interaction, check on each page load whether the
  //         browser has just completed a redirect flow and handle the response from Azure AD if so.
  //TODO: Do we need smoother handling of deeplink routing (integrating with React Router)?
  trace(`Login`, `Checking for a redirect response to process...`);
  result = await globalMsalInstance.handleRedirectPromise();
  trace(`Login`, `Redirect result account: ${result?.account?.localAccountId}`);

  // Step 3: Look for any accounts that are already considered to be signed in by MSAL.js.
  //         Note that these accounts may or may not have a valid session with Azure AD.
  trace(`Login`, `Loading authenticated accounts...`);
  const allAccounts = globalMsalInstance.getAllAccounts();
  trace(
    `Login`,
    `MSAL accounts: ${JSON.stringify(allAccounts.map((account) => account.localAccountId))}`
  );

  // Step 4: If zero accounts were found, attempt a silent SSO to try to use the user's single
  //          active session with Azure AD (if the user has exactly one such session) to authenticate.
  if (allAccounts.length === 0) {
    try {
      trace(`Login`, `Attempting silent SSO...`);
      result = await globalMsalInstance.ssoSilent({
        scopes: scopes,
      });
      trace(`Login`, `Silent SSO was successful.`);
    } catch (error) {
      trace(`Login`, `Silent SSO failed with: ${renderMsalError(error)}`);
      if (!(error instanceof InteractionRequiredAuthError)) {
        throw displayableError(error);
      }
    }
  }

  // Step 5: If one or more accounts was found but no active account is set, set the active account.
  let activeAccount = globalMsalInstance.getActiveAccount();
  trace(`Login`, `Active account is: ${activeAccount?.localAccountId}`);
  if (allAccounts.length > 0 && !activeAccount) {
    const firstAccount = allAccounts[0];
    trace(
      `Login`,
      `Setting active account to first known account: ${firstAccount.localAccountId}`
    );
    globalMsalInstance.setActiveAccount(firstAccount);
    activeAccount = firstAccount;
  }

  // Step 6: If an active account is now set, attempt to acquire a token silently using the active account.
  if (activeAccount) {
    try {
      trace(
        `Login`,
        `Attempting silent token acquisition using the active account '${activeAccount?.localAccountId}'...`
      );
      result = await globalMsalInstance.acquireTokenSilent({
        scopes: scopes,
      });
      trace(`Login`, `Silent token acquisition was successful.`);
    } catch (error) {
      trace(
        `Login`,
        `Silent token acquisition failed with: ${renderMsalError(error)}`
      );
      if (!(error instanceof InteractionRequiredAuthError)) {
        throw displayableError(error);
      }
    }
  }

  // Step 5: One the user is authenticated, store the user's account ID for future reference.
  //         This account ID becomes the root of the Recoil dataflow graph. That is, all other
  //         API queries should be designed to only execute once this atom is initialized.
  if (result && result.account) {
    return {
      userId: result.account.localAccountId,
      email: result.account.idTokenClaims?.email?.toString(),
      name: result.account.name,
    };
  } else if (result && !result.account) {
    throw displayableError(
      new Error(
        'An authentication result was obtained but no account was determined to be signed in.'
      )
    );
  }

  // Step 6: If the user needs to authenticate interactively, trigger a redirect flow.
  try {
    trace(
      `Login`,
      `Attempting token acquisition with a redirect because interaction is required...`
    );
    const stateQueryParam = new URLSearchParams(window.location.search).get(
      'state'
    );
    await globalMsalInstance.acquireTokenRedirect({
      scopes: scopes,
      // Ensure that the 'state' parameter is always round-tripped through MSAL.
      // This is useful, e.g., for person invite redemption which may require interrupting a
      // non-authenticated user with an authentication redirect before they can complete the
      // invite redemption process.
      state: stateQueryParam ?? undefined,
    });
    throw displayableError(
      new Error(
        'This code was expected to be unreachable since acquireTokenRedirect should never actually return.'
      )
    );
  } catch (error) {
    trace(
      `Login`,
      `Token acquisition with redirect failed with: ${renderMsalError(error)}`
    );
    throw displayableError(error);
  }
}

let accountInfoStateInitialized = false;
const initializeAccountInfoStateAsync: AtomEffect<AccountInfo> = (params) => {
  trace(`InitializeAccountInfoStateAsync`, params.node.key);
  if (!accountInfoStateInitialized) {
    accountInfoStateInitialized = true;
    params.setSelf(loginAndSetActiveAccountAsync());
  } else {
    trace(
      `InitializeAccountInfoStateAsync`,
      `Initialization has already started; skipping this atom effect invocation.`
    );
  }
};

// This will be set by AuthenticationWrapper once the user has authenticated and the default account is set.
export const accountInfoState = atom<AccountInfo>({
  key: 'accountInfoState',
  effects: [loggingEffect, initializeAccountInfoStateAsync],
});

export async function tryAcquireAccessToken(): Promise<string | null> {
  if (keycloakAuthEnabled) {
    const storedTokens = readStoredKeycloakTokens();
    if (!storedTokens) {
      return null;
    }

    if (keycloakTokensAreCurrent(storedTokens)) {
      return storedTokens.accessToken;
    }

    const refreshedTokens = await refreshKeycloakTokensAsync(storedTokens);
    return refreshedTokens?.accessToken ?? null;
  }

  // This function attempts to return a current access token for the authenticated account using MSAL.js and,
  // if it can't due to required interaction, informs the caller by returning null.
  // https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-browser/docs/acquire-token.md
  trace(`tryAcquireAccessToken`, `Attempting to acquire an access token...`);

  // Step 1: Ensure that the user has an active account in MSAL.js.
  const activeAccount = globalMsalInstance.getActiveAccount();
  if (!activeAccount) {
    trace(`tryAcquireAccessToken`, `MSAL does not have an active account set.`);
    return null;
  }

  // Step 2: Attempt to acquire an access token silently using the current active account.
  //TODO: Incorporate new AAD B2C refresh token support?
  try {
    trace(
      `tryAcquireAccessToken`,
      `Attempting silent token acquisition using the active account '${activeAccount?.localAccountId}'...`
    );
    const result = await globalMsalInstance.acquireTokenSilent({
      scopes: scopes,
    });
    trace(`tryAcquireAccessToken`, `Silent token acquisition was successful.`);
    return result.accessToken;
  } catch (error) {
    trace(
      `tryAcquireAccessToken`,
      `Silent token acquisition failed with: ${renderMsalError(error)}`
    );
    if (!(error instanceof InteractionRequiredAuthError)) {
      trace(
        `tryAcquireAccessToken`,
        `This error type is unexpected and requires technical support.`
      );
      throw displayableError(error);
    } else {
      trace(
        `tryAcquireAccessToken`,
        `User interaction with Azure AD is required.`
      );
      return null;
    }
  }
}

export async function logoutAsync(): Promise<void> {
  if (keycloakAuthEnabled) {
    const storedTokens = readStoredKeycloakTokens();
    localStorage.removeItem(keycloakTokenStorageKey);

    const logoutUrl = new URL(keycloakEndpoint('logout'));
    logoutUrl.searchParams.set(
      'post_logout_redirect_uri',
      import.meta.env.VITE_APP_AUTH_REDIRECT_URI
    );

    if (storedTokens?.idToken) {
      logoutUrl.searchParams.set('id_token_hint', storedTokens.idToken);
    }

    window.location.assign(logoutUrl.toString());
    return;
  }

  trace(`Logout`, `Signing out the active account...`);

  await globalMsalInstance.logoutRedirect({
    account: globalMsalInstance.getActiveAccount() ?? undefined,
  });
}

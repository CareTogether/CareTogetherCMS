import {
  PublicClientApplication,
  IPublicClientApplication,
  InteractionRequiredAuthError,
  AuthenticationResult,
} from '@azure/msal-browser';
import { AtomEffect, atom } from 'recoil';
import { loggingEffect } from '../Utilities/loggingEffect';

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
  //TODO: Invoke App Insights as well.
}

function renderMsalError(error: unknown) {
  return `${error}`; //TODO: How to log MSAL.js errors?
}

function displayableError(error: Error | unknown) {
  return error; //TODO: Include a user-friendly message that's compatible with the global error boundary.
  //"Something went wrong during sign-in. Try clearing your browser cache and cookies, and report this as a bug if the issue persists."
}

function withDefaultScopes(scopes: string[]) {
  // Add the default OpenID Connect scopes and then deduplicate the resulting entries.
  return [
    ...new Set(scopes.concat(['openid', 'profile', 'offline_access', 'email'])),
  ];
}
const scopes = withDefaultScopes([import.meta.env.VITE_APP_AUTH_SCOPES]);

type AccountInfo = {
  userId: string;
  email?: string;
  name?: string;
};

async function loginAndSetActiveAccountAsync(): Promise<AccountInfo> {
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

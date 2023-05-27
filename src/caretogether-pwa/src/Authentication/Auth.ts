import { PublicClientApplication, IPublicClientApplication, InteractionRequiredAuthError, AuthenticationResult } from "@azure/msal-browser";
import { AtomEffect, atom } from "recoil";
import { loggingEffect } from "../Utilities/loggingEffect";

// MSAL configuration for single page application authorization. For guidance, see
// https://docs.microsoft.com/en-us/azure/active-directory/develop/scenario-spa-app-configuration?tabs=react and
// https://github.com/AzureAD/microsoft-authentication-library-for-js/tree/dev/lib/msal-react.
const config = {
  auth: {
    clientId: import.meta.env.VITE_APP_AUTH_CLIENT_ID,
    authority: import.meta.env.VITE_APP_AUTH_AUTHORITY,
    knownAuthorities: [ import.meta.env.VITE_APP_AUTH_KNOWN_AUTHORITY ],
    redirectUri: import.meta.env.VITE_APP_AUTH_REDIRECT_URI
  },
  cache: {
    cacheLocation: "localStorage"
  }
};

export const globalMsalInstance: IPublicClientApplication = new PublicClientApplication(config);

function trace(scope: string, message: string) {
  console.debug(`[${scope}] ${message}`);
  //TODO: Invoke App Insights as well.
}

function renderMsalError(error: unknown) {
  return `${error}`; //TODO: How to log MSAL.js errors?
}

function displayableError(error: Error | unknown) {
  return error; //TODO: Include a user-friendly message that's compatible with the global error boundary.
}

function withDefaultScopes(scopes: string[]) {
  // Add the default OpenID Connect scopes and then deduplicate the resulting entries.
  return [...new Set(scopes.concat([
    "openid",
    "profile",
    "offline_access"
  ]))];
}
const scopes = withDefaultScopes([import.meta.env.VITE_APP_AUTH_SCOPES]);

async function loginAndSetActiveAccountAsync(): Promise<string> {
  // The ultimate objective of this function is to obtain an AuthenticationResult from Azure AD via MSAL.js
  // and return the local account ID of the authenticated account.
  let result: AuthenticationResult | null = null;

  // Step 1: Initialize the MSAL.js library
  // https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-browser/docs/initialization.md
  trace(`Login`, `Initializing MSAL...`);
  await globalMsalInstance.initialize();

  // Step 2: Since we are using redirect-based interaction, check on each page load whether the
  //         browser has just completed a redirect flow and handle the response from Azure AD if so.
  trace(`Login`, `Checking for a redirect response to process...`);
  result = await globalMsalInstance.handleRedirectPromise();
  trace(`Login`, `Redirect result account: ${result?.account?.localAccountId}`);

  // Step 3: Look for any accounts that are already considered to be signed in by MSAL.js.
  //         Note that these accounts may or may not have a valid session with Azure AD.
  trace(`Login`, `Loading authenticated accounts...`);
  const allAccounts = globalMsalInstance.getAllAccounts();
  trace(`Login`, `MSAL accounts: ${JSON.stringify(allAccounts.map(account => account.localAccountId))}`);

  if (allAccounts.length === 0) {
    // Step 4a: If zero accounts were found, attempt a silent SSO to try to use the user's single
    //          active session with Azure AD (if the user has exactly one such session) to authenticate.
    try {
      trace(`Login`, `Attempting silent SSO...`);
      result = await globalMsalInstance.ssoSilent({
        scopes: scopes
      });
      trace(`Login`, `Silent SSO was successful.`);
    } catch (error) {
      trace(`Login`, `Silent SSO failed with: ${renderMsalError(error)}`);
      if (!(error instanceof InteractionRequiredAuthError)) {
        throw displayableError(error);
      }
    }
  } else {
    // Step 4b: If one or more accounts was found, set the active account (if needed) and attempt
    //          to acquire a token silently to verify the user's authentication.
    if (allAccounts.length > 1) {
      //NOTE: Based on the documentation, we can assume that if only one account is found then MSAL will
      //      guarantee that it is *always* the active account.
      const firstAccount = allAccounts[0];
      trace(`Login`, `Setting active account to first known account: ${firstAccount.localAccountId}`);
      globalMsalInstance.setActiveAccount(firstAccount);
    }
    const activeAccount = globalMsalInstance.getActiveAccount();
    trace(`Login`, `Active account is: ${activeAccount?.localAccountId}`);
    try {
      trace(`Login`, `Attempting silent token acquisition using the active account '${activeAccount?.localAccountId}'...`);
      result = await globalMsalInstance.acquireTokenSilent({
        scopes: scopes
      });
      trace(`Login`, `Silent token acquisition was successful.`);
    } catch (error) {
      trace(`Login`, `Silent token acquisition failed with: ${renderMsalError(error)}`);
      if (!(error instanceof InteractionRequiredAuthError)) {
        throw displayableError(error);
      }
    }
  }

  // Step 5: One the user is authenticated, store the user's account ID for future reference.
  //         This becomes the root of the Recoil dataflow graph.
  if (result && result.account) {
    return result.account.localAccountId;
  } else if (result && !result.account) {
    throw displayableError(
      new Error("An authentication result was obtained but no account was determined to be signed in."));
  }

  // Step 6: If the user needs to authenticate interactively, trigger a redirect flow.
  try {
    trace(`Login`, `Attempting token acquisition with a redirect because interaction is required...`);
    const stateQueryParam = new URLSearchParams(window.location.search).get("state");
    await globalMsalInstance.acquireTokenRedirect({
      scopes: scopes,
      // Ensure that the 'state' parameter is always round-tripped through MSAL.
      // This is useful, e.g., for person invite redemption which may require interrupting a
      // non-authenticated user with an authentication redirect before they can complete the
      // invite redemption process.
      state: stateQueryParam ?? undefined
    });
    throw displayableError(
      new Error("This code was expected to be unreachable since acquireTokenRedirect should never actually return."));
  } catch (error) {
    trace(`Login`, `Token acquisition with redirect failed with: ${renderMsalError(error)}`);
    throw displayableError(error);
  }
}

//TODO: Add an event callback to be notified if the user's session expires?
//      NO -- idiomatic MSAL.js usage is to stick with these 'acquireToken*' flows and then alert the user if interaction is needed.

const initializeUserIdStateAsync: AtomEffect<any> = params => {
  trace("InitializeUserIdStateAsync", params.node.key);
  params.setSelf(loginAndSetActiveAccountAsync());
}

// This will be set by AuthenticationWrapper once the user has authenticated and the default account is set.
export const userIdState = atom<string>({
  key: 'userIdState',
  effects: [
    loggingEffect,
    initializeUserIdStateAsync
  ]
});

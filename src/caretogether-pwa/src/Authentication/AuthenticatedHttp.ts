import { IPublicClientApplication } from "@azure/msal-browser";
import { globalMsalInstance } from "./Auth";

const acquireAccessToken = async (msalInstance: IPublicClientApplication) => {
  const activeAccount = msalInstance.getActiveAccount();
  const accounts = msalInstance.getAllAccounts();

  if (!activeAccount && accounts.length === 0) {
    /*
    * User is not signed in. Throw error or wait for user to login.
    * Do not attempt to log a user in outside of the context of MsalProvider
    */
    throw new Error("User is not signed in.");
  }
  const request = {
    scopes: [import.meta.env.VITE_APP_AUTH_SCOPES],
    account: activeAccount || accounts[0]
  };

  // This will throw an exception on failure.
  const authResult = await msalInstance.acquireTokenSilent(request);
  //TODO: Handle failure:
  // if (e instanceof InteractionRequiredAuthError) {
  //   globalMsalInstance.acquireTokenRedirect({
  //     ... (or somehow engage with the user to avoid losing unsaved work?)
  //   })
  // }

  return authResult.accessToken
};

class AuthenticatedHttp {
  async fetch(url: RequestInfo, init?: RequestInit): Promise<Response> {
    const accessToken = await acquireAccessToken(globalMsalInstance);

    init && (init.headers = {
      ...init.headers,
      Authorization: `Bearer ${accessToken}`
    });
    return window.fetch(url, init);
  }
}

export const authenticatingFetch = new AuthenticatedHttp();

import { IPublicClientApplication } from "@azure/msal-browser";
import { globalMsalInstance } from "./Auth";

const acquireAccessToken = async (msalInstance: IPublicClientApplication) => {
  // As long as this function is only called by the model classes after the user has authenticated,
  // either 'activeAccount' or 'accounts' will return a usable value.
  const activeAccount = msalInstance.getActiveAccount();
  const accounts = msalInstance.getAllAccounts();

  const request = {
    scopes: [process.env.REACT_APP_AUTH_SCOPES],
    account: activeAccount || accounts[0]
  };

  try {
    const authResponse = await msalInstance.acquireTokenSilent(request);
    return authResponse.accessToken;
  } catch (error) {
    // Fall back to interaction if the silent call fails.
    await msalInstance.acquireTokenRedirect(request);
  }
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

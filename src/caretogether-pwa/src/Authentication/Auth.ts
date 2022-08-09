import { PublicClientApplication, IPublicClientApplication } from "@azure/msal-browser";

// MSAL configuration for single page application authorization. For guidance, see
// https://docs.microsoft.com/en-us/azure/active-directory/develop/scenario-spa-app-configuration?tabs=react and
// https://github.com/AzureAD/microsoft-authentication-library-for-js/tree/dev/lib/msal-react.
const config = {
  auth: {
    clientId: process.env.REACT_APP_AUTH_CLIENT_ID,
    authority: process.env.REACT_APP_AUTH_AUTHORITY,
    knownAuthorities: [ process.env.REACT_APP_AUTH_KNOWN_AUTHORITY ],
    redirectUri: process.env.REACT_APP_AUTH_REDIRECT_URI
  },
  cache: {
    cacheLocation: "localStorage"
  }
};

export const globalMsalInstance: IPublicClientApplication = new PublicClientApplication(config);

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

import { PublicClientApplication, IPublicClientApplication } from "@azure/msal-browser";

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

import React from 'react';
import ReactDOM from 'react-dom';
import { PublicClientApplication, InteractionType } from "@azure/msal-browser";
import { MsalProvider, useMsalAuthentication, useIsAuthenticated } from '@azure/msal-react';
import { AppInsightsContext } from "@microsoft/applicationinsights-react-js";
import { aiReact } from './Components/AppInsights';
import App from './App';
import reportWebVitals from './reportWebVitals';

// MSAL configuration for single page application authorization. For guidance, see
// https://docs.microsoft.com/en-us/azure/active-directory/develop/scenario-spa-app-configuration?tabs=react and
// https://github.com/AzureAD/microsoft-authentication-library-for-js/tree/dev/lib/msal-react.
const config = {
  auth: {
    clientId: 'c02dcc3a-2b74-4fef-b9ef-fc1c9e83454c',
    authority: 'https://caretogetherb2cdev.b2clogin.com/caretogetherb2cdev.onmicrosoft.com/B2C_1A_SIGNUP_SIGNIN',
    knownAuthorities: [ 'caretogetherb2cdev.b2clogin.com' ],
    redirectUri: 'http://localhost:3000'
  },
  cache: {
    cacheLocation: "localStorage" //TODO: Doing this for simplicity right now, we may want to switch back to "sessionStorage" for security.
  }
};
const publicClientApplication = new PublicClientApplication(config);

function SecureAppRoot() {
  // Force the user to sign in if not already authenticated, then render the app.
  // See https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-react/docs/hooks.md
  useMsalAuthentication(InteractionType.Redirect);
  const isAuthenticated = useIsAuthenticated();
  
  return (
    <>
      {isAuthenticated
        ? <App />
        : <p>You are not signed in. You can try to refresh your page (F5) to reattempt signing in.</p>
      }
    </>
  );
}

// Telemetry is sent to Azure Application Insights. For customization instructions, see
// https://docs.microsoft.com/en-us/azure/azure-monitor/app/javascript-react-plugin
ReactDOM.render(
  <React.StrictMode>
    <AppInsightsContext.Provider value={aiReact}>
      <MsalProvider instance={publicClientApplication}>
        <SecureAppRoot />
      </MsalProvider>
    </AppInsightsContext.Provider>
  </React.StrictMode>,
  document.getElementById('root')
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();

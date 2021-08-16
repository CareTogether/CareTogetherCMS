import React from 'react';
import ReactDOM from 'react-dom';
import { InteractionType } from "@azure/msal-browser";
import { MsalProvider, useMsalAuthentication, useIsAuthenticated } from '@azure/msal-react';
import { AppInsightsContext } from "@microsoft/applicationinsights-react-js";
import { aiReact } from './Components/AppInsights';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { RecoilRoot } from 'recoil';
import { globalMsalInstance } from './Auth';
import { MuiPickersUtilsProvider } from '@material-ui/pickers';
import DateFnsUtils from '@date-io/date-fns';
import { ModelLoader } from './Model/ModelLoader';

function AuthWrapper() {
  // Force the user to sign in if not already authenticated, then render the app.
  // See https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-react/docs/hooks.md
  useMsalAuthentication(InteractionType.Redirect);
  const isAuthenticated = useIsAuthenticated();
  
  return (
    <>
      {isAuthenticated
        ? <ModelLoader>
            <App />
          </ModelLoader>
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
      <MsalProvider instance={globalMsalInstance}>
        <MuiPickersUtilsProvider utils={DateFnsUtils}>
          <RecoilRoot>
            <AuthWrapper />
          </RecoilRoot>
        </MuiPickersUtilsProvider>
      </MsalProvider>
    </AppInsightsContext.Provider>
  </React.StrictMode>,
  document.getElementById('root')
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();

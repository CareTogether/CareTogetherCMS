import React from 'react';
import ReactDOM from 'react-dom';
import { InteractionType } from "@azure/msal-browser";
import { MsalProvider, useMsalAuthentication, useIsAuthenticated } from '@azure/msal-react';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { RecoilRoot } from 'recoil';
import { globalMsalInstance } from './Auth';
import LocalizationProvider from '@mui/x-date-pickers';
import { AdapterDateFns as DateAdapter } from '@mui/x-date-pickers/AdapterDateFns';
import { ModelLoader } from './Model/ModelLoader';
import { Theme, StyledEngineProvider } from '@mui/material';
import { ThemeProvider } from '@mui/material/styles';
import { createTheme } from '@mui/material/styles';
import ErrorBackdrop from './Components/ErrorBackdrop';
import RequestBackdrop from './Components/RequestBackdrop';
import { amber } from '@mui/material/colors';


declare module '@mui/styles/defaultTheme' {
  // eslint-disable-next-line @typescript-eslint/no-empty-interface
  interface DefaultTheme extends Theme {}
}


const theme = createTheme({
  palette: {
    primary: {
      main: '#00838f',
    },
    secondary: amber,
    tonalOffset: 0.6
  }
});

function AuthWrapper() {
  // Force the user to sign in if not already authenticated, then render the app.
  // See https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-react/docs/hooks.md
  useMsalAuthentication(InteractionType.Redirect);
  const isAuthenticated = useIsAuthenticated();
  
  return (
    <>
      {isAuthenticated
        ? <ModelLoader>
            <React.Suspense fallback={<div>Loading...</div>}>
              <App />
            </React.Suspense>
          </ModelLoader>
        : <p>You are not signed in. You can try to refresh your page (F5) to reattempt signing in.</p>
      }
      <RequestBackdrop />
      <ErrorBackdrop />
    </>
  );
}

// Telemetry is sent to Azure Application Insights. For customization instructions, see
// https://docs.microsoft.com/en-us/azure/azure-monitor/app/javascript-react-plugin
ReactDOM.render(
  <React.StrictMode>
    <StyledEngineProvider injectFirst>
      <ThemeProvider theme={theme}>
        <MsalProvider instance={globalMsalInstance}>
          <LocalizationProvider dateAdapter={DateAdapter}>
            <RecoilRoot>
              <AuthWrapper />
            </RecoilRoot>
          </LocalizationProvider>
        </MsalProvider>
      </ThemeProvider>
    </StyledEngineProvider>
  </React.StrictMode>,
  document.getElementById('root')
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();

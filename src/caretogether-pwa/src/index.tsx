import React from 'react';
import ReactDOM from 'react-dom/client';
import { InteractionType } from "@azure/msal-browser";
import { MsalProvider, useMsalAuthentication, useIsAuthenticated } from '@azure/msal-react';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { RecoilRoot } from 'recoil';
import { globalMsalInstance } from './Auth';
import LocalizationProvider from '@mui/x-date-pickers';
import { AdapterDateFns as DateAdapter } from '@mui/x-date-pickers/AdapterDateFns';
import { ModelLoader } from './Model/ModelLoader';
import { CssBaseline } from '@mui/material';
import { ThemeProvider } from '@mui/material/styles';
import { createTheme } from '@mui/material/styles';
import ErrorBackdrop from './Components/ErrorBackdrop';
import RequestBackdrop from './Components/RequestBackdrop';
import { amber } from '@mui/material/colors';

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

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
root.render(
  <React.StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline enableColorScheme />
      <MsalProvider instance={globalMsalInstance}>
        <LocalizationProvider dateAdapter={DateAdapter}>
          <RecoilRoot>
            <AuthWrapper />
          </RecoilRoot>
        </LocalizationProvider>
      </MsalProvider>
    </ThemeProvider>
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();

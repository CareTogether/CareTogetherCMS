import React from 'react';
import ReactDOM from 'react-dom/client';
import { AppInsightsContext } from '@microsoft/applicationinsights-react-js';
import { aiReactPlugin } from './ApplicationInsightsService';
import { ThemeProvider } from '@mui/material/styles';
import { theme } from './theme';
import { CssBaseline } from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns as DateAdapter } from '@mui/x-date-pickers/AdapterDateFns';
import { GlobalErrorBoundary } from './GlobalErrorBoundary';
import { RecoilRoot } from 'recoil';
import { BrowserRouter as Router } from "react-router-dom";
import { MsalProvider } from '@azure/msal-react';
import { globalMsalInstance } from './Authentication/Auth';
import AuthenticationWrapper from './Authentication/AuthenticationWrapper';
import { ModelRoot } from './Model/ModelRoot';
import ShellRootLayout from './Shell/ShellRootLayout';
import { AppRoutes } from './AppRoutes';
import reportWebVitals from './reportWebVitals';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
root.render(
  <React.StrictMode>
    <AppInsightsContext.Provider value={aiReactPlugin}>
      <ThemeProvider theme={theme}>
        <CssBaseline enableColorScheme />
        <LocalizationProvider dateAdapter={DateAdapter}>
          <GlobalErrorBoundary>
            <RecoilRoot>
              <Router>
                <MsalProvider instance={globalMsalInstance}>
                  <AuthenticationWrapper>
                    <ModelRoot>
                      <ShellRootLayout>
                        <AppRoutes />
                      </ShellRootLayout>
                    </ModelRoot>
                  </AuthenticationWrapper>
                </MsalProvider>
              </Router>
              {/* <RequestBackdrop />
              <ErrorBackdrop /> */}
            </RecoilRoot>
          </GlobalErrorBoundary>
        </LocalizationProvider>
      </ThemeProvider>
    </AppInsightsContext.Provider>
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();

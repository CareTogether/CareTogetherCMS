import React from 'react';
import ReactDOM from 'react-dom/client';
import { ThemeProvider } from '@mui/material/styles';
import { theme } from './theme';
import { CssBaseline } from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns as DateAdapter } from '@mui/x-date-pickers/AdapterDateFns';
import { RecoilRoot } from 'recoil';
import { BrowserRouter as Router } from "react-router-dom";
import { MsalProvider } from '@azure/msal-react';
import { globalMsalInstance } from './Authentication/Auth';
import AuthenticationWrapper from './Authentication/AuthenticationWrapper';
import { ModelLoader } from './Model/ModelLoader';
import ShellRootLayout from './Components/Shell/ShellRootLayout';
import { AppRoutes } from './AppRoutes';
import RequestBackdrop from './Components/RequestBackdrop';
import ErrorBackdrop from './Components/ErrorBackdrop';
import reportWebVitals from './reportWebVitals';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
root.render(
  <React.StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline enableColorScheme />
      <LocalizationProvider dateAdapter={DateAdapter}>
        <RecoilRoot>
          <Router>
            <MsalProvider instance={globalMsalInstance}>
              <AuthenticationWrapper>
                <ModelLoader>
                  <ShellRootLayout>
                    <AppRoutes />
                  </ShellRootLayout>
                </ModelLoader>
              </AuthenticationWrapper>
            </MsalProvider>
          </Router>
          <RequestBackdrop />
          <ErrorBackdrop />
        </RecoilRoot>
      </LocalizationProvider>
    </ThemeProvider>
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();

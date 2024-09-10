import React from 'react';
import ReactDOM from 'react-dom/client';
import { AppInsightsContext } from '@microsoft/applicationinsights-react-js';
import { aiReactPlugin } from './ApplicationInsightsService';
import { ThemeProvider } from '@mui/material/styles';
import { theme } from './theme';
import { CssBaseline } from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns as DateAdapter } from '@mui/x-date-pickers/AdapterDateFnsV3';
import { GlobalErrorBoundary } from './GlobalErrorBoundary';
import { RecoilRoot } from 'recoil';
import { BrowserRouter as Router } from 'react-router-dom';
import AuthenticationWrapper from './Authentication/AuthenticationWrapper';
import { AppRoutes } from './AppRoutes';
import RequestBackdrop from './Shell/RequestBackdrop';
import { ProgressBackdrop } from './Shell/ProgressBackdrop';

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
                <AuthenticationWrapper>
                  <React.Suspense
                    fallback={
                      <ProgressBackdrop opaque>
                        <p>Initializing...</p>
                      </ProgressBackdrop>
                    }
                  >
                    <AppRoutes />
                  </React.Suspense>
                </AuthenticationWrapper>
              </Router>
              <RequestBackdrop />
            </RecoilRoot>
          </GlobalErrorBoundary>
        </LocalizationProvider>
      </ThemeProvider>
    </AppInsightsContext.Provider>
  </React.StrictMode>
);

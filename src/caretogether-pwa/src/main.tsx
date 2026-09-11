import React from 'react';
import ReactDOM from 'react-dom/client';
import { AppInsightsContext } from '@microsoft/applicationinsights-react-js';
import { aiReactPlugin } from './ApplicationInsightsService';
import { ThemeProvider } from '@mui/material/styles';
import { theme } from './theme';
import { CssBaseline } from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns as DateAdapter } from '@mui/x-date-pickers/AdapterDateFns';
import { LicenseInfo } from '@mui/x-license';
import { GlobalErrorBoundary } from './GlobalErrorBoundary';
import { BrowserRouter as Router } from 'react-router-dom';
import AuthenticationWrapper from './Authentication/AuthenticationWrapper';
import { AppRoutes } from './AppRoutes';
import RequestBackdrop from './Shell/RequestBackdrop';
import { ProgressBackdrop } from './Shell/ProgressBackdrop';

import { PostHogProvider } from 'posthog-js/react';
import type { PostHogConfig } from 'posthog-js';
import { postHogOptions } from './Utilities/Instrumentation/postHogOptions';
import {
  FEATURE_FLAG_KEYS,
  type FeatureFlagKey,
  type FeatureFlagOverrides,
} from './featureFlags';

const muiXLicenseKey = import.meta.env.VITE_APP_MUI_X_LICENSE_KEY?.trim();
if (muiXLicenseKey) {
  LicenseInfo.setLicenseKey(muiXLicenseKey);
}

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

const app = (
  <ThemeProvider theme={theme}>
    <CssBaseline enableColorScheme />
    <LocalizationProvider dateAdapter={DateAdapter}>
      <GlobalErrorBoundary>
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
      </GlobalErrorBoundary>
    </LocalizationProvider>
  </ThemeProvider>
);

function getE2EFeatureFlags(): Record<FeatureFlagKey, boolean> | undefined {
  if (!import.meta.env.DEV) {
    return undefined;
  }

  const overrides = window.__CARETOGETHER_E2E_FEATURE_FLAGS__;
  if (!overrides) {
    return undefined;
  }

  return Object.fromEntries(
    FEATURE_FLAG_KEYS.map((featureFlag) => [
      featureFlag,
      overrides[featureFlag] ?? false,
    ])
  ) as Record<FeatureFlagKey, boolean>;
}

function getEffectivePostHogOptions(
  e2eFeatureFlags: FeatureFlagOverrides | undefined
): Partial<PostHogConfig> {
  const commonOptions = {
    api_host: import.meta.env.VITE_APP_PUBLIC_POSTHOG_HOST,
    ...postHogOptions,
  };

  if (!e2eFeatureFlags) {
    return commonOptions;
  }

  return {
    ...commonOptions,
    bootstrap: {
      distinctID: 'playwright',
      featureFlags: e2eFeatureFlags,
    },
    advanced_disable_flags: true,
    opt_out_capturing_by_default: true,
  };
}

const e2eFeatureFlags = getE2EFeatureFlags();
const postHogApiKey =
  import.meta.env.VITE_APP_PUBLIC_POSTHOG_KEY ||
  (e2eFeatureFlags ? 'phc_playwright' : undefined);

root.render(
  <React.StrictMode>
    <AppInsightsContext.Provider value={aiReactPlugin}>
      {postHogApiKey ? (
        <PostHogProvider
          apiKey={postHogApiKey}
          options={getEffectivePostHogOptions(e2eFeatureFlags)}
        >
          {app}
        </PostHogProvider>
      ) : (
        app
      )}
    </AppInsightsContext.Provider>
  </React.StrictMode>
);

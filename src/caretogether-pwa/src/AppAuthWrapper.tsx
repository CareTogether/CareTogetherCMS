import React from 'react';
import { InteractionType } from "@azure/msal-browser";
import { MsalProvider, useMsalAuthentication, useIsAuthenticated } from '@azure/msal-react';
import { globalMsalInstance } from './Auth';
import { ModelLoader } from './Model/ModelLoader';
import App from './App';

function InnerAuthWrapper() {
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
    </>
  );
}

export default function AppAuthWrapper() {
  return (
    <MsalProvider instance={globalMsalInstance}>
      <InnerAuthWrapper />
    </MsalProvider>
  );
}

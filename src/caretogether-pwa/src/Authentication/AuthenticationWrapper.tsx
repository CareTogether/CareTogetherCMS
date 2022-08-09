import React from 'react';
import { InteractionType } from "@azure/msal-browser";
import { useMsalAuthentication, useIsAuthenticated } from '@azure/msal-react';

interface InnerAuthWrapperProps {
  children?: React.ReactNode
}
function InnerAuthWrapper({ children }: InnerAuthWrapperProps) {
  // Force the user to sign in if not already authenticated, then render the app.
  // See https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-react/docs/hooks.md
  useMsalAuthentication(InteractionType.Redirect);
  const isAuthenticated = useIsAuthenticated();
  
  return (
    <>
      {isAuthenticated
        ? children
        : <p>You are not signed in. You can try to refresh your page (F5) to reattempt signing in.</p>
      }
    </>
  );
}

interface AuthenticationWrapperProps {
  children?: React.ReactNode
}
export default function AuthenticationWrapper({ children }: AuthenticationWrapperProps) {
  return (
    <InnerAuthWrapper>
      {children}
    </InnerAuthWrapper>
  );
}

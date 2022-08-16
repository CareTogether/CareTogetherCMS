import React, { useEffect } from 'react';
import { EventType, InteractionType } from "@azure/msal-browser";
import { useMsalAuthentication, useIsAuthenticated, useAccount, useMsal } from '@azure/msal-react';
import { globalMsalInstance } from './Auth';
import { ProgressBackdrop } from '../ProgressBackdrop';
import { useSetRecoilState } from 'recoil';
import { accessTokenState } from './AuthenticatedHttp';

function SignInScreen() {
  // Force the user to sign in if not already authenticated, then render the app.
  // See https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-react/docs/hooks.md
  useMsalAuthentication(InteractionType.Redirect); /*, {} as RedirectRequest*/

  return (
    <ProgressBackdrop opaque>
      <p>Signing in...</p>
      <p>If you are not redirected within a few seconds,<br /> try refreshing this page.</p>
    </ProgressBackdrop>
  );
}

interface AuthenticationWrapperProps {
  children?: React.ReactNode
}
export default function AuthenticationWrapper({ children }: AuthenticationWrapperProps) {
  useMsalAuthentication(InteractionType.None, {
    scopes: [process.env.REACT_APP_AUTH_SCOPES]
  });
  const isAuthenticated = useIsAuthenticated();
  const defaultAccount = useAccount();
  const { instance } = useMsal();
  const setAccessToken = useSetRecoilState(accessTokenState);

  // Before rendering any child components, ensure that the user is authenticated and
  // that the default account is set correctly in MSAL.
  useEffect(() => {
    const accounts = globalMsalInstance.getAllAccounts();
    const accountToActivate = accounts.length > 0 ? accounts[0] : null;
    globalMsalInstance.setActiveAccount(accountToActivate);
  }, [ isAuthenticated ]);
  
  useEffect(() => {
    const callbackId = instance.addEventCallback((event: any) => {
      if (event.eventType === EventType.ACQUIRE_TOKEN_SUCCESS) {
        const accessToken = event.payload.accessToken as string;
        setAccessToken(accessToken);
        //TODO: Register callbacks on expiration?
      }
    });

    return () => {
      if (callbackId) {
        instance.removeEventCallback(callbackId);
      }
    }
  }, [ instance, setAccessToken ]);

  return (
    <>
      {isAuthenticated && defaultAccount
        ? children
        //TODO: Handle account selection when multiple accounts are signed in
        : <SignInScreen />}
    </>
  );
}

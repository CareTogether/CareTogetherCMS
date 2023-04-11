import React, { useEffect } from 'react';
import { InteractionType } from "@azure/msal-browser";
import { useMsalAuthentication, useIsAuthenticated, useAccount } from '@azure/msal-react';
import { ProgressBackdrop } from '../Shell/ProgressBackdrop';
import { useScopedTrace } from '../Hooks/useScopedTrace';
import { useSearchParams } from 'react-router-dom';
import { useRecoilCallback } from 'recoil';
import { userIdState } from "../Model/Data";

function SignInScreen() {
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
  const trace = useScopedTrace("AuthenticationWrapper");
  trace("start");

  // Ensure that the 'state' parameter is always round-tripped through MSAL.
  // This is useful, e.g., for person invite redemption which may require interrupting a
  // non-authenticated user with an authentication redirect before they can complete the
  // invite redemption process.
  const [searchParams, ] = useSearchParams();
  const stateQueryParam = searchParams.get("state");
  trace(`state: ${stateQueryParam}`);
  
  // Force the user to sign in if not already authenticated.
  // See https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-react/docs/hooks.md
  //TODO: Handle token/session expiration to intercept the automatic redirect and prompt the user first?
  //TODO: Smoother handling of deeplink routing (integrating with React Router)?
  //TODO: Incorporate new AAD B2C refresh token support?
  useMsalAuthentication(InteractionType.Redirect, {
    scopes: [process.env.REACT_APP_AUTH_SCOPES],
    state: stateQueryParam ?? undefined
  });

  const isAuthenticated = useIsAuthenticated();
  const defaultAccount = useAccount();
  trace(`isAuthenticated: ${isAuthenticated} -- defaultAccount: ${defaultAccount?.localAccountId}`);
  
  // One the user is authenticated, store the user's account for future reference.
  // This becomes the root of the Recoil dataflow graph.
  const setUserId = useRecoilCallback(({ set, snapshot }) => (userId: string) => {
    set(userIdState, userId);
  });
  useEffect(() => {
    trace("Effect triggered");
    if (isAuthenticated && defaultAccount) {
      trace(`Setting user ID: ${defaultAccount.localAccountId}`);
      setUserId(defaultAccount.localAccountId);
    }
  }, [isAuthenticated, defaultAccount, setUserId, trace]);

  trace("render");
  return (
    <>
      {isAuthenticated && defaultAccount
        ? children
        //TODO: Handle account selection when multiple accounts are signed in (this is an edge case)
        : <SignInScreen />}
    </>
  );
}

import React, { useEffect } from 'react';
import { InteractionType } from "@azure/msal-browser";
import { useMsalAuthentication, useAccount, AuthenticatedTemplate, UnauthenticatedTemplate, useMsal } from '@azure/msal-react';
import { ProgressBackdrop } from '../Shell/ProgressBackdrop';
import { useScopedTrace } from '../Hooks/useScopedTrace';
import { useSearchParams } from 'react-router-dom';
import { useSetRecoilState } from 'recoil';
import { userIdState } from "../Model/Data";

function SignIn() {
  const trace = useScopedTrace("SignIn");

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

  return (
    <ProgressBackdrop opaque>
      <p>Signing in...</p>
      <p>If you are not redirected within a few seconds,<br /> try refreshing this page.</p>
    </ProgressBackdrop>
  );
}

function AuthenticatedUserWrapper({ children }: React.PropsWithChildren) {
  const trace = useScopedTrace("SelectedUserWrapper");

  const defaultAccount = useAccount();
  const msal = useMsal();
  
  const allAccounts = msal.accounts;

  trace(`defaultAccount: ${defaultAccount?.localAccountId}`);
  trace(`MSAL accounts: ${JSON.stringify(allAccounts.map(account => account.localAccountId))}`);

  // One the user is authenticated, store the user's account for future reference.
  // This becomes the root of the Recoil dataflow graph.
  const setUserId = useSetRecoilState(userIdState);
  useEffect(() => {
    if (defaultAccount) {
      trace(`Setting the model to use the active account's user ID: ${defaultAccount.localAccountId}`);
      setUserId(defaultAccount.localAccountId);
    } else if (allAccounts.length === 1) {
      trace("Marking the signed-in account as active");
      msal.instance.setActiveAccount(allAccounts[0]);
    } else if (allAccounts.length === 0) {
      throw new Error("Your user was unexpectedly not authenticated; please report this as a bug.");
    } else {
      throw new Error("You are signed in with more than one user account. Try clearing your browser cache and cookies, and report this as a bug if the issue persists.");
    }
  }, [allAccounts, defaultAccount, setUserId, trace]);

  return (
    <>
      {children}
    </>
  );
}

export default function AuthenticationWrapper({ children }: React.PropsWithChildren) {
  return (
    <>
      <AuthenticatedTemplate>
        {/*TODO: Handle account selection when multiple accounts are signed in (this is an edge case)*/}
        <AuthenticatedUserWrapper>
          {children}
        </AuthenticatedUserWrapper>
      </AuthenticatedTemplate>
      <UnauthenticatedTemplate>
        <SignIn />
      </UnauthenticatedTemplate>
    </>
  );
}

import React, { useEffect, useState } from 'react';
import { globalMsalInstance } from './Auth';
import { ProgressBackdrop } from '../Shell/ProgressBackdrop';
import { useScopedTrace } from '../Hooks/useScopedTrace';
import { useSearchParams } from 'react-router-dom';
import { useRecoilValueLoadable, useSetRecoilState } from 'recoil';
import { userIdState } from "../Model/Data";
import { useLoadable } from '../Hooks/useLoadable';

function SignIn() {
  const trace = useScopedTrace("SignIn");
  
  // Ensure that the 'state' parameter is always round-tripped through MSAL.
  // This is useful, e.g., for person invite redemption which may require interrupting a
  // non-authenticated user with an authentication redirect before they can complete the
  // invite redemption process.
  const [searchParams, ] = useSearchParams();
  const stateQueryParam = searchParams.get("state");
  trace(`state: ${stateQueryParam}`);
  
  // Ensure that the authenticated user is set as the default/active account.
  // One the user is authenticated, store the user's account for future reference.
  // This becomes the root of the Recoil dataflow graph.
  //const setAllAccounts = useSetRecoilState(allAccountsState);
  //TODO: Handle token/session expiration to intercept the automatic redirect and prompt the user first?
  //TODO: Smoother handling of deeplink routing (integrating with React Router)?
  //TODO: Incorporate new AAD B2C refresh token support?
  const setUserId = useSetRecoilState(userIdState);
  useEffect(() => {
    trace(`Blindly calling handleRedirectPromise...`);
    globalMsalInstance.handleRedirectPromise().then(result => {
      if (result == null) {
        trace(`handleRedirectPromise returned null`);
      } else {
        trace(`handleRedirectPromise returned a result`);
        console.log(result);
      }
    }).catch(error => {
      trace(`handleRedirectPromise returned an error`);
      console.log(error);
    });
    // trace(`starting loginRedirect with state: ${stateQueryParam}`);
    // globalMsalInstance.loginRedirect({
    //   scopes: [import.meta.env.VITE_APP_AUTH_SCOPES],
    //   state: stateQueryParam ?? undefined
    // }).then(() => {
    //   trace(`loginRedirect completed`);

    //   const allAccounts = globalMsalInstance.getAllAccounts();
    //   trace(`allAccounts length: ${allAccounts.length}`);
      
    //   let activeAccount = globalMsalInstance.getActiveAccount();
    //   trace(`activeAccount: ${activeAccount?.localAccountId}`);
  
    //   if (!activeAccount) {
    //     if (allAccounts.length === 1) {
    //       trace("Marking the sole signed-in account as active");
    //       let activeAccount = allAccounts[0];
    //       globalMsalInstance.setActiveAccount(activeAccount);
    //     } else if (allAccounts.length === 0) {
    //       throw new Error("Your user was unexpectedly not authenticated; please report this as a bug.");
    //     } else {
    //       //TODO: Handle account selection when multiple accounts are signed in (this is an edge case)
    //       throw new Error("You are signed in with more than one user account. Try clearing your browser cache and cookies, and report this as a bug if the issue persists.");
    //     }
    //   }
      
    //   trace(`Setting the model to use the active account's user ID: ${activeAccount!.localAccountId}`);
    //   setUserId(activeAccount!.localAccountId);
    // });
  }, [setUserId]);

  return (
    <ProgressBackdrop opaque>
      <p>Signing in...</p>
      <p>If you are not redirected within a few seconds,<br /> try refreshing this page.</p>
    </ProgressBackdrop>
  );
}

function AuthenticatedUserWrapper({ children }: React.PropsWithChildren) {
  //const trace = useScopedTrace("SelectedUserWrapper");
/*
  // Ensure that the authenticated user is set as the default/active account.
  // One the user is authenticated, store the user's account for future reference.
  // This becomes the root of the Recoil dataflow graph.
  useEffect(() => {
    const allAccounts = globalMsalInstance.getAllAccounts();
    trace(`MSAL accounts: ${JSON.stringify(allAccounts.map(account => account.localAccountId))}`);
    
    const activeAccount = globalMsalInstance.getActiveAccount();
    trace(`activeAccount: ${activeAccount?.localAccountId}`);

    if (activeAccount) {
      trace(`Setting the model to use the active account's user ID: ${activeAccount.localAccountId}`);
      setUserId(activeAccount.localAccountId);
    } else if (allAccounts.length === 1) {
      trace("Marking the signed-in account as active");
      globalMsalInstance.setActiveAccount(allAccounts[0]);
    } else if (allAccounts.length === 0) {
      throw new Error("Your user was unexpectedly not authenticated; please report this as a bug.");
    } else {
      //TODO: Handle account selection when multiple accounts are signed in (this is an edge case)
      throw new Error("You are signed in with more than one user account. Try clearing your browser cache and cookies, and report this as a bug if the issue persists.");
    }
  }, [setUserId, trace]);
*/
  return (
    <>
      {children}
    </>
  );
}

export default function AuthenticationWrapper({ children }: React.PropsWithChildren) {
  const trace = useScopedTrace("AuthenticationWrapper");

  const [msalInitialized, setMsalInitialized] = useState(false);

  useEffect(() => {
    (async () => {
      trace("Initializing MSAL...");
      await globalMsalInstance.initialize();
      trace("MSAL initialization completed.");
      setMsalInitialized(true);
    })();
  }, [setMsalInitialized]);
  
  //TODO: Add an event callback to be notified if the user's session expires?
  // Force the user to sign in if not already authenticated.
  const userId = useLoadable(userIdState);
  trace(`userId: ${userId}`);

  return (!msalInitialized
    ? <ProgressBackdrop opaque>
        <p>Initializing security...</p>
      </ProgressBackdrop>
    : !userId
    ? <SignIn />
    : <AuthenticatedUserWrapper>
        {children}
      </AuthenticatedUserWrapper>
  );
}

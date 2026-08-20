import React, { Suspense } from 'react';
import { ProgressBackdrop } from '../Shell/ProgressBackdrop';
import { useScopedTrace } from '../Hooks/useScopedTrace';
import { useAccountInfo } from '../Authentication/Auth';

function AuthenticatedUserWrapper({ children }: React.PropsWithChildren) {
  const trace = useScopedTrace('AuthenticatedUserWrapper');

  // This will suspend until a user ID has been set by the `accountInfoState` initialization logic.
  const userId = useAccountInfo()?.userId;
  trace(`userId: ${userId}`);

  return <>{userId ? children : <></>}</>;
}

export default function AuthenticationWrapper({
  children,
}: React.PropsWithChildren) {
  return (
    <Suspense
      fallback={
        <ProgressBackdrop opaque>
          <p>Signing in...</p>
          <p>
            If you are not redirected within a few seconds,
            <br /> try refreshing this page.
          </p>
        </ProgressBackdrop>
      }
    >
      <AuthenticatedUserWrapper>{children}</AuthenticatedUserWrapper>
    </Suspense>
  );
}

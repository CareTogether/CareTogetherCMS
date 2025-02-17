import { useEffect } from 'react';
import { accountInfoState } from '../../Authentication/Auth';
import { useLoadable } from '../../Hooks/useLoadable';
import posthog from 'posthog-js';

export const usePostHogIdentify = () => {
  const accountInfo = useLoadable(accountInfoState);

  // Passing the properties to the deps array avoids calling the effect twice.
  useEffect(() => {
    if (accountInfo?.userId) {
      posthog.identify(accountInfo.userId, {
        email: accountInfo.email,
        name: accountInfo.name,
      });
    }
  }, [accountInfo?.userId, accountInfo?.email, accountInfo?.name]);
};

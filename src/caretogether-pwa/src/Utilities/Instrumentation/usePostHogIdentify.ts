import { useEffect } from 'react';
import { accountInfoState } from '../../Authentication/Auth';
import { useLoadable } from '../../Hooks/useLoadable';
import posthog from 'posthog-js';

export const usePostHogIdentify = () => {
  const accountInfo = useLoadable(accountInfoState);

  // Passing the properties to the deps array avoids calling the effect twice.
  useEffect(() => {
    if (!accountInfo?.userId) {
      return;
    }

    const userProperties = {
      email: accountInfo.email,
      name: accountInfo.name,
    };
    const distinctIdBeforeIdentify = posthog.get_distinct_id();

    posthog.identify(accountInfo.userId, userProperties);

    if (distinctIdBeforeIdentify === accountInfo.userId) {
      posthog.setPersonPropertiesForFlags(userProperties);
    }
  }, [accountInfo?.userId, accountInfo?.email, accountInfo?.name]);
};

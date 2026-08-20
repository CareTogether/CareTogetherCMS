import { useEffect } from 'react';
import { useAccountInfo } from '../../Authentication/Auth';
import posthog from 'posthog-js';

export const usePostHogIdentify = () => {
  const accountInfo = useAccountInfo();

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

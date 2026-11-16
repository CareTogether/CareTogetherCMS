import { useFeatureFlagEnabled } from 'posthog-js/react';
import { Permission } from '../GeneratedClient';
import { useVisibleReferralsLoadable } from '../Model/Data';
import { useGlobalPermissionsLoadable } from '../Model/SessionModel';
import { REFERRALS_FEATURE_FLAG } from '../featureFlags';

export function useCanAccessReferrals() {
  const referralsEnabled = useFeatureFlagEnabled(REFERRALS_FEATURE_FLAG);
  const permissions = useGlobalPermissionsLoadable();
  const visibleReferrals = useVisibleReferralsLoadable();

  return (
    !!referralsEnabled &&
    (permissions(Permission.CreateV1Referral) ||
      permissions(Permission.ViewV1Referral) ||
      (visibleReferrals?.length ?? 0) > 0)
  );
}

import { useFeatureFlagEnabled } from 'posthog-js/react';
import { REFERRALS_FEATURE_FLAG } from '../featureFlags';
import { Permission } from '../GeneratedClient';
import { useVisibleReferrals } from '../Model/Data';
import { useGlobalPermissions } from '../Model/SessionModel';
import { useFeatureFlagsLoaded } from '../Utilities/Instrumentation/useFeatureFlagsLoaded';

export function useReferralsAccessGate() {
  const referralsEnabled = useFeatureFlagEnabled(REFERRALS_FEATURE_FLAG);
  const featureFlagsLoaded = useFeatureFlagsLoaded();
  const permissions = useGlobalPermissions();
  const referralRecords = useVisibleReferrals();

  const canCreateReferrals = permissions(Permission.CreateV1Referral);
  const canViewGlobalReferrals = permissions(Permission.ViewV1Referral);
  const canViewContextualReferrals = referralRecords.length > 0;
  const canAccessReferrals =
    canCreateReferrals || canViewGlobalReferrals || canViewContextualReferrals;

  return {
    canAccessReferrals,
    referralsEnabled,
    shouldRedirect:
      !canAccessReferrals ||
      (featureFlagsLoaded && referralsEnabled !== true),
    shouldShowLoading: !featureFlagsLoaded,
    shouldShowReferrals:
      featureFlagsLoaded && canAccessReferrals && referralsEnabled === true,
  };
}

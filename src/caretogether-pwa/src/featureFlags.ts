export const FAMILY_SCREEN_V2_EARLY_ACCESS_FEATURE_FLAG = 'family-screen-v2-ea';
export const FUNCTION_ASSIGNMENTS_FEATURE_FLAG = 'volunteer-assignments';
export const SELF_SERVICE_POLICY_FEATURE_FLAG = 'self-service-policy';
export const FAMILY_MEMBER_CUSTOM_FIELDS_FEATURE_FLAG =
  'family-member-custom-fields';
export const FAMILY_MEMBER_PRINT_INFORMATION_FEATURE_FLAG =
  'family-member-print-information';
export const ORGANIZATION_CATEGORIES_FEATURE_FLAG = 'organization-categories';
export const ORGANIZATION_APPROVALS_FEATURE_FLAG = 'organization-approvals';
export const REFERRALS_FEATURE_FLAG = 'referrals';
export const UPDATE_TEST_FAMILY_FEATURE_FLAG = 'updateTestFamilyFlag';
export const PERMISSIONS_AUTOCOMPLETE_FEATURE_FLAG = 'permissionsAutocomplete';

export const FEATURE_FLAG_KEYS = [
  FAMILY_SCREEN_V2_EARLY_ACCESS_FEATURE_FLAG,
  FUNCTION_ASSIGNMENTS_FEATURE_FLAG,
  SELF_SERVICE_POLICY_FEATURE_FLAG,
  FAMILY_MEMBER_CUSTOM_FIELDS_FEATURE_FLAG,
  FAMILY_MEMBER_PRINT_INFORMATION_FEATURE_FLAG,
  ORGANIZATION_CATEGORIES_FEATURE_FLAG,
  ORGANIZATION_APPROVALS_FEATURE_FLAG,
  REFERRALS_FEATURE_FLAG,
  UPDATE_TEST_FAMILY_FEATURE_FLAG,
  PERMISSIONS_AUTOCOMPLETE_FEATURE_FLAG,
] as const;

export type FeatureFlagKey = (typeof FEATURE_FLAG_KEYS)[number];
export type FeatureFlagOverrides = Partial<Record<FeatureFlagKey, boolean>>;

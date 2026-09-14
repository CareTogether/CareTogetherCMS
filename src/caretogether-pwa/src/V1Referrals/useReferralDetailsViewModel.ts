import { useCallback, useMemo } from 'react';
import { useFeatureFlagEnabled } from 'posthog-js/react';
import { useFamilyLookup } from '../Model/DirectoryModel';
import { useVisibleReferrals } from '../Model/Data';
import { usePartneringFamilies } from '../Model/V1CasesModel';
import { usePolicy } from '../Model/PolicyModel';
import {
  useAllPartneringFamiliesPermissions,
  useFamilyPermissions,
} from '../Model/SessionModel';
import { Permission, V1ReferralStatus } from '../GeneratedClient';
import { FUNCTION_ASSIGNMENTS_FEATURE_FLAG } from '../featureFlags';
import {
  buildReferralCaseOptionsForFamily,
  buildReferralCustomFieldDisplayRows,
  buildReferralDocumentDisplayRows,
  buildReferralFamilyOptions,
  deriveReferralFamilyActionFlags,
  familyHasAnyV1Case,
  familyHasOpenV1Case,
  findLinkedV1ReferralCase,
  formatReferralCaseLabel,
} from './referralDetailsModel';

export function useReferralDetailsViewModel(referralId?: string) {
  const referralInfos = useVisibleReferrals();
  const familyLookup = useFamilyLookup();
  const families = usePartneringFamilies();
  const policy = usePolicy();
  const functionAssignmentsEnabled = useFeatureFlagEnabled(
    FUNCTION_ASSIGNMENTS_FEATURE_FLAG
  );
  const allPartneringFamiliesPermissions =
    useAllPartneringFamiliesPermissions();

  const referralInfo = useMemo(
    () => referralInfos.find((r) => r.referral?.referralId === referralId),
    [referralInfos, referralId]
  );
  const referral = referralInfo?.referral;
  const family = referral?.familyId
    ? familyLookup(referral.familyId)
    : undefined;
  const familyPermissions = useFamilyPermissions(family);

  const linkedV1Case = useMemo(
    () =>
      referral
        ? findLinkedV1ReferralCase(family, referral.referralId)
        : undefined,
    [family, referral]
  );
  const familyHasOpenCase = familyHasOpenV1Case(family);
  const referralAlreadyLinkedToCase = !!linkedV1Case;
  const familyHasAnyCase = familyHasAnyV1Case(family);
  const isOpen = referral?.status === V1ReferralStatus.Open;
  const isClosed = referral?.status === V1ReferralStatus.Closed;
  const referralPermissions = useCallback(
    (permission: Permission) =>
      referralInfo?.userPermissions?.includes(permission) ?? false,
    [referralInfo?.userPermissions]
  );
  const canEditReferral = referralPermissions(Permission.EditV1Referral);
  const canCloseReferral = referralPermissions(Permission.CloseV1Referral);
  const canReopenReferral = referralPermissions(Permission.ReopenV1Referral);
  const canViewFunctionAssignments = referralPermissions(
    Permission.ViewV1ReferralFunctionAssignments
  );
  const canEditFunctionAssignments = referralPermissions(
    Permission.EditV1ReferralFunctionAssignments
  );
  const {
    canCreateClientFamily,
    canLinkExistingCase,
    canOpenCase,
    canSelectFamily,
  } = deriveReferralFamilyActionFlags({
    canCreateAnyV1Case: allPartneringFamiliesPermissions(
      Permission.CreateV1Case
    ),
    canCreateFamilyV1Case: familyPermissions(Permission.CreateV1Case),
    canEditAnyFamilyInfo: allPartneringFamiliesPermissions(
      Permission.EditFamilyInfo
    ),
    canEditFamilyV1Case: familyPermissions(Permission.EditV1Case),
    canEditReferral,
    familyHasAnyCase,
    familyHasOpenCase,
    hasReferralFamily: !!referral?.familyId,
    isClosed,
    isOpen,
    referralAlreadyLinkedToCase,
  });
  const familyOptions = useMemo(
    () => buildReferralFamilyOptions(families),
    [families]
  );
  const referralCustomFields = useMemo(
    () => policy.referralPolicy?.customFields ?? [],
    [policy.referralPolicy?.customFields]
  );
  const functionAssignmentPolicies =
    policy.v1ReferralPolicy?.functionAssignmentPolicies ?? [];
  const referralCustomFieldDisplayRows = useMemo(
    () =>
      buildReferralCustomFieldDisplayRows(
        referralCustomFields,
        referral?.completedCustomFields
      ),
    [referral?.completedCustomFields, referralCustomFields]
  );
  const referralDocumentDisplayRows = useMemo(
    () => buildReferralDocumentDisplayRows(referral?.uploadedDocuments),
    [referral?.uploadedDocuments]
  );
  const referralRequirements = referral?.missingIntakeRequirements ?? [];
  const linkedV1CaseLabel = linkedV1Case
    ? formatReferralCaseLabel(
        linkedV1Case === family?.partneringFamilyInfo?.openV1Case,
        linkedV1Case.closedAtUtc
      )
    : undefined;
  const buildCaseOptionsForFamily = useCallback(
    (familyId: string) =>
      buildReferralCaseOptionsForFamily(familyLookup(familyId)),
    [familyLookup]
  );

  return {
    buildCaseOptionsForFamily,
    canCloseReferral,
    canCreateClientFamily,
    canEditFunctionAssignments,
    canEditReferral,
    canLinkExistingCase,
    canOpenCase,
    canReopenReferral,
    canSelectFamily,
    canViewFunctionAssignments,
    family,
    familyOptions,
    functionAssignmentPolicies,
    functionAssignmentsEnabled,
    isClosed,
    isOpen,
    linkedV1Case,
    linkedV1CaseLabel,
    referral,
    referralAlreadyLinkedToCase,
    referralCustomFieldDisplayRows,
    referralDocumentDisplayRows,
    referralInfo,
    referralRequirements,
  };
}

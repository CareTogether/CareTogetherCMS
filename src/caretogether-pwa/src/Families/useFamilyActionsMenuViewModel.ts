import { Permission, RoleRemovalReason } from '../GeneratedClient';
import type { CombinedFamilyInfo } from '../GeneratedClient';
import type { PrintableFamilyMember } from './FamilyMemberPrintData';

type PermissionCheck = (permission: Permission) => boolean;

export type FamilyRoleRemovalActionModel = {
  key: string;
  label: string;
  role: string;
};

export type FamilyRoleResetActionModel = {
  key: string;
  label: string;
  role: string;
  removalReason: RoleRemovalReason;
  removalAdditionalComments: string;
};

export type FamilyActionsMenuViewModel = {
  canAddNotes: boolean;
  canEditFamilyInfo: boolean;
  canUploadDocuments: boolean;
  hasFamilyActions: boolean;
  hasMoreMenuActions: boolean;
  roleRemovalActions: FamilyRoleRemovalActionModel[];
  roleResetActions: FamilyRoleResetActionModel[];
  showCompleteOtherAction: boolean;
  showDeleteFamilyAction: boolean;
  showToggleTestFamilyAction: boolean;
  toggleTestFamilyLabel: string;
};

type UseFamilyActionsMenuViewModelParameters = {
  family?: CombinedFamilyInfo;
  familyMemberPrintInformationEnabled: boolean;
  permissions: PermissionCheck;
  printableFamilyMembers: PrintableFamilyMember[];
  updateTestFamilyFlagEnabled: boolean | undefined;
};

export function useFamilyActionsMenuViewModel({
  family,
  familyMemberPrintInformationEnabled,
  permissions,
  printableFamilyMembers,
  updateTestFamilyFlagEnabled,
}: UseFamilyActionsMenuViewModelParameters): FamilyActionsMenuViewModel {
  const canEditVolunteerRoleParticipation = permissions(
    Permission.EditVolunteerRoleParticipation
  );
  const canEditFamilyInfo = permissions(Permission.EditFamilyInfo);
  const canUploadDocuments = permissions(Permission.UploadFamilyDocuments);
  const canAddNotes =
    permissions(Permission.AddEditDraftNotes) ||
    permissions(Permission.AddEditOwnDraftNotes);
  const showCompleteOtherAction =
    family?.volunteerFamilyInfo != null &&
    permissions(Permission.EditApprovalRequirementCompletion);
  const participatingFamilyRoles = Object.entries(
    family?.volunteerFamilyInfo?.familyRoleApprovals || {}
  ).filter(
    ([role, status]) =>
      status.currentStatus != null &&
      !family?.volunteerFamilyInfo?.roleRemovals?.find(
        (removedRole) =>
          removedRole.roleName === role &&
          (removedRole.effectiveUntil == null ||
            removedRole.effectiveUntil > new Date())
      )
  );
  const roleRemovalActions = canEditVolunteerRoleParticipation
    ? participatingFamilyRoles.map(([role]) => ({
        key: role,
        label: `Remove from ${role} role`,
        role,
      }))
    : [];
  const roleResetActions = canEditVolunteerRoleParticipation
    ? (family?.volunteerFamilyInfo?.roleRemovals || [])
        .filter((removedRole) => !removedRole.effectiveUntil)
        .map((removedRole) => ({
          key: removedRole.roleName!,
          label: `Reset ${removedRole.roleName} participation`,
          role: removedRole.roleName!,
          removalReason: removedRole.reason!,
          removalAdditionalComments: removedRole.additionalComments!,
        }))
    : [];
  const hasVolunteerRoleActions =
    canEditVolunteerRoleParticipation &&
    (participatingFamilyRoles.length > 0 ||
      (family?.volunteerFamilyInfo?.roleRemovals &&
        family.volunteerFamilyInfo.roleRemovals.length > 0));
  const hasPrintActions =
    familyMemberPrintInformationEnabled && printableFamilyMembers.length > 0;
  const hasMoreMenuActions =
    hasVolunteerRoleActions ||
    hasPrintActions ||
    canEditFamilyInfo ||
    showCompleteOtherAction;
  const hasFamilyActions =
    canUploadDocuments ||
    canEditFamilyInfo ||
    canAddNotes ||
    hasMoreMenuActions;
  const showToggleTestFamilyAction =
    canEditFamilyInfo && updateTestFamilyFlagEnabled === true;
  const toggleTestFamilyLabel = family?.family?.isTestFamily
    ? 'Unmark as test family'
    : 'Mark as test family';

  return {
    canAddNotes,
    canEditFamilyInfo,
    canUploadDocuments,
    hasFamilyActions,
    hasMoreMenuActions,
    roleRemovalActions,
    roleResetActions,
    showCompleteOtherAction,
    showDeleteFamilyAction: canEditFamilyInfo,
    showToggleTestFamilyAction,
    toggleTestFamilyLabel,
  };
}

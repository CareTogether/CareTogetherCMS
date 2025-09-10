import { Permission } from '../../GeneratedClient';

// Grouped permissions by logical categories
const groupedPermissionsWithoutOther = {
  FamilyDocuments: [
    Permission.ViewFamilyDocumentMetadata,
    Permission.ReadFamilyDocuments,
    Permission.UploadFamilyDocuments,
    Permission.DeleteFamilyDocuments,
  ],
  PersonUser: [
    Permission.InvitePersonUser,
    Permission.EditPersonUserProtectedRoles,
    Permission.EditPersonUserStandardRoles,
    Permission.ViewPersonUserLoginInfo,
  ],
  ScreensAccess: [
    Permission.AccessVolunteersScreen,
    Permission.AccessPartneringFamiliesScreen,
    Permission.AccessSettingsScreen,
    Permission.AccessCommunitiesScreen,
    Permission.AccessReportsScreen,
    Permission.AccessSupportScreen,
  ],
  RolesAndSettings: [Permission.AddEditRoles],
  FamilyAndPersonInfo: [
    Permission.ViewFamilyCustomFields,
    Permission.ViewFamilyHistory,
    Permission.ViewPersonConcerns,
    Permission.ViewPersonNotes,
    Permission.ViewPersonContactInfo,
    Permission.EditFamilyInfo,
    Permission.EditPersonConcerns,
    Permission.EditPersonNotes,
    Permission.EditPersonContactInfo,
    Permission.ViewPersonDateOfBirth,
  ],
  Notes: [
    Permission.AddEditDraftNotes,
    Permission.DiscardDraftNotes,
    Permission.ApproveNotes,
    Permission.ViewAllNotes,
    Permission.AddEditOwnDraftNotes,
    Permission.DiscardOwnDraftNotes,
  ],
  Approval: [
    Permission.ViewApprovalStatus,
    Permission.EditApprovalRequirementCompletion,
    Permission.EditApprovalRequirementExemption,
    Permission.EditVolunteerRoleParticipation,
    Permission.ViewApprovalProgress,
    Permission.ViewApprovalHistory,
    Permission.ActivateVolunteerFamily,
  ],
  V1Cases: [
    Permission.CreateV1Case,
    Permission.EditV1Case,
    Permission.CloseV1Case,
    Permission.ViewV1CaseCustomFields,
    Permission.ViewV1CaseComments,
    Permission.ViewV1CaseProgress,
    Permission.EditV1CaseRequirementCompletion,
    Permission.EditV1CaseRequirementExemption,
    Permission.ViewV1CaseHistory,
  ],
  Arrangements: [
    Permission.CreateArrangement,
    Permission.EditArrangement,
    Permission.ViewAssignments,
    Permission.EditAssignments,
    Permission.ViewArrangementProgress,
    Permission.ViewAssignedArrangementProgress,
    Permission.EditArrangementRequirementCompletion,
    Permission.EditArrangementRequirementExemption,
    Permission.DeleteArrangement,
  ],
  ChildLocation: [
    Permission.ViewChildLocationHistory,
    Permission.TrackChildLocationChange,
  ],
  Communication: [Permission.SendBulkSms],
  Communities: [
    Permission.CreateCommunity,
    Permission.EditCommunity,
    Permission.DeleteCommunity,
    Permission.EditCommunityMemberFamilies,
    Permission.EditCommunityRoleAssignments,
    Permission.ViewCommunityDocumentMetadata,
    Permission.ReadCommunityDocuments,
    Permission.UploadCommunityDocuments,
    Permission.DeleteCommunityDocuments,
  ],
};

const groupedPermissionsWithoutOtherFlat = Object.values(
  groupedPermissionsWithoutOther
).flat();

// In case there are permissions not included in the groupedPermissionsWithoutOther,
// we add them under the "Other" category.
export const groupedPermissions =
  groupedPermissionsWithoutOtherFlat.length < Object.values(Permission).length
    ? {
        ...groupedPermissionsWithoutOther,
        Other: Object.values(Permission).filter(
          (permission) =>
            typeof permission !== 'string' && // Exclude string permissions
            !groupedPermissionsWithoutOtherFlat.includes(permission)
        ),
      }
    : groupedPermissionsWithoutOther;

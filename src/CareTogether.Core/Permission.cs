
namespace CareTogether
{
    public enum Permission
    {
        //NOTE: These permissions are currently *intentionally* more coarse-grained than the underlying
        //      commands they map to. The intent is to simplify configuring roles with some opinionated
        //      guidance. However, as CareTogether evolves, it is likely that new requirements will
        //      emerge that in turn will lead to a more refined concept of permissions.

        // ---- Global ---- //

        ViewFamilyDocumentMetadata = 1,
        ReadFamilyDocuments = 2,
        UploadFamilyDocuments = 3, // Will become a prerequisite for upload-linked actions
        DeleteFamilyDocuments = 4,

        AccessVolunteersScreen = 100,
        AccessPartneringFamiliesScreen = 101,
        AccessSettingsScreen = 102,
        EditRoles = 103,

        ViewFamilyCustomFields = 150,
        ViewFamilyHistory = 151,
        ViewPersonConcerns = 152,
        ViewPersonNotes = 153,
        ViewPersonContactInfo = 154,
        EditFamilyInfo = 155,
        EditPersonConcerns = 156,
        EditPersonNotes = 157,
        EditPersonContactInfo = 158,
        EditPersonUserLink = 159,

        AddEditDraftNotes = 180,
        DiscardDraftNotes = 181,
        ApproveNotes = 182,
        ViewAllNotes = 183, // Viewing your own notes is implicitly allowed

        // ---- Approvals ---- //

        ViewApprovalStatus = 200,
        EditApprovalRequirementCompletion = 201, // Requires UploadFamilyDocuments
        EditApprovalRequirementExemption = 202,
        EditVolunteerRoleParticipation = 203,
        ViewApprovalProgress = 204,
        ViewApprovalHistory = 205,
        ActivateVolunteerFamily = 206,

        // ---- Referrals ---- //

        CreateReferral = 300,
        EditReferral = 301,
        CloseReferral = 302,
        ViewReferralCustomFields = 303,
        ViewReferralComments = 304,
        ViewReferralProgress = 305,
        EditReferralRequirementCompletion = 306, // Requires UploadFamilyDocuments
        EditReferralRequirementExemption = 307,
        ViewReferralHistory = 308,

        CreateArrangement = 350,
        EditArrangement = 351,
        ViewAssignments = 352,
        EditAssignments = 353,
        ViewArrangementProgress = 354,
        ViewAssignedArrangementProgress = 355, // See only items assigned to your own family
        EditArrangementRequirementCompletion = 356,
        EditArrangementRequirementExemption = 357,
        DeleteArrangement = 358,
        
        ViewChildLocationHistory = 380,
        TrackChildLocationChange = 381,

        SendBulkSms = 400,
    }
}

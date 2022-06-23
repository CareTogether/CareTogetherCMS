
namespace CareTogether
{
    public enum Permission
    {
        //NOTE: These permissions are currently *intentionally* more coarse-grained than the underlying
        //      commands they map to. The intent is to simplify configuring roles with some opinionated
        //      guidance. However, as CareTogether evolves, it is likely that new requirements will
        //      emerge that in turn will lead to a more refined concept of permissions.

        ReadDocuments = 1,
        UploadStandaloneDocuments = 2, // Will become a prerequisite for upload-linked actions
        DeleteFamilyDocuments = 3,
        
        ViewAllFamilies = 100,
        ViewLinkedFamilies = 101,

        ViewFamilyDocumentMetadata = 150,
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

        ViewApprovalStatus = 200,
        EditApprovalRequirementCompletion = 201, // Requires UploadStandaloneDocuments
        EditApprovalRequirementExemption = 202,
        EditVolunteerRoleParticipation = 203,
        ViewApprovalProgress = 204,
        ViewApprovalHistory = 205,
        ActivateVolunteerFamily = 206,

        CreateReferral = 300,
        EditReferral = 301,
        CloseReferral = 302,
        EditReferralRequirementCompletion = 303,
        EditReferralRequirementExemption = 304,
        CreateArrangement = 305,
        EditArrangement = 306,
        EditAssignments = 307,
        EditArrangementRequirementCompletion = 308,
        EditArrangementRequirementExemption = 309,
        TrackChildLocationChange = 310,

        SendBulkSms = 400,
    }
}

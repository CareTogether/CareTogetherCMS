
namespace CareTogether
{
    public enum Permission
    {
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

        ViewApprovalStatus = 200,
        EditApprovalRequirementCompletion = 201, // Requires UploadStandaloneDocuments
        EditApprovalRequirementExemption = 202,
        EditVolunteerRoleParticipation = 203,
        ViewApprovalProgress = 204,
        ViewApprovalHistory = 205,
        ActivateVolunteerFamily = 206,

        SendBulkSms = 400
    }
}

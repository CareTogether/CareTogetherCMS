
namespace CareTogether
{
    public enum Permission
    {
        ReadDocuments = 1,
        UploadStandaloneDocuments = 2, // Will become a prerequisite for upload-linked actions
        
        ViewAllFamilies = 100,
        ViewLinkedFamilies = 101,

        ViewApprovalStatus = 200,
        EditApprovalRequirementCompletion = 201, // Requires UploadStandaloneDocuments
        EditApprovalRequirementExemption = 202,
        EditVolunteerRoleParticipation = 203,
        ViewApprovalProgress = 204,
        ViewApprovalHistory = 205,
    }
}

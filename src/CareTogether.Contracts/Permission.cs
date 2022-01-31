
namespace CareTogether
{
    public enum Permission
    {
        ReadDocuments = 1,
        UploadStandaloneDocuments = 2,
        
        ViewAllFamilies = 100,
        ViewLinkedFamilies = 101,

        ViewApprovalStatus = 200,
        EditApprovalRequirementCompletion = 201, // Also allows linked document uploads
        EditApprovalRequirementExemption = 202,
        EditVolunteerRoleParticipation = 203,
    }
}

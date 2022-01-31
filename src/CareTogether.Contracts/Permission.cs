
namespace CareTogether
{
    public enum Permission
    {
        ReadDocuments = 1,
        UploadStandaloneDocuments = 2,
        
        ViewApprovalStatus = 200,
        EditApprovalRequirementCompletion = 201, // Also allows document uploads
    }
}

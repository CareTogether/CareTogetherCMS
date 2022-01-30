
namespace CareTogether
{
    public enum Permission
    {
        ReadDocuments = 1,
        UploadDocuments = 2, //NOTE: This permission is also implied by other higher-level permissions that involve document uploads
        
        ViewApprovalStatus = 200,
    }
}

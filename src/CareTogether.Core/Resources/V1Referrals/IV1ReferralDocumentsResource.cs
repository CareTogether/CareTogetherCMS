using System;
using System.Threading.Tasks;

namespace CareTogether.Resources.V1Referrals
{
    public interface IV1ReferralDocumentsResource
    {
        Task<Uri> GetV1ReferralDocumentReadValetUrl(
            Guid organizationId,
            Guid locationId,
            Guid referralId,
            Guid documentId
        );

        Task<Uri> GetV1ReferralDocumentUploadValetUrl(
            Guid organizationId,
            Guid locationId,
            Guid referralId,
            Guid documentId
        );
    }
}

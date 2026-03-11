using System;
using System.Linq;
using System.Threading.Tasks;
using CareTogether.Utilities.FileStore;

namespace CareTogether.Resources.V1Referrals
{
    public sealed class V1ReferralDocumentsResource : IV1ReferralDocumentsResource
    {
        private readonly IV1ReferralsResource v1ReferralsResource;
        private readonly IFileStore fileStore;

        public V1ReferralDocumentsResource(
            IV1ReferralsResource v1ReferralsResource,
            IFileStore fileStore
        )
        {
            this.v1ReferralsResource = v1ReferralsResource;
            this.fileStore = fileStore;
        }

        public async Task<Uri> GetV1ReferralDocumentReadValetUrl(
            Guid organizationId,
            Guid locationId,
            Guid referralId,
            Guid documentId
        )
        {
            var referral = await v1ReferralsResource.GetReferralAsync(
                organizationId,
                locationId,
                referralId
            );

            if (
                referral == null
                || !referral.UploadedDocuments.Any(doc => doc.UploadedDocumentId == documentId)
                || referral.DeletedDocuments.Any(doc => doc == documentId)
            )
                throw new Exception("The specified referral document does not exist.");

            return await fileStore.GetValetReadUrlAsync(organizationId, locationId, documentId);
        }

        public async Task<Uri> GetV1ReferralDocumentUploadValetUrl(
            Guid organizationId,
            Guid locationId,
            Guid referralId,
            Guid documentId
        )
        {
            var referral = await v1ReferralsResource.GetReferralAsync(
                organizationId,
                locationId,
                referralId
            );

            if (
                referral == null
                || referral.UploadedDocuments.Any(doc => doc.UploadedDocumentId == documentId)
            )
                throw new Exception("The specified referral document already exists.");

            return await fileStore.GetValetCreateUrlAsync(organizationId, locationId, documentId);
        }
    }
}

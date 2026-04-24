using System;
using System.Collections.Immutable;
using System.Linq;
using System.Threading.Tasks;
using CareTogether.Utilities.EventLog;
using CareTogether.Utilities.FileStore;

namespace CareTogether.Resources.V1Referrals
{
    public sealed class V1ReferralsResource : IV1ReferralsResource
    {
        private readonly IEventLog<V1ReferralEvent> eventLog;
        private readonly IFileStore fileStore;
        private readonly ConcurrentLockingStore<
            (Guid organizationId, Guid locationId),
            V1ReferralModel
        > tenantModels;

        public V1ReferralsResource(IEventLog<V1ReferralEvent> eventLog, IFileStore fileStore)
        {
            this.eventLog = eventLog;
            this.fileStore = fileStore;
            tenantModels = new ConcurrentLockingStore<
                (Guid organizationId, Guid locationId),
                V1ReferralModel
            >(key =>
                V1ReferralModel.InitializeAsync(
                    eventLog.GetAllEventsAsync(key.organizationId, key.locationId)
                )
            );
        }

        public async Task ExecuteV1ReferralCommandAsync(
            Guid organizationId,
            Guid locationId,
            V1ReferralCommand command,
            Guid actorUserId
        )
        {
            using (
                var lockedModel = await tenantModels.WriteLockItemAsync(
                    (organizationId, locationId)
                )
            )
            {
                var result = lockedModel.Value.ExecuteReferralCommand(
                    command,
                    actorUserId,
                    DateTime.UtcNow
                );

                await eventLog.AppendEventAsync(
                    organizationId,
                    locationId,
                    result.Event,
                    result.SequenceNumber
                );
                result.OnCommit();
            }
        }

        public async Task<V1Referral?> GetReferralAsync(
            Guid organizationId,
            Guid locationId,
            Guid referralId
        )
        {
            using (
                var lockedModel = await tenantModels.ReadLockItemAsync((organizationId, locationId))
            )
            {
                return lockedModel.Value.GetReferral(referralId);
            }
        }

        public async Task<ImmutableList<V1Referral>> ListReferralsAsync(
            Guid organizationId,
            Guid locationId
        )
        {
            using (
                var lockedModel = await tenantModels.ReadLockItemAsync((organizationId, locationId))
            )
            {
                return lockedModel.Value.FindReferrals(_ => true);
            }
        }

        public async Task<Uri> GetV1ReferralDocumentReadValetUrl(
            Guid organizationId,
            Guid locationId,
            Guid referralId,
            Guid documentId
        )
        {
            var referral = await GetReferralAsync(organizationId, locationId, referralId);

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
            var referral = await GetReferralAsync(organizationId, locationId, referralId);

            if (referral == null)
                throw new Exception("The specified referral does not exist.");

            if (referral.Status == V1ReferralStatus.Closed)
                throw new Exception("Closed referrals cannot be edited.");

            if (referral.UploadedDocuments.Any(doc => doc.UploadedDocumentId == documentId))
                throw new Exception("The specified referral document already exists.");

            return await fileStore.GetValetCreateUrlAsync(organizationId, locationId, documentId);
        }
    }
}

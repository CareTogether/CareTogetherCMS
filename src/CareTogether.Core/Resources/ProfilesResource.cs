using CareTogether.Resources.Models;
using CareTogether.Resources.Storage;
using System;
using System.Collections.Immutable;
using System.Linq;
using System.Threading.Tasks;

namespace CareTogether.Resources
{
    public sealed class ContactsResource : IContactsResource
    {
        private readonly IMultitenantEventLog<ContactCommandExecutedEvent> contactsEventLog;
        private readonly ConcurrentLockingStore<(Guid organizationId, Guid locationId), ContactsModel> tenantContactsModels;


        public ContactsResource(IMultitenantEventLog<ContactCommandExecutedEvent> contactsEventLog)
        {
            this.contactsEventLog = contactsEventLog;
            tenantContactsModels = new ConcurrentLockingStore<(Guid organizationId, Guid locationId), ContactsModel>(key =>
                ContactsModel.InitializeAsync(contactsEventLog.GetAllEventsAsync(key.organizationId, key.locationId)));
        }


        public async Task<ContactInfo> ExecuteContactCommandAsync(
            Guid organizationId, Guid locationId, ContactCommand command, Guid userId)
        {
            using (var lockedModel = await tenantContactsModels.WriteLockItemAsync((organizationId, locationId)))
            {
                var result = lockedModel.Value.ExecuteContactCommand(command, userId, DateTime.UtcNow);
                
                await contactsEventLog.AppendEventAsync(organizationId, locationId, result.Event, result.SequenceNumber);
                result.OnCommit();
                return result.Contact;
            }
        }

        public async Task<ImmutableDictionary<Guid, ContactInfo>> ListContactsAsync(Guid organizationId, Guid locationId)
        {
            using (var lockedModel = await tenantContactsModels.ReadLockItemAsync((organizationId, locationId)))
            {
                return lockedModel.Value.FindContacts(c => true)
                    .ToImmutableDictionary(c => c.PersonId);
            }
        }

        public async Task<ContactInfo> FindUserContactInfoAsync(Guid organizationId, Guid locationId, Guid personId)
        {
            using (var lockedModel = await tenantContactsModels.ReadLockItemAsync((organizationId, locationId)))
            {
                var result = lockedModel.Value.FindContacts(c => c.PersonId == personId).Single();
                return result;
            }
        }
    }
}

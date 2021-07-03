using CareTogether.Abstractions;
using CareTogether.Resources;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace CareTogether.Api
{
    //TODO: Extract this to the tests project and only reference that project conditionally
    public static class TestDataProvider
    {
        static readonly Guid guid1 = Guid.Parse("11111111-1111-1111-1111-111111111111");
        static readonly Guid guid2 = Guid.Parse("22222222-2222-2222-2222-222222222222");
        static readonly Guid guid3 = Guid.Parse("33333333-3333-3333-3333-333333333333");
        static readonly Guid guid4 = Guid.Parse("44444444-4444-4444-4444-444444444444");
        static readonly Guid guid5 = Guid.Parse("55555555-5555-5555-5555-555555555555");
        static readonly Guid guid6 = Guid.Parse("66666666-6666-6666-6666-666666666666");


        public static async Task PopulateTestDataAsync(
            IMultitenantEventLog<CommunityEvent> communityEventLog,
            IMultitenantKeyValueStore<ContactInfo> contactStore, IMultitenantKeyValueStore<Dictionary<Guid, Goal>> goalsStore)
        {
            foreach (var (domainEvent, index) in EventSequence<CommunityEvent>(
                new PersonCommandExecuted(new CreatePerson(Guid.Parse("2b87864a-63e3-4406-bcbc-c0068a13ac05"), Guid.Parse("2b87864a-63e3-4406-bcbc-c0068a13ac05"), "System", "Administrator", null)),
                new PersonCommandExecuted(new CreatePerson(guid1, null, "John", "Doe", null)),
                new PersonCommandExecuted(new CreatePerson(guid2, guid3, "Jane", "Smith", new AgeInYears(42, new DateTime(2021, 1, 1)))),
                new PersonCommandExecuted(new UpdatePersonName(guid2, "Jane", "Doe")),
                new PersonCommandExecuted(new UpdatePersonAge(guid1, new ExactAge(new DateTime(1975, 1, 1)))),
                new PersonCommandExecuted(new UpdatePersonAge(guid2, new ExactAge(new DateTime(1979, 7, 1)))),
                new PersonCommandExecuted(new UpdatePersonUserLink(guid1, guid4)),
                new FamilyCommandExecuted(new CreateFamily(guid5, VolunteerFamilyStatus.Active, null,
                    new List<(Guid, FamilyAdultRelationshipInfo)> { (guid1, new FamilyAdultRelationshipInfo(FamilyAdultRelationshipType.Dad, "ABC", true, true, "Test")) },
                    null, null)),
                new FamilyCommandExecuted(new AddAdultToFamily(guid5, guid2, new FamilyAdultRelationshipInfo(FamilyAdultRelationshipType.Mom, "DEF", true, true, null))),
                new PersonCommandExecuted(new CreatePerson(guid6, null, "Eric", "Doe", new AgeInYears(12, new DateTime(2021, 1, 1)))),
                new FamilyCommandExecuted(new AddChildToFamily(guid5, guid6, new List<CustodialRelationship>
                {
                    new CustodialRelationship(guid6, guid1, CustodialRelationshipType.ParentWithCustody),
                    new CustodialRelationship(guid6, guid2, CustodialRelationshipType.ParentWithCustody)
                })),
                new FamilyCommandExecuted(new UpdateAdultRelationshipToFamily(guid5, guid1, new FamilyAdultRelationshipInfo(FamilyAdultRelationshipType.Dad, "ABC123", false, false, "XYZ"))),
                new FamilyCommandExecuted(new RemoveCustodialRelationship(guid5, guid6, guid1)),
                new FamilyCommandExecuted(new UpdateCustodialRelationshipType(guid5, guid6, guid2, CustodialRelationshipType.ParentWithCourtAppointedCustody)),
                new FamilyCommandExecuted(new AddCustodialRelationship(guid5, guid6, guid1, CustodialRelationshipType.ParentWithCourtAppointedCustody))))
            {
                var result = await communityEventLog.AppendEventAsync(guid1, guid2, domainEvent, index);
                if (result.IsT1)
                    throw new InvalidOperationException(result.ToString());
            }

            await contactStore.UpsertValueAsync(guid1, guid2, guid1, new ContactInfo(guid1, new List<Address>
            {
                new Address(guid2, "123 Main St.", "Apt. A", "Smallville", guid3, "12345", guid4),
                new Address(guid3, "456 Old Ave.", null, "Bigtown", guid4, "67890", guid4)
            }, guid2, new List<PhoneNumber>
            {
                new PhoneNumber(guid2, "1235554567", PhoneNumberType.Mobile),
                new PhoneNumber(guid3, "1235555555", PhoneNumberType.Home)
            }, guid2, new List<EmailAddress>
            {
                new EmailAddress(guid2, "personal@example.com", EmailAddressType.Personal),
                new EmailAddress(guid3, "work@example.com", EmailAddressType.Work)
            }, guid2, "Cannot receive voicemails"));
        }


        private static IEnumerable<(T, long)> EventSequence<T>(params T[] events) =>
            events.Select((e, i) => (e, (long)i));
    }
}

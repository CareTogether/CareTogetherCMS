using CareTogether.Abstractions;
using CareTogether.Managers;
using CareTogether.Resources;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace CareTogether.TestData
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

        static readonly Guid adminId = Guid.Parse("2b87864a-63e3-4406-bcbc-c0068a13ac05");


        public static async Task PopulateTestDataAsync(
            IMultitenantEventLog<CommunityEvent> communityEventLog,
            IMultitenantEventLog<ContactCommandExecutedEvent> contactsEventLog,
            IMultitenantEventLog<GoalCommandExecutedEvent> goalsEventLog,
            IMultitenantEventLog<ReferralEvent> referralsEventLog)
        {
            await communityEventLog.AppendEventsAsync(guid1, guid2,
                new PersonCommandExecuted(new CreatePerson(adminId, adminId, "System", "Administrator", null)),
                new PersonCommandExecuted(new CreatePerson(guid1, null, "John", "Doe", null)),
                new PersonCommandExecuted(new CreatePerson(guid2, guid3, "Jane", "Smith", new AgeInYears(42, new DateTime(2021, 1, 1)))),
                new PersonCommandExecuted(new UpdatePersonName(guid2, "Jane", "Doe")),
                new PersonCommandExecuted(new UpdatePersonAge(guid1, new ExactAge(new DateTime(1975, 1, 1)))),
                new PersonCommandExecuted(new UpdatePersonAge(guid2, new ExactAge(new DateTime(1979, 7, 1)))),
                new PersonCommandExecuted(new UpdatePersonUserLink(guid1, guid4)),
                new FamilyCommandExecuted(new CreateFamily(guid5, null, PartneringFamilyStatus.Active,
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
                new FamilyCommandExecuted(new AddCustodialRelationship(guid5, guid6, guid1, CustodialRelationshipType.ParentWithCourtAppointedCustody)));

            await contactsEventLog.AppendEventsAsync(guid1, guid2,
                new ContactCommandExecutedEvent(new CreateContact(guid1, "Amy has contact details for a callback")),
                new ContactCommandExecutedEvent(new AddContactAddress(guid1,
                    new Address(guid3, "456 Old Ave.", null, "Bigtown", guid4, "67890", guid4),
                    true)),
                new ContactCommandExecutedEvent(new AddContactPhoneNumber(guid1,
                    new PhoneNumber(guid2, "1235554567", PhoneNumberType.Mobile),
                    true)),
                new ContactCommandExecutedEvent(new AddContactEmailAddress(guid1,
                    new EmailAddress(guid2, "personal@example.com", EmailAddressType.Personal),
                    true)),
                new ContactCommandExecutedEvent(new AddContactAddress(guid1,
                    new Address(guid2, "123 Main St.", "Apt. A", "Smallville", guid3, "12345", guid4),
                    true)),
                new ContactCommandExecutedEvent(new UpdateContactAddress(guid1,
                    new Address(guid3, "456 Old Ave.", null, "Bigtown", guid4, "67890", guid4),
                    false)),
                new ContactCommandExecutedEvent(new AddContactPhoneNumber(guid1,
                    new PhoneNumber(guid3, "1235555555", PhoneNumberType.Home),
                    true)),
                new ContactCommandExecutedEvent(new UpdateContactPhoneNumber(guid1,
                    new PhoneNumber(guid2, "1235554567", PhoneNumberType.Mobile),
                    false)),
                new ContactCommandExecutedEvent(new AddContactEmailAddress(guid1,
                    new EmailAddress(guid3, "work@example.com", EmailAddressType.Work),
                    true)),
                new ContactCommandExecutedEvent(new UpdateContactEmailAddress(guid1,
                    new EmailAddress(guid2, "personal@example.com", EmailAddressType.Personal),
                    false)),
                new ContactCommandExecutedEvent(new UpdateContactMethodPreferenceNotes(guid1,
                    "Cannot receive voicemails")));

            await referralsEventLog.AppendEventsAsync(guid1, guid2,
                new ReferralCommandExecuted(new CreateReferral(guid1, adminId, new DateTime(2020, 3, 5, 4, 10, 0), guid5, "v1")),
                new ReferralCommandExecuted(new UploadReferralForm(guid1, adminId, new DateTime(2020, 3, 5, 4, 15, 15), "Request for Help Form", "v1", "Jane Doe referral info.pdf")),
                new ReferralCommandExecuted(new PerformReferralActivity(guid1, adminId, new DateTime(2020, 3, 6, 8, 45, 30), "Intake Coordinator Screening Call")),
                new ArrangementCommandExecuted(new CreateArrangement(guid1, guid1, adminId, new DateTime(2020, 3, 11, 11, 12, 13), "v1", "Hosting")),
                new ReferralCommandExecuted(new CloseReferral(guid1, adminId, new DateTime(2020, 10, 4, 12, 32, 55), ReferralCloseReason.NeedMet)),
                new ReferralCommandExecuted(new CreateReferral(guid2, adminId, new DateTime(2021, 7, 10, 19, 30, 45), guid5, "v1")),
                new ReferralCommandExecuted(new UploadReferralForm(guid2, adminId, new DateTime(2021, 7, 10, 19, 32, 0), "Request for Help Form", "v1", "Jane Doe second referral info.pdf")),
                new ReferralCommandExecuted(new PerformReferralActivity(guid2, adminId, new DateTime(2021, 7, 10, 19, 32, 0), "Intake Coordinator Screening Call")));
        }


        private static async Task AppendEventsAsync<T>(this IMultitenantEventLog<T> eventLog,
            Guid organizationId, Guid locationId, params T[] events)
        {
            foreach (var (domainEvent, index) in events
                .Select((e, i) => (e, (long)i)))
            {
                var result = await eventLog.AppendEventAsync(organizationId, locationId, domainEvent, index);
                if (result.IsT1)
                    throw new InvalidOperationException(result.ToString());
            }
        }
    }
}

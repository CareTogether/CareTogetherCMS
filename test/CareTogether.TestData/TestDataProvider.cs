using CareTogether.Abstractions;
using CareTogether.Managers;
using CareTogether.Resources;
using System;
using System.Collections.Generic;
using System.Collections.Immutable;
using System.Linq;
using System.Threading.Tasks;

namespace CareTogether.TestData
{
    public static class TestDataProvider
    {
        private static Guid Id(char x) => Guid.Parse("xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx".Replace('x', x));
        static readonly Guid guid1 = Id('1');
        static readonly Guid guid2 = Id('2');
        static readonly Guid guid3 = Id('3');
        static readonly Guid guid4 = Id('4');
        static readonly Guid guid5 = Id('5');
        static readonly Guid guid6 = Id('6');
        static readonly Guid guid7 = Id('7');
        static readonly Guid guid8 = Id('8');
        static readonly Guid guid9 = Id('9');
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
                new FamilyCommandExecuted(new CreateFamily(guid1, null, PartneringFamilyStatus.Active,
                    new List<(Guid, FamilyAdultRelationshipInfo)> { (guid1, new FamilyAdultRelationshipInfo(FamilyAdultRelationshipType.Dad, "ABC", true, true, "Test")) },
                    null, null)),
                new FamilyCommandExecuted(new AddAdultToFamily(guid1, guid2, new FamilyAdultRelationshipInfo(FamilyAdultRelationshipType.Mom, "DEF", true, true, null))),
                new PersonCommandExecuted(new CreatePerson(guid3, null, "Eric", "Doe", new AgeInYears(12, new DateTime(2021, 1, 1)))),
                new FamilyCommandExecuted(new AddChildToFamily(guid1, guid3, new List<CustodialRelationship>
                {
                    new CustodialRelationship(guid3, guid1, CustodialRelationshipType.ParentWithCustody),
                    new CustodialRelationship(guid3, guid2, CustodialRelationshipType.ParentWithCustody)
                })),
                new FamilyCommandExecuted(new UpdateAdultRelationshipToFamily(guid1, guid1, new FamilyAdultRelationshipInfo(FamilyAdultRelationshipType.Dad, "ABC123", false, false, "XYZ"))),
                new FamilyCommandExecuted(new RemoveCustodialRelationship(guid1, guid3, guid1)),
                new FamilyCommandExecuted(new UpdateCustodialRelationshipType(guid1, guid3, guid2, CustodialRelationshipType.ParentWithCourtAppointedCustody)),
                new FamilyCommandExecuted(new AddCustodialRelationship(guid1, guid3, guid1, CustodialRelationshipType.ParentWithCourtAppointedCustody)),
                new PersonCommandExecuted(new CreatePerson(guid4, null, "Emily", "Coachworthy", new ExactAge(new DateTime(1980, 3, 19)))),
                new PersonCommandExecuted(new CreatePerson(guid5, null, "Han", "Solo", new AgeInYears(30, new DateTime(2021, 7, 1)))),
                new PersonCommandExecuted(new CreatePerson(guid6, null, "Leia", "Skywalker", new AgeInYears(28, new DateTime(2021, 7, 1)))),
                new PersonCommandExecuted(new CreatePerson(guid7, null, "Ben", "Solo", new AgeInYears(12, new DateTime(2021, 7, 1)))),
                new FamilyCommandExecuted(new CreateFamily(guid2, VolunteerFamilyStatus.Active, null,
                    new List<(Guid, FamilyAdultRelationshipInfo)>
                    {
                        (guid5, new FamilyAdultRelationshipInfo(FamilyAdultRelationshipType.Dad, null, true, true, "Smuggler")),
                        (guid6, new FamilyAdultRelationshipInfo(FamilyAdultRelationshipType.Mom, "Uncertain claim to royalty", true, false, "Freedom fighter"))
                    }, new List<Guid>() { guid7 }, new List<CustodialRelationship>()
                    {
                        new CustodialRelationship(guid7, guid5, CustodialRelationshipType.ParentWithCustody),
                        new CustodialRelationship(guid7, guid6, CustodialRelationshipType.ParentWithCustody)
                    })),
                new PersonCommandExecuted(new CreatePerson(guid8, null, "William", "Riker", new ExactAge(new DateTime(1972, 1, 1)))),
                new PersonCommandExecuted(new CreatePerson(guid9, null, "Deanna", "Riker", new ExactAge(new DateTime(1970, 1, 1)))),
                new FamilyCommandExecuted(new CreateFamily(guid3, VolunteerFamilyStatus.Active, null,
                    new List<(Guid, FamilyAdultRelationshipInfo)>
                    {
                        (guid8, new FamilyAdultRelationshipInfo(FamilyAdultRelationshipType.Dad, null, true, true, null)),
                        (guid9, new FamilyAdultRelationshipInfo(FamilyAdultRelationshipType.Mom, null, true, false, null))
                    }, new List<Guid>(), new List<CustodialRelationship>()))
            );

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
                new ReferralCommandExecuted(new CreateReferral(guid1, adminId, new DateTime(2020, 3, 5, 4, 10, 0), guid1, "v1")),
                new ReferralCommandExecuted(new UploadReferralForm(guid1, adminId, new DateTime(2020, 3, 5, 4, 15, 15), "Request for Help Form", "v1", "Jane Doe referral info.pdf")),
                new ReferralCommandExecuted(new PerformReferralActivity(guid1, adminId, new DateTime(2020, 3, 6, 8, 45, 30), "Intake Coordinator Screening Call")),
                new ArrangementCommandExecuted(new CreateArrangement(guid1, guid1, adminId, new DateTime(2020, 3, 11, 11, 12, 13), "v1", "Hosting")),
                new ArrangementCommandExecuted(new AssignIndividualVolunteer(guid1, guid1, adminId, new DateTime(2020, 3, 11, 11, 13, 14), guid4, "Family Coach")),
                new ArrangementCommandExecuted(new AssignVolunteerFamily(guid1, guid1, adminId, new DateTime(2020, 3, 11, 11, 13, 55), guid2, "Host Family")),
                new ArrangementCommandExecuted(new AssignVolunteerFamily(guid1, guid1, adminId, new DateTime(2020, 3, 11, 12, 22, 21), guid3, "Host Family Friend")),
                new ArrangementCommandExecuted(new AssignPartneringFamilyChildren(guid1, guid1, adminId, new DateTime(2020, 3, 11, 11, 14, 32),
                    ImmutableList<Guid>.Empty.Add(guid3))),
                new ArrangementCommandExecuted(new InitiateArrangement(guid1, guid1, adminId, new DateTime(2020, 3, 12, 16, 55, 0))),
                new ArrangementCommandExecuted(new TrackChildrenLocationChange(guid1, guid1, adminId, new DateTime(2020, 3, 15, 8, 33, 34),
                    ImmutableList<Guid>.Empty.Add(guid3), guid3, ChildrenLocationPlan.DaytimeChildCare, "Babysitting")),
                new ArrangementCommandExecuted(new TrackChildrenLocationChange(guid1, guid1, adminId, new DateTime(2020, 3, 15, 20, 40, 45),
                    ImmutableList<Guid>.Empty.Add(guid3), guid2, ChildrenLocationPlan.DaytimeChildCare, "Dropped off with host parents after ☕ and 🍰")),
                new ArrangementCommandExecuted(new PerformArrangementActivity(guid1, guid1, adminId, new DateTime(2020, 3, 14, 10, 10, 10),
                    guid4, "Family Coach Safety Visit")),
                new ArrangementCommandExecuted(new PerformArrangementActivity(guid1, guid1, adminId, new DateTime(2020, 3, 21, 11, 11, 11),
                    guid4, "Family Coach Supervision")),
                new ArrangementCommandExecuted(new TrackChildrenLocationChange(guid1, guid1, adminId, new DateTime(2020, 3, 22, 16, 30, 35),
                    ImmutableList<Guid>.Empty.Add(guid3), guid1, ChildrenLocationPlan.OvernightHousing, "Weekend with parents, met at McDonald's near mom")),
                new ArrangementCommandExecuted(new TrackChildrenLocationChange(guid1, guid1, adminId, new DateTime(2020, 3, 24, 8, 30, 35),
                    ImmutableList<Guid>.Empty.Add(guid3), guid2, ChildrenLocationPlan.OvernightHousing, "Mom dropped off on way to work")),
                new ArrangementCommandExecuted(new TrackChildrenLocationChange(guid1, guid1, adminId, new DateTime(2020, 3, 30, 18, 18, 18),
                    ImmutableList<Guid>.Empty.Add(guid3), guid1, ChildrenLocationPlan.ReturnToFamily, "Mom met us and picked him up at DQ")),
                new ReferralCommandExecuted(new CloseReferral(guid1, adminId, new DateTime(2020, 10, 4, 12, 32, 55), ReferralCloseReason.NeedMet)),
                new ReferralCommandExecuted(new CreateReferral(guid2, adminId, new DateTime(2021, 7, 10, 19, 30, 45), guid1, "v1")),
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

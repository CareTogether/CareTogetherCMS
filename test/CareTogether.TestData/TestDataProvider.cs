using CareTogether.Resources.Accounts;
using CareTogether.Resources.Approvals;
using CareTogether.Resources.Communities;
using CareTogether.Resources.Directory;
using CareTogether.Resources.Goals;
using CareTogether.Resources.Notes;
using CareTogether.Resources.Policies;
using CareTogether.Resources.Referrals;
using CareTogether.Utilities.EventLog;
using CareTogether.Utilities.ObjectStore;
using System;
using System.Collections.Generic;
using System.Collections.Immutable;
using System.Linq;
using System.Threading.Tasks;

namespace CareTogether.TestData
{
    public static class TestDataProvider
    {
        /* Families
         * ======================
         * NOTE: guidF is reserved for CareTogether system actions and should not be used as a person ID!
         * McTester - guid0
         *   Administrator McTester - guid0 - UserID adminId
         * Doe - guid1
         *   John Doe - guid1 - UserID guid4
         *   Jane Doe (Smith) - guid2 - UserID guid3
         *   Eric Doe - guid3
         * Coachworthy - guid4
         *   Emily Coachworthy - guid4 - UserID volunteerId
         * Skywalker - guid2
         *   Han Solo - guid5
         *   Leia Skywalker - guid6
         *   Ben Solo - guid7
         *   Luke Skywalker - guidA
         * Riker - guid3
         *   William Riker - guid8
         *   Deanna Riker - guid9
         * Brown - guid5
         *   Emmett Brown - guidB
         *   Marty McFly - guidC
         */

        #region Constructors & IDs

        private static Guid Id(char x) => Guid.Parse("xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx".Replace('x', x));
        static readonly Guid guid0 = Id('0');
        static readonly Guid guid1 = Id('1');
        static readonly Guid guid2 = Id('2');
        static readonly Guid guid3 = Id('3');
        static readonly Guid guid4 = Id('4');
        static readonly Guid guid5 = Id('5');
        static readonly Guid guid6 = Id('6');
        static readonly Guid guid7 = Id('7');
        static readonly Guid guid8 = Id('8');
        static readonly Guid guid9 = Id('9');
        static readonly Guid guidA = Id('a');
        static readonly Guid guidB = Id('b');
        static readonly Guid guidC = Id('c');
        static readonly Guid adminId = Guid.Parse("2b87864a-63e3-4406-bcbc-c0068a13ac05");
        static readonly Guid volunteerId = Guid.Parse("e3aaef77-0e97-47a6-b788-a67c237c781e");


        public static async Task PopulateTestDataAsync(
            IEventLog<AccountEvent> accountsEventLog,
            IEventLog<PersonAccessEvent> personAccessEventLog,
            IEventLog<DirectoryEvent> directoryEventLog,
            IEventLog<GoalCommandExecutedEvent> goalsEventLog,
            IEventLog<ReferralEvent> referralsEventLog,
            IEventLog<ApprovalEvent> approvalsEventLog,
            IEventLog<NotesEvent> notesEventLog,
            IEventLog<CommunityCommandExecutedEvent> communitiesEventLog,
            IObjectStore<string?> draftNotesStore,
            IObjectStore<OrganizationConfiguration> configurationStore,
            IObjectStore<EffectiveLocationPolicy> policiesStore,
            IObjectStore<OrganizationSecrets> organizationSecretsStore,
            string? testSourceSmsPhoneNumber)
        {
            await PopulateAccountEvents(accountsEventLog);
            await PopulatePersonAccessEvents(personAccessEventLog);
            await PopulateDirectoryEvents(directoryEventLog);
            await PopulateGoalEvents(goalsEventLog);
            await PopulateReferralEvents(referralsEventLog);
            await PopulateApprovalEvents(approvalsEventLog);
            await PopulateNoteEvents(notesEventLog);
            await PopulateCommunityEvents(communitiesEventLog);
            await PopulateDraftNotes(draftNotesStore);
            await PopulateConfigurations(configurationStore, testSourceSmsPhoneNumber, organizationSecretsStore);
            await PopulatePolicies(policiesStore);
        }

        #endregion

        public static async Task PopulateAccountEvents(IEventLog<AccountEvent> accountsEventLog)
        {
            //NOTE: Since this log is *global*, only do this if these events have not yet been appended.
            var testEventsNeeded = new[]
            {
                new AccountEvent(SystemConstants.SystemUserId, new DateTime(2020, 1, 1),
                    new LinkPersonToAcccount(UserId: adminId, OrganizationId: guid1, LocationId: guid2, PersonId: guid0)),
                new AccountEvent(SystemConstants.SystemUserId, new DateTime(2020, 1, 1),
                    new LinkPersonToAcccount(UserId: adminId, OrganizationId: guid1, LocationId: guid3, PersonId: guid0)),
                new AccountEvent(SystemConstants.SystemUserId, new DateTime(2020, 1, 1),
                    new LinkPersonToAcccount(UserId: volunteerId, OrganizationId: guid1, LocationId: guid2, PersonId: guid4))
            };
            var existingGlobalEvents = await accountsEventLog.GetAllEventsAsync(guid0, guid0).ToListAsync();
            var testEventsToAppend = testEventsNeeded
                .Where(testEvent => !existingGlobalEvents.Any(entry => entry.DomainEvent == testEvent))
                .ToArray();
            await accountsEventLog.AppendEventsAsync(guid0, guid0, testEventsToAppend);
        }

        public static async Task PopulatePersonAccessEvents(IEventLog<PersonAccessEvent> personAccessEventLog)
        {
            await personAccessEventLog.AppendEventsAsync(guid1, guid2,
                new PersonAccessEvent(SystemConstants.SystemUserId, new DateTime(2020, 1, 1),
                    new ChangePersonRoles(PersonId: guid0, Roles: ImmutableList.Create(SystemConstants.ORGANIZATION_ADMINISTRATOR))),
                new PersonAccessEvent(SystemConstants.SystemUserId, new DateTime(2020, 1, 1),
                    new ChangePersonRoles(PersonId: guid4, Roles: ImmutableList.Create("Volunteer")))
                );
            await personAccessEventLog.AppendEventsAsync(guid1, guid3,
                new PersonAccessEvent(SystemConstants.SystemUserId, new DateTime(2020, 1, 1),
                    new ChangePersonRoles(PersonId: guid0, Roles: ImmutableList.Create(SystemConstants.ORGANIZATION_ADMINISTRATOR)))
                );
        }

        public static async Task PopulateDirectoryEvents(IEventLog<DirectoryEvent> directoryEventLog)
        {
            await directoryEventLog.AppendEventsAsync(guid1, guid2,
                new PersonCommandExecuted(adminId, new DateTime(2021, 7, 1), new CreatePerson(guid0, "Administrator", "McTester", Gender.Male, new ExactAge(new DateTime(2021, 7, 1)), "Ethnic",
                    ImmutableList<Address>.Empty, null, ImmutableList<PhoneNumber>.Empty, null, ImmutableList<EmailAddress>.Empty, null, "Test", "ABC")),
                new FamilyCommandExecuted(adminId, new DateTime(2021, 7, 1), new CreateFamily(guid0, guid0,
                    ImmutableList<(Guid, FamilyAdultRelationshipInfo)>.Empty.Add((guid0, new FamilyAdultRelationshipInfo("Single", true))),
                    ImmutableList<Guid>.Empty, ImmutableList<CustodialRelationship>.Empty)),
                new PersonCommandExecuted(adminId, new DateTime(2021, 7, 1), new CreatePerson(guid1, "John", "Doe", Gender.Male, new ExactAge(new DateTime(1980, 7, 1)), "Ethnic",
                    ImmutableList<Address>.Empty, null, ImmutableList<PhoneNumber>.Empty, null, ImmutableList<EmailAddress>.Empty, null, null, "DEF")),
                new PersonCommandExecuted(adminId, new DateTime(2021, 7, 1), new CreatePerson(guid2, "Jane", "Smith", Gender.Female, new AgeInYears(42, new DateTime(2021, 1, 1)), "Ethnic",
                    ImmutableList<Address>.Empty, null, ImmutableList<PhoneNumber>.Empty, null, ImmutableList<EmailAddress>.Empty, null, null, null)),
                new PersonCommandExecuted(adminId, new DateTime(2021, 7, 1), new UpdatePersonName(guid2, "Jane", "Doe")),
                new PersonCommandExecuted(adminId, new DateTime(2021, 7, 1), new UpdatePersonAge(guid1, new ExactAge(new DateTime(1975, 1, 1)))),
                new PersonCommandExecuted(adminId, new DateTime(2021, 7, 1), new UpdatePersonAge(guid2, new ExactAge(new DateTime(1979, 7, 1)))),
                new FamilyCommandExecuted(adminId, new DateTime(2021, 7, 1), new CreateFamily(guid1, guid1,
                    ImmutableList<(Guid, FamilyAdultRelationshipInfo)>.Empty.Add((guid1, new FamilyAdultRelationshipInfo("Dad", true))),
                    ImmutableList<Guid>.Empty, ImmutableList<CustodialRelationship>.Empty)),
                new FamilyCommandExecuted(adminId, new DateTime(2021, 7, 1), new AddAdultToFamily(guid1, guid2, new FamilyAdultRelationshipInfo("Mom", true))),
                new FamilyCommandExecuted(adminId, new DateTime(2020, 3, 5, 4, 15, 15), new UploadFamilyDocument(guid1, guid1, "Jane Doe referral info.pdf")),
                new PersonCommandExecuted(adminId, new DateTime(2021, 7, 1), new CreatePerson(guid3, "Eric", "Doe", Gender.Male, new AgeInYears(12, new DateTime(2021, 1, 1)), "Ethnic",
                    ImmutableList<Address>.Empty, null, ImmutableList<PhoneNumber>.Empty, null, ImmutableList<EmailAddress>.Empty, null, null, null)),
                new FamilyCommandExecuted(adminId, new DateTime(2021, 7, 1), new AddChildToFamily(guid1, guid3, ImmutableList<CustodialRelationship>.Empty
                    .Add(new CustodialRelationship(guid3, guid1, CustodialRelationshipType.ParentWithCustody))
                    .Add(new CustodialRelationship(guid3, guid2, CustodialRelationshipType.ParentWithCustody)))),
                new FamilyCommandExecuted(adminId, new DateTime(2021, 7, 1), new UpdateAdultRelationshipToFamily(guid1, guid1, new FamilyAdultRelationshipInfo("Dad", false))),
                new FamilyCommandExecuted(adminId, new DateTime(2021, 7, 1), new RemoveCustodialRelationship(guid1, guid3, guid1)),
                new FamilyCommandExecuted(adminId, new DateTime(2021, 7, 1), new UpdateCustodialRelationshipType(guid1, guid3, guid2, CustodialRelationshipType.ParentWithCourtAppointedCustody)),
                new FamilyCommandExecuted(adminId, new DateTime(2021, 7, 1), new AddCustodialRelationship(guid1, new CustodialRelationship(guid3, guid1, CustodialRelationshipType.ParentWithCourtAppointedCustody))),
                new PersonCommandExecuted(adminId, new DateTime(2021, 7, 1), new CreatePerson(guid4, "Emily", "Coachworthy", Gender.Female, new ExactAge(new DateTime(1980, 3, 19)), "Caucasian",
                    ImmutableList<Address>.Empty, null, ImmutableList<PhoneNumber>.Empty, null, ImmutableList<EmailAddress>.Empty, null, null, null)),
                new FamilyCommandExecuted(adminId, new DateTime(2021, 7, 1), new CreateFamily(guid4, guid4,
                    ImmutableList<(Guid, FamilyAdultRelationshipInfo)>.Empty.Add((guid4, new FamilyAdultRelationshipInfo("Single", true))),
                    ImmutableList<Guid>.Empty, ImmutableList<CustodialRelationship>.Empty)),
                new PersonCommandExecuted(adminId, new DateTime(2021, 7, 1), new CreatePerson(guid5, "Han", "Solo", Gender.Male, new AgeInYears(30, new DateTime(2021, 7, 1)), "Corellian",
                    ImmutableList<Address>.Empty, null, ImmutableList<PhoneNumber>.Empty, null, ImmutableList<EmailAddress>.Empty, null, "Smuggler", null)),
                new PersonCommandExecuted(adminId, new DateTime(2021, 7, 1), new CreatePerson(guid6, "Leia", "Skywalker", Gender.Male, new AgeInYears(28, new DateTime(2021, 7, 1)), "Tatooinian",
                    ImmutableList<Address>.Empty, null, ImmutableList<PhoneNumber>.Empty, null, ImmutableList<EmailAddress>.Empty, null, "Freedom fighter", "Uncertain claim to royalty")),
                new PersonCommandExecuted(adminId, new DateTime(2021, 7, 1), new CreatePerson(guid7, "Ben", "Solo", Gender.Male, new AgeInYears(12, new DateTime(2021, 7, 1)), "Chandrilan",
                    ImmutableList<Address>.Empty, null, ImmutableList<PhoneNumber>.Empty, null, ImmutableList<EmailAddress>.Empty, null, null, null)),
                new PersonCommandExecuted(adminId, new DateTime(2021, 7, 1), new CreatePerson(guidA, "Luke", "Skywalker", Gender.Male, new AgeInYears(28, new DateTime(2021, 7, 1)), "Tatooinian",
                    ImmutableList<Address>.Empty, null, ImmutableList<PhoneNumber>.Empty, null, ImmutableList<EmailAddress>.Empty, null, null, null)),
                new FamilyCommandExecuted(adminId, new DateTime(2021, 7, 1), new CreateFamily(guid2, guid6,
                    ImmutableList<(Guid, FamilyAdultRelationshipInfo)>.Empty
                        .Add((guid5, new FamilyAdultRelationshipInfo("Dad", true)))
                        .Add((guid6, new FamilyAdultRelationshipInfo("Mom", true)))
                        .Add((guidA, new FamilyAdultRelationshipInfo("Sibling", false))),
                    ImmutableList<Guid>.Empty.Add(guid7), ImmutableList<CustodialRelationship>.Empty
                        .Add(new CustodialRelationship(guid7, guid5, CustodialRelationshipType.ParentWithCustody))
                        .Add(new CustodialRelationship(guid7, guid6, CustodialRelationshipType.ParentWithCustody)))),
                new PersonCommandExecuted(adminId, new DateTime(2021, 7, 1), new CreatePerson(guid8, "William", "Riker", Gender.Male, new ExactAge(new DateTime(1972, 1, 1)), "Alaskan",
                    ImmutableList<Address>.Empty, null, ImmutableList<PhoneNumber>.Empty, null, ImmutableList<EmailAddress>.Empty, null, null, null)),
                new PersonCommandExecuted(adminId, new DateTime(2021, 7, 1), new CreatePerson(guid9, "Deanna", "Riker", Gender.Female, new ExactAge(new DateTime(1970, 1, 1)), "Betazoid",
                    ImmutableList<Address>.Empty, null, ImmutableList<PhoneNumber>.Empty, null, ImmutableList<EmailAddress>.Empty, null, null, null)),
                new FamilyCommandExecuted(adminId, new DateTime(2021, 7, 1), new CreateFamily(guid3, guid8,
                    ImmutableList<(Guid, FamilyAdultRelationshipInfo)>.Empty
                        .Add((guid8, new FamilyAdultRelationshipInfo("Dad", true)))
                        .Add((guid9, new FamilyAdultRelationshipInfo("Mom", true))),
                    ImmutableList<Guid>.Empty, ImmutableList<CustodialRelationship>.Empty)),
                new PersonCommandExecuted(adminId, new DateTime(2021, 7, 1), new AddPersonAddress(guid1,
                    new Address(guid3, "456 Old Ave.", null, "Bigtown", "TX", "67890"),
                    true)),
                new PersonCommandExecuted(adminId, new DateTime(2021, 7, 1), new AddPersonPhoneNumber(guid1,
                    new PhoneNumber(guid2, "1235554567", PhoneNumberType.Mobile),
                    true)),
                new PersonCommandExecuted(adminId, new DateTime(2021, 7, 1), new AddPersonEmailAddress(guid1,
                    new EmailAddress(guid2, "personal@example.com", EmailAddressType.Personal),
                    true)),
                new PersonCommandExecuted(adminId, new DateTime(2021, 7, 1), new AddPersonAddress(guid1,
                    new Address(guid2, "123 Main St.", "Apt. A", "Smallville", "NY", "12345"),
                    true)),
                new PersonCommandExecuted(adminId, new DateTime(2021, 7, 1), new UpdatePersonAddress(guid1,
                    new Address(guid3, "456 Old Ave.", null, "Bigtown", "TX", "67890"),
                    false)),
                new PersonCommandExecuted(adminId, new DateTime(2021, 7, 1), new AddPersonPhoneNumber(guid1,
                    new PhoneNumber(guid3, "1235555555", PhoneNumberType.Home),
                    true)),
                new PersonCommandExecuted(adminId, new DateTime(2021, 7, 1), new UpdatePersonPhoneNumber(guid1,
                    new PhoneNumber(guid2, "1235554567", PhoneNumberType.Mobile),
                    false)),
                new PersonCommandExecuted(adminId, new DateTime(2021, 7, 1), new AddPersonEmailAddress(guid1,
                    new EmailAddress(guid3, "work@example.com", EmailAddressType.Work),
                    true)),
                new PersonCommandExecuted(adminId, new DateTime(2021, 7, 1), new UpdatePersonEmailAddress(guid1,
                    new EmailAddress(guid2, "personal@example.com", EmailAddressType.Personal),
                    false)),
                //new PersonCommandExecuted(adminId, new DateTime(2021, 7, 1), new UpdatePersonContactMethodPreferenceNotes(guid1,
                //    "Cannot receive voicemails")),
                new PersonCommandExecuted(adminId, new DateTime(2021, 8, 1), new AddPersonAddress(guid4,
                    new Address(guid3, "456 Old Ave.", null, "Bigtown", "TX", "67890"),
                    true)),
                new PersonCommandExecuted(adminId, new DateTime(2021, 8, 1), new AddPersonPhoneNumber(guid4,
                    new PhoneNumber(guid2, "1235554567", PhoneNumberType.Mobile),
                    true)),
                new PersonCommandExecuted(adminId, new DateTime(2021, 8, 1), new AddPersonEmailAddress(guid4,
                    new EmailAddress(guid2, "personal@example.com", EmailAddressType.Personal),
                    true)),
                new PersonCommandExecuted(adminId, new DateTime(2021, 8, 1), new AddPersonAddress(guid4,
                    new Address(guid2, "123 Main St.", "Apt. A", "Smallville", "NY", "12345"),
                    true)),
                new PersonCommandExecuted(adminId, new DateTime(2021, 8, 1), new UpdatePersonAddress(guid4,
                    new Address(guid3, "456 Old Ave.", null, "Bigtown", "TX", "67890"),
                    false)),
                new PersonCommandExecuted(adminId, new DateTime(2021, 8, 1), new AddPersonPhoneNumber(guid4,
                    new PhoneNumber(guid3, "1235555555", PhoneNumberType.Home),
                    true)),
                new PersonCommandExecuted(adminId, new DateTime(2021, 8, 1), new UpdatePersonPhoneNumber(guid4,
                    new PhoneNumber(guid2, "1235554567", PhoneNumberType.Mobile),
                    false)),
                new PersonCommandExecuted(adminId, new DateTime(2021, 8, 1), new AddPersonEmailAddress(guid4,
                    new EmailAddress(guid3, "work@example.com", EmailAddressType.Work),
                    true)),
                new PersonCommandExecuted(adminId, new DateTime(2021, 8, 1), new UpdatePersonEmailAddress(guid4,
                    new EmailAddress(guid2, "personal@example.com", EmailAddressType.Personal),
                    false)),
                //new PersonCommandExecuted(adminId, new DateTime(2021, 8, 1), new UpdatePersonContactMethodPreferenceNotes(guid4,
                //    "Cannot receive voicemails"))
                new FamilyCommandExecuted(adminId, new DateTime(2022, 3, 2, 18, 0, 0), new UploadFamilyDocument(guid1, guid2, "Jane Doe second referral info.pdf")),
                new PersonCommandExecuted(adminId, new DateTime(2022, 6, 21), new CreatePerson(guidB, "Emmett", "Brown", Gender.Male, new AgeInYears(60, new DateTime(2022, 6, 21)), "Caucasian",
                    ImmutableList<Address>.Empty, null, ImmutableList<PhoneNumber>.Empty, null, ImmutableList<EmailAddress>.Empty, null, null, null)),
                new PersonCommandExecuted(adminId, new DateTime(2022, 6, 21), new CreatePerson(guidC, "Marty", "McFly", Gender.Male, new AgeInYears(14, new DateTime(2022, 6, 21)), "Caucasian",
                    ImmutableList<Address>.Empty, null, ImmutableList<PhoneNumber>.Empty, null, ImmutableList<EmailAddress>.Empty, null, null, null)),
                new FamilyCommandExecuted(adminId, new DateTime(2022, 6, 21), new CreateFamily(guid5, guidB,
                    ImmutableList<(Guid, FamilyAdultRelationshipInfo)>.Empty
                        .Add((guidB, new FamilyAdultRelationshipInfo("Single", true))),
                    ImmutableList<Guid>.Empty.Add(guidC), ImmutableList<CustodialRelationship>.Empty
                        .Add(new CustodialRelationship(guidC, guidB, CustodialRelationshipType.LegalGuardian))))
            );
        }

        public static async Task PopulateReferralEvents(IEventLog<ReferralEvent> referralsEventLog)
        {
            await referralsEventLog.AppendEventsAsync(guid1, guid2,
                new ReferralCommandExecuted(adminId, new DateTime(2020, 3, 5, 4, 10, 0), new CreateReferral(guid1, guid1, new DateTime(2020, 3, 5, 4, 10, 0))),
                new ReferralCommandExecuted(adminId, new DateTime(2020, 3, 5, 4, 15, 15), new CompleteReferralRequirement(guid1, guid1, guid1, "Request for Help Form", new DateTime(2020, 3, 5, 4, 12, 15), guid1, null)),
                new ReferralCommandExecuted(adminId, new DateTime(2020, 3, 6, 8, 45, 30), new CompleteReferralRequirement(guid1, guid1, guid2, "Intake Coordinator Screening Call", new DateTime(2020, 3, 6, 8, 45, 30), adminId, null)),
                new ReferralCommandExecuted(adminId, new DateTime(2020, 3, 6, 8, 45, 45), new UpdateReferralComments(guid1, guid1, "John and Jane seem eerily... generic.")),
                new ArrangementsCommandExecuted(adminId, new DateTime(2020, 3, 11, 11, 12, 13), new CreateArrangement(guid1, guid1, ImmutableList.Create(guid1), "Hosting", new DateTime(2020, 3, 11), guid3)),
                new ArrangementsCommandExecuted(adminId, new DateTime(2020, 3, 11, 11, 13, 14), new AssignIndividualVolunteer(guid1, guid1, ImmutableList.Create(guid1), guid4, guid4, "Family Coach", null)),
                new ArrangementsCommandExecuted(adminId, new DateTime(2020, 3, 11, 11, 13, 55), new AssignVolunteerFamily(guid1, guid1, ImmutableList.Create(guid1), guid2, "Host Family", "New Host Family")),
                new ArrangementsCommandExecuted(adminId, new DateTime(2020, 3, 11, 12, 22, 21), new AssignVolunteerFamily(guid1, guid1, ImmutableList.Create(guid1), guid3, "Host Family Friend", "Familiar Host Family")),
                new ArrangementsCommandExecuted(adminId, new DateTime(2020, 3, 12, 16, 55, 0), new StartArrangements(guid1, guid1, ImmutableList.Create(guid1), new DateTime(2020, 3, 12, 16, 55, 0))),
                new ArrangementsCommandExecuted(adminId, new DateTime(2020, 3, 15, 8, 33, 34), new TrackChildLocationChange(guid1, guid1, ImmutableList.Create(guid1),
                    new DateTime(2020, 3, 15, 8, 33, 34), guid3, guid9, ChildLocationPlan.DaytimeChildCare, guid4)),
                new ArrangementsCommandExecuted(adminId, new DateTime(2020, 3, 15, 20, 40, 45), new TrackChildLocationChange(guid1, guid1, ImmutableList.Create(guid1),
                        new DateTime(2020, 3, 15, 20, 40, 45), guid2, guid6, ChildLocationPlan.DaytimeChildCare, guid5)),
                new ArrangementsCommandExecuted(adminId, new DateTime(2020, 3, 14, 10, 10, 10), new CompleteArrangementRequirement(guid1, guid1, ImmutableList.Create(guid1), guid1,
                    "Family Coach Safety Visit", new DateTime(2020, 3, 14, 10, 10, 10), guid4, guid0)),
                new ArrangementsCommandExecuted(adminId, new DateTime(2020, 3, 21, 11, 11, 11), new CompleteArrangementRequirement(guid1, guid1, ImmutableList.Create(guid1), guid2,
                    "Family Coach Supervision", new DateTime(2020, 3, 21, 11, 11, 11), adminId, null)),
                new ArrangementsCommandExecuted(adminId, new DateTime(2020, 3, 30, 18, 45, 0), new TrackChildLocationChange(guid1, guid1, ImmutableList.Create(guid1),
                    new DateTime(2020, 3, 22, 16, 30, 35), guid1, guid2, ChildLocationPlan.WithParent, guid6)),
                new ArrangementsCommandExecuted(adminId, new DateTime(2020, 3, 30, 18, 46, 0), new TrackChildLocationChange(guid1, guid1, ImmutableList.Create(guid1),
                    new DateTime(2020, 3, 24, 8, 30, 35), guid2, guid5, ChildLocationPlan.OvernightHousing, guid7)),
                new ArrangementsCommandExecuted(adminId, new DateTime(2020, 3, 30, 18, 47, 0), new TrackChildLocationChange(guid1, guid1, ImmutableList.Create(guid1),
                    new DateTime(2020, 3, 30, 18, 18, 18), guid1, guid2, ChildLocationPlan.WithParent, guid8)),
                new ArrangementsCommandExecuted(adminId, new DateTime(2020, 3, 30, 19, 0, 0), new EndArrangements(guid1, guid1, ImmutableList.Create(guid1), new DateTime(2020, 3, 30, 19, 0, 0))),
                new ReferralCommandExecuted(adminId, new DateTime(2020, 4, 1, 12, 32, 55), new CloseReferral(guid1, guid1, ReferralCloseReason.NeedMet, new DateTime(2020, 4, 1, 12, 0, 0))),
                new ReferralCommandExecuted(adminId, new DateTime(2022, 3, 1, 19, 30, 45), new CreateReferral(guid1, guid2, new DateTime(2022, 3, 1, 19, 30, 45))),
                new ReferralCommandExecuted(adminId, new DateTime(2022, 3, 1, 19, 31, 0), new UpdateReferralComments(guid1, guid2, "The family needs help because Daylight Savings Time is starting up again soon.")),
                new ReferralCommandExecuted(adminId, new DateTime(2022, 3, 2, 19, 32, 0), new CompleteReferralRequirement(guid1, guid2, guid3, "Request for Help Form", new DateTime(2022, 3, 2, 18, 0, 0), guid2, null)),
                new ReferralCommandExecuted(adminId, new DateTime(2022, 3, 2, 19, 32, 0), new CompleteReferralRequirement(guid1, guid2, guid4, "Intake Coordinator Screening Call",
                    new DateTime(2022, 3, 2, 19, 32, 0), null, null)),
                new ArrangementsCommandExecuted(adminId, new DateTime(2022, 3, 3, 10, 0, 0), new CreateArrangement(guid1, guid2, ImmutableList.Create(guid2), "Babysitting", new DateTime(2022, 3, 2), guid3)),
                new ArrangementsCommandExecuted(adminId, new DateTime(2022, 3, 3, 10, 0, 0), new CreateArrangement(guid1, guid2, ImmutableList.Create(guid3), "Friending", new DateTime(2022, 4, 2), guid1)),
                new ArrangementsCommandExecuted(adminId, new DateTime(2022, 3, 3, 10, 0, 0), new CreateArrangement(guid1, guid2, ImmutableList.Create(guid4), "Friending", new DateTime(2022, 5, 2), guid2)),
                new ArrangementsCommandExecuted(adminId, new DateTime(2022, 3, 3, 10, 0, 0), new CreateArrangement(guid1, guid2, ImmutableList.Create(guid5), "Hosting", new DateTime(2022, 3, 2), guid3)),
                new ArrangementsCommandExecuted(adminId, new DateTime(2022, 3, 3, 10, 0, 0), new UpdateArrangementComments(guid1, guid2, ImmutableList.Create(guid2), "Start on Friday the 11th")),
                new ArrangementsCommandExecuted(adminId, new DateTime(2022, 3, 3, 10, 0, 0), new UpdateArrangementComments(guid1, guid2, ImmutableList.Create(guid3, guid4), "Start on Saturday the 12th")),
                new ArrangementsCommandExecuted(adminId, new DateTime(2022, 3, 3, 11, 0, 0), new AssignIndividualVolunteer(guid1, guid2, ImmutableList.Create(guid5), guid4, guid4, "Family Coach", null)),
                new ArrangementsCommandExecuted(adminId, new DateTime(2022, 3, 3, 11, 0, 0), new AssignVolunteerFamily(guid1, guid2, ImmutableList.Create(guid5), guid2, "Host Family", null)), // Demonstrates invalid data (variant required by newer policy)
                new ReferralCommandExecuted(adminId, new DateTime(2022, 6, 21, 20, 38, 0), new CreateReferral(guid5, guid3, new DateTime(2022, 6, 21, 20, 38, 0)))
            );
        }

        public static async Task PopulateGoalEvents(IEventLog<GoalCommandExecutedEvent> goalsEventLog)
        {
            await goalsEventLog.AppendEventsAsync(guid1, guid2,
                new GoalCommandExecutedEvent(adminId, new DateTime(2021, 7, 11), new CreateGoal(guid2, guid1, "Get an apartment", new DateTime(2021, 8, 11))),
                new GoalCommandExecutedEvent(adminId, new DateTime(2021, 7, 11), new CreateGoal(guid2, guid2, "Find a job", new DateTime(2021, 8, 11))),
                new GoalCommandExecutedEvent(adminId, new DateTime(2021, 7, 11), new CreateGoal(guid2, guid2, "Get daytime childcare", new DateTime(2021, 8, 1))),
                new GoalCommandExecutedEvent(adminId, new DateTime(2021, 7, 12), new ChangeGoalDescription(guid2, guid1, "Find stable housing")),
                new GoalCommandExecutedEvent(adminId, new DateTime(2021, 8, 1), new ChangeGoalTargetDate(guid2, guid1, new DateTime(2021, 8, 31))),
                new GoalCommandExecutedEvent(adminId, new DateTime(2021, 8, 30), new MarkGoalCompleted(guid2, guid1, new DateTime(2021, 8, 27))));
        }

        public static async Task PopulateApprovalEvents(IEventLog<ApprovalEvent> approvalsEventLog)
        {
            await approvalsEventLog.AppendEventsAsync(guid1, guid2,
                new VolunteerFamilyCommandExecuted(adminId, new DateTime(),
                    new ActivateVolunteerFamily(guid0)),
                new VolunteerFamilyCommandExecuted(adminId, new DateTime(),
                    new UploadVolunteerFamilyDocument(guid4, guid1, "fca.pdf")),
                new VolunteerCommandExecuted(adminId, new DateTime(2021, 7, 1),
                    new CompleteVolunteerRequirement(guid4, guid4, guid1, "Family Coach Application", new DateTime(2021, 7, 1), guid1, null)),
                new VolunteerCommandExecuted(adminId, new DateTime(2021, 7, 10),
                    new CompleteVolunteerRequirement(guid4, guid4, guid2, "Interview with Family Coach Supervisor", new DateTime(2021, 7, 9), Guid.Empty, guid9)),
                new VolunteerFamilyCommandExecuted(adminId, new DateTime(2021, 7, 14),
                    new UploadVolunteerFamilyDocument(guid4, guid2, "bgcheck.pdf")),
                new VolunteerCommandExecuted(adminId, new DateTime(2021, 7, 14),
                    new CompleteVolunteerRequirement(guid4, guid4, guid3, "Background Check", new DateTime(2021, 7, 13), guid2, null)),
                new VolunteerFamilyCommandExecuted(adminId, new DateTime(2021, 7, 1),
                    new UploadVolunteerFamilyDocument(guid3, guid3, "hfapp.pdf")), 
                new VolunteerFamilyCommandExecuted(adminId, new DateTime(2021, 7, 1),
                    new CompleteVolunteerFamilyRequirement(guid3, guid1, "Host Family Application", new DateTime(2021, 7, 1), guid3, null)),
                new VolunteerFamilyCommandExecuted(adminId, new DateTime(2021, 7, 15),
                    new CompleteVolunteerFamilyRequirement(guid3, guid2, "Home Screening Checklist", new DateTime(2021, 7, 14), Guid.Empty, null)),
                new VolunteerFamilyCommandExecuted(adminId, new DateTime(2021, 7, 18),
                    new UploadVolunteerFamilyDocument(guid3, guid4, "bgcheck23.pdf")),
                new VolunteerCommandExecuted(adminId, new DateTime(2021, 7, 18),
                    new CompleteVolunteerRequirement(guid3, guid8, guid4, "Background Check", new DateTime(2021, 7, 16), guid4, null)),
                new VolunteerFamilyCommandExecuted(adminId, new DateTime(2021, 7, 18),
                    new UploadVolunteerFamilyDocument(guid3, guid5, "background check.pdf")),
                new VolunteerCommandExecuted(adminId, new DateTime(2021, 7, 18),
                    new CompleteVolunteerRequirement(guid3, guid9, guid5, "Background Check", new DateTime(2021, 7, 16), guid5, null)),
                new VolunteerFamilyCommandExecuted(adminId, new DateTime(2021, 8, 10),
                    new UploadVolunteerFamilyDocument(guid2, guid6, "famfriendapp.pdf")),
                new VolunteerCommandExecuted(adminId, new DateTime(2021, 8, 10),
                    new CompleteVolunteerRequirement(guid2, guid6, guid6, "Family Friend Application", new DateTime(2021, 8, 10), guid6, null)),
                new VolunteerCommandExecuted(adminId, new DateTime(2021, 8, 11), //TODO: This is a workaround for a bug!
                    new CompleteVolunteerRequirement(guid2, guid5, guid7, "Family Friend Application", new DateTime(2021, 8, 11), guid7, null)),
                new VolunteerFamilyCommandExecuted(adminId, new DateTime(2021, 9, 1),
                    new ExemptVolunteerFamilyRequirement(guid3, "Host Family Interview", "'Picard' showed that they still watch out for Jean-Luc, so we have no concerns.", null)),
                new VolunteerCommandExecuted(adminId, new DateTime(2021, 9, 1),
                    new ExemptVolunteerRequirement(guid3, guid8, "Comprehensive Background Check", "Starfleet clearance still active", new DateTime(2278, 12, 31))),
                new VolunteerCommandExecuted(adminId, new DateTime(2021, 9, 1),
                    new CompleteVolunteerRequirement(guid3, guid8, new Guid(), "Host Family Training", new DateTime(2021, 9, 1), null, null)),
                new VolunteerCommandExecuted(adminId, new DateTime(2021, 9, 1),
                    new ExemptVolunteerRequirement(guid3, guid9, "Host Family Training", "She's a Betazoid. Empaths don't need training.", new DateTime(2278, 12, 31))),
                new VolunteerCommandExecuted(adminId, new DateTime(2021, 9, 1),
                    new CompleteVolunteerRequirement(guid3, guid9, new Guid(), "Comprehensive Background Check", new DateTime(2021, 9, 1), null, null))
                );
        }

        public static async Task PopulateNoteEvents(IEventLog<NotesEvent> referralsEventLog)
        {
            await referralsEventLog.AppendEventsAsync(guid1, guid2,
                new NoteCommandExecuted(volunteerId, new DateTime(2020, 3, 14, 10, 10, 10), new CreateDraftNote(guid1, guid0,
                    null, null)),
                new NoteCommandExecuted(adminId, new DateTime(2020, 3, 14, 11, 10, 10), new ApproveNote(guid1, guid0,
                    "The kids were in awe of my carpet bag. They were such sweethearts, though I do wish to state, for the record, that they are given entirely too much sugar with their medicine.", null)),
                new NoteCommandExecuted(volunteerId, new DateTime(2020, 3, 15, 8, 33, 34), new CreateDraftNote(guid1, guid4, null, null)),
                new NoteCommandExecuted(adminId, new DateTime(2020, 3, 15, 8, 33, 34), new ApproveNote(guid1, guid4, "Babysitting", null)),
                new NoteCommandExecuted(volunteerId, new DateTime(2020, 3, 15, 20, 40, 45), new CreateDraftNote(guid1, guid5, null, null)),
                new NoteCommandExecuted(adminId, new DateTime(2020, 3, 15, 20, 40, 45), new ApproveNote(guid1, guid5, "Dropped off with host parents after ☕ and 🍰", null)),
                new NoteCommandExecuted(volunteerId, new DateTime(2020, 3, 22, 16, 30, 35), new CreateDraftNote(guid1, guid6, null, null)),
                new NoteCommandExecuted(adminId, new DateTime(2020, 3, 22, 16, 30, 35), new ApproveNote(guid1, guid6, "Weekend with parents, met at McDonald's near mom", null)),
                new NoteCommandExecuted(volunteerId, new DateTime(2020, 3, 22, 18, 0, 0), new CreateDraftNote(guid1, guid1, null, null)),
                new NoteCommandExecuted(volunteerId, new DateTime(2020, 3, 22, 19, 30, 0), new EditDraftNote(guid1, guid1, null, null)),
                new NoteCommandExecuted(adminId, new DateTime(2020, 3, 22, 19, 45, 0), new ApproveNote(guid1, guid1, "Eric and Ben liked the Play Place and didn't want to go home.", null)),
                new NoteCommandExecuted(volunteerId, new DateTime(2020, 3, 24, 8, 30, 35), new CreateDraftNote(guid1, guid7, null, null)),
                new NoteCommandExecuted(adminId, new DateTime(2020, 3, 24, 8, 30, 35), new ApproveNote(guid1, guid7, "Mom dropped off on way to work", null)),
                new NoteCommandExecuted(volunteerId, new DateTime(2020, 3, 24, 8, 45, 0), new CreateDraftNote(guid1, guid2, null, null)),
                new NoteCommandExecuted(volunteerId, new DateTime(2020, 3, 24, 8, 50, 0), new DiscardDraftNote(guid1, guid2)),
                new NoteCommandExecuted(volunteerId, new DateTime(2020, 3, 24, 8, 55, 0), new CreateDraftNote(guid1, guid3, null, null)),
                new NoteCommandExecuted(volunteerId, new DateTime(2020, 3, 24, 8, 57, 0), new EditDraftNote(guid1, guid3, null, null)),
                new NoteCommandExecuted(volunteerId, new DateTime(2020, 3, 30, 18, 18, 18), new CreateDraftNote(guid1, guid8, null, null)),
                new NoteCommandExecuted(adminId, new DateTime(2020, 3, 30, 18, 18, 18), new ApproveNote(guid1, guid8, "Mom met us and picked him up at DQ", null)),
                new NoteCommandExecuted(adminId, new DateTime(2020, 3, 31, 10, 0, 0), new CreateDraftNote(guid1, guidA, null, null)),
                new NoteCommandExecuted(adminId, new DateTime(2021, 7, 10, 9, 30, 0), new CreateDraftNote(guid4, guid9, null, null)),
                new NoteCommandExecuted(adminId, new DateTime(2021, 7, 10, 9, 32, 0), new ApproveNote(guid4, guid9, "I'm a little star-struck... Emily is *amazing*!!", null)));
        }

        public static async Task PopulateCommunityEvents(IEventLog<CommunityCommandExecutedEvent> communitiesEventLog)
        {
            await communitiesEventLog.AppendEventsAsync(guid1, guid2,
                new CommunityCommandExecutedEvent(adminId, new DateTime(2023, 2, 1, 10, 0, 0), new CreateCommunity(guid1, "Officer Poker Group", "This informal group meets whenever the script calls for it.")),
                new CommunityCommandExecutedEvent(adminId, new DateTime(2023, 2, 1, 10, 5, 0), new RenameCommunity(guid1, "Officers' Poker Group")),
                new CommunityCommandExecutedEvent(adminId, new DateTime(2023, 2, 1, 10, 7, 30), new EditCommunityDescription(guid1, "This informal group meets whenever the script calls for it... and Tuesday evenings.")),
                new CommunityCommandExecutedEvent(adminId, new DateTime(2023, 2, 1, 10, 10, 0), new AddCommunityMemberFamily(guid1, guid3)),
                new CommunityCommandExecutedEvent(adminId, new DateTime(2023, 2, 1, 10, 12, 0), new AddCommunityMemberFamily(guid1, guid4)),
                new CommunityCommandExecutedEvent(adminId, new DateTime(2023, 2, 1, 10, 13, 0), new AddCommunityMemberFamily(guid1, guid5)),
                new CommunityCommandExecutedEvent(adminId, new DateTime(2023, 2, 1, 10, 14, 0), new AddCommunityRoleAssignment(guid1, guid4, "Community Organizer")),
                new CommunityCommandExecutedEvent(adminId, new DateTime(2023, 2, 1, 10, 14, 0), new AddCommunityRoleAssignment(guid1, guid8, "Community Organizer")),
                new CommunityCommandExecutedEvent(adminId, new DateTime(2023, 2, 1, 10, 15, 0), new RemoveCommunityRoleAssignment(guid1, guid4, "Community Organizer")),
                new CommunityCommandExecutedEvent(adminId, new DateTime(2023, 2, 1, 10, 15, 30), new AddCommunityRoleAssignment(guid1, guid4, "Community Co-Organizer")),
                new CommunityCommandExecutedEvent(adminId, new DateTime(2023, 2, 1, 10, 16, 0), new UploadCommunityDocument(guid1, guid1, "Five-card stud rules.pdf")),
                new CommunityCommandExecutedEvent(adminId, new DateTime(2023, 2, 1, 10, 16, 30), new DeleteUploadedCommunityDocument(guid1, guid1)),
                new CommunityCommandExecutedEvent(adminId, new DateTime(2023, 2, 1, 10, 18, 12), new UploadCommunityDocument(guid1, guid2, "Revised five-card stud rules.pdf")),
                new CommunityCommandExecutedEvent(adminId, new DateTime(2023, 2, 2, 0, 0, 0), new CreateCommunity(guid2, "Fight Club", "Don't talk about it.")));
        }

        public static async Task PopulateDraftNotes(IObjectStore<string?> draftNotesStore)
        {
            await draftNotesStore.UpsertAsync(guid1, guid2, guid3.ToString(),
                "Kids are doing better playing this morning. For some reason they're both really into \"lightsabers\" or something like that... 😅");
            await draftNotesStore.UpsertAsync(guid1, guid2, guidA.ToString(),
                "Jane said \"So long and thanks for all the fish.\" Not sure what to make of that.");
        }

        public static async Task PopulateConfigurations(IObjectStore<OrganizationConfiguration> configurationStore,
            string? testSourceSmsPhoneNumber, IObjectStore<OrganizationSecrets> organizationSecretsStore)
        {
            var sourcePhoneNumbers = ImmutableList<SourcePhoneNumberConfiguration>.Empty;
            if (!string.IsNullOrWhiteSpace(testSourceSmsPhoneNumber))
                sourcePhoneNumbers = sourcePhoneNumbers.Add(
                    new SourcePhoneNumberConfiguration(testSourceSmsPhoneNumber, "Test Number"));

            await configurationStore.UpsertAsync(guid1, Guid.Empty, "config",
                new OrganizationConfiguration("CareTogether",
                    ImmutableList<LocationConfiguration>.Empty
                        .Add(new LocationConfiguration(guid2, "Atlantis",
                            ImmutableList<string>.Empty.AddRange(new[] { "Atlantean", "Aquatic", "Norse" }),
                            ImmutableList<string>.Empty.AddRange(new[] { "Single", "Spouse", "Partner", "Dad", "Mom", "Relative", "Droid" }),
                            sourcePhoneNumbers))
                        .Add(new LocationConfiguration(guid3, "El Dorado",
                            ImmutableList<string>.Empty.AddRange(new[] { "Amazon", "Caucasian", "Other" }),
                            ImmutableList<string>.Empty.AddRange(new[] { "Single", "Spouse", "Partner", "Dad", "Mom", "Relative", "Domestic Worker" }),
                            sourcePhoneNumbers)),
                    ImmutableList<RoleDefinition>.Empty
                        .Add(new RoleDefinition("Volunteer", IsProtected: false, ImmutableList<ContextualPermissionSet>.Empty
                            .Add(new ContextualPermissionSet(new GlobalPermissionContext(),
                                ImmutableList.Create(
                                    Permission.AccessPartneringFamiliesScreen,
                                    Permission.AccessVolunteersScreen,
                                    Permission.AccessCommunitiesScreen
                                )))
                            .Add(new ContextualPermissionSet(new OwnFamilyPermissionContext(),
                                ImmutableList.Create(
                                    Permission.ViewPersonContactInfo,
                                    Permission.ViewApprovalProgress,
                                    Permission.ViewFamilyDocumentMetadata
                                )))
                            .Add(new ContextualPermissionSet(
                                new AssignedFunctionsInReferralPartneringFamilyPermissionContext(WhenReferralIsOpen: true,
                                    WhenOwnFunctionIsIn: ImmutableList.Create(
                                        "Host Family",
                                        "Family Coach",
                                        "Family Friend",
                                        "Parent Friend",
                                        "Host Family Friend",
                                        "Staff Supervision"
                                    )),
                                ImmutableList.Create(
                                    Permission.AddEditDraftNotes,
                                    Permission.DiscardDraftNotes,
                                    Permission.ViewAssignments,
                                    Permission.ViewAssignedArrangementProgress,
                                    Permission.ViewChildLocationHistory,
                                    Permission.TrackChildLocationChange,
                                    Permission.ViewPersonConcerns,
                                    Permission.ViewPersonNotes
                                )))
                            .Add(new ContextualPermissionSet(
                                new AssignedFunctionsInReferralCoAssigneeFamiliesPermissionContext(WhenReferralIsOpen: null,
                                    WhenOwnFunctionIsIn: null, WhenAssigneeFunctionIsIn: null),
                                ImmutableList.Create(
                                    Permission.ViewPersonContactInfo
                                )))
                            .Add(new ContextualPermissionSet(
                                new CommunityMemberPermissionContext(
                                    WhenOwnCommunityRoleIsIn: null),
                                ImmutableList.Create(
                                    Permission.ViewCommunityDocumentMetadata)))
                            .Add(new ContextualPermissionSet(
                                new CommunityMemberPermissionContext(
                                    WhenOwnCommunityRoleIsIn: ImmutableList.Create("Community Organizer", "Community Co-Organizer")),
                                ImmutableList.Create(
                                    Permission.ReadCommunityDocuments)))
                            .Add(new ContextualPermissionSet(
                                new CommunityCoMemberFamiliesPermissionContext(
                                    WhenOwnCommunityRoleIsIn: null),
                                ImmutableList.Create(
                                    Permission.ViewPersonContactInfo,
                                    Permission.ViewApprovalStatus)))
                            .Add(new ContextualPermissionSet(
                                new CommunityCoMemberFamiliesPermissionContext(
                                    WhenOwnCommunityRoleIsIn: ImmutableList.Create("Community Organizer")),
                                ImmutableList.Create(
                                    Permission.ViewApprovalProgress,
                                    Permission.ViewReferralProgress,
                                    Permission.ViewArrangementProgress))))),
                    ImmutableList<string>.Empty
                        .Add("Community Organizer")
                        .Add("Community Co-Organizer")));

            await organizationSecretsStore.UpsertAsync(guid1, Guid.Empty, "secrets",
                new OrganizationSecrets("0123456789abcdef0123456789abcdef"));
        }

        public static async Task PopulatePolicies(IObjectStore<EffectiveLocationPolicy> policiesStore)
        {
            var policy = new EffectiveLocationPolicy(
                ActionDefinitions: new Dictionary<string, ActionRequirement>
                {
                    ["Request for Help Form"] = new ActionRequirement(DocumentLinkRequirement.Allowed, NoteEntryRequirement.Allowed,
                        "Can be done over the phone", new Uri("http://example.com/forms/requestforhelp-v1"), null),
                    ["Intake Coordinator Screening Call"] = new ActionRequirement(DocumentLinkRequirement.None, NoteEntryRequirement.Required, null, null, null),
                    ["Intake Form"] = new ActionRequirement(DocumentLinkRequirement.Required, NoteEntryRequirement.Allowed,
                        "Email or text the Cognito Form link", new Uri("http://example.com/forms/intake-v1"), null),
                    ["Hosting Consent"] = new ActionRequirement(DocumentLinkRequirement.Required, NoteEntryRequirement.None,
                        "This must be notarized.", new Uri("http://example.com/forms/consent-v1"), null),
                    ["Family Meeting"] = new ActionRequirement(DocumentLinkRequirement.None, NoteEntryRequirement.Required,
                        null, null, null),
                    ["Medical POA"] = new ActionRequirement(DocumentLinkRequirement.Required, NoteEntryRequirement.None,
                        "This must be notarized.", new Uri("http://example.com/forms/medicalpoa-v2"), null),
                    ["Family Coach Safety Visit"] = new ActionRequirement(DocumentLinkRequirement.None, NoteEntryRequirement.Required, null, null, null),
                    ["Return of Child Form"] = new ActionRequirement(DocumentLinkRequirement.Required, NoteEntryRequirement.Allowed,
                        null, new Uri("http://example.com/forms/returnofchild-v1"), null),
                    ["Host Family Debriefing"] = new ActionRequirement(DocumentLinkRequirement.Required, NoteEntryRequirement.Required, null, null, null),
                    ["Advocacy Agreement"] = new ActionRequirement(DocumentLinkRequirement.Required, NoteEntryRequirement.None,
                        null, new Uri("http://example.com/forms/advocacy-v1"), null),
                    ["Family Coach Checkin"] = new ActionRequirement(DocumentLinkRequirement.None, NoteEntryRequirement.Required, null, null, null),
                    ["Family Coach Supervision"] = new ActionRequirement(DocumentLinkRequirement.Allowed, NoteEntryRequirement.Required, null, null, null),
                    ["Family Friend Application"] = new ActionRequirement(DocumentLinkRequirement.Required, NoteEntryRequirement.None,
                        null, new Uri("http://example.com/forms/app-ff"), null),
                    ["Background Check"] = new ActionRequirement(DocumentLinkRequirement.Required, NoteEntryRequirement.Allowed,
                        "See approval guide for directions", new Uri("http://example.com/forms/bgcheck"), new TimeSpan(365 * 3, 0, 0, 0)),
                    ["Family Coach Application"] = new ActionRequirement(DocumentLinkRequirement.Required, NoteEntryRequirement.None,
                        null, new Uri("http://example.com/forms/app-fc"), null),
                    ["Comprehensive Background Check"] = new ActionRequirement(DocumentLinkRequirement.Required, NoteEntryRequirement.Allowed,
                        "This is an all-in-one background check", new Uri("http://example.com/forms/compbgcheck"), new TimeSpan(365 * 2, 0, 0, 0)),
                    ["Interview with Family Coach Supervisor"] = new ActionRequirement(DocumentLinkRequirement.Allowed, NoteEntryRequirement.Required, null, null, null),
                    ["Host Family Application"] = new ActionRequirement(DocumentLinkRequirement.Required, NoteEntryRequirement.None,
                        null, new Uri("http://example.com/forms/app-hf"), null),
                    ["Host Family Training"] = new ActionRequirement(DocumentLinkRequirement.None, NoteEntryRequirement.Allowed,
                        null, new Uri("http://example.com/training/hf"), null),
                    ["Home Screening Checklist"] = new ActionRequirement(DocumentLinkRequirement.Required, NoteEntryRequirement.Allowed,
                        "Must be filled out by an approved home screener", new Uri("http://example.com/forms/hscheck"), null),
                    ["Host Family Interview"] = new ActionRequirement(DocumentLinkRequirement.Allowed, NoteEntryRequirement.Required, null, null, null),
                    ["Meet & Greet"] = new ActionRequirement(DocumentLinkRequirement.Required, NoteEntryRequirement.Allowed, null, new Uri("http://example.com/forms/mag"), null)
                }.ToImmutableDictionary(),
                ImmutableList<CustomField>.Empty
                    .Add(new("Has Pool", CustomFieldType.Boolean, null, null))
                    .Add(new("Home Church", CustomFieldType.String, CustomFieldValidation.SuggestOnly, ImmutableList<string>.Empty.Add("Mega Church").Add("Mini Church"))),
                new ReferralPolicy(
                    new List<string>
                    {
                        "Request for Help Form",
                        "Intake Coordinator Screening Call",
                        "Intake Form"
                    }.ToImmutableList(),
                    new List<CustomField>
                    {
                        new CustomField("Referral Source", CustomFieldType.String, CustomFieldValidation.SuggestOnly,
                            ImmutableList.Create("Shangri-La", "El Dorado", "Asgard")),
                        new CustomField("Protective Order", CustomFieldType.Boolean, null, null)
                    }.ToImmutableList(),
                    new List<ArrangementPolicy>
                    {
                        new ArrangementPolicy("Hosting", ChildInvolvement.ChildHousing,
                            ArrangementFunctions: new List<ArrangementFunction>
                            {
                                new ArrangementFunction("Host Family", FunctionRequirement.OneOrMore,
                                    EligibleIndividualVolunteerRoles: ImmutableList<string>.Empty,
                                    EligibleVolunteerFamilyRoles: new List<string>
                                    {
                                        "Host Family"
                                    }.ToImmutableList(),
                                    EligiblePeople: ImmutableList<Guid>.Empty,
                                    Variants: ImmutableList<ArrangementFunctionVariant>.Empty
                                        .Add(new ArrangementFunctionVariant("New Host Family",
                                            RequiredSetupActionNames: ImmutableList<string>.Empty
                                                .Add("Family Meeting"),
                                            RequiredMonitoringActions: ImmutableList<MonitoringRequirement>.Empty
                                                .Add(new MonitoringRequirement("Family Coach Safety Visit",
                                                    new DurationStagesPerChildLocationRecurrencePolicy(new List<RecurrencePolicyStage>
                                                    {
                                                        new RecurrencePolicyStage(TimeSpan.FromHours(48), 1),
                                                        new RecurrencePolicyStage(TimeSpan.FromDays(7), 5),
                                                        new RecurrencePolicyStage(TimeSpan.FromDays(14), null)
                                                    }.ToImmutableList()))),
                                            RequiredCloseoutActionNames: ImmutableList<string>.Empty
                                                .Add("Host Family Debriefing")))
                                        .Add(new ArrangementFunctionVariant("Familiar Host Family",
                                            RequiredSetupActionNames: ImmutableList<string>.Empty,
                                            RequiredMonitoringActions: ImmutableList<MonitoringRequirement>.Empty
                                                .Add(new MonitoringRequirement("Family Coach Safety Visit",
                                                    new DurationStagesPerChildLocationRecurrencePolicy(new List<RecurrencePolicyStage>
                                                    {
                                                        new RecurrencePolicyStage(TimeSpan.FromHours(48), 1),
                                                        new RecurrencePolicyStage(TimeSpan.FromDays(14), null)
                                                    }.ToImmutableList()))),
                                            RequiredCloseoutActionNames: ImmutableList<string>.Empty
                                                .Add("Host Family Debriefing")))),
                                new ArrangementFunction("Family Coach", FunctionRequirement.ExactlyOne,
                                    EligibleIndividualVolunteerRoles: new List<string>
                                    {
                                        "Family Coach"
                                    }.ToImmutableList(),
                                    EligibleVolunteerFamilyRoles: ImmutableList<string>.Empty,
                                    EligiblePeople: ImmutableList<Guid>.Empty,
                                    Variants: ImmutableList<ArrangementFunctionVariant>.Empty),
                                new ArrangementFunction("Parent Friend", FunctionRequirement.ZeroOrMore,
                                    EligibleIndividualVolunteerRoles: new List<string>
                                    {
                                        "Family Coach",
                                        "Family Friend"
                                    }.ToImmutableList(),
                                    EligibleVolunteerFamilyRoles: new List<string>
                                    {
                                        "Host Family"
                                    }.ToImmutableList(),
                                    EligiblePeople: ImmutableList<Guid>.Empty,
                                    Variants: ImmutableList<ArrangementFunctionVariant>.Empty),
                                new ArrangementFunction("Host Family Friend", FunctionRequirement.ZeroOrMore,
                                    EligibleIndividualVolunteerRoles: new List<string>
                                    {
                                        "Family Coach",
                                        "Family Friend"
                                    }.ToImmutableList(),
                                    EligibleVolunteerFamilyRoles: new List<string>
                                    {
                                        "Host Family"
                                    }.ToImmutableList(),
                                    EligiblePeople: ImmutableList<Guid>.Empty,
                                    Variants: ImmutableList<ArrangementFunctionVariant>.Empty),
                                new ArrangementFunction("Staff Supervision", FunctionRequirement.ExactlyOne,
                                    EligibleIndividualVolunteerRoles: ImmutableList<string>.Empty,
                                    EligibleVolunteerFamilyRoles: ImmutableList<string>.Empty,
                                    EligiblePeople: new[] { guid0 }.ToImmutableList(),
                                    Variants: ImmutableList<ArrangementFunctionVariant>.Empty)
                            }.ToImmutableList(),
                            RequiredSetupActionNames: new List<string>
                            {
                                "Hosting Consent",
                                "Medical POA"
                            }.ToImmutableList(),
                            RequiredMonitoringActions: new List<MonitoringRequirement>
                            {
                                new MonitoringRequirement("Family Coach Supervision",
                                    new DurationStagesRecurrencePolicy(new List<RecurrencePolicyStage>
                                    {
                                        new RecurrencePolicyStage(TimeSpan.FromDays(7), null)
                                    }.ToImmutableList()))
                            }.ToImmutableList(),
                            RequiredCloseoutActionNames: new List<string>
                            {
                                "Return of Child Form"
                            }.ToImmutableList()),
                        new ArrangementPolicy("Babysitting", ChildInvolvement.DaytimeChildCareOnly,
                            ArrangementFunctions: new List<ArrangementFunction>
                            {
                                new ArrangementFunction("Host Family", FunctionRequirement.OneOrMore,
                                    EligibleIndividualVolunteerRoles: ImmutableList<string>.Empty,
                                    EligibleVolunteerFamilyRoles: new List<string>
                                    {
                                        "Host Family"
                                    }.ToImmutableList(),
                                    EligiblePeople: ImmutableList<Guid>.Empty,
                                    Variants: ImmutableList<ArrangementFunctionVariant>.Empty
                                        .Add(new ArrangementFunctionVariant("New Host Family",
                                            RequiredSetupActionNames: ImmutableList<string>.Empty
                                                .Add("Family Meeting"),
                                            RequiredMonitoringActions: ImmutableList<MonitoringRequirement>.Empty
                                                .Add(new MonitoringRequirement("Family Coach Safety Visit",
                                                    new ChildCareOccurrenceBasedRecurrencePolicy(TimeSpan.FromHours(48), 3, 0, true)))
                                                .Add(new MonitoringRequirement("Family Coach Checkin",
                                                    new ChildCareOccurrenceBasedRecurrencePolicy(TimeSpan.FromHours(48), 3, 0, false))),
                                            RequiredCloseoutActionNames: ImmutableList<string>.Empty
                                                .Add("Host Family Debriefing")))
                                        .Add(new ArrangementFunctionVariant("Familiar Host Family",
                                            RequiredSetupActionNames: ImmutableList<string>.Empty,
                                            RequiredMonitoringActions: ImmutableList<MonitoringRequirement>.Empty
                                                .Add(new MonitoringRequirement("Family Coach Safety Visit",
                                                    new ChildCareOccurrenceBasedRecurrencePolicy(TimeSpan.FromHours(48), 3, 2, true)))
                                                .Add(new MonitoringRequirement("Family Coach Checkin",
                                                    new ChildCareOccurrenceBasedRecurrencePolicy(TimeSpan.FromHours(48), 3, 2, false))),
                                            RequiredCloseoutActionNames: ImmutableList<string>.Empty))),
                                new ArrangementFunction("Family Coach", FunctionRequirement.ExactlyOne,
                                    EligibleIndividualVolunteerRoles: new List<string>
                                    {
                                        "Family Coach"
                                    }.ToImmutableList(),
                                    EligibleVolunteerFamilyRoles: ImmutableList<string>.Empty,
                                    EligiblePeople: ImmutableList<Guid>.Empty,
                                    Variants: ImmutableList<ArrangementFunctionVariant>.Empty),
                                new ArrangementFunction("Staff Supervision", FunctionRequirement.ExactlyOne,
                                    EligibleIndividualVolunteerRoles: ImmutableList<string>.Empty,
                                    EligibleVolunteerFamilyRoles: ImmutableList<string>.Empty,
                                    EligiblePeople: new[] { guid0 }.ToImmutableList(),
                                    Variants: ImmutableList<ArrangementFunctionVariant>.Empty)
                            }.ToImmutableList(),
                            RequiredSetupActionNames: new List<string>
                            {
                                "Hosting Consent"
                            }.ToImmutableList(),
                            RequiredMonitoringActions: new List<MonitoringRequirement>
                            {
                                new MonitoringRequirement("Family Coach Supervision",
                                    new DurationStagesRecurrencePolicy(new List<RecurrencePolicyStage>
                                    {
                                        new RecurrencePolicyStage(TimeSpan.FromDays(30), null)
                                    }.ToImmutableList()))
                            }.ToImmutableList(),
                            RequiredCloseoutActionNames: new List<string>
                            {
                                "Return of Child Form"
                            }.ToImmutableList()),
                        new ArrangementPolicy("Friending", ChildInvolvement.NoChildInvolvement,
                            ArrangementFunctions: new List<ArrangementFunction>
                            {
                                new ArrangementFunction("Family Friend", FunctionRequirement.OneOrMore,
                                    EligibleIndividualVolunteerRoles: new List<string>
                                    {
                                        "Family Coach",
                                        "Family Friend"
                                    }.ToImmutableList(),
                                    EligibleVolunteerFamilyRoles: new List<string>
                                    {
                                        "Host Family"
                                    }.ToImmutableList(),
                                    EligiblePeople: ImmutableList<Guid>.Empty,
                                    Variants: ImmutableList<ArrangementFunctionVariant>.Empty),
                                new ArrangementFunction("Family Coach", FunctionRequirement.ExactlyOne,
                                    EligibleIndividualVolunteerRoles: new List<string>
                                    {
                                        "Family Coach"
                                    }.ToImmutableList(),
                                    EligibleVolunteerFamilyRoles: ImmutableList<string>.Empty,
                                    EligiblePeople: ImmutableList<Guid>.Empty,
                                    Variants: ImmutableList<ArrangementFunctionVariant>.Empty),
                                new ArrangementFunction("Staff Supervision", FunctionRequirement.ExactlyOne,
                                    EligibleIndividualVolunteerRoles: ImmutableList<string>.Empty,
                                    EligibleVolunteerFamilyRoles: ImmutableList<string>.Empty,
                                    EligiblePeople: new[] { guid0 }.ToImmutableList(),
                                    Variants: ImmutableList<ArrangementFunctionVariant>.Empty)
                            }.ToImmutableList(),
                            RequiredSetupActionNames: new List<string>
                            {
                                "Advocacy Agreement"
                            }.ToImmutableList(),
                            RequiredMonitoringActions: new List<MonitoringRequirement>
                            {
                                new MonitoringRequirement("Family Coach Checkin",
                                    new DurationStagesRecurrencePolicy(new List<RecurrencePolicyStage>
                                    {
                                        new RecurrencePolicyStage(TimeSpan.FromDays(2), 1),
                                        new RecurrencePolicyStage(TimeSpan.FromDays(7), null)
                                    }.ToImmutableList())),
                                new MonitoringRequirement("Family Coach Supervision",
                                    new DurationStagesRecurrencePolicy(new List<RecurrencePolicyStage>
                                    {
                                        new RecurrencePolicyStage(TimeSpan.FromDays(7), null)
                                    }.ToImmutableList()))
                            }.ToImmutableList(),
                            RequiredCloseoutActionNames: new List<string>
                            { }.ToImmutableList())
                    }.ToImmutableList()),
                new VolunteerPolicy(
                    new Dictionary<string, VolunteerRolePolicy>
                    {
                        ["Family Friend"] = new VolunteerRolePolicy("Family Friend", PolicyVersions: new List<VolunteerRolePolicyVersion>
                        {
                            new VolunteerRolePolicyVersion("v1", new DateTime(2021, 10, 1), new List<VolunteerApprovalRequirement>
                            {
                                new VolunteerApprovalRequirement(RequirementStage.Application, "Family Friend Application"),
                                new VolunteerApprovalRequirement(RequirementStage.Approval, "Background Check")
                            }.ToImmutableList()),
                            new VolunteerRolePolicyVersion("v2", null, new List<VolunteerApprovalRequirement>
                            {
                                new VolunteerApprovalRequirement(RequirementStage.Application, "Family Friend Application"),
                                new VolunteerApprovalRequirement(RequirementStage.Approval, "Comprehensive Background Check")
                            }.ToImmutableList())
                        }.ToImmutableList()),
                        ["Family Coach"] = new VolunteerRolePolicy("Family Coach", PolicyVersions: new List<VolunteerRolePolicyVersion>
                        {
                            new VolunteerRolePolicyVersion("v1", new DateTime(2021, 10, 1), new List<VolunteerApprovalRequirement>
                            {
                                new VolunteerApprovalRequirement(RequirementStage.Application, "Family Coach Application"),
                                new VolunteerApprovalRequirement(RequirementStage.Approval, "Background Check"),
                                new VolunteerApprovalRequirement(RequirementStage.Approval, "Interview with Family Coach Supervisor")
                            }.ToImmutableList()),
                            new VolunteerRolePolicyVersion("v2", null, new List<VolunteerApprovalRequirement>
                            {
                                new VolunteerApprovalRequirement(RequirementStage.Application, "Family Coach Application"),
                                new VolunteerApprovalRequirement(RequirementStage.Approval, "Comprehensive Background Check"),
                                new VolunteerApprovalRequirement(RequirementStage.Approval, "Interview with Family Coach Supervisor")
                            }.ToImmutableList())
                        }.ToImmutableList())
                    }.ToImmutableDictionary(),
                    new Dictionary<string, VolunteerFamilyRolePolicy>
                    {
                        ["Host Family"] = new VolunteerFamilyRolePolicy("Host Family", PolicyVersions: new List<VolunteerFamilyRolePolicyVersion>
                        {
                            new VolunteerFamilyRolePolicyVersion("v1", new DateTime(2021, 10, 1), new List<VolunteerFamilyApprovalRequirement>
                            {
                                new VolunteerFamilyApprovalRequirement(RequirementStage.Application, "Host Family Application", VolunteerFamilyRequirementScope.OncePerFamily),
                                new VolunteerFamilyApprovalRequirement(RequirementStage.Approval, "Background Check", VolunteerFamilyRequirementScope.AllAdultsInTheFamily),
                                new VolunteerFamilyApprovalRequirement(RequirementStage.Approval, "Host Family Training", VolunteerFamilyRequirementScope.AllParticipatingAdultsInTheFamily),
                                new VolunteerFamilyApprovalRequirement(RequirementStage.Approval, "Home Screening Checklist", VolunteerFamilyRequirementScope.OncePerFamily),
                                new VolunteerFamilyApprovalRequirement(RequirementStage.Approval, "Host Family Interview", VolunteerFamilyRequirementScope.OncePerFamily),
                                new VolunteerFamilyApprovalRequirement(RequirementStage.Onboarding, "Meet & Greet", VolunteerFamilyRequirementScope.OncePerFamily)
                            }.ToImmutableList()),
                            new VolunteerFamilyRolePolicyVersion("v2", null, new List<VolunteerFamilyApprovalRequirement>
                            {
                                new VolunteerFamilyApprovalRequirement(RequirementStage.Application, "Host Family Application", VolunteerFamilyRequirementScope.OncePerFamily),
                                new VolunteerFamilyApprovalRequirement(RequirementStage.Approval, "Comprehensive Background Check", VolunteerFamilyRequirementScope.AllAdultsInTheFamily),
                                new VolunteerFamilyApprovalRequirement(RequirementStage.Approval, "Host Family Training", VolunteerFamilyRequirementScope.AllParticipatingAdultsInTheFamily),
                                new VolunteerFamilyApprovalRequirement(RequirementStage.Approval, "Home Screening Checklist", VolunteerFamilyRequirementScope.OncePerFamily),
                                new VolunteerFamilyApprovalRequirement(RequirementStage.Approval, "Host Family Interview", VolunteerFamilyRequirementScope.OncePerFamily),
                                new VolunteerFamilyApprovalRequirement(RequirementStage.Onboarding, "Meet & Greet", VolunteerFamilyRequirementScope.OncePerFamily)
                            }.ToImmutableList())
                        }.ToImmutableList())
                    }.ToImmutableDictionary()));

            await policiesStore.UpsertAsync(guid1, guid2, "policy", policy);
            await policiesStore.UpsertAsync(guid1, guid3, "policy", policy);
        }
        

        private static async Task AppendEventsAsync<T>(this IEventLog<T> eventLog,
            Guid organizationId, Guid locationId, params T[] events)
        {
            foreach (var (domainEvent, index) in events
                .Select((e, i) => (e, (long)i)))
            {
                await eventLog.AppendEventAsync(organizationId, locationId, domainEvent, index + 1);
            }
        }
    }
}

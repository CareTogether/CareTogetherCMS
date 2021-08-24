using CareTogether.Resources;
using CareTogether.Resources.Models;
using CareTogether.Resources.Storage;
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
        static readonly Guid adminId = Guid.Parse("2b87864a-63e3-4406-bcbc-c0068a13ac05");


        public static async Task PopulateTestDataAsync(
            IMultitenantEventLog<CommunityEvent> communityEventLog,
            IMultitenantEventLog<ContactCommandExecutedEvent> contactsEventLog,
            IMultitenantEventLog<GoalCommandExecutedEvent> goalsEventLog,
            IMultitenantEventLog<ReferralEvent> referralsEventLog,
            IMultitenantEventLog<ApprovalEvent> approvalsEventLog,
            IObjectStore<string?> draftNotesStore,
            IObjectStore<EffectiveLocationPolicy> policiesStore)
        {
            await PopulateCommunityEvents(communityEventLog);
            await PopulateContactEvents(contactsEventLog);
            await PopulateGoalEvents(goalsEventLog);
            await PopulateReferralEvents(referralsEventLog);
            await PopulateApprovalEvents(approvalsEventLog);
            await PopulateDraftNotes(draftNotesStore);
            await PopulatePolicies(policiesStore);
        }

        
        public static async Task PopulateCommunityEvents(IMultitenantEventLog<CommunityEvent> communityEventLog)
        {
            await communityEventLog.AppendEventsAsync(guid1, guid2,
                new PersonCommandExecuted(guid0, new DateTime(2021, 7, 1), new CreatePerson(adminId, adminId, "System", "Administrator", Gender.Male, new ExactAge(new DateTime(2021, 7, 1)), "Ethnic", "Test", "ABC")),
                new PersonCommandExecuted(guid0, new DateTime(2021, 7, 1), new CreatePerson(guid1, null, "John", "Doe", Gender.Male, new ExactAge(new DateTime(1980, 7, 1)), "Ethnic", null, "DEF")),
                new PersonCommandExecuted(guid0, new DateTime(2021, 7, 1), new CreatePerson(guid2, guid3, "Jane", "Smith", Gender.Female, new AgeInYears(42, new DateTime(2021, 1, 1)), "Ethnic", null, null)),
                new PersonCommandExecuted(guid0, new DateTime(2021, 7, 1), new UpdatePersonName(guid2, "Jane", "Doe")),
                new PersonCommandExecuted(guid0, new DateTime(2021, 7, 1), new UpdatePersonAge(guid1, new ExactAge(new DateTime(1975, 1, 1)))),
                new PersonCommandExecuted(guid0, new DateTime(2021, 7, 1), new UpdatePersonAge(guid2, new ExactAge(new DateTime(1979, 7, 1)))),
                new PersonCommandExecuted(guid0, new DateTime(2021, 7, 1), new UpdatePersonUserLink(guid1, guid4)),
                new FamilyCommandExecuted(guid0, new DateTime(2021, 7, 1), new CreateFamily(guid1, guid1,
                    new List<(Guid, FamilyAdultRelationshipInfo)> { (guid1, new FamilyAdultRelationshipInfo("Dad", true)) },
                    new List<Guid>(), new List<CustodialRelationship>())),
                new FamilyCommandExecuted(guid0, new DateTime(2021, 7, 1), new AddAdultToFamily(guid1, guid2, new FamilyAdultRelationshipInfo("Mom", true))),
                new PersonCommandExecuted(guid0, new DateTime(2021, 7, 1), new CreatePerson(guid3, null, "Eric", "Doe", Gender.Male, new AgeInYears(12, new DateTime(2021, 1, 1)), "Ethnic", null, null)),
                new FamilyCommandExecuted(guid0, new DateTime(2021, 7, 1), new AddChildToFamily(guid1, guid3, new List<CustodialRelationship>
                {
                    new CustodialRelationship(guid3, guid1, CustodialRelationshipType.ParentWithCustody),
                    new CustodialRelationship(guid3, guid2, CustodialRelationshipType.ParentWithCustody)
                })),
                new FamilyCommandExecuted(guid0, new DateTime(2021, 7, 1), new UpdateAdultRelationshipToFamily(guid1, guid1, new FamilyAdultRelationshipInfo("Dad", false))),
                new FamilyCommandExecuted(guid0, new DateTime(2021, 7, 1), new RemoveCustodialRelationship(guid1, guid3, guid1)),
                new FamilyCommandExecuted(guid0, new DateTime(2021, 7, 1), new UpdateCustodialRelationshipType(guid1, guid3, guid2, CustodialRelationshipType.ParentWithCourtAppointedCustody)),
                new FamilyCommandExecuted(guid0, new DateTime(2021, 7, 1), new AddCustodialRelationship(guid1, guid3, guid1, CustodialRelationshipType.ParentWithCourtAppointedCustody)),
                new PersonCommandExecuted(guid0, new DateTime(2021, 7, 1), new CreatePerson(guid4, null, "Emily", "Coachworthy", Gender.Female, new ExactAge(new DateTime(1980, 3, 19)), "Ethnic", null, null)),
                new FamilyCommandExecuted(guid0, new DateTime(2021, 7, 1), new CreateFamily(guid4, guid4,
                    new List<(Guid, FamilyAdultRelationshipInfo)> { (guid4, new FamilyAdultRelationshipInfo("Single", true)) },
                    new List<Guid>(), new List<CustodialRelationship>())),
                new PersonCommandExecuted(guid0, new DateTime(2021, 7, 1), new CreatePerson(guid5, null, "Han", "Solo", Gender.Male, new AgeInYears(30, new DateTime(2021, 7, 1)), "Ethnic", "Smuggler", null)),
                new PersonCommandExecuted(guid0, new DateTime(2021, 7, 1), new CreatePerson(guid6, null, "Leia", "Skywalker", Gender.Male, new AgeInYears(28, new DateTime(2021, 7, 1)), "Ethnic", "Freedom fighter", "Uncertain claim to royalty")),
                new PersonCommandExecuted(guid0, new DateTime(2021, 7, 1), new CreatePerson(guid7, null, "Ben", "Solo", Gender.Male, new AgeInYears(12, new DateTime(2021, 7, 1)), "Ethnic", null, null)),
                new FamilyCommandExecuted(guid0, new DateTime(2021, 7, 1), new CreateFamily(guid2, guid6,
                    new List<(Guid, FamilyAdultRelationshipInfo)>
                    {
                        (guid5, new FamilyAdultRelationshipInfo("Dad", true)),
                        (guid6, new FamilyAdultRelationshipInfo("Mom", true))
                    }, new List<Guid>() { guid7 }, new List<CustodialRelationship>()
                    {
                        new CustodialRelationship(guid7, guid5, CustodialRelationshipType.ParentWithCustody),
                        new CustodialRelationship(guid7, guid6, CustodialRelationshipType.ParentWithCustody)
                    })),
                new PersonCommandExecuted(guid0, new DateTime(2021, 7, 1), new CreatePerson(guid8, null, "William", "Riker", Gender.Male, new ExactAge(new DateTime(1972, 1, 1)), "Ethnic", null, null)),
                new PersonCommandExecuted(guid0, new DateTime(2021, 7, 1), new CreatePerson(guid9, null, "Deanna", "Riker", Gender.Female, new ExactAge(new DateTime(1970, 1, 1)), "Ethnic", null, null)),
                new FamilyCommandExecuted(guid0, new DateTime(2021, 7, 1), new CreateFamily(guid3, guid8,
                    new List<(Guid, FamilyAdultRelationshipInfo)>
                    {
                        (guid8, new FamilyAdultRelationshipInfo("Dad", true)),
                        (guid9, new FamilyAdultRelationshipInfo("Mom", true))
                    }, new List<Guid>(), new List<CustodialRelationship>()))
            );
        }

        public static async Task PopulateContactEvents(IMultitenantEventLog<ContactCommandExecutedEvent> contactsEventLog)
        {
            await contactsEventLog.AppendEventsAsync(guid1, guid2,
                new ContactCommandExecutedEvent(guid0, new DateTime(2021, 7, 1), new CreateContact(guid1, "Amy has contact details for a callback")),
                new ContactCommandExecutedEvent(guid0, new DateTime(2021, 7, 1), new AddContactAddress(guid1,
                    new Address(guid3, "456 Old Ave.", null, "Bigtown", guid4, "67890", guid4),
                    true)),
                new ContactCommandExecutedEvent(guid0, new DateTime(2021, 7, 1), new AddContactPhoneNumber(guid1,
                    new PhoneNumber(guid2, "1235554567", PhoneNumberType.Mobile),
                    true)),
                new ContactCommandExecutedEvent(guid0, new DateTime(2021, 7, 1), new AddContactEmailAddress(guid1,
                    new EmailAddress(guid2, "personal@example.com", EmailAddressType.Personal),
                    true)),
                new ContactCommandExecutedEvent(guid0, new DateTime(2021, 7, 1), new AddContactAddress(guid1,
                    new Address(guid2, "123 Main St.", "Apt. A", "Smallville", guid3, "12345", guid4),
                    true)),
                new ContactCommandExecutedEvent(guid0, new DateTime(2021, 7, 1), new UpdateContactAddress(guid1,
                    new Address(guid3, "456 Old Ave.", null, "Bigtown", guid4, "67890", guid4),
                    false)),
                new ContactCommandExecutedEvent(guid0, new DateTime(2021, 7, 1), new AddContactPhoneNumber(guid1,
                    new PhoneNumber(guid3, "1235555555", PhoneNumberType.Home),
                    true)),
                new ContactCommandExecutedEvent(guid0, new DateTime(2021, 7, 1), new UpdateContactPhoneNumber(guid1,
                    new PhoneNumber(guid2, "1235554567", PhoneNumberType.Mobile),
                    false)),
                new ContactCommandExecutedEvent(guid0, new DateTime(2021, 7, 1), new AddContactEmailAddress(guid1,
                    new EmailAddress(guid3, "work@example.com", EmailAddressType.Work),
                    true)),
                new ContactCommandExecutedEvent(guid0, new DateTime(2021, 7, 1), new UpdateContactEmailAddress(guid1,
                    new EmailAddress(guid2, "personal@example.com", EmailAddressType.Personal),
                    false)),
                new ContactCommandExecutedEvent(guid0, new DateTime(2021, 7, 1), new UpdateContactMethodPreferenceNotes(guid1,
                    "Cannot receive voicemails")));
        }

        public static async Task PopulateReferralEvents(IMultitenantEventLog<ReferralEvent> referralsEventLog)
        {
            await referralsEventLog.AppendEventsAsync(guid1, guid2,
                new ReferralCommandExecuted(adminId, new DateTime(2020, 3, 5, 4, 10, 0), new CreateReferral(guid1, guid1, "v1", new DateTime(2020, 3, 5, 4, 10, 0))),
                new ReferralCommandExecuted(adminId, new DateTime(2020, 3, 5, 4, 15, 15), new UploadReferralForm(guid1, new DateTime(2020, 3, 5, 4, 12, 15), "Request for Help Form", "v1", "Jane Doe referral info.pdf", guid1)),
                new ReferralCommandExecuted(adminId, new DateTime(2020, 3, 6, 8, 45, 30), new PerformReferralActivity(guid1, "Intake Coordinator Screening Call", new DateTime(2020, 3, 6, 8, 45, 30), adminId)),
                new ArrangementCommandExecuted(adminId, new DateTime(2020, 3, 11, 11, 12, 13), new CreateArrangement(guid1, guid1, "v1", "Hosting")),
                new ArrangementCommandExecuted(adminId, new DateTime(2020, 3, 11, 11, 13, 14), new AssignIndividualVolunteer(guid1, guid1, guid4, "Family Coach")),
                new ArrangementCommandExecuted(adminId, new DateTime(2020, 3, 11, 11, 13, 55), new AssignVolunteerFamily(guid1, guid1, guid2, "Host Family")),
                new ArrangementCommandExecuted(adminId, new DateTime(2020, 3, 11, 12, 22, 21), new AssignVolunteerFamily(guid1, guid1, guid3, "Host Family Friend")),
                new ArrangementCommandExecuted(adminId, new DateTime(2020, 3, 11, 11, 14, 32), new AssignPartneringFamilyChildren(guid1, guid1,
                    ImmutableList<Guid>.Empty.Add(guid3))),
                new ArrangementCommandExecuted(adminId, new DateTime(2020, 3, 12, 16, 55, 0), new InitiateArrangement(guid1, guid1, new DateTime(2020, 3, 12, 16, 55, 0))),
                new ArrangementCommandExecuted(adminId, new DateTime(2020, 3, 15, 8, 33, 34), new TrackChildrenLocationChange(guid1, guid1,
                    new DateTime(2020, 3, 15, 8, 33, 34), ImmutableList<Guid>.Empty.Add(guid3), guid3, ChildrenLocationPlan.DaytimeChildCare, "Babysitting")),
                new ArrangementCommandExecuted(adminId, new DateTime(2020, 3, 15, 20, 40, 45), new TrackChildrenLocationChange(guid1, guid1,
                        new DateTime(2020, 3, 15, 20, 40, 45), ImmutableList<Guid>.Empty.Add(guid3), guid2, ChildrenLocationPlan.DaytimeChildCare, "Dropped off with host parents after ☕ and 🍰")),
                new ArrangementCommandExecuted(adminId, new DateTime(2020, 3, 14, 10, 10, 10), new PerformArrangementActivity(guid1, guid1,
                    "Family Coach Safety Visit", new DateTime(2020, 3, 14, 10, 10, 10), guid4)),
                new ArrangementCommandExecuted(adminId, new DateTime(2020, 3, 21, 11, 11, 11), new PerformArrangementActivity(guid1, guid1,
                    "Family Coach Supervision", new DateTime(2020, 3, 21, 11, 11, 11), adminId)),
                new ArrangementCommandExecuted(adminId, new DateTime(2020, 3, 22, 16, 30, 35), new TrackChildrenLocationChange(guid1, guid1,
                    new DateTime(2020, 3, 22, 16, 30, 35), ImmutableList<Guid>.Empty.Add(guid3), guid1, ChildrenLocationPlan.OvernightHousing, "Weekend with parents, met at McDonald's near mom")),
                new ArrangementNoteCommandExecuted(guid4, new DateTime(2020, 3, 22, 18, 0, 0), new CreateDraftArrangementNote(guid1, guid1, guid1, null)),
                new ArrangementNoteCommandExecuted(guid4, new DateTime(2020, 3, 22, 19, 30, 0), new EditDraftArrangementNote(guid1, guid1, guid1, null)),
                new ArrangementNoteCommandExecuted(adminId, new DateTime(2020, 3, 22, 19, 45, 0), new ApproveArrangementNote(guid1, guid1, guid1, "Eric and Ben liked the Play Place and didn't want to go home.")),
                new ArrangementCommandExecuted(adminId, new DateTime(2020, 3, 24, 8, 30, 35), new TrackChildrenLocationChange(guid1, guid1,
                    new DateTime(2020, 3, 24, 8, 30, 35), ImmutableList<Guid>.Empty.Add(guid3), guid2, ChildrenLocationPlan.OvernightHousing, "Mom dropped off on way to work")),
                new ArrangementNoteCommandExecuted(guid4, new DateTime(2020, 3, 24, 8, 45, 0), new CreateDraftArrangementNote(guid1, guid1, guid2, null)),
                new ArrangementNoteCommandExecuted(guid4, new DateTime(2020, 3, 24, 8, 50, 0), new DiscardDraftArrangementNote(guid1, guid1, guid2)),
                new ArrangementNoteCommandExecuted(guid4, new DateTime(2020, 3, 24, 8, 55, 0), new CreateDraftArrangementNote(guid1, guid1, guid3, null)),
                new ArrangementNoteCommandExecuted(guid4, new DateTime(2020, 3, 24, 8, 57, 0), new EditDraftArrangementNote(guid1, guid1, guid3, null)),
                new ArrangementCommandExecuted(adminId, new DateTime(2020, 3, 30, 18, 18, 18), new TrackChildrenLocationChange(guid1, guid1,
                    new DateTime(2020, 3, 30, 18, 18, 18), ImmutableList<Guid>.Empty.Add(guid3), guid1, ChildrenLocationPlan.ReturnToFamily, "Mom met us and picked him up at DQ")),
                new ReferralCommandExecuted(adminId, new DateTime(2020, 10, 4, 12, 32, 55), new CloseReferral(guid1, ReferralCloseReason.NeedMet)),
                new ReferralCommandExecuted(adminId, new DateTime(2021, 7, 10, 19, 30, 45), new CreateReferral(guid2, guid1, "v1", new DateTime(2021, 7, 10, 19, 30, 45))),
                new ReferralCommandExecuted(adminId, new DateTime(2021, 7, 10, 19, 32, 0), new UploadReferralForm(guid2, new DateTime(2021, 7, 10, 18, 0, 0), "Request for Help Form", "v1", "Jane Doe second referral info.pdf", guid2)),
                new ReferralCommandExecuted(adminId, new DateTime(2021, 7, 10, 19, 32, 0), new PerformReferralActivity(guid2, "Intake Coordinator Screening Call",
                    new DateTime(2021, 7, 10, 19, 32, 0), adminId)));
        }

        public static async Task PopulateGoalEvents(IMultitenantEventLog<GoalCommandExecutedEvent> goalsEventLog)
        {
            await goalsEventLog.AppendEventsAsync(guid1, guid2,
                new GoalCommandExecutedEvent(adminId, new DateTime(2021, 7, 11), new CreateGoal(guid2, guid1, "Get an apartment", new DateTime(2021, 8, 11))),
                new GoalCommandExecutedEvent(adminId, new DateTime(2021, 7, 11), new CreateGoal(guid2, guid2, "Find a job", new DateTime(2021, 8, 11))),
                new GoalCommandExecutedEvent(adminId, new DateTime(2021, 7, 11), new CreateGoal(guid2, guid2, "Get daytime childcare", new DateTime(2021, 8, 1))),
                new GoalCommandExecutedEvent(adminId, new DateTime(2021, 7, 12), new ChangeGoalDescription(guid2, guid1, "Find stable housing")),
                new GoalCommandExecutedEvent(adminId, new DateTime(2021, 8, 1), new ChangeGoalTargetDate(guid2, guid1, new DateTime(2021, 8, 31))),
                new GoalCommandExecutedEvent(adminId, new DateTime(2021, 8, 30), new MarkGoalCompleted(guid2, guid1, new DateTime(2021, 8, 27))));
        }

        public static async Task PopulateApprovalEvents(IMultitenantEventLog<ApprovalEvent> approvalsEventLog)
        {
            await approvalsEventLog.AppendEventsAsync(guid1, guid2,
                new VolunteerCommandExecuted(adminId, new DateTime(2021, 7, 1),
                    new UploadVolunteerForm(guid4, guid4, new DateTime(2021, 7, 1), "Family Coach Application", "v1", "abc.pdf", Guid.Empty)),
                new VolunteerCommandExecuted(adminId, new DateTime(2021, 7, 10),
                    new PerformVolunteerActivity(guid4, guid4, "Interview with Family Coach Supervisor", new DateTime(2021, 7, 9), guid1)),
                new VolunteerCommandExecuted(adminId, new DateTime(2021, 7, 14),
                    new UploadVolunteerForm(guid4, guid4, new DateTime(2021, 7, 13), "Background Check", "v1", "def.pdf", Guid.Empty)),
                new VolunteerFamilyCommandExecuted(adminId, new DateTime(2021, 7, 1),
                    new UploadVolunteerFamilyForm(guid3, new DateTime(2021, 7, 1), "Host Family Application", "v1", "abc.pdf", Guid.Empty)),
                new VolunteerFamilyCommandExecuted(adminId, new DateTime(2021, 7, 15),
                    new UploadVolunteerFamilyForm(guid3, new DateTime(2021, 7, 14), "Home Screening Checklist", "v1", "def.pdf", Guid.Empty)),
                new VolunteerCommandExecuted(adminId, new DateTime(2021, 7, 18),
                    new UploadVolunteerForm(guid3, guid8, new DateTime(2021, 7, 16), "Background Check", "v1", "bg8.jpg", Guid.Empty)),
                new VolunteerCommandExecuted(adminId, new DateTime(2021, 7, 18),
                    new UploadVolunteerForm(guid3, guid9, new DateTime(2021, 7, 16), "Background Check", "v1", "bg9.jpg", Guid.Empty)),
                new VolunteerCommandExecuted(adminId, new DateTime(2021, 8, 10),
                    new UploadVolunteerForm(guid2, guid6, new DateTime(2021, 8, 10), "Family Friend Application", "v1", "ffls.pdf", Guid.Empty)),
                new VolunteerCommandExecuted(adminId, new DateTime(2021, 8, 11), //TODO: This is a workaround for a bug!
                    new UploadVolunteerForm(guid2, guid5, new DateTime(2021, 8, 11), "Family Friend Application", "v1", "ffhs.pdf", Guid.Empty)));
        }

        public static async Task PopulateDraftNotes(IObjectStore<string?> draftNotesStore)
        {
            await draftNotesStore.UpsertAsync(guid1, guid2, guid3.ToString(),
                "Kids are doing better playing this morning. For some reason they're both really into \"lightsabers\" or something like that... 😅");
        }

        public static async Task PopulatePolicies(IObjectStore<EffectiveLocationPolicy> policiesStore)
        {
            await policiesStore.UpsertAsync(guid1, guid2, "1", new EffectiveLocationPolicy(1, "Local test policy",
                new ReferralPolicy(
                    new List<ActionRequirement>
                    {
                        new FormUploadRequirement("Request for Help Form", "v1",
                            "Can be done over the phone", new Uri("http://example.com/forms/requestforhelp-v1")),
                        new ActivityRequirement("Intake Coordinator Screening Call"),
                        new FormUploadRequirement("Intake Form", "v1",
                            "Email or text the Cognito Form link", new Uri("http://example.com/forms/intake-v1"))
                    }.ToImmutableList(),
                    new List<ArrangementPolicy>
                    {
                        new ArrangementPolicy("Hosting", ChildInvolvement.ChildHousing,
                            VolunteerFunctions: new List<VolunteerFunction>
                            {
                                new VolunteerFunction("Host Family", FunctionRequirement.OneOrMore,
                                EligibleIndividualVolunteerRoles: ImmutableList<string>.Empty,
                                EligibleVolunteerFamilyRoles: new List<string>
                                {
                                    "Host Family"
                                }.ToImmutableList()),
                                new VolunteerFunction("Family Coach", FunctionRequirement.ExactlyOne,
                                EligibleIndividualVolunteerRoles: new List<string>
                                {
                                    "Family Coach"
                                }.ToImmutableList(),
                                EligibleVolunteerFamilyRoles: ImmutableList<string>.Empty),
                                new VolunteerFunction("Parent Friend", FunctionRequirement.ZeroOrMore,
                                EligibleIndividualVolunteerRoles: new List<string>
                                {
                                    "Family Coach",
                                    "Family Friend"
                                }.ToImmutableList(),
                                EligibleVolunteerFamilyRoles: new List<string>
                                {
                                    "Host Family"
                                }.ToImmutableList()),
                                new VolunteerFunction("Host Family Friend", FunctionRequirement.ZeroOrMore,
                                EligibleIndividualVolunteerRoles: new List<string>
                                {
                                    "Family Coach",
                                    "Family Friend"
                                }.ToImmutableList(),
                                EligibleVolunteerFamilyRoles: new List<string>
                                {
                                    "Host Family"
                                }.ToImmutableList()),
                                new VolunteerFunction("Parent and Host Family Friend", FunctionRequirement.ZeroOrMore,
                                EligibleIndividualVolunteerRoles: new List<string>
                                {
                                    "Family Coach",
                                    "Family Friend"
                                }.ToImmutableList(),
                                EligibleVolunteerFamilyRoles: new List<string>
                                {
                                    "Host Family"
                                }.ToImmutableList())
                            }.ToImmutableList(),
                            RequiredSetupActions: new List<ActionRequirement>
                            {
                                new FormUploadRequirement("Hosting Consent", "v1",
                                    "This must be notarized.", new Uri("http://example.com/forms/consent-v1")),
                                new FormUploadRequirement("Medical POA", "v2",
                                    "This must be notarized.", new Uri("http://example.com/forms/medicalpoa-v2"))
                            }.ToImmutableList(),
                            RequiredMonitoringActions: new List<(ActionRequirement, RecurrencePolicy)>
                            {
                                (new ActivityRequirement("Family Coach Safety Visit"),
                                    new RecurrencePolicy(new List<RecurrencePolicyStage>
                                    {
                                        new RecurrencePolicyStage(TimeSpan.FromHours(48), 1),
                                        new RecurrencePolicyStage(TimeSpan.FromDays(7), 5),
                                        new RecurrencePolicyStage(TimeSpan.FromDays(14), null)
                                    }.ToImmutableList())),
                                (new ActivityRequirement("Family Coach Supervision"),
                                    new RecurrencePolicy(new List<RecurrencePolicyStage>
                                    {
                                        new RecurrencePolicyStage(TimeSpan.FromDays(7), null)
                                    }.ToImmutableList()))
                            }.ToImmutableList(),
                            RequiredCloseoutActions: new List<ActionRequirement>
                            {
                                new FormUploadRequirement("Return of Child", "v1",
                                    null, new Uri("http://example.com/forms/returnofchild-v1")),
                            }.ToImmutableList()),
                        new ArrangementPolicy("Friending", ChildInvolvement.NoChildInvolvement,
                            VolunteerFunctions: new List<VolunteerFunction>
                            {
                                new VolunteerFunction("Family Friend", FunctionRequirement.OneOrMore,
                                EligibleIndividualVolunteerRoles: new List<string>
                                {
                                    "Family Coach",
                                    "Family Friend"
                                }.ToImmutableList(),
                                EligibleVolunteerFamilyRoles: new List<string>
                                {
                                    "Host Family"
                                }.ToImmutableList()),
                                new VolunteerFunction("Family Coach", FunctionRequirement.ExactlyOne,
                                EligibleIndividualVolunteerRoles: new List<string>
                                {
                                    "Family Coach"
                                }.ToImmutableList(),
                                EligibleVolunteerFamilyRoles: ImmutableList<string>.Empty)
                            }.ToImmutableList(),
                            RequiredSetupActions: new List<ActionRequirement>
                            {
                                new FormUploadRequirement("Advocacy Agreement", "v1",
                                    null, new Uri("http://example.com/forms/advocacy-v1")),
                            }.ToImmutableList(),
                            RequiredMonitoringActions: new List<(ActionRequirement, RecurrencePolicy)>
                            {
                                (new ActivityRequirement("Family Coach Checkin"),
                                    new RecurrencePolicy(new List<RecurrencePolicyStage>
                                    {
                                        new RecurrencePolicyStage(TimeSpan.FromDays(7), null)
                                    }.ToImmutableList())),
                                (new ActivityRequirement("Family Coach Supervision"),
                                    new RecurrencePolicy(new List<RecurrencePolicyStage>
                                    {
                                        new RecurrencePolicyStage(TimeSpan.FromDays(7), null)
                                    }.ToImmutableList()))
                            }.ToImmutableList(),
                            RequiredCloseoutActions: new List<ActionRequirement>
                            { }.ToImmutableList())
                    }.ToImmutableList()),
                new VolunteerPolicy(
                    new Dictionary<string, VolunteerRolePolicy>
                    {
                        ["Family Friend"] = new VolunteerRolePolicy("Family Friend", new List<VolunteerApprovalRequirement>
                        {
                            new VolunteerApprovalRequirement(RequiredToBeProspective: true,
                                new FormUploadRequirement("Family Friend Application", "v1", null, new Uri("http://example.com/forms/app-ff"))),
                            new VolunteerApprovalRequirement(RequiredToBeProspective: false,
                                new FormUploadRequirement("Background Check", "v1", "See approval guide for directions", new Uri("http://example.com/forms/app-ff")))
                        }.ToImmutableList()),
                        ["Family Coach"] = new VolunteerRolePolicy("Family Coach", new List<VolunteerApprovalRequirement>
                        {
                            new VolunteerApprovalRequirement(RequiredToBeProspective: true,
                                new FormUploadRequirement("Family Coach Application", "v1", null, new Uri("http://example.com/forms/app-fc"))),
                            new VolunteerApprovalRequirement(RequiredToBeProspective: false,
                                new FormUploadRequirement("Background Check", "v1", "See approval guide for directions", new Uri("http://example.com/forms/app-ff"))),
                            new VolunteerApprovalRequirement(RequiredToBeProspective: false,
                                new ActivityRequirement("Interview with Family Coach Supervisor"))
                        }.ToImmutableList())
                    }.ToImmutableDictionary(),
                    new Dictionary<string, VolunteerFamilyRolePolicy>
                    {
                        ["Host Family"] = new VolunteerFamilyRolePolicy("Host Family", new List<VolunteerFamilyApprovalRequirement>
                        {
                            new VolunteerFamilyApprovalRequirement(RequiredToBeProspective: true,
                                new FormUploadRequirement("Host Family Application", "v1", null, new Uri("http://example.com/forms/app-hf")),
                                VolunteerFamilyRequirementScope.OncePerFamily),
                            new VolunteerFamilyApprovalRequirement(RequiredToBeProspective: false,
                                new FormUploadRequirement("Background Check", "v1", "See approval guide for directions", new Uri("http://example.com/forms/app-ff")),
                                VolunteerFamilyRequirementScope.AllAdultsInTheFamily),
                            new VolunteerFamilyApprovalRequirement(RequiredToBeProspective: false,
                                new FormUploadRequirement("Home Screening Checklist", "v1", "Must be filled out by an approved home screener", new Uri("http://example.com/forms/hscheck")),
                                VolunteerFamilyRequirementScope.OncePerFamily),
                            new VolunteerFamilyApprovalRequirement(RequiredToBeProspective: false,
                                new ActivityRequirement("Host Family Interview"),
                                VolunteerFamilyRequirementScope.OncePerFamily)
                        }.ToImmutableList())
                    }.ToImmutableDictionary())));
        }


        private static async Task AppendEventsAsync<T>(this IMultitenantEventLog<T> eventLog,
            Guid organizationId, Guid locationId, params T[] events)
        {
            foreach (var (domainEvent, index) in events
                .Select((e, i) => (e, (long)i)))
            {
                var result = await eventLog.AppendEventAsync(organizationId, locationId, domainEvent, index + 1);
                if (result.IsT1)
                    throw new InvalidOperationException(result.ToString());
            }
        }
    }
}

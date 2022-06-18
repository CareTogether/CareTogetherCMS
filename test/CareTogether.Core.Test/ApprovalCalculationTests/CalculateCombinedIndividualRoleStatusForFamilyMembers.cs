using CareTogether.Engines;
using CareTogether.Engines.PolicyEvaluation;
using CareTogether.Resources;
using CareTogether.Resources.Directory;
using CareTogether.Resources.Policies;
using Microsoft.VisualStudio.TestTools.UnitTesting;
using System;
using System.Collections.Immutable;

namespace CareTogether.Core.Test.ApprovalCalculationTests
{
    [TestClass]
    public class CalculateCombinedIndividualRoleStatusForFamilyMembers
    {
        private static Guid Id(char x) => Guid.Parse("xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx".Replace('x', x));
        static readonly Guid guid0 = Id('0');
        static readonly Guid guid1 = Id('1');
        static readonly Guid guid2 = Id('2');
        static readonly Guid guid3 = Id('3');
        static readonly Guid guid4 = Id('4');
        static readonly Guid guid5 = Id('5');
        static readonly Guid guid6 = Id('6');

        static ImmutableDictionary<string, VolunteerRolePolicy> volunteerRoles =
            ImmutableDictionary<string, VolunteerRolePolicy>.Empty
            .Add("Host", new VolunteerRolePolicy("Host", ImmutableList<VolunteerRolePolicyVersion>.Empty
                .Add(new VolunteerRolePolicyVersion("v1", SupersededAtUtc: new DateTime(2022, 1, 20),
                    Helpers.IndividualApprovalRequirements(
                        (RequirementStage.Application, "A"),
                        (RequirementStage.Approval, "B"),
                        (RequirementStage.Approval, "C"),
                        (RequirementStage.Approval, "D"),
                        (RequirementStage.Onboarding, "E"),
                        (RequirementStage.Onboarding, "F"))))
                .Add(new VolunteerRolePolicyVersion("v2", SupersededAtUtc: null,
                    Helpers.IndividualApprovalRequirements(
                        (RequirementStage.Application, "A"),
                        (RequirementStage.Approval, "B"),
                        (RequirementStage.Approval, "C"),
                        (RequirementStage.Approval, "Dv2"),
                        (RequirementStage.Onboarding, "E"),
                        (RequirementStage.Onboarding, "F"))))))
            .Add("Coach", new VolunteerRolePolicy("Coach", ImmutableList<VolunteerRolePolicyVersion>.Empty
                .Add(new VolunteerRolePolicyVersion("v1", SupersededAtUtc: null,
                    Helpers.IndividualApprovalRequirements(
                        (RequirementStage.Application, "Acoach"),
                        (RequirementStage.Approval, "B"),
                        (RequirementStage.Approval, "Ccoach"),
                        (RequirementStage.Approval, "Dv2"),
                        (RequirementStage.Onboarding, "E"),
                        (RequirementStage.Onboarding, "Fcoach"))))))
            .Add("OldRole", new VolunteerRolePolicy("OldRole", ImmutableList<VolunteerRolePolicyVersion>.Empty
                .Add(new VolunteerRolePolicyVersion("vSuperseded", SupersededAtUtc: new DateTime(2022, 1, 20),
                    Helpers.IndividualApprovalRequirements(
                        (RequirementStage.Application, "Aold"),
                        (RequirementStage.Approval, "B"),
                        (RequirementStage.Onboarding, "E"))))));

        static Person adult1 = new Person(guid1, null, true, "Bob", "Smith", Gender.Male, new ExactAge(new DateTime(2000, 1, 1)), "",
            ImmutableList<Address>.Empty, null, ImmutableList<PhoneNumber>.Empty, null, ImmutableList<EmailAddress>.Empty, null, null, null);
        static Person adult2 = new Person(guid2, null, true, "Jane", "Smith", Gender.Female, new ExactAge(new DateTime(2000, 1, 1)), "",
            ImmutableList<Address>.Empty, null, ImmutableList<PhoneNumber>.Empty, null, ImmutableList<EmailAddress>.Empty, null, null, null);
        static Person inactiveAdult3 = new Person(guid3, null, false, "BobDUPLICATE", "Smith", Gender.Male, new ExactAge(new DateTime(2000, 1, 1)), "",
            ImmutableList<Address>.Empty, null, ImmutableList<PhoneNumber>.Empty, null, ImmutableList<EmailAddress>.Empty, null, null, null);
        static Person brotherNotInHousehold4 = new Person(guid2, null, true, "Eric", "Smith", Gender.Male, new ExactAge(new DateTime(2000, 1, 1)), "",
            ImmutableList<Address>.Empty, null, ImmutableList<PhoneNumber>.Empty, null, ImmutableList<EmailAddress>.Empty, null, null, null);
        static Person child5 = new Person(guid5, null, true, "Wanda", "Smith", Gender.Female, new ExactAge(new DateTime(2022, 1, 1)), "",
            ImmutableList<Address>.Empty, null, ImmutableList<PhoneNumber>.Empty, null, ImmutableList<EmailAddress>.Empty, null, null, null);

        static Family family = new Family(guid0, guid1,
            ImmutableList<(Person, FamilyAdultRelationshipInfo)>.Empty
                .Add((adult1, new FamilyAdultRelationshipInfo("Dad", true)))
                .Add((adult2, new FamilyAdultRelationshipInfo("Mom", true)))
                /*.Add((inactiveAdult3, new FamilyAdultRelationshipInfo("Dad", true))) //TODO: Reenable
                .Add((brotherNotInHousehold4, new FamilyAdultRelationshipInfo("Brother", false)))*/, //TODO: Reenable
            ImmutableList<Person>.Empty
                .Add(child5),
            ImmutableList<CustodialRelationship>.Empty
                .Add(new CustodialRelationship(guid5, guid1, CustodialRelationshipType.ParentWithCustody))
                .Add(new CustodialRelationship(guid5, guid2, CustodialRelationshipType.ParentWithCustody)),
            ImmutableList<UploadedDocumentInfo>.Empty, ImmutableList<Guid>.Empty, ImmutableList<Activity>.Empty);


        [TestMethod]
        public void TestNotApplied()
        {
            var result = ApprovalCalculations.CalculateCombinedIndividualRoleStatusForFamilyMembers(
                volunteerRoles, family, utcNow: new DateTime(2022, 1, 20),
                Helpers.CompletedIndividualRequirements(),
                Helpers.ExemptedIndividualRequirements(),
                Helpers.RemovedIndividualRoles());

            Assert.AreEqual(2, result.Count);
            AssertEx.DictionaryIs(result[guid1].IndividualRoleVersionApprovals);
            AssertEx.SequenceIs(result[guid1].MissingIndividualRequirements);
            AssertEx.SequenceIs(result[guid1].RemovedIndividualRoles);
            AssertEx.SequenceIs(result[guid1].AvailableIndividualApplications, "A", "Acoach", "Aold");
            AssertEx.DictionaryIs(result[guid2].IndividualRoleVersionApprovals);
            AssertEx.SequenceIs(result[guid2].MissingIndividualRequirements);
            AssertEx.SequenceIs(result[guid2].RemovedIndividualRoles);
            AssertEx.SequenceIs(result[guid2].AvailableIndividualApplications, "A", "Acoach", "Aold");
        }

        [TestMethod]
        public void TestAppliedOnly()
        {
            var result = ApprovalCalculations.CalculateCombinedIndividualRoleStatusForFamilyMembers(
                volunteerRoles, family, utcNow: new DateTime(2022, 1, 20),
                Helpers.CompletedIndividualRequirements((guid1, "A", 1)),
                Helpers.ExemptedIndividualRequirements(),
                Helpers.RemovedIndividualRoles());

            Assert.AreEqual(2, result.Count);
            AssertEx.DictionaryIs(result[guid1].IndividualRoleVersionApprovals,
                ("Host", new RoleVersionApproval[] {
                    new ("v1", RoleApprovalStatus.Prospective, null),
                    new ("v2", RoleApprovalStatus.Prospective, null) }));
            AssertEx.SequenceIs(result[guid1].MissingIndividualRequirements, "B", "C", "D", "Dv2");
            AssertEx.SequenceIs(result[guid1].RemovedIndividualRoles);
            AssertEx.SequenceIs(result[guid1].AvailableIndividualApplications, "Acoach", "Aold");
            AssertEx.DictionaryIs(result[guid2].IndividualRoleVersionApprovals);
            AssertEx.SequenceIs(result[guid2].MissingIndividualRequirements);
            AssertEx.SequenceIs(result[guid2].RemovedIndividualRoles);
            AssertEx.SequenceIs(result[guid2].AvailableIndividualApplications, "A", "Acoach", "Aold");
        }

        [TestMethod]
        public void TestAppliedToMultipleRoles()
        {
            var result = ApprovalCalculations.CalculateCombinedIndividualRoleStatusForFamilyMembers(
                volunteerRoles, family, utcNow: new DateTime(2022, 1, 20),
                Helpers.CompletedIndividualRequirements((guid1, "A", 1), (guid1, "Acoach", 1), (guid2, "A", 1)),
                Helpers.ExemptedIndividualRequirements(),
                Helpers.RemovedIndividualRoles());

            Assert.AreEqual(2, result.Count);
            AssertEx.DictionaryIs(result[guid1].IndividualRoleVersionApprovals,
                ("Host", new RoleVersionApproval[] {
                    new ("v1", RoleApprovalStatus.Prospective, null),
                    new ("v2", RoleApprovalStatus.Prospective, null) }),
                ("Coach", new RoleVersionApproval[] {
                    new ("v1", RoleApprovalStatus.Prospective, null) }));
            AssertEx.SequenceIs(result[guid1].MissingIndividualRequirements, "B", "C", "D", "Dv2", "Ccoach");
            AssertEx.SequenceIs(result[guid1].RemovedIndividualRoles);
            AssertEx.SequenceIs(result[guid1].AvailableIndividualApplications, "Aold");
            AssertEx.DictionaryIs(result[guid2].IndividualRoleVersionApprovals,
                ("Host", new RoleVersionApproval[] {
                    new ("v1", RoleApprovalStatus.Prospective, null),
                    new ("v2", RoleApprovalStatus.Prospective, null) }));
            AssertEx.SequenceIs(result[guid2].MissingIndividualRequirements, "B", "C", "D", "Dv2");
            AssertEx.SequenceIs(result[guid2].RemovedIndividualRoles);
            AssertEx.SequenceIs(result[guid2].AvailableIndividualApplications, "Acoach", "Aold");
        }

        [TestMethod]
        public void TestAppliedOnlyWillBeSuperseded()
        {
            var result = ApprovalCalculations.CalculateCombinedIndividualRoleStatusForFamilyMembers(
                volunteerRoles, family, utcNow: new DateTime(2022, 1, 10),
                Helpers.CompletedIndividualRequirements((guid1, "Aold", 1)),
                Helpers.ExemptedIndividualRequirements(),
                Helpers.RemovedIndividualRoles());

            Assert.AreEqual(2, result.Count);
            AssertEx.DictionaryIs(result[guid1].IndividualRoleVersionApprovals,
                ("OldRole", new RoleVersionApproval[] {
                    new ("vSuperseded", RoleApprovalStatus.Prospective, null) }));
            AssertEx.SequenceIs(result[guid1].MissingIndividualRequirements, "B");
            AssertEx.SequenceIs(result[guid1].RemovedIndividualRoles);
            AssertEx.SequenceIs(result[guid1].AvailableIndividualApplications, "A", "Acoach");
            AssertEx.DictionaryIs(result[guid2].IndividualRoleVersionApprovals);
            AssertEx.SequenceIs(result[guid2].MissingIndividualRequirements);
            AssertEx.SequenceIs(result[guid2].RemovedIndividualRoles);
            AssertEx.SequenceIs(result[guid2].AvailableIndividualApplications, "A", "Acoach", "Aold");
        }

        [TestMethod]
        public void TestAppliedOnlyHasBeenSuperseded()
        {
            var result = ApprovalCalculations.CalculateCombinedIndividualRoleStatusForFamilyMembers(
                volunteerRoles, family, utcNow: new DateTime(2022, 1, 30),
                Helpers.CompletedIndividualRequirements((guid1, "Aold", 1)),
                Helpers.ExemptedIndividualRequirements(),
                Helpers.RemovedIndividualRoles());

            Assert.AreEqual(2, result.Count);
            AssertEx.DictionaryIs(result[guid1].IndividualRoleVersionApprovals,
                ("OldRole", new RoleVersionApproval[] {
                    new ("vSuperseded", RoleApprovalStatus.Prospective, null) }));
            AssertEx.SequenceIs(result[guid1].MissingIndividualRequirements, "B");
            AssertEx.SequenceIs(result[guid1].RemovedIndividualRoles);
            AssertEx.SequenceIs(result[guid1].AvailableIndividualApplications, "A", "Acoach");
            AssertEx.DictionaryIs(result[guid2].IndividualRoleVersionApprovals);
            AssertEx.SequenceIs(result[guid2].MissingIndividualRequirements);
            AssertEx.SequenceIs(result[guid2].RemovedIndividualRoles);
            AssertEx.SequenceIs(result[guid2].AvailableIndividualApplications, "A", "Acoach", "Aold");
        }

        [TestMethod]
        public void TestAppliedOnlyAfterSupersededDateWillBeSuperseded()
        {
            var result = ApprovalCalculations.CalculateCombinedIndividualRoleStatusForFamilyMembers(
                volunteerRoles, family, utcNow: new DateTime(2022, 1, 10),
                Helpers.CompletedIndividualRequirements((guid1, "Aold", 25)),
                Helpers.ExemptedIndividualRequirements(),
                Helpers.RemovedIndividualRoles());

            Assert.AreEqual(2, result.Count);
            AssertEx.DictionaryIs(result[guid1].IndividualRoleVersionApprovals);
            AssertEx.SequenceIs(result[guid1].MissingIndividualRequirements);
            AssertEx.SequenceIs(result[guid1].RemovedIndividualRoles);
            AssertEx.SequenceIs(result[guid1].AvailableIndividualApplications, "A", "Acoach", "Aold");
            AssertEx.DictionaryIs(result[guid2].IndividualRoleVersionApprovals);
            AssertEx.SequenceIs(result[guid2].MissingIndividualRequirements);
            AssertEx.SequenceIs(result[guid2].RemovedIndividualRoles);
            AssertEx.SequenceIs(result[guid2].AvailableIndividualApplications, "A", "Acoach", "Aold");
        }

        [TestMethod]
        public void TestAppliedOnlyAfterSupersededDateHasBeenSuperseded()
        {
            var result = ApprovalCalculations.CalculateCombinedIndividualRoleStatusForFamilyMembers(
                volunteerRoles, family, utcNow: new DateTime(2022, 1, 30),
                Helpers.CompletedIndividualRequirements((guid1, "Aold", 25)),
                Helpers.ExemptedIndividualRequirements(),
                Helpers.RemovedIndividualRoles());

            Assert.AreEqual(2, result.Count);
            AssertEx.DictionaryIs(result[guid1].IndividualRoleVersionApprovals);
            AssertEx.SequenceIs(result[guid1].MissingIndividualRequirements);
            AssertEx.SequenceIs(result[guid1].RemovedIndividualRoles);
            AssertEx.SequenceIs(result[guid1].AvailableIndividualApplications, "A", "Acoach", "Aold");
            AssertEx.DictionaryIs(result[guid2].IndividualRoleVersionApprovals);
            AssertEx.SequenceIs(result[guid2].MissingIndividualRequirements);
            AssertEx.SequenceIs(result[guid2].RemovedIndividualRoles);
            AssertEx.SequenceIs(result[guid2].AvailableIndividualApplications, "A", "Acoach", "Aold");
        }

        [TestMethod]
        public void TestPartiallyApprovedOnly()
        {
            var result = ApprovalCalculations.CalculateCombinedIndividualRoleStatusForFamilyMembers(
                volunteerRoles, family, utcNow: new DateTime(2022, 1, 20),
                Helpers.CompletedIndividualRequirements((guid1, "A", 1), (guid1, "Acoach", 1), (guid2, "A", 1),
                    (guid1, "B", 5), (guid1, "C", 5), (guid2, "Dv2", 5)),
                Helpers.ExemptedIndividualRequirements(),
                Helpers.RemovedIndividualRoles());

            Assert.AreEqual(2, result.Count);
            AssertEx.DictionaryIs(result[guid1].IndividualRoleVersionApprovals,
                ("Host", new RoleVersionApproval[] {
                    new ("v1", RoleApprovalStatus.Prospective, null),
                    new ("v2", RoleApprovalStatus.Prospective, null) }),
                ("Coach", new RoleVersionApproval[] {
                    new ("v1", RoleApprovalStatus.Prospective, null) }));
            AssertEx.SequenceIs(result[guid1].MissingIndividualRequirements, "D", "Dv2", "Ccoach");
            AssertEx.SequenceIs(result[guid1].RemovedIndividualRoles);
            AssertEx.SequenceIs(result[guid1].AvailableIndividualApplications, "Aold");
            AssertEx.DictionaryIs(result[guid2].IndividualRoleVersionApprovals,
                ("Host", new RoleVersionApproval[] {
                    new ("v1", RoleApprovalStatus.Prospective, null),
                    new ("v2", RoleApprovalStatus.Prospective, null) }));
            AssertEx.SequenceIs(result[guid2].MissingIndividualRequirements, "B", "C", "D");
            AssertEx.SequenceIs(result[guid2].RemovedIndividualRoles);
            AssertEx.SequenceIs(result[guid2].AvailableIndividualApplications, "Acoach", "Aold");
        }

        [TestMethod]
        public void TestApprovedOnlyForOnePerson()
        {
            var result = ApprovalCalculations.CalculateCombinedIndividualRoleStatusForFamilyMembers(
                volunteerRoles, family, utcNow: new DateTime(2022, 1, 20),
                Helpers.CompletedIndividualRequirements((guid1, "A", 1), (guid1, "Acoach", 1), (guid2, "A", 1),
                    (guid1, "B", 5), (guid1, "C", 5), (guid2, "Dv2", 5), (guid1, "D", 6), (guid2, "B", 6)),
                Helpers.ExemptedIndividualRequirements(),
                Helpers.RemovedIndividualRoles());

            Assert.AreEqual(2, result.Count);
            AssertEx.DictionaryIs(result[guid1].IndividualRoleVersionApprovals,
                ("Host", new RoleVersionApproval[] {
                    new ("v1", RoleApprovalStatus.Approved, null),
                    new ("v2", RoleApprovalStatus.Prospective, null) }),
                ("Coach", new RoleVersionApproval[] {
                    new ("v1", RoleApprovalStatus.Prospective, null) }));
            AssertEx.SequenceIs(result[guid1].MissingIndividualRequirements, "E", "F", "Dv2", "Ccoach");
            AssertEx.SequenceIs(result[guid1].RemovedIndividualRoles);
            AssertEx.SequenceIs(result[guid1].AvailableIndividualApplications, "Aold");
            AssertEx.DictionaryIs(result[guid2].IndividualRoleVersionApprovals,
                ("Host", new RoleVersionApproval[] {
                    new ("v1", RoleApprovalStatus.Prospective, null),
                    new ("v2", RoleApprovalStatus.Prospective, null) }));
            AssertEx.SequenceIs(result[guid2].MissingIndividualRequirements, "C", "D");
            AssertEx.SequenceIs(result[guid2].RemovedIndividualRoles);
            AssertEx.SequenceIs(result[guid2].AvailableIndividualApplications, "Acoach", "Aold");
        }

        [TestMethod]
        public void TestApprovedOnlyForBothPeople()
        {
            var result = ApprovalCalculations.CalculateCombinedIndividualRoleStatusForFamilyMembers(
                volunteerRoles, family, utcNow: new DateTime(2022, 1, 20),
                Helpers.CompletedIndividualRequirements((guid1, "A", 1), (guid1, "Acoach", 1), (guid2, "A", 1),
                    (guid1, "B", 5), (guid1, "C", 5), (guid2, "Dv2", 5), (guid1, "D", 6), (guid2, "B", 6), (guid2, "C", 6)),
                Helpers.ExemptedIndividualRequirements(),
                Helpers.RemovedIndividualRoles());

            Assert.AreEqual(2, result.Count);
            AssertEx.DictionaryIs(result[guid1].IndividualRoleVersionApprovals,
                ("Host", new RoleVersionApproval[] {
                    new ("v1", RoleApprovalStatus.Approved, null),
                    new ("v2", RoleApprovalStatus.Prospective, null) }),
                ("Coach", new RoleVersionApproval[] {
                    new ("v1", RoleApprovalStatus.Prospective, null) }));
            AssertEx.SequenceIs(result[guid1].MissingIndividualRequirements, "E", "F", "Dv2", "Ccoach");
            AssertEx.SequenceIs(result[guid1].RemovedIndividualRoles);
            AssertEx.SequenceIs(result[guid1].AvailableIndividualApplications, "Aold");
            AssertEx.DictionaryIs(result[guid2].IndividualRoleVersionApprovals,
                ("Host", new RoleVersionApproval[] {
                    new ("v1", RoleApprovalStatus.Prospective, null),
                    new ("v2", RoleApprovalStatus.Approved, null) }));
            AssertEx.SequenceIs(result[guid2].MissingIndividualRequirements, "D", "E", "F");
            AssertEx.SequenceIs(result[guid2].RemovedIndividualRoles);
            AssertEx.SequenceIs(result[guid2].AvailableIndividualApplications, "Acoach", "Aold");
        }

        [TestMethod]
        public void TestApprovedOnlyForBothPeopleMultipleWays()
        {
            var result = ApprovalCalculations.CalculateCombinedIndividualRoleStatusForFamilyMembers(
                volunteerRoles, family, utcNow: new DateTime(2022, 1, 20),
                Helpers.CompletedIndividualRequirements((guid1, "A", 1), (guid1, "Acoach", 1), (guid2, "A", 1),
                    (guid1, "B", 5), (guid1, "C", 5), (guid2, "Dv2", 5), (guid1, "D", 6), (guid2, "B", 6), (guid2, "C", 6),
                    (guid2, "D", 7)),
                Helpers.ExemptedIndividualRequirements(),
                Helpers.RemovedIndividualRoles());

            Assert.AreEqual(2, result.Count);
            AssertEx.DictionaryIs(result[guid1].IndividualRoleVersionApprovals,
                ("Host", new RoleVersionApproval[] {
                    new ("v1", RoleApprovalStatus.Approved, null),
                    new ("v2", RoleApprovalStatus.Prospective, null) }),
                ("Coach", new RoleVersionApproval[] {
                    new ("v1", RoleApprovalStatus.Prospective, null) }));
            AssertEx.SequenceIs(result[guid1].MissingIndividualRequirements, "E", "F", "Dv2", "Ccoach");
            AssertEx.SequenceIs(result[guid1].RemovedIndividualRoles);
            AssertEx.SequenceIs(result[guid1].AvailableIndividualApplications, "Aold");
            AssertEx.DictionaryIs(result[guid2].IndividualRoleVersionApprovals,
                ("Host", new RoleVersionApproval[] {
                    new ("v1", RoleApprovalStatus.Approved, null),
                    new ("v2", RoleApprovalStatus.Approved, null) }));
            AssertEx.SequenceIs(result[guid2].MissingIndividualRequirements, "E", "F");
            AssertEx.SequenceIs(result[guid2].RemovedIndividualRoles);
            AssertEx.SequenceIs(result[guid2].AvailableIndividualApplications, "Acoach", "Aold");
        }

        [TestMethod]
        public void TestApprovedOnlyByExemption()
        {
            var result = ApprovalCalculations.CalculateCombinedIndividualRoleStatusForFamilyMembers(
                volunteerRoles, family, utcNow: new DateTime(2022, 1, 20),
                Helpers.CompletedIndividualRequirements((guid1, "A", 1), (guid1, "Acoach", 1), (guid2, "A", 1),
                    (guid1, "C", 5), (guid1, "D", 6), (guid2, "B", 6), (guid2, "C", 6)),
                Helpers.ExemptedIndividualRequirements((guid1, "B", 25), (guid2, "D", 26)),
                Helpers.RemovedIndividualRoles());

            Assert.AreEqual(2, result.Count);
            AssertEx.DictionaryIs(result[guid1].IndividualRoleVersionApprovals,
                ("Host", new RoleVersionApproval[] {
                    new ("v1", RoleApprovalStatus.Approved, new DateTime(2022, 1, 25)),
                    new ("v2", RoleApprovalStatus.Prospective, null) }),
                ("Coach", new RoleVersionApproval[] {
                    new ("v1", RoleApprovalStatus.Prospective, null) }));
            AssertEx.SequenceIs(result[guid1].MissingIndividualRequirements, "E", "F", "Dv2", "Ccoach");
            AssertEx.SequenceIs(result[guid1].RemovedIndividualRoles);
            AssertEx.SequenceIs(result[guid1].AvailableIndividualApplications, "Aold");
            AssertEx.DictionaryIs(result[guid2].IndividualRoleVersionApprovals,
                ("Host", new RoleVersionApproval[] {
                    new ("v1", RoleApprovalStatus.Approved, new DateTime(2022, 1, 26)),
                    new ("v2", RoleApprovalStatus.Prospective, null) }));
            AssertEx.SequenceIs(result[guid2].MissingIndividualRequirements, "Dv2", "E", "F");
            AssertEx.SequenceIs(result[guid2].RemovedIndividualRoles);
            AssertEx.SequenceIs(result[guid2].AvailableIndividualApplications, "Acoach", "Aold");
        }

        [TestMethod]
        public void TestNotApprovedBecauseExemptionExpired()
        {
            var result = ApprovalCalculations.CalculateCombinedIndividualRoleStatusForFamilyMembers(
                volunteerRoles, family, utcNow: new DateTime(2022, 1, 30),
                Helpers.CompletedIndividualRequirements((guid1, "A", 1), (guid1, "Acoach", 1), (guid2, "A", 1),
                    (guid1, "C", 5), (guid1, "D", 6), (guid2, "B", 6), (guid2, "C", 6)),
                Helpers.ExemptedIndividualRequirements((guid1, "B", 25), (guid2, "D", 26)),
                Helpers.RemovedIndividualRoles());

            Assert.AreEqual(2, result.Count);
            AssertEx.DictionaryIs(result[guid1].IndividualRoleVersionApprovals,
                ("Host", new RoleVersionApproval[] {
                    new ("v1", RoleApprovalStatus.Prospective, null),
                    new ("v2", RoleApprovalStatus.Prospective, null) }),
                ("Coach", new RoleVersionApproval[] {
                    new ("v1", RoleApprovalStatus.Prospective, null) }));
            AssertEx.SequenceIs(result[guid1].MissingIndividualRequirements, "B", "Dv2", "Ccoach");
            AssertEx.SequenceIs(result[guid1].RemovedIndividualRoles);
            AssertEx.SequenceIs(result[guid1].AvailableIndividualApplications, "Aold");
            AssertEx.DictionaryIs(result[guid2].IndividualRoleVersionApprovals,
                ("Host", new RoleVersionApproval[] {
                    new ("v1", RoleApprovalStatus.Prospective, null),
                    new ("v2", RoleApprovalStatus.Prospective, null) }));
            AssertEx.SequenceIs(result[guid2].MissingIndividualRequirements, "D", "Dv2");
            AssertEx.SequenceIs(result[guid2].RemovedIndividualRoles);
            AssertEx.SequenceIs(result[guid2].AvailableIndividualApplications, "Acoach", "Aold");
        }

        [TestMethod]
        public void TestOnboardedOnly()
        {
            var result = ApprovalCalculations.CalculateCombinedIndividualRoleStatusForFamilyMembers(
                volunteerRoles, family, utcNow: new DateTime(2022, 1, 20),
                Helpers.CompletedIndividualRequirements((guid1, "A", 1), (guid1, "Acoach", 1), (guid2, "A", 1),
                    (guid1, "B", 5), (guid1, "C", 5), (guid2, "Dv2", 5), (guid1, "D", 6), (guid2, "B", 6),
                    (guid1, "E", 8), (guid1, "F", 8)),
                Helpers.ExemptedIndividualRequirements(),
                Helpers.RemovedIndividualRoles());

            Assert.AreEqual(2, result.Count);
            AssertEx.DictionaryIs(result[guid1].IndividualRoleVersionApprovals,
                ("Host", new RoleVersionApproval[] {
                new ("v1", RoleApprovalStatus.Onboarded, null),
                new ("v2", RoleApprovalStatus.Prospective, null) }),
                ("Coach", new RoleVersionApproval[] {
                new ("v1", RoleApprovalStatus.Prospective, null) }));
            AssertEx.SequenceIs(result[guid1].MissingIndividualRequirements, "Dv2", "Ccoach");
            AssertEx.SequenceIs(result[guid1].RemovedIndividualRoles);
            AssertEx.SequenceIs(result[guid1].AvailableIndividualApplications, "Aold");
            AssertEx.DictionaryIs(result[guid2].IndividualRoleVersionApprovals,
                ("Host", new RoleVersionApproval[] {
                new ("v1", RoleApprovalStatus.Prospective, null),
                new ("v2", RoleApprovalStatus.Prospective, null) }));
            AssertEx.SequenceIs(result[guid2].MissingIndividualRequirements, "C", "D");
            AssertEx.SequenceIs(result[guid2].RemovedIndividualRoles);
            AssertEx.SequenceIs(result[guid2].AvailableIndividualApplications, "Acoach", "Aold");
        }

        [TestMethod]
        public void TestOnboardedOnlyExpiring()
        {
            var result = ApprovalCalculations.CalculateCombinedIndividualRoleStatusForFamilyMembers(
                volunteerRoles, family, utcNow: new DateTime(2022, 1, 20),
                Helpers.CompletedIndividualRequirementsWithExpiry((guid1, "A", 1, null), (guid1, "Acoach", 1, null), (guid2, "A", 1, null),
                    (guid1, "B", 5, null), (guid1, "C", 5, 25), (guid2, "Dv2", 5, null), (guid1, "D", 6, null), (guid2, "B", 6, null),
                    (guid1, "E", 8, null), (guid1, "F", 8, null)),
                Helpers.ExemptedIndividualRequirements(),
                Helpers.RemovedIndividualRoles());

            Assert.AreEqual(2, result.Count);
            AssertEx.DictionaryIs(result[guid1].IndividualRoleVersionApprovals,
                ("Host", new RoleVersionApproval[] {
                new ("v1", RoleApprovalStatus.Onboarded, new DateTime(2022, 1, 25)),
                new ("v2", RoleApprovalStatus.Prospective, null) }),
                ("Coach", new RoleVersionApproval[] {
                new ("v1", RoleApprovalStatus.Prospective, null) }));
            AssertEx.SequenceIs(result[guid1].MissingIndividualRequirements, "Dv2", "Ccoach");
            AssertEx.SequenceIs(result[guid1].RemovedIndividualRoles);
            AssertEx.SequenceIs(result[guid1].AvailableIndividualApplications, "Aold");
            AssertEx.DictionaryIs(result[guid2].IndividualRoleVersionApprovals,
                ("Host", new RoleVersionApproval[] {
                new ("v1", RoleApprovalStatus.Prospective, null),
                new ("v2", RoleApprovalStatus.Prospective, null) }));
            AssertEx.SequenceIs(result[guid2].MissingIndividualRequirements, "C", "D");
            AssertEx.SequenceIs(result[guid2].RemovedIndividualRoles);
            AssertEx.SequenceIs(result[guid2].AvailableIndividualApplications, "Acoach", "Aold");
        }
    }
}

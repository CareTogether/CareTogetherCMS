using CareTogether.Engines;
using CareTogether.Resources;
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
                        (RequirementStage.Onboarding, "Fcoach"))))));

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
            ImmutableList<UploadedDocumentInfo>.Empty, ImmutableList<Guid>.Empty);


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
            AssertEx.SequenceIs(result[guid1].AvailableIndividualApplications, "A", "Acoach");
            AssertEx.DictionaryIs(result[guid2].IndividualRoleVersionApprovals);
            AssertEx.SequenceIs(result[guid2].MissingIndividualRequirements);
            AssertEx.SequenceIs(result[guid2].RemovedIndividualRoles);
            AssertEx.SequenceIs(result[guid2].AvailableIndividualApplications, "A", "Acoach");
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
                    new ("v1", RoleApprovalStatus.Prospective),
                    new ("v2", RoleApprovalStatus.Prospective) }));
            AssertEx.SequenceIs(result[guid1].MissingIndividualRequirements, "B", "C", "D", "Dv2");
            AssertEx.SequenceIs(result[guid1].RemovedIndividualRoles);
            AssertEx.SequenceIs(result[guid1].AvailableIndividualApplications, "Acoach");
            AssertEx.DictionaryIs(result[guid2].IndividualRoleVersionApprovals);
            AssertEx.SequenceIs(result[guid2].MissingIndividualRequirements);
            AssertEx.SequenceIs(result[guid2].RemovedIndividualRoles);
            AssertEx.SequenceIs(result[guid2].AvailableIndividualApplications, "A", "Acoach");
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
                    new ("v1", RoleApprovalStatus.Prospective),
                    new ("v2", RoleApprovalStatus.Prospective) }),
                ("Coach", new RoleVersionApproval[] {
                    new ("v1", RoleApprovalStatus.Prospective) }));
            AssertEx.SequenceIs(result[guid1].MissingIndividualRequirements, "B", "C", "D", "Dv2", "Ccoach");
            AssertEx.SequenceIs(result[guid1].RemovedIndividualRoles);
            AssertEx.SequenceIs(result[guid1].AvailableIndividualApplications);
            AssertEx.DictionaryIs(result[guid2].IndividualRoleVersionApprovals,
                ("Host", new RoleVersionApproval[] {
                    new ("v1", RoleApprovalStatus.Prospective),
                    new ("v2", RoleApprovalStatus.Prospective) }));
            AssertEx.SequenceIs(result[guid2].MissingIndividualRequirements, "B", "C", "D", "Dv2");
            AssertEx.SequenceIs(result[guid2].RemovedIndividualRoles);
            AssertEx.SequenceIs(result[guid2].AvailableIndividualApplications, "Acoach");
        }

        //[TestMethod]
        //public void TestAppliedOnlyWillBeSuperseded()
        //{
        //    var (status, missingRequirements, availableApplications) = ApprovalCalculations.CalculateIndividualVolunteerRoleApprovalStatus(
        //        new VolunteerRolePolicyVersion("v1", SupersededAtUtc: new DateTime(2022, 1, 10), requirements),
        //        utcNow: new DateTime(2022, 1, 5),
        //        Helpers.Completed(("A", 1)),
        //        Helpers.Exempted());

        //    Assert.AreEqual(RoleApprovalStatus.Prospective, status);
        //    // Requirements from superseded policies remain "available" for historical data entry purposes.
        //    AssertEx.SequenceIs(missingRequirements, "B", "C", "D");
        //    AssertEx.SequenceIs(availableApplications);
        //}

        //[TestMethod]
        //public void TestAppliedOnlyHasBeenSuperseded()
        //{
        //    var (status, missingRequirements, availableApplications) = ApprovalCalculations.CalculateIndividualVolunteerRoleApprovalStatus(
        //        new VolunteerRolePolicyVersion("v1", SupersededAtUtc: new DateTime(2022, 1, 10), requirements),
        //        utcNow: new DateTime(2022, 1, 20),
        //        Helpers.Completed(("A", 1)),
        //        Helpers.Exempted());

        //    Assert.AreEqual(RoleApprovalStatus.Prospective, status);
        //    // Requirements from superseded policies remain "available" for historical data entry purposes.
        //    AssertEx.SequenceIs(missingRequirements, "B", "C", "D");
        //    AssertEx.SequenceIs(availableApplications);
        //}

        //[TestMethod]
        //public void TestAppliedOnlyAfterSupersededDateWillBeSuperseded()
        //{
        //    var (status, missingRequirements, availableApplications) = ApprovalCalculations.CalculateIndividualVolunteerRoleApprovalStatus(
        //        new VolunteerRolePolicyVersion("v1", SupersededAtUtc: new DateTime(2022, 1, 10), requirements),
        //        utcNow: new DateTime(2022, 1, 5),
        //        Helpers.Completed(("A", 15)),
        //        Helpers.Exempted());

        //    Assert.AreEqual(null, status);
        //    AssertEx.SequenceIs(missingRequirements);
        //    // Completing an application after the superseded date is not considered a valid completion for this policy version.
        //    // The superseded policy's requirements remain "available" for historical data entry purposes.
        //    AssertEx.SequenceIs(availableApplications, "A");
        //}

        //[TestMethod]
        //public void TestAppliedOnlyAfterSupersededDateHasBeenSuperseded()
        //{
        //    var (status, missingRequirements, availableApplications) = ApprovalCalculations.CalculateIndividualVolunteerRoleApprovalStatus(
        //        new VolunteerRolePolicyVersion("v1", SupersededAtUtc: new DateTime(2022, 1, 10), requirements),
        //        utcNow: new DateTime(2022, 1, 20),
        //        Helpers.Completed(("A", 15)),
        //        Helpers.Exempted());

        //    Assert.AreEqual(null, status);
        //    AssertEx.SequenceIs(missingRequirements);
        //    // Completing an application after the superseded date is not considered a valid completion for this policy version.
        //    // The superseded policy's requirements remain "available" for historical data entry purposes.
        //    AssertEx.SequenceIs(availableApplications, "A");
        //}

        //[TestMethod]
        //public void TestPartiallyApprovedOnly()
        //{
        //    var (status, missingRequirements, availableApplications) = ApprovalCalculations.CalculateIndividualVolunteerRoleApprovalStatus(
        //        new VolunteerRolePolicyVersion("v1", SupersededAtUtc: null, requirements),
        //        utcNow: new DateTime(2022, 1, 20),
        //        Helpers.Completed(("A", 1), ("B", 2), ("C", 3)),
        //        Helpers.Exempted());

        //    Assert.AreEqual(RoleApprovalStatus.Prospective, status);
        //    AssertEx.SequenceIs(missingRequirements, "D");
        //    AssertEx.SequenceIs(availableApplications);
        //}

        //[TestMethod]
        //public void TestPartiallyApprovedWillBeSuperseded()
        //{
        //    var (status, missingRequirements, availableApplications) = ApprovalCalculations.CalculateIndividualVolunteerRoleApprovalStatus(
        //        new VolunteerRolePolicyVersion("v1", SupersededAtUtc: new DateTime(2022, 1, 10), requirements),
        //        utcNow: new DateTime(2022, 1, 5),
        //        Helpers.Completed(("A", 1), ("B", 2), ("C", 3)),
        //        Helpers.Exempted());

        //    Assert.AreEqual(RoleApprovalStatus.Prospective, status);
        //    AssertEx.SequenceIs(missingRequirements, "D");
        //    AssertEx.SequenceIs(availableApplications);
        //}

        //[TestMethod]
        //public void TestPartiallyApprovedHasBeenSuperseded()
        //{
        //    var (status, missingRequirements, availableApplications) = ApprovalCalculations.CalculateIndividualVolunteerRoleApprovalStatus(
        //        new VolunteerRolePolicyVersion("v1", SupersededAtUtc: new DateTime(2022, 1, 10), requirements),
        //        utcNow: new DateTime(2022, 1, 20),
        //        Helpers.Completed(("A", 1), ("B", 2), ("C", 3)),
        //        Helpers.Exempted());

        //    Assert.AreEqual(RoleApprovalStatus.Prospective, status);
        //    AssertEx.SequenceIs(missingRequirements, "D");
        //    AssertEx.SequenceIs(availableApplications);
        //}

        //[TestMethod]
        //public void TestPartiallyApprovedAfterSupersededDateWillBeSuperseded()
        //{
        //    var (status, missingRequirements, availableApplications) = ApprovalCalculations.CalculateIndividualVolunteerRoleApprovalStatus(
        //        new VolunteerRolePolicyVersion("v1", SupersededAtUtc: new DateTime(2022, 1, 10), requirements),
        //        utcNow: new DateTime(2022, 1, 5),
        //        Helpers.Completed(("A", 1), ("B", 12), ("C", 13)),
        //        Helpers.Exempted());

        //    Assert.AreEqual(RoleApprovalStatus.Prospective, status);
        //    // Requirements from superseded policies remain "available" for historical data entry purposes.
        //    AssertEx.SequenceIs(missingRequirements, "B", "C", "D");
        //    AssertEx.SequenceIs(availableApplications);
        //}

        //[TestMethod]
        //public void TestPartiallyApprovedAfterSupersededDateHasBeenSuperseded()
        //{
        //    var (status, missingRequirements, availableApplications) = ApprovalCalculations.CalculateIndividualVolunteerRoleApprovalStatus(
        //        new VolunteerRolePolicyVersion("v1", SupersededAtUtc: new DateTime(2022, 1, 10), requirements),
        //        utcNow: new DateTime(2022, 1, 20),
        //        Helpers.Completed(("A", 1), ("B", 12), ("C", 13)),
        //        Helpers.Exempted());

        //    Assert.AreEqual(RoleApprovalStatus.Prospective, status);
        //    // Requirements from superseded policies remain "available" for historical data entry purposes.
        //    AssertEx.SequenceIs(missingRequirements, "B", "C", "D");
        //    AssertEx.SequenceIs(availableApplications);
        //}

        //[TestMethod]
        //public void TestApprovedOnly()
        //{
        //    var (status, missingRequirements, availableApplications) = ApprovalCalculations.CalculateIndividualVolunteerRoleApprovalStatus(
        //        new VolunteerRolePolicyVersion("v1", SupersededAtUtc: null, requirements),
        //        utcNow: new DateTime(2022, 1, 20),
        //        Helpers.Completed(("A", 1), ("B", 2), ("C", 3), ("D", 4)),
        //        Helpers.Exempted());

        //    Assert.AreEqual(RoleApprovalStatus.Approved, status);
        //    AssertEx.SequenceIs(missingRequirements, "E", "F");
        //    AssertEx.SequenceIs(availableApplications);
        //}

        //[TestMethod]
        //public void TestApprovedOnlyByExemption()
        //{
        //    var (status, missingRequirements, availableApplications) = ApprovalCalculations.CalculateIndividualVolunteerRoleApprovalStatus(
        //        new VolunteerRolePolicyVersion("v1", SupersededAtUtc: null, requirements),
        //        utcNow: new DateTime(2022, 1, 20),
        //        Helpers.Completed(("A", 1), ("B", 2), ("C", 3)),
        //        Helpers.Exempted(("D", 30)));

        //    Assert.AreEqual(RoleApprovalStatus.Approved, status);
        //    AssertEx.SequenceIs(missingRequirements, "E", "F");
        //    AssertEx.SequenceIs(availableApplications);
        //}

        //[TestMethod]
        //public void TestNotApprovedBecauseExemptionExpired()
        //{
        //    var (status, missingRequirements, availableApplications) = ApprovalCalculations.CalculateIndividualVolunteerRoleApprovalStatus(
        //        new VolunteerRolePolicyVersion("v1", SupersededAtUtc: null, requirements),
        //        utcNow: new DateTime(2022, 1, 20),
        //        Helpers.Completed(("A", 1), ("B", 2), ("C", 3), ("E", 10), ("F", 10)),
        //        Helpers.Exempted(("D", 15)));

        //    Assert.AreEqual(RoleApprovalStatus.Prospective, status);
        //    AssertEx.SequenceIs(missingRequirements, "D");
        //    AssertEx.SequenceIs(availableApplications);
        //}

        //[TestMethod]
        //public void TestApprovedWillBeSuperseded()
        //{
        //    var (status, missingRequirements, availableApplications) = ApprovalCalculations.CalculateIndividualVolunteerRoleApprovalStatus(
        //        new VolunteerRolePolicyVersion("v1", SupersededAtUtc: new DateTime(2022, 1, 10), requirements),
        //        utcNow: new DateTime(2022, 1, 5),
        //        Helpers.Completed(("A", 1), ("B", 2), ("C", 3), ("D", 4)),
        //        Helpers.Exempted());

        //    Assert.AreEqual(RoleApprovalStatus.Approved, status);
        //    AssertEx.SequenceIs(missingRequirements, "E", "F");
        //    AssertEx.SequenceIs(availableApplications);
        //}

        //[TestMethod]
        //public void TestApprovedHasBeenSuperseded()
        //{
        //    var (status, missingRequirements, availableApplications) = ApprovalCalculations.CalculateIndividualVolunteerRoleApprovalStatus(
        //        new VolunteerRolePolicyVersion("v1", SupersededAtUtc: new DateTime(2022, 1, 10), requirements),
        //        utcNow: new DateTime(2022, 1, 20),
        //        Helpers.Completed(("A", 1), ("B", 2), ("C", 3), ("D", 4)),
        //        Helpers.Exempted());

        //    Assert.AreEqual(RoleApprovalStatus.Approved, status);
        //    AssertEx.SequenceIs(missingRequirements, "E", "F");
        //    AssertEx.SequenceIs(availableApplications);
        //}

        //[TestMethod]
        //public void TestApprovedAfterSupersededDateWillBeSuperseded()
        //{
        //    var (status, missingRequirements, availableApplications) = ApprovalCalculations.CalculateIndividualVolunteerRoleApprovalStatus(
        //        new VolunteerRolePolicyVersion("v1", SupersededAtUtc: new DateTime(2022, 1, 10), requirements),
        //        utcNow: new DateTime(2022, 1, 5),
        //        Helpers.Completed(("A", 1), ("B", 2), ("C", 3), ("D", 14)),
        //        Helpers.Exempted());

        //    Assert.AreEqual(RoleApprovalStatus.Prospective, status);
        //    // Requirements from superseded policies remain "available" for historical data entry purposes.
        //    AssertEx.SequenceIs(missingRequirements, "D");
        //    AssertEx.SequenceIs(availableApplications);
        //}

        //[TestMethod]
        //public void TestApprovedAfterSupersededDateHasBeenSuperseded()
        //{
        //    var (status, missingRequirements, availableApplications) = ApprovalCalculations.CalculateIndividualVolunteerRoleApprovalStatus(
        //        new VolunteerRolePolicyVersion("v1", SupersededAtUtc: new DateTime(2022, 1, 10), requirements),
        //        utcNow: new DateTime(2022, 1, 20),
        //        Helpers.Completed(("A", 1), ("B", 2), ("C", 3), ("D", 14)),
        //        Helpers.Exempted());

        //    Assert.AreEqual(RoleApprovalStatus.Prospective, status);
        //    // Requirements from superseded policies remain "available" for historical data entry purposes.
        //    AssertEx.SequenceIs(missingRequirements, "D");
        //    AssertEx.SequenceIs(availableApplications);
        //}

        //[TestMethod]
        //public void TestOnboardedOnly()
        //{
        //    var (status, missingRequirements, availableApplications) = ApprovalCalculations.CalculateIndividualVolunteerRoleApprovalStatus(
        //        new VolunteerRolePolicyVersion("v1", SupersededAtUtc: null, requirements),
        //        utcNow: new DateTime(2022, 1, 20),
        //        Helpers.Completed(("A", 1), ("B", 2), ("C", 3), ("D", 4), ("E", 5), ("F", 6)),
        //        Helpers.Exempted());

        //    Assert.AreEqual(RoleApprovalStatus.Onboarded, status);
        //    AssertEx.SequenceIs(missingRequirements);
        //    AssertEx.SequenceIs(availableApplications);
        //}

        //[TestMethod]
        //public void TestOnboardedOnlyByExemption()
        //{
        //    var (status, missingRequirements, availableApplications) = ApprovalCalculations.CalculateIndividualVolunteerRoleApprovalStatus(
        //        new VolunteerRolePolicyVersion("v1", SupersededAtUtc: null, requirements),
        //        utcNow: new DateTime(2022, 1, 20),
        //        Helpers.Completed(("A", 1), ("B", 2), ("C", 3), ("E", 5)),
        //        Helpers.Exempted(("D", null), ("F", 30)));

        //    Assert.AreEqual(RoleApprovalStatus.Onboarded, status);
        //    AssertEx.SequenceIs(missingRequirements);
        //    AssertEx.SequenceIs(availableApplications);
        //}

        //[TestMethod]
        //public void TestNotOnboardedBecauseExemptionExpired()
        //{
        //    var (status, missingRequirements, availableApplications) = ApprovalCalculations.CalculateIndividualVolunteerRoleApprovalStatus(
        //        new VolunteerRolePolicyVersion("v1", SupersededAtUtc: null, requirements),
        //        utcNow: new DateTime(2022, 1, 20),
        //        Helpers.Completed(("A", 1), ("B", 2), ("C", 3), ("E", 10)),
        //        Helpers.Exempted(("D", null), ("F", 10)));

        //    Assert.AreEqual(RoleApprovalStatus.Approved, status);
        //    AssertEx.SequenceIs(missingRequirements, "F");
        //    AssertEx.SequenceIs(availableApplications);
        //}

        //[TestMethod]
        //public void TestOnboardedWillBeSuperseded()
        //{
        //    var (status, missingRequirements, availableApplications) = ApprovalCalculations.CalculateIndividualVolunteerRoleApprovalStatus(
        //        new VolunteerRolePolicyVersion("v1", SupersededAtUtc: new DateTime(2022, 1, 10), requirements),
        //        utcNow: new DateTime(2022, 1, 5),
        //        Helpers.Completed(("A", 1), ("B", 2), ("C", 3), ("D", 4), ("E", 5), ("F", 6)),
        //        Helpers.Exempted());

        //    Assert.AreEqual(RoleApprovalStatus.Onboarded, status);
        //    AssertEx.SequenceIs(missingRequirements);
        //    AssertEx.SequenceIs(availableApplications);
        //}

        //[TestMethod]
        //public void TestOnboardedHasBeenSuperseded()
        //{
        //    var (status, missingRequirements, availableApplications) = ApprovalCalculations.CalculateIndividualVolunteerRoleApprovalStatus(
        //        new VolunteerRolePolicyVersion("v1", SupersededAtUtc: new DateTime(2022, 1, 10), requirements),
        //        utcNow: new DateTime(2022, 1, 20),
        //        Helpers.Completed(("A", 1), ("B", 2), ("C", 3), ("D", 4), ("E", 5), ("F", 6)),
        //        Helpers.Exempted());

        //    Assert.AreEqual(RoleApprovalStatus.Onboarded, status);
        //    AssertEx.SequenceIs(missingRequirements);
        //    AssertEx.SequenceIs(availableApplications);
        //}

        //[TestMethod]
        //public void TestOnboardedAfterSupersededDateWillBeSuperseded()
        //{
        //    var (status, missingRequirements, availableApplications) = ApprovalCalculations.CalculateIndividualVolunteerRoleApprovalStatus(
        //        new VolunteerRolePolicyVersion("v1", SupersededAtUtc: new DateTime(2022, 1, 10), requirements),
        //        utcNow: new DateTime(2022, 1, 5),
        //        Helpers.Completed(("A", 1), ("B", 2), ("C", 3), ("D", 4), ("E", 5), ("F", 16)),
        //        Helpers.Exempted());

        //    Assert.AreEqual(RoleApprovalStatus.Approved, status);
        //    // Requirements from superseded policies remain "available" for historical data entry purposes.
        //    AssertEx.SequenceIs(missingRequirements, "F");
        //    AssertEx.SequenceIs(availableApplications);
        //}

        //[TestMethod]
        //public void TestOnboardedAfterSupersededDateHasBeenSuperseded()
        //{
        //    var (status, missingRequirements, availableApplications) = ApprovalCalculations.CalculateIndividualVolunteerRoleApprovalStatus(
        //        new VolunteerRolePolicyVersion("v1", SupersededAtUtc: new DateTime(2022, 1, 10), requirements),
        //        utcNow: new DateTime(2022, 1, 20),
        //        Helpers.Completed(("A", 1), ("B", 2), ("C", 3), ("D", 4), ("E", 5), ("F", 16)),
        //        Helpers.Exempted());

        //    Assert.AreEqual(RoleApprovalStatus.Approved, status);
        //    // Requirements from superseded policies remain "available" for historical data entry purposes.
        //    AssertEx.SequenceIs(missingRequirements, "F");
        //    AssertEx.SequenceIs(availableApplications);
        //}
    }
}

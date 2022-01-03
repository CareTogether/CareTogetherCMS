using CareTogether.Engines;
using CareTogether.Resources;
using Microsoft.VisualStudio.TestTools.UnitTesting;
using System;
using System.Collections.Immutable;

namespace CareTogether.Core.Test.ApprovalCalculationTests
{
    [TestClass]
    public class CalculateFamilyVolunteerRoleApprovalStatus
    {
        private static Guid Id(char x) => Guid.Parse("xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx".Replace('x', x));
        static readonly Guid guid0 = Id('0');
        static readonly Guid guid1 = Id('1');
        static readonly Guid guid2 = Id('2');
        static readonly Guid guid3 = Id('3');
        static readonly Guid guid4 = Id('4');
        static readonly Guid guid5 = Id('5');
        static readonly Guid guid6 = Id('6');

        static ImmutableList<VolunteerFamilyApprovalRequirement> requirements =
            Helpers.FamilyApprovalRequirements(
                (RequirementStage.Application, "A", VolunteerFamilyRequirementScope.OncePerFamily),
                (RequirementStage.Approval, "B", VolunteerFamilyRequirementScope.OncePerFamily),
                (RequirementStage.Approval, "C", VolunteerFamilyRequirementScope.AllAdultsInTheFamily),
                (RequirementStage.Approval, "D", VolunteerFamilyRequirementScope.AllParticipatingAdultsInTheFamily),
                (RequirementStage.Onboarding, "E", VolunteerFamilyRequirementScope.OncePerFamily),
                (RequirementStage.Onboarding, "F", VolunteerFamilyRequirementScope.AllParticipatingAdultsInTheFamily));

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
            var (status, missingRequirements, availableApplications, missingIndividualRequirements) =
                ApprovalCalculations.CalculateFamilyVolunteerRoleApprovalStatus("Role",
                new VolunteerFamilyRolePolicyVersion("v1", SupersededAtUtc: null, requirements),
                utcNow: new DateTime(2022, 1, 20), family,
                Helpers.Completed(),
                Helpers.Exempted(),
                Helpers.CompletedIndividualRequirements(),
                Helpers.ExemptedIndividualRequirements(),
                Helpers.RemovedIndividualRoles((guid2, "Role")));

            Assert.AreEqual(null, status);
            AssertEx.SequenceIs(missingRequirements);
            AssertEx.SequenceIs(availableApplications, "A");
            AssertEx.DictionaryIs(missingIndividualRequirements);
        }

        [TestMethod]
        public void TestNotAppliedWillBeSuperseded()
        {
            var (status, missingRequirements, availableApplications, missingIndividualRequirements) =
                ApprovalCalculations.CalculateFamilyVolunteerRoleApprovalStatus("Role",
                new VolunteerFamilyRolePolicyVersion("v1", SupersededAtUtc: new DateTime(2022, 1, 10), requirements),
                utcNow: new DateTime(2022, 1, 5), family,
                Helpers.Completed(),
                Helpers.Exempted(),
                Helpers.CompletedIndividualRequirements(),
                Helpers.ExemptedIndividualRequirements(),
                Helpers.RemovedIndividualRoles((guid2, "Role")));

            Assert.AreEqual(null, status);
            AssertEx.SequenceIs(missingRequirements);
            AssertEx.SequenceIs(availableApplications, "A");
            AssertEx.DictionaryIs(missingIndividualRequirements);
        }

        [TestMethod]
        public void TestNotAppliedHasBeenSuperseded()
        {
            var (status, missingRequirements, availableApplications, missingIndividualRequirements) =
                ApprovalCalculations.CalculateFamilyVolunteerRoleApprovalStatus("Role",
                new VolunteerFamilyRolePolicyVersion("v1", SupersededAtUtc: new DateTime(2022, 1, 10), requirements),
                utcNow: new DateTime(2022, 1, 20), family,
                Helpers.Completed(),
                Helpers.Exempted(),
                Helpers.CompletedIndividualRequirements(),
                Helpers.ExemptedIndividualRequirements(),
                Helpers.RemovedIndividualRoles((guid2, "Role")));

            Assert.AreEqual(null, status);
            AssertEx.SequenceIs(missingRequirements);
            AssertEx.SequenceIs(availableApplications, "A");
            AssertEx.DictionaryIs(missingIndividualRequirements);
        }

        [TestMethod]
        public void TestAppliedOnly()
        {
            var (status, missingRequirements, availableApplications, missingIndividualRequirements) =
                ApprovalCalculations.CalculateFamilyVolunteerRoleApprovalStatus("Role",
                new VolunteerFamilyRolePolicyVersion("v1", SupersededAtUtc: null, requirements),
                utcNow: new DateTime(2022, 1, 20), family,
                Helpers.Completed(("A", 1)),
                Helpers.Exempted(),
                Helpers.CompletedIndividualRequirements(),
                Helpers.ExemptedIndividualRequirements(),
                Helpers.RemovedIndividualRoles((guid2, "Role")));

            Assert.AreEqual(RoleApprovalStatus.Prospective, status);
            AssertEx.SequenceIs(missingRequirements, "B");
            AssertEx.SequenceIs(availableApplications);
            AssertEx.DictionaryIs(missingIndividualRequirements,
                (guid1, new string[] { "C", "D" }),
                (guid2, new string[] { "C" }));
        }

        [TestMethod]
        public void TestAppliedOnlyWillBeSuperseded()
        {
            var (status, missingRequirements, availableApplications, missingIndividualRequirements) =
                ApprovalCalculations.CalculateFamilyVolunteerRoleApprovalStatus("Role",
                new VolunteerFamilyRolePolicyVersion("v1", SupersededAtUtc: new DateTime(2022, 1, 10), requirements),
                utcNow: new DateTime(2022, 1, 5), family,
                Helpers.Completed(("A", 1)),
                Helpers.Exempted(),
                Helpers.CompletedIndividualRequirements(),
                Helpers.ExemptedIndividualRequirements(),
                Helpers.RemovedIndividualRoles((guid2, "Role")));

            Assert.AreEqual(RoleApprovalStatus.Prospective, status);
            AssertEx.SequenceIs(missingRequirements, "B");
            AssertEx.SequenceIs(availableApplications);
            AssertEx.DictionaryIs(missingIndividualRequirements,
                (guid1, new string[] { "C", "D" }),
                (guid2, new string[] { "C" }));
        }

        [TestMethod]
        public void TestAppliedOnlyHasBeenSuperseded()
        {
            var (status, missingRequirements, availableApplications, missingIndividualRequirements) =
                ApprovalCalculations.CalculateFamilyVolunteerRoleApprovalStatus("Role",
                new VolunteerFamilyRolePolicyVersion("v1", SupersededAtUtc: new DateTime(2022, 1, 10), requirements),
                utcNow: new DateTime(2022, 1, 20), family,
                Helpers.Completed(("A", 1)),
                Helpers.Exempted(),
                Helpers.CompletedIndividualRequirements(),
                Helpers.ExemptedIndividualRequirements(),
                Helpers.RemovedIndividualRoles((guid2, "Role")));

            Assert.AreEqual(RoleApprovalStatus.Prospective, status);
            AssertEx.SequenceIs(missingRequirements, "B");
            AssertEx.SequenceIs(availableApplications);
            AssertEx.DictionaryIs(missingIndividualRequirements,
                (guid1, new string[] { "C", "D" }),
                (guid2, new string[] { "C" }));
        }

        [TestMethod]
        public void TestAppliedOnlyAfterSupersededDateWillBeSuperseded()
        {
            var (status, missingRequirements, availableApplications, missingIndividualRequirements) =
                ApprovalCalculations.CalculateFamilyVolunteerRoleApprovalStatus("Role",
                new VolunteerFamilyRolePolicyVersion("v1", SupersededAtUtc: new DateTime(2022, 1, 10), requirements),
                utcNow: new DateTime(2022, 1, 5), family,
                Helpers.Completed(("A", 15)),
                Helpers.Exempted(),
                Helpers.CompletedIndividualRequirements(),
                Helpers.ExemptedIndividualRequirements(),
                Helpers.RemovedIndividualRoles((guid2, "Role")));

            Assert.AreEqual(null, status);
            AssertEx.SequenceIs(missingRequirements);
            // Completing an application after the superseded date is not considered a valid completion for this policy version.
            // The superseded policy's requirements remain "available" for historical data entry purposes.
            AssertEx.SequenceIs(availableApplications, "A");
            AssertEx.DictionaryIs(missingIndividualRequirements);
        }

        [TestMethod]
        public void TestAppliedOnlyAfterSupersededDateHasBeenSuperseded()
        {
            var (status, missingRequirements, availableApplications, missingIndividualRequirements) =
                ApprovalCalculations.CalculateFamilyVolunteerRoleApprovalStatus("Role",
                new VolunteerFamilyRolePolicyVersion("v1", SupersededAtUtc: new DateTime(2022, 1, 10), requirements),
                utcNow: new DateTime(2022, 1, 20), family,
                Helpers.Completed(("A", 15)),
                Helpers.Exempted(),
                Helpers.CompletedIndividualRequirements(),
                Helpers.ExemptedIndividualRequirements(),
                Helpers.RemovedIndividualRoles((guid2, "Role")));

            Assert.AreEqual(null, status);
            AssertEx.SequenceIs(missingRequirements);
            // Completing an application after the superseded date is not considered a valid completion for this policy version.
            // The superseded policy's requirements remain "available" for historical data entry purposes.
            AssertEx.SequenceIs(availableApplications, "A");
            AssertEx.DictionaryIs(missingIndividualRequirements);
        }

        [TestMethod]
        public void TestPartiallyApprovedOnly()
        {
            var (status, missingRequirements, availableApplications, missingIndividualRequirements) =
                ApprovalCalculations.CalculateFamilyVolunteerRoleApprovalStatus("Role",
                new VolunteerFamilyRolePolicyVersion("v1", SupersededAtUtc: null, requirements),
                utcNow: new DateTime(2022, 1, 20), family,
                Helpers.Completed(("A", 1), ("B", 2)),
                Helpers.Exempted(),
                Helpers.CompletedIndividualRequirements((guid1, "C", 3), (guid2, "C", 3)),
                Helpers.ExemptedIndividualRequirements(),
                Helpers.RemovedIndividualRoles((guid2, "Role")));

            Assert.AreEqual(RoleApprovalStatus.Prospective, status);
            AssertEx.SequenceIs(missingRequirements);
            AssertEx.SequenceIs(availableApplications);
            AssertEx.DictionaryIs(missingIndividualRequirements,
                (guid1, new string[] { "D" }));
        }

        [TestMethod]
        public void TestPartiallyApprovedWillBeSuperseded()
        {
            var (status, missingRequirements, availableApplications, missingIndividualRequirements) =
                ApprovalCalculations.CalculateFamilyVolunteerRoleApprovalStatus("Role",
                new VolunteerFamilyRolePolicyVersion("v1", SupersededAtUtc: new DateTime(2022, 1, 10), requirements),
                utcNow: new DateTime(2022, 1, 5), family,
                Helpers.Completed(("A", 1), ("B", 2)),
                Helpers.Exempted(),
                Helpers.CompletedIndividualRequirements((guid1, "C", 3), (guid2, "C", 3)),
                Helpers.ExemptedIndividualRequirements(),
                Helpers.RemovedIndividualRoles((guid2, "Role")));

            Assert.AreEqual(RoleApprovalStatus.Prospective, status);
            AssertEx.SequenceIs(missingRequirements);
            AssertEx.SequenceIs(availableApplications);
            AssertEx.DictionaryIs(missingIndividualRequirements,
                (guid1, new string[] { "D" }));
        }

        [TestMethod]
        public void TestPartiallyApprovedHasBeenSuperseded()
        {
            var (status, missingRequirements, availableApplications, missingIndividualRequirements) =
                ApprovalCalculations.CalculateFamilyVolunteerRoleApprovalStatus("Role",
                new VolunteerFamilyRolePolicyVersion("v1", SupersededAtUtc: new DateTime(2022, 1, 10), requirements),
                utcNow: new DateTime(2022, 1, 20), family,
                Helpers.Completed(("A", 1), ("B", 2)),
                Helpers.Exempted(),
                Helpers.CompletedIndividualRequirements((guid1, "C", 3), (guid2, "C", 3)),
                Helpers.ExemptedIndividualRequirements(),
                Helpers.RemovedIndividualRoles((guid2, "Role")));

            Assert.AreEqual(RoleApprovalStatus.Prospective, status);
            AssertEx.SequenceIs(missingRequirements);
            AssertEx.SequenceIs(availableApplications);
            AssertEx.DictionaryIs(missingIndividualRequirements,
                (guid1, new string[] { "D" }));
        }

        [TestMethod]
        public void TestPartiallyApprovedAfterSupersededDateWillBeSuperseded()
        {
            var (status, missingRequirements, availableApplications, missingIndividualRequirements) =
                ApprovalCalculations.CalculateFamilyVolunteerRoleApprovalStatus("Role",
                new VolunteerFamilyRolePolicyVersion("v1", SupersededAtUtc: new DateTime(2022, 1, 10), requirements),
                utcNow: new DateTime(2022, 1, 5), family,
                Helpers.Completed(("A", 1), ("B", 12)),
                Helpers.Exempted(),
                Helpers.CompletedIndividualRequirements((guid1, "C", 3), (guid2, "C", 13)),
                Helpers.ExemptedIndividualRequirements(),
                Helpers.RemovedIndividualRoles((guid2, "Role")));

            Assert.AreEqual(RoleApprovalStatus.Prospective, status);
            // Requirements from superseded policies remain "available" for historical data entry purposes.
            AssertEx.SequenceIs(missingRequirements, "B");
            AssertEx.SequenceIs(availableApplications);
            AssertEx.DictionaryIs(missingIndividualRequirements,
                (guid1, new string[] { "D" }),
                (guid2, new string[] { "C" }));
        }

        [TestMethod]
        public void TestPartiallyApprovedAfterSupersededDateHasBeenSuperseded()
        {
            var (status, missingRequirements, availableApplications, missingIndividualRequirements) =
                ApprovalCalculations.CalculateFamilyVolunteerRoleApprovalStatus("Role",
                new VolunteerFamilyRolePolicyVersion("v1", SupersededAtUtc: new DateTime(2022, 1, 10), requirements),
                utcNow: new DateTime(2022, 1, 20), family,
                Helpers.Completed(("A", 1), ("B", 12)),
                Helpers.Exempted(),
                Helpers.CompletedIndividualRequirements((guid1, "C", 3), (guid2, "C", 13)),
                Helpers.ExemptedIndividualRequirements(),
                Helpers.RemovedIndividualRoles((guid2, "Role")));

            Assert.AreEqual(RoleApprovalStatus.Prospective, status);
            // Requirements from superseded policies remain "available" for historical data entry purposes.
            AssertEx.SequenceIs(missingRequirements, "B");
            AssertEx.SequenceIs(availableApplications);
            AssertEx.DictionaryIs(missingIndividualRequirements,
                (guid1, new string[] { "D" }),
                (guid2, new string[] { "C" }));
        }

        [TestMethod]
        public void TestApprovedOnly()
        {
            var (status, missingRequirements, availableApplications, missingIndividualRequirements) =
                ApprovalCalculations.CalculateFamilyVolunteerRoleApprovalStatus("Role",
                new VolunteerFamilyRolePolicyVersion("v1", SupersededAtUtc: null, requirements),
                utcNow: new DateTime(2022, 1, 20), family,
                Helpers.Completed(("A", 1), ("B", 2)),
                Helpers.Exempted(),
                Helpers.CompletedIndividualRequirements((guid1, "C", 3), (guid1, "D", 4), (guid2, "C", 3)),
                Helpers.ExemptedIndividualRequirements(),
                Helpers.RemovedIndividualRoles((guid2, "Role")));

            Assert.AreEqual(RoleApprovalStatus.Approved, status);
            AssertEx.SequenceIs(missingRequirements, "E");
            AssertEx.SequenceIs(availableApplications);
            AssertEx.DictionaryIs(missingIndividualRequirements,
                (guid1, new string[] { "F" }));
        }

        [TestMethod]
        public void TestNotApprovedOnlyWithoutRemovedRole()
        {
            var (status, missingRequirements, availableApplications, missingIndividualRequirements) =
                ApprovalCalculations.CalculateFamilyVolunteerRoleApprovalStatus("Role",
                new VolunteerFamilyRolePolicyVersion("v1", SupersededAtUtc: null, requirements),
                utcNow: new DateTime(2022, 1, 20), family,
                Helpers.Completed(("A", 1), ("B", 2)),
                Helpers.Exempted(),
                Helpers.CompletedIndividualRequirements((guid1, "C", 3), (guid1, "D", 4), (guid2, "C", 3)),
                Helpers.ExemptedIndividualRequirements(),
                Helpers.RemovedIndividualRoles());

            Assert.AreEqual(RoleApprovalStatus.Prospective, status);
            AssertEx.SequenceIs(missingRequirements);
            AssertEx.SequenceIs(availableApplications);
            AssertEx.DictionaryIs(missingIndividualRequirements,
                (guid2, new string[] { "D" }));
        }

        [TestMethod]
        public void TestApprovedOnlyWithoutRemovedRole()
        {
            var (status, missingRequirements, availableApplications, missingIndividualRequirements) =
                ApprovalCalculations.CalculateFamilyVolunteerRoleApprovalStatus("Role",
                new VolunteerFamilyRolePolicyVersion("v1", SupersededAtUtc: null, requirements),
                utcNow: new DateTime(2022, 1, 20), family,
                Helpers.Completed(("A", 1), ("B", 2)),
                Helpers.Exempted(),
                Helpers.CompletedIndividualRequirements((guid1, "C", 3), (guid1, "D", 4), (guid2, "C", 3), (guid2, "D", 3)),
                Helpers.ExemptedIndividualRequirements(),
                Helpers.RemovedIndividualRoles());

            Assert.AreEqual(RoleApprovalStatus.Approved, status);
            AssertEx.SequenceIs(missingRequirements, "E");
            AssertEx.SequenceIs(availableApplications);
            AssertEx.DictionaryIs(missingIndividualRequirements,
                (guid1, new string[] { "F" }),
                (guid2, new string[] { "F" }));
        }

        [TestMethod]
        public void TestApprovedOnlyByExemption()
        {
            var (status, missingRequirements, availableApplications, missingIndividualRequirements) =
                ApprovalCalculations.CalculateFamilyVolunteerRoleApprovalStatus("Role",
                new VolunteerFamilyRolePolicyVersion("v1", SupersededAtUtc: null, requirements),
                utcNow: new DateTime(2022, 1, 20), family,
                Helpers.Completed(("A", 1)),
                Helpers.Exempted(("B", 30)),
                Helpers.CompletedIndividualRequirements((guid1, "C", 3), (guid1, "D", 4)),
                Helpers.ExemptedIndividualRequirements((guid2, "C", 30)),
                Helpers.RemovedIndividualRoles((guid2, "Role")));

            Assert.AreEqual(RoleApprovalStatus.Approved, status);
            AssertEx.SequenceIs(missingRequirements, "E");
            AssertEx.SequenceIs(availableApplications);
            AssertEx.DictionaryIs(missingIndividualRequirements,
                (guid1, new string[] { "F" }));
        }

        [TestMethod]
        public void TestNotApprovedBecauseExemptionExpired()
        {
            var (status, missingRequirements, availableApplications, missingIndividualRequirements) =
                ApprovalCalculations.CalculateFamilyVolunteerRoleApprovalStatus("Role",
                new VolunteerFamilyRolePolicyVersion("v1", SupersededAtUtc: null, requirements),
                utcNow: new DateTime(2022, 1, 20), family,
                Helpers.Completed(("A", 1)),
                Helpers.Exempted(("B", 15)),
                Helpers.CompletedIndividualRequirements((guid1, "C", 3), (guid1, "D", 4)),
                Helpers.ExemptedIndividualRequirements((guid2, "C", 30)),
                Helpers.RemovedIndividualRoles((guid2, "Role")));

            Assert.AreEqual(RoleApprovalStatus.Prospective, status);
            AssertEx.SequenceIs(missingRequirements, "B");
            AssertEx.SequenceIs(availableApplications);
            AssertEx.DictionaryIs(missingIndividualRequirements);
        }

        [TestMethod]
        public void TestNotApprovedBecauseIndividualExemptionExpired()
        {
            var (status, missingRequirements, availableApplications, missingIndividualRequirements) =
                ApprovalCalculations.CalculateFamilyVolunteerRoleApprovalStatus("Role",
                new VolunteerFamilyRolePolicyVersion("v1", SupersededAtUtc: null, requirements),
                utcNow: new DateTime(2022, 1, 20), family,
                Helpers.Completed(("A", 1)),
                Helpers.Exempted(("B", 30)),
                Helpers.CompletedIndividualRequirements((guid1, "C", 3), (guid1, "D", 4)),
                Helpers.ExemptedIndividualRequirements((guid2, "C", 15)),
                Helpers.RemovedIndividualRoles((guid2, "Role")));

            Assert.AreEqual(RoleApprovalStatus.Prospective, status);
            AssertEx.SequenceIs(missingRequirements);
            AssertEx.SequenceIs(availableApplications);
            AssertEx.DictionaryIs(missingIndividualRequirements,
                (guid2, new string[] { "C" }));
        }

        [TestMethod]
        public void TestApprovedWillBeSuperseded()
        {
            var (status, missingRequirements, availableApplications, missingIndividualRequirements) =
                ApprovalCalculations.CalculateFamilyVolunteerRoleApprovalStatus("Role",
                new VolunteerFamilyRolePolicyVersion("v1", SupersededAtUtc: new DateTime(2022, 1, 10), requirements),
                utcNow: new DateTime(2022, 1, 5), family,
                Helpers.Completed(("A", 1), ("B", 2)),
                Helpers.Exempted(),
                Helpers.CompletedIndividualRequirements((guid1, "C", 3), (guid1, "D", 4), (guid2, "C", 3)),
                Helpers.ExemptedIndividualRequirements(),
                Helpers.RemovedIndividualRoles((guid2, "Role")));

            Assert.AreEqual(RoleApprovalStatus.Approved, status);
            AssertEx.SequenceIs(missingRequirements, "E");
            AssertEx.SequenceIs(availableApplications);
            AssertEx.DictionaryIs(missingIndividualRequirements,
                (guid1, new string[] { "F" }));
        }

        [TestMethod]
        public void TestApprovedHasBeenSuperseded()
        {
            var (status, missingRequirements, availableApplications, missingIndividualRequirements) =
                ApprovalCalculations.CalculateFamilyVolunteerRoleApprovalStatus("Role",
                new VolunteerFamilyRolePolicyVersion("v1", SupersededAtUtc: new DateTime(2022, 1, 10), requirements),
                utcNow: new DateTime(2022, 1, 20), family,
                Helpers.Completed(("A", 1), ("B", 2)),
                Helpers.Exempted(),
                Helpers.CompletedIndividualRequirements((guid1, "C", 3), (guid1, "D", 4), (guid2, "C", 3)),
                Helpers.ExemptedIndividualRequirements(),
                Helpers.RemovedIndividualRoles((guid2, "Role")));

            Assert.AreEqual(RoleApprovalStatus.Approved, status);
            AssertEx.SequenceIs(missingRequirements, "E");
            AssertEx.SequenceIs(availableApplications);
            AssertEx.DictionaryIs(missingIndividualRequirements,
                (guid1, new string[] { "F" }));
        }

        [TestMethod]
        public void TestApprovedAfterSupersededDateWillBeSuperseded()
        {
            var (status, missingRequirements, availableApplications, missingIndividualRequirements) =
                ApprovalCalculations.CalculateFamilyVolunteerRoleApprovalStatus("Role",
                new VolunteerFamilyRolePolicyVersion("v1", SupersededAtUtc: new DateTime(2022, 1, 10), requirements),
                utcNow: new DateTime(2022, 1, 5), family,
                Helpers.Completed(("A", 1), ("B", 12)),
                Helpers.Exempted(),
                Helpers.CompletedIndividualRequirements((guid1, "C", 3), (guid1, "D", 4), (guid2, "C", 3)),
                Helpers.ExemptedIndividualRequirements(),
                Helpers.RemovedIndividualRoles((guid2, "Role")));

            Assert.AreEqual(RoleApprovalStatus.Prospective, status);
            // Requirements from superseded policies remain "available" for historical data entry purposes.
            AssertEx.SequenceIs(missingRequirements, "B");
            AssertEx.SequenceIs(availableApplications);
            AssertEx.DictionaryIs(missingIndividualRequirements);
        }

        [TestMethod]
        public void TestApprovedIndividualAfterSupersededDateWillBeSuperseded()
        {
            var (status, missingRequirements, availableApplications, missingIndividualRequirements) =
                ApprovalCalculations.CalculateFamilyVolunteerRoleApprovalStatus("Role",
                new VolunteerFamilyRolePolicyVersion("v1", SupersededAtUtc: new DateTime(2022, 1, 10), requirements),
                utcNow: new DateTime(2022, 1, 5), family,
                Helpers.Completed(("A", 1), ("B", 2)),
                Helpers.Exempted(),
                Helpers.CompletedIndividualRequirements((guid1, "C", 3), (guid1, "D", 14), (guid2, "C", 3)),
                Helpers.ExemptedIndividualRequirements(),
                Helpers.RemovedIndividualRoles((guid2, "Role")));

            Assert.AreEqual(RoleApprovalStatus.Prospective, status);
            // Requirements from superseded policies remain "available" for historical data entry purposes.
            AssertEx.SequenceIs(missingRequirements);
            AssertEx.SequenceIs(availableApplications);
            AssertEx.DictionaryIs(missingIndividualRequirements,
                (guid1, new string[] { "D" }));
        }

        [TestMethod]
        public void TestApprovedAfterSupersededDateHasBeenSuperseded()
        {
            var (status, missingRequirements, availableApplications, missingIndividualRequirements) =
                ApprovalCalculations.CalculateFamilyVolunteerRoleApprovalStatus("Role",
                new VolunteerFamilyRolePolicyVersion("v1", SupersededAtUtc: new DateTime(2022, 1, 10), requirements),
                utcNow: new DateTime(2022, 1, 20), family,
                Helpers.Completed(("A", 1), ("B", 12)),
                Helpers.Exempted(),
                Helpers.CompletedIndividualRequirements((guid1, "C", 3), (guid1, "D", 4), (guid2, "C", 3)),
                Helpers.ExemptedIndividualRequirements(),
                Helpers.RemovedIndividualRoles((guid2, "Role")));

            Assert.AreEqual(RoleApprovalStatus.Prospective, status);
            // Requirements from superseded policies remain "available" for historical data entry purposes.
            AssertEx.SequenceIs(missingRequirements, "B");
            AssertEx.SequenceIs(availableApplications);
        }

        [TestMethod]
        public void TestOnboardedOnly()
        {
            var (status, missingRequirements, availableApplications, missingIndividualRequirements) =
                ApprovalCalculations.CalculateFamilyVolunteerRoleApprovalStatus("Role",
                new VolunteerFamilyRolePolicyVersion("v1", SupersededAtUtc: null, requirements),
                utcNow: new DateTime(2022, 1, 20), family,
                Helpers.Completed(("A", 1), ("B", 2), ("E", 4)),
                Helpers.Exempted(),
                Helpers.CompletedIndividualRequirements((guid1, "C", 3), (guid1, "D", 4), (guid2, "C", 3), (guid1, "F", 4)),
                Helpers.ExemptedIndividualRequirements(),
                Helpers.RemovedIndividualRoles((guid2, "Role")));

            Assert.AreEqual(RoleApprovalStatus.Onboarded, status);
            AssertEx.SequenceIs(missingRequirements);
            AssertEx.SequenceIs(availableApplications);
            AssertEx.DictionaryIs(missingIndividualRequirements);
        }

        [TestMethod]
        public void TestOnboardedOnlyByExemption()
        {
            var (status, missingRequirements, availableApplications, missingIndividualRequirements) =
                ApprovalCalculations.CalculateFamilyVolunteerRoleApprovalStatus("Role",
                new VolunteerFamilyRolePolicyVersion("v1", SupersededAtUtc: null, requirements),
                utcNow: new DateTime(2022, 1, 20), family,
                Helpers.Completed(("A", 1), ("B", 2)),
                Helpers.Exempted(("E", null)),
                Helpers.CompletedIndividualRequirements((guid1, "C", 3), (guid1, "D", 4), (guid2, "C", 3)),
                Helpers.ExemptedIndividualRequirements((guid1, "F", 30)),
                Helpers.RemovedIndividualRoles((guid2, "Role")));

            Assert.AreEqual(RoleApprovalStatus.Onboarded, status);
            AssertEx.SequenceIs(missingRequirements);
            AssertEx.SequenceIs(availableApplications);
            AssertEx.DictionaryIs(missingIndividualRequirements);
        }

        [TestMethod]
        public void TestNotOnboardedBecauseExemptionExpired()
        {
            var (status, missingRequirements, availableApplications, missingIndividualRequirements) =
                ApprovalCalculations.CalculateFamilyVolunteerRoleApprovalStatus("Role",
                new VolunteerFamilyRolePolicyVersion("v1", SupersededAtUtc: null, requirements),
                utcNow: new DateTime(2022, 1, 20), family,
                Helpers.Completed(("A", 1), ("B", 2)),
                Helpers.Exempted(("E", null)),
                Helpers.CompletedIndividualRequirements((guid1, "C", 3), (guid1, "D", 4), (guid2, "C", 3)),
                Helpers.ExemptedIndividualRequirements((guid1, "F", 10)),
                Helpers.RemovedIndividualRoles((guid2, "Role")));

            Assert.AreEqual(RoleApprovalStatus.Approved, status);
            AssertEx.SequenceIs(missingRequirements);
            AssertEx.SequenceIs(availableApplications);
            AssertEx.DictionaryIs(missingIndividualRequirements,
                (guid1, new string[] { "F" }));
        }

        [TestMethod]
        public void TestOnboardedWillBeSuperseded()
        {
            var (status, missingRequirements, availableApplications, missingIndividualRequirements) =
                ApprovalCalculations.CalculateFamilyVolunteerRoleApprovalStatus("Role",
                new VolunteerFamilyRolePolicyVersion("v1", SupersededAtUtc: new DateTime(2022, 1, 10), requirements),
                utcNow: new DateTime(2022, 1, 5), family,
                Helpers.Completed(("A", 1), ("B", 2), ("E", 4)),
                Helpers.Exempted(),
                Helpers.CompletedIndividualRequirements((guid1, "C", 3), (guid1, "D", 4), (guid2, "C", 3), (guid1, "F", 4)),
                Helpers.ExemptedIndividualRequirements(),
                Helpers.RemovedIndividualRoles((guid2, "Role")));

            Assert.AreEqual(RoleApprovalStatus.Onboarded, status);
            AssertEx.SequenceIs(missingRequirements);
            AssertEx.SequenceIs(availableApplications);
            AssertEx.DictionaryIs(missingIndividualRequirements);
        }

        [TestMethod]
        public void TestOnboardedHasBeenSuperseded()
        {
            var (status, missingRequirements, availableApplications, missingIndividualRequirements) =
                ApprovalCalculations.CalculateFamilyVolunteerRoleApprovalStatus("Role",
                new VolunteerFamilyRolePolicyVersion("v1", SupersededAtUtc: new DateTime(2022, 1, 10), requirements),
                utcNow: new DateTime(2022, 1, 20), family,
                Helpers.Completed(("A", 1), ("B", 2), ("E", 4)),
                Helpers.Exempted(),
                Helpers.CompletedIndividualRequirements((guid1, "C", 3), (guid1, "D", 4), (guid2, "C", 3), (guid1, "F", 4)),
                Helpers.ExemptedIndividualRequirements(),
                Helpers.RemovedIndividualRoles((guid2, "Role")));

            Assert.AreEqual(RoleApprovalStatus.Onboarded, status);
            AssertEx.SequenceIs(missingRequirements);
            AssertEx.SequenceIs(availableApplications);
            AssertEx.DictionaryIs(missingIndividualRequirements);
        }

        [TestMethod]
        public void TestOnboardedAfterSupersededDateWillBeSuperseded()
        {
            var (status, missingRequirements, availableApplications, missingIndividualRequirements) =
                ApprovalCalculations.CalculateFamilyVolunteerRoleApprovalStatus("Role",
                new VolunteerFamilyRolePolicyVersion("v1", SupersededAtUtc: new DateTime(2022, 1, 10), requirements),
                utcNow: new DateTime(2022, 1, 5), family,
                Helpers.Completed(("A", 1), ("B", 2), ("E", 14)),
                Helpers.Exempted(),
                Helpers.CompletedIndividualRequirements((guid1, "C", 3), (guid1, "D", 4), (guid2, "C", 3), (guid1, "F", 4)),
                Helpers.ExemptedIndividualRequirements(),
                Helpers.RemovedIndividualRoles((guid2, "Role")));

            Assert.AreEqual(RoleApprovalStatus.Approved, status);
            // Requirements from superseded policies remain "available" for historical data entry purposes.
            AssertEx.SequenceIs(missingRequirements, "E");
            AssertEx.SequenceIs(availableApplications);
            AssertEx.DictionaryIs(missingIndividualRequirements);
        }

        [TestMethod]
        public void TestOnboardedAfterSupersededDateHasBeenSuperseded()
        {
            var (status, missingRequirements, availableApplications, missingIndividualRequirements) =
                ApprovalCalculations.CalculateFamilyVolunteerRoleApprovalStatus("Role",
                new VolunteerFamilyRolePolicyVersion("v1", SupersededAtUtc: new DateTime(2022, 1, 10), requirements),
                utcNow: new DateTime(2022, 1, 20), family,
                Helpers.Completed(("A", 1), ("B", 2), ("E", 14)),
                Helpers.Exempted(),
                Helpers.CompletedIndividualRequirements((guid1, "C", 3), (guid1, "D", 4), (guid2, "C", 3), (guid1, "F", 4)),
                Helpers.ExemptedIndividualRequirements(),
                Helpers.RemovedIndividualRoles((guid2, "Role")));

            Assert.AreEqual(RoleApprovalStatus.Approved, status);
            // Requirements from superseded policies remain "available" for historical data entry purposes.
            AssertEx.SequenceIs(missingRequirements, "E");
            AssertEx.SequenceIs(availableApplications);
            AssertEx.DictionaryIs(missingIndividualRequirements);
        }
    }
}

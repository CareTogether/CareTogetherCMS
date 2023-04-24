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
    public class CalculateCombinedFamilyRoleStatusForFamily
    {
        private static Guid Id(char x) => Guid.Parse("xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx".Replace('x', x));
        static readonly Guid guid0 = Id('0');
        static readonly Guid guid1 = Id('1');
        static readonly Guid guid2 = Id('2');
        static readonly Guid guid3 = Id('3');
        static readonly Guid guid4 = Id('4');
        static readonly Guid guid5 = Id('5');
        static readonly Guid guid6 = Id('6');

        static ImmutableDictionary<string, VolunteerFamilyRolePolicy> volunteerFamilyRoles =
            ImmutableDictionary<string, VolunteerFamilyRolePolicy>.Empty
            .Add("Host", new VolunteerFamilyRolePolicy("Host", ImmutableList<VolunteerFamilyRolePolicyVersion>.Empty
                .Add(new VolunteerFamilyRolePolicyVersion("v1", SupersededAtUtc: new DateTime(2022, 1, 20),
                    Helpers.FamilyApprovalRequirements(
                        (RequirementStage.Application, "A", VolunteerFamilyRequirementScope.OncePerFamily),
                        (RequirementStage.Approval, "B", VolunteerFamilyRequirementScope.OncePerFamily),
                        (RequirementStage.Approval, "C", VolunteerFamilyRequirementScope.AllParticipatingAdultsInTheFamily),
                        (RequirementStage.Approval, "D", VolunteerFamilyRequirementScope.AllAdultsInTheFamily),
                        (RequirementStage.Onboarding, "E", VolunteerFamilyRequirementScope.AllParticipatingAdultsInTheFamily),
                        (RequirementStage.Onboarding, "F", VolunteerFamilyRequirementScope.OncePerFamily))))
                .Add(new VolunteerFamilyRolePolicyVersion("v2", SupersededAtUtc: null,
                    Helpers.FamilyApprovalRequirements(
                        (RequirementStage.Application, "A", VolunteerFamilyRequirementScope.OncePerFamily),
                        (RequirementStage.Approval, "B", VolunteerFamilyRequirementScope.OncePerFamily),
                        (RequirementStage.Approval, "C", VolunteerFamilyRequirementScope.AllParticipatingAdultsInTheFamily),
                        (RequirementStage.Approval, "Dv2", VolunteerFamilyRequirementScope.AllAdultsInTheFamily),
                        (RequirementStage.Onboarding, "E", VolunteerFamilyRequirementScope.AllParticipatingAdultsInTheFamily),
                        (RequirementStage.Onboarding, "F", VolunteerFamilyRequirementScope.OncePerFamily))))))
            .Add("Coach", new VolunteerFamilyRolePolicy("Coach", ImmutableList<VolunteerFamilyRolePolicyVersion>.Empty
                .Add(new VolunteerFamilyRolePolicyVersion("v1", SupersededAtUtc: null,
                    Helpers.FamilyApprovalRequirements(
                        (RequirementStage.Application, "Acoach", VolunteerFamilyRequirementScope.OncePerFamily),
                        (RequirementStage.Approval, "B", VolunteerFamilyRequirementScope.OncePerFamily),
                        (RequirementStage.Approval, "Ccoach", VolunteerFamilyRequirementScope.AllParticipatingAdultsInTheFamily),
                        (RequirementStage.Approval, "Dv2", VolunteerFamilyRequirementScope.AllAdultsInTheFamily),
                        (RequirementStage.Onboarding, "E", VolunteerFamilyRequirementScope.AllParticipatingAdultsInTheFamily),
                        (RequirementStage.Onboarding, "Fcoach", VolunteerFamilyRequirementScope.OncePerFamily))))))
            .Add("OldRole", new VolunteerFamilyRolePolicy("OldRole", ImmutableList<VolunteerFamilyRolePolicyVersion>.Empty
                .Add(new VolunteerFamilyRolePolicyVersion("vSuperseded", SupersededAtUtc: new DateTime(2022, 1, 20),
                    Helpers.FamilyApprovalRequirements(
                        (RequirementStage.Application, "Aold", VolunteerFamilyRequirementScope.OncePerFamily),
                        (RequirementStage.Approval, "B", VolunteerFamilyRequirementScope.OncePerFamily),
                        (RequirementStage.Onboarding, "E", VolunteerFamilyRequirementScope.AllParticipatingAdultsInTheFamily))))));
        
        static VolunteerPolicy volunteerPolicy = new VolunteerPolicy(
            ImmutableDictionary<string, VolunteerRolePolicy>.Empty, volunteerFamilyRoles);

        static Person adult1 = new Person(guid1, true, "Bob", "Smith", Gender.Male, new ExactAge(new DateTime(2000, 1, 1)), "",
            ImmutableList<Address>.Empty, null, ImmutableList<PhoneNumber>.Empty, null, ImmutableList<EmailAddress>.Empty, null, null, null);
        static Person adult2 = new Person(guid2, true, "Jane", "Smith", Gender.Female, new ExactAge(new DateTime(2000, 1, 1)), "",
            ImmutableList<Address>.Empty, null, ImmutableList<PhoneNumber>.Empty, null, ImmutableList<EmailAddress>.Empty, null, null, null);
        static Person inactiveAdult3 = new Person(guid3, false, "BobDUPLICATE", "Smith", Gender.Male, new ExactAge(new DateTime(2000, 1, 1)), "",
            ImmutableList<Address>.Empty, null, ImmutableList<PhoneNumber>.Empty, null, ImmutableList<EmailAddress>.Empty, null, null, null);
        static Person brotherNotInHousehold4 = new Person(guid2, true, "Eric", "Smith", Gender.Male, new ExactAge(new DateTime(2000, 1, 1)), "",
            ImmutableList<Address>.Empty, null, ImmutableList<PhoneNumber>.Empty, null, ImmutableList<EmailAddress>.Empty, null, null, null);
        static Person child5 = new Person(guid5, true, "Wanda", "Smith", Gender.Female, new ExactAge(new DateTime(2022, 1, 1)), "",
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
            ImmutableList<UploadedDocumentInfo>.Empty, ImmutableList<Guid>.Empty,
            ImmutableList<CompletedCustomFieldInfo>.Empty, ImmutableList<Activity>.Empty);


        [TestMethod]
        public void TestNotApplied()
        {
            var result = ApprovalCalculations.CalculateCombinedFamilyRoleStatusForFamily(
                volunteerPolicy, family, utcNow: new DateTime(2022, 1, 20),
                Helpers.Completed(),
                Helpers.Exempted(),
                Helpers.Removed(),
                Helpers.CompletedIndividualRequirements(),
                Helpers.ExemptedIndividualRequirements(),
                Helpers.RemovedIndividualRoles());

            AssertEx.DictionaryIs(result.FamilyRoleVersionApprovals);
            AssertEx.SequenceIs(result.AvailableFamilyApplications, "A", "Acoach", "Aold");
            AssertEx.SequenceIs(result.RemovedFamilyRoles);
            AssertEx.SequenceIs(result.MissingFamilyRequirements);
            AssertEx.DictionaryIs(result.MissingIndividualRequirementsForFamilyRoles);
        }

        [TestMethod]
        public void TestAppliedOnly()
        {
            var result = ApprovalCalculations.CalculateCombinedFamilyRoleStatusForFamily(
                volunteerPolicy, family, utcNow: new DateTime(2022, 1, 20),
                Helpers.Completed(("A", 1)),
                Helpers.Exempted(),
                Helpers.Removed(),
                Helpers.CompletedIndividualRequirements(),
                Helpers.ExemptedIndividualRequirements(),
                Helpers.RemovedIndividualRoles((guid2, "Host")));

            AssertEx.DictionaryIs(result.FamilyRoleVersionApprovals,
                ("Host", new RoleVersionApproval[] {
                    new ("v1", RoleApprovalStatus.Prospective, null),
                    new ("v2", RoleApprovalStatus.Prospective, null) }));
            AssertEx.SequenceIs(result.AvailableFamilyApplications, "Acoach", "Aold");
            AssertEx.SequenceIs(result.RemovedFamilyRoles);
            AssertEx.SequenceIs(result.MissingFamilyRequirements, "B");
            AssertEx.DictionaryIs(result.MissingIndividualRequirementsForFamilyRoles,
                (guid1, new [] { "C", "D", "Dv2" }),
                (guid2, new [] { "D", "Dv2" } ));
        }

        [TestMethod]
        public void TestAppliedToMultipleRoles()
        {
            var result = ApprovalCalculations.CalculateCombinedFamilyRoleStatusForFamily(
                volunteerPolicy, family, utcNow: new DateTime(2022, 1, 20),
                Helpers.Completed(("A", 1), ("Acoach", 1)),
                Helpers.Exempted(),
                Helpers.Removed(),
                Helpers.CompletedIndividualRequirements(),
                Helpers.ExemptedIndividualRequirements(),
                Helpers.RemovedIndividualRoles((guid2, "Host")));

            AssertEx.DictionaryIs(result.FamilyRoleVersionApprovals,
                ("Host", new RoleVersionApproval[] {
                    new ("v1", RoleApprovalStatus.Prospective, null),
                    new ("v2", RoleApprovalStatus.Prospective, null) }),
                ("Coach", new RoleVersionApproval[] {
                    new ("v1", RoleApprovalStatus.Prospective, null) }));
            AssertEx.SequenceIs(result.AvailableFamilyApplications, "Aold");
            AssertEx.SequenceIs(result.RemovedFamilyRoles);
            AssertEx.SequenceIs(result.MissingFamilyRequirements, "B");
            AssertEx.DictionaryIs(result.MissingIndividualRequirementsForFamilyRoles,
                (guid1, new[] { "C", "D", "Dv2", "Ccoach" }),
                (guid2, new[] { "D", "Dv2", "Ccoach" }));
        }

        [TestMethod]
        public void TestApprovedForOneVersionOnly()
        {
            var result = ApprovalCalculations.CalculateCombinedFamilyRoleStatusForFamily(
                volunteerPolicy, family, utcNow: new DateTime(2022, 1, 20),
                Helpers.Completed(("A", 1), ("Acoach", 1), ("B", 4)),
                Helpers.Exempted(),
                Helpers.Removed(),
                Helpers.CompletedIndividualRequirements((guid1, "C", 2), (guid1, "Dv2", 2), (guid2, "Dv2", 2), (guid2, "Ccoach", 5)),
                Helpers.ExemptedIndividualRequirements(),
                Helpers.RemovedIndividualRoles((guid2, "Host")));

            AssertEx.DictionaryIs(result.FamilyRoleVersionApprovals,
                ("Host", new RoleVersionApproval[] {
                    new ("v1", RoleApprovalStatus.Prospective, null),
                    new ("v2", RoleApprovalStatus.Approved, null) }),
                ("Coach", new RoleVersionApproval[] {
                    new ("v1", RoleApprovalStatus.Prospective, null) }));
            AssertEx.SequenceIs(result.AvailableFamilyApplications, "Aold");
            AssertEx.SequenceIs(result.RemovedFamilyRoles);
            AssertEx.SequenceIs(result.MissingFamilyRequirements, "F");
            AssertEx.DictionaryIs(result.MissingIndividualRequirementsForFamilyRoles,
                (guid1, new[] { "D", "Ccoach", "E" }),
                (guid2, new[] { "D" }));
        }
    }
}

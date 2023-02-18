using CareTogether.Engines;
using CareTogether.Engines.PolicyEvaluation;
using CareTogether.Resources;
using CareTogether.Resources.Approvals;
using CareTogether.Resources.Directory;
using CareTogether.Resources.Policies;
using CareTogether.TestData;
using Microsoft.VisualStudio.TestTools.UnitTesting;
using System;
using System.Collections.Generic;
using System.Collections.Immutable;
using System.Linq;
using System.Threading.Tasks;

namespace CareTogether.Core.Test
{
    [TestClass]
    public class CalculateVolunteerFamilyApprovalStatusTests
    {
        static readonly Guid guid1 = Guid.Parse("11111111-1111-1111-1111-111111111111");
        static readonly Guid guid2 = Guid.Parse("22222222-2222-2222-2222-222222222222");
        static readonly Guid guid3 = Guid.Parse("33333333-3333-3333-3333-333333333333");
        static readonly Guid guid4 = Guid.Parse("44444444-4444-4444-4444-444444444444");
        static readonly Guid guid5 = Guid.Parse("55555555-5555-5555-5555-555555555555");
        static readonly Guid guid6 = Guid.Parse("66666666-6666-6666-6666-666666666666");
        static readonly Guid guid7 = Guid.Parse("77777777-7777-7777-7777-777777777777");
        static readonly Guid guid8 = Guid.Parse("88888888-8888-8888-8888-888888888888");
        static readonly Guid guid9 = Guid.Parse("99999999-9999-9999-9999-999999999999");

        static readonly Family volunteerFamily = new Family(guid4, guid1,
            ImmutableList<(Person, FamilyAdultRelationshipInfo)>.Empty
                .Add((new Person(guid1, null, true, "John", "Voluntold", Gender.Male, new ExactAge(new DateTime(2000, 1, 1)), "Ethnic",
                    ImmutableList<Address>.Empty, null, ImmutableList<PhoneNumber>.Empty, null, ImmutableList<EmailAddress>.Empty, null, null, "Works from home"),
                    new FamilyAdultRelationshipInfo("Dad", true)))
                .Add((new Person(guid2, null, true, "Jane", "Voluntold", Gender.Female, new ExactAge(new DateTime(2000, 1, 1)), "Ethnic",
                    ImmutableList<Address>.Empty, null, ImmutableList<PhoneNumber>.Empty, null, ImmutableList<EmailAddress>.Empty, null, null, "Travels for work"),
                    new FamilyAdultRelationshipInfo("Mom", true)))
                .Add((new Person(guid3, null, true, "Janet", "Staywithus", Gender.Female, new ExactAge(new DateTime(2002, 1, 1)), "Ethnic",
                    ImmutableList<Address>.Empty, null, ImmutableList<PhoneNumber>.Empty, null, ImmutableList<EmailAddress>.Empty, null,
                    "Likely sleep-deprived as she's getting her master's in social work", "Living with sister & brother-in-law during college"),
                    new FamilyAdultRelationshipInfo("Relative", true))),
            ImmutableList<Person>.Empty
                .Add(new Person(guid4, null, true, "Joe", "Voluntold", Gender.Male, new AgeInYears(4, new DateTime(2021, 7, 1)), "Ethnic",
                    ImmutableList<Address>.Empty, null, ImmutableList<PhoneNumber>.Empty, null, ImmutableList<EmailAddress>.Empty, null, null, null))
                .Add(new Person(guid5, null, true, "Jill", "Notours", Gender.Female, new AgeInYears(2, new DateTime(2021, 7, 1)), "Ethnic",
                    ImmutableList<Address>.Empty, null, ImmutableList<PhoneNumber>.Empty, null, ImmutableList<EmailAddress>.Empty, null, null, null)),
            ImmutableList<CustodialRelationship>.Empty
                .Add(new CustodialRelationship(guid4, guid1, CustodialRelationshipType.ParentWithCustody))
                .Add(new CustodialRelationship(guid4, guid2, CustodialRelationshipType.ParentWithCustody))
                .Add(new CustodialRelationship(guid5, guid1, CustodialRelationshipType.LegalGuardian))
                .Add(new CustodialRelationship(guid5, guid2, CustodialRelationshipType.LegalGuardian)),
            ImmutableList<UploadedDocumentInfo>.Empty, ImmutableList<Guid>.Empty,
            ImmutableDictionary<string, CompletedCustomFieldInfo>.Empty, ImmutableList<Activity>.Empty);

        private static MemoryObjectStore<EffectiveLocationPolicy> policiesStore =
            new MemoryObjectStore<EffectiveLocationPolicy>();
        private static readonly VolunteerPolicy volunteerPolicy;

        static CalculateVolunteerFamilyApprovalStatusTests()
        {
            TestDataProvider.PopulatePolicies(policiesStore).Wait();
            volunteerPolicy = policiesStore.GetAsync(guid1, guid2, "policy").Result.VolunteerPolicy;
        }


        [TestMethod]
        public void TestCalculateVolunteerFamilyApprovalStatusWithNoActions()
        {
            var result = ApprovalCalculations.CalculateVolunteerFamilyApprovalStatus(volunteerPolicy,
                volunteerFamily, DateTime.UtcNow,
                new List<CompletedRequirementInfo>
                {
                }.ToImmutableList(),
                ImmutableList<ExemptedRequirementInfo>.Empty,
                ImmutableList<RemovedRole>.Empty,
                new Dictionary<Guid, ImmutableList<CompletedRequirementInfo>>
                {
                    [guid1] = ImmutableList<CompletedRequirementInfo>.Empty,
                    [guid2] = ImmutableList<CompletedRequirementInfo>.Empty,
                    [guid3] = ImmutableList<CompletedRequirementInfo>.Empty
                }.ToImmutableDictionary(),
                ImmutableDictionary<Guid, ImmutableList<ExemptedRequirementInfo>>.Empty,
                new Dictionary<Guid, ImmutableList<RemovedRole>>
                {
                    [guid1] = ImmutableList<RemovedRole>.Empty,
                    [guid2] = ImmutableList<RemovedRole>.Empty,
                    [guid3] = ImmutableList<RemovedRole>.Empty
                }.ToImmutableDictionary());

            Assert.AreEqual(0, result.FamilyRoleApprovals.Count);
            Assert.AreEqual(3, result.IndividualVolunteers.Count);
            Assert.AreEqual(0, result.IndividualVolunteers[guid1].IndividualRoleApprovals.Count);
            Assert.AreEqual(0, result.IndividualVolunteers[guid2].IndividualRoleApprovals.Count);
            Assert.AreEqual(0, result.IndividualVolunteers[guid3].IndividualRoleApprovals.Count);
        }

        [TestMethod]
        public void TestCalculateVolunteerFamilyApprovalStatusWithJustApplications()
        {
            var result = ApprovalCalculations.CalculateVolunteerFamilyApprovalStatus(volunteerPolicy,
                volunteerFamily, DateTime.UtcNow,
                new List<CompletedRequirementInfo>
                {
                    new CompletedRequirementInfo(guid6, new DateTime(2021, 7, 1), guid1, "Host Family Application", new DateTime(2021, 7, 1), null, Guid.Empty, null)
                }.ToImmutableList(),
                ImmutableList<ExemptedRequirementInfo>.Empty,
                ImmutableList<RemovedRole>.Empty,
                new Dictionary<Guid, ImmutableList<CompletedRequirementInfo>>
                {
                    [guid1] = ImmutableList<CompletedRequirementInfo>.Empty
                        .Add(new CompletedRequirementInfo(guid6, new DateTime(2021, 7, 1), guid2, "Family Friend Application", new DateTime(2021, 7, 1), null, Guid.Empty, null))
                        .Add(new CompletedRequirementInfo(guid6, new DateTime(2021, 7, 1), guid3, "Family Coach Application", new DateTime(2021, 7, 1), null, Guid.Empty, null)),
                    [guid2] = ImmutableList<CompletedRequirementInfo>.Empty
                        .Add(new CompletedRequirementInfo(guid6, new DateTime(2021, 7, 1), guid4, "Family Friend Application", new DateTime(2021, 7, 1), null, Guid.Empty, null)),
                    [guid3] = ImmutableList<CompletedRequirementInfo>.Empty
                }.ToImmutableDictionary(),
                ImmutableDictionary<Guid, ImmutableList<ExemptedRequirementInfo>>.Empty,
                new Dictionary<Guid, ImmutableList<RemovedRole>>
                {
                    [guid1] = ImmutableList<RemovedRole>.Empty,
                    [guid2] = ImmutableList<RemovedRole>.Empty,
                    [guid3] = ImmutableList<RemovedRole>.Empty
                }.ToImmutableDictionary());

            Assert.AreEqual(1, result.FamilyRoleApprovals.Count);
            Assert.AreEqual(2, result.FamilyRoleApprovals["Host Family"].Count);
            Assert.AreEqual(new RoleVersionApproval("v1", RoleApprovalStatus.Prospective, null), result.FamilyRoleApprovals["Host Family"].Single(x => x.Version == "v1"));
            Assert.AreEqual(new RoleVersionApproval("v2", RoleApprovalStatus.Prospective, null), result.FamilyRoleApprovals["Host Family"].Single(x => x.Version == "v2"));
            Assert.AreEqual(3, result.IndividualVolunteers.Count);
            Assert.AreEqual(2, result.IndividualVolunteers[guid1].IndividualRoleApprovals.Count);
            Assert.AreEqual(2, result.IndividualVolunteers[guid1].IndividualRoleApprovals["Family Friend"].Count);
            Assert.AreEqual(2, result.IndividualVolunteers[guid1].IndividualRoleApprovals["Family Coach"].Count);
            Assert.AreEqual(new RoleVersionApproval("v1", RoleApprovalStatus.Prospective, null), result.IndividualVolunteers[guid1].IndividualRoleApprovals["Family Friend"].Single(x => x.Version == "v1"));
            Assert.AreEqual(new RoleVersionApproval("v2", RoleApprovalStatus.Prospective, null), result.IndividualVolunteers[guid1].IndividualRoleApprovals["Family Friend"].Single(x => x.Version == "v2"));
            Assert.AreEqual(new RoleVersionApproval("v1", RoleApprovalStatus.Prospective, null), result.IndividualVolunteers[guid1].IndividualRoleApprovals["Family Coach"].Single(x => x.Version == "v1"));
            Assert.AreEqual(new RoleVersionApproval("v2", RoleApprovalStatus.Prospective, null), result.IndividualVolunteers[guid1].IndividualRoleApprovals["Family Coach"].Single(x => x.Version == "v2"));
            Assert.AreEqual(1, result.IndividualVolunteers[guid2].IndividualRoleApprovals.Count);
            Assert.AreEqual(2, result.IndividualVolunteers[guid2].IndividualRoleApprovals["Family Friend"].Count);
            Assert.AreEqual(new RoleVersionApproval("v1", RoleApprovalStatus.Prospective, null), result.IndividualVolunteers[guid2].IndividualRoleApprovals["Family Friend"].Single(x => x.Version == "v1"));
            Assert.AreEqual(new RoleVersionApproval("v2", RoleApprovalStatus.Prospective, null), result.IndividualVolunteers[guid2].IndividualRoleApprovals["Family Friend"].Single(x => x.Version == "v2"));
            Assert.AreEqual(0, result.IndividualVolunteers[guid3].IndividualRoleApprovals.Count);
        }

        [TestMethod]
        public void TestCalculateVolunteerFamilyApprovalStatusWithPartialHostFamilyProgress()
        {
            var result = ApprovalCalculations.CalculateVolunteerFamilyApprovalStatus(volunteerPolicy,
                volunteerFamily, DateTime.UtcNow,
                new List<CompletedRequirementInfo>
                {
                    new CompletedRequirementInfo(guid6, new DateTime(2021, 7, 1), guid1, "Host Family Application", new DateTime(2021, 7, 1), null, Guid.Empty, null),
                    new CompletedRequirementInfo(guid6, new DateTime(2021, 7, 10), guid2, "Home Screening Checklist", new DateTime(2021, 7, 8), null, Guid.Empty, null),
                    new CompletedRequirementInfo(guid6, new DateTime(2021, 7, 10), guid3, "Host Family Interview", new DateTime(2021, 7, 10), null, Guid.Empty, null)
                }.ToImmutableList(),
                ImmutableList<ExemptedRequirementInfo>.Empty,
                ImmutableList<RemovedRole>.Empty,
                new Dictionary<Guid, ImmutableList<CompletedRequirementInfo>>
                {
                    [guid1] = ImmutableList<CompletedRequirementInfo>.Empty
                        .Add(new CompletedRequirementInfo(guid1, new DateTime(2021, 7, 14), guid4, "Background Check", new DateTime(2021, 7, 12), null, Guid.Empty, null)),
                    [guid2] = ImmutableList<CompletedRequirementInfo>.Empty,
                    [guid3] = ImmutableList<CompletedRequirementInfo>.Empty
                }.ToImmutableDictionary(),
                ImmutableDictionary<Guid, ImmutableList<ExemptedRequirementInfo>>.Empty,
                new Dictionary<Guid, ImmutableList<RemovedRole>>
                {
                    [guid1] = ImmutableList<RemovedRole>.Empty,
                    [guid2] = ImmutableList<RemovedRole>.Empty,
                    [guid3] = ImmutableList<RemovedRole>.Empty
                }.ToImmutableDictionary());

            Assert.AreEqual(1, result.FamilyRoleApprovals.Count);
            Assert.AreEqual(2, result.FamilyRoleApprovals["Host Family"].Count);
            Assert.AreEqual(new RoleVersionApproval("v1", RoleApprovalStatus.Prospective, null), result.FamilyRoleApprovals["Host Family"].Single(x => x.Version == "v1"));
            Assert.AreEqual(new RoleVersionApproval("v2", RoleApprovalStatus.Prospective, null), result.FamilyRoleApprovals["Host Family"].Single(x => x.Version == "v2"));
            Assert.AreEqual(3, result.IndividualVolunteers.Count);
            Assert.AreEqual(0, result.IndividualVolunteers[guid1].IndividualRoleApprovals.Count);
            Assert.AreEqual(0, result.IndividualVolunteers[guid2].IndividualRoleApprovals.Count);
            Assert.AreEqual(0, result.IndividualVolunteers[guid3].IndividualRoleApprovals.Count);
        }

        [TestMethod]
        public void TestCalculateVolunteerFamilyApprovalStatusWithCompleteHostFamilyProgress()
        {
            var result = ApprovalCalculations.CalculateVolunteerFamilyApprovalStatus(volunteerPolicy,
                volunteerFamily, DateTime.UtcNow,
                new List<CompletedRequirementInfo>
                {
                    new CompletedRequirementInfo(guid6, new DateTime(2021, 7, 1), guid1, "Host Family Application", new DateTime(2021, 7, 1), null, Guid.Empty, null),
                    new CompletedRequirementInfo(guid6, new DateTime(2021, 7, 10), guid2, "Home Screening Checklist", new DateTime(2021, 7, 8), null, Guid.Empty, null),
                    new CompletedRequirementInfo(guid6, new DateTime(2021, 7, 10), guid3, "Host Family Interview", new DateTime(2021, 7, 10), null, Guid.Empty, null)
                }.ToImmutableList(),
                ImmutableList<ExemptedRequirementInfo>.Empty,
                ImmutableList<RemovedRole>.Empty,
                new Dictionary<Guid, ImmutableList<CompletedRequirementInfo>>
                {
                    [guid1] = ImmutableList<CompletedRequirementInfo>.Empty
                        .Add(new CompletedRequirementInfo(guid6, new DateTime(2021, 7, 14), guid4, "Background Check", new DateTime(2021, 7, 12), null, Guid.Empty, null))
                        .Add(new CompletedRequirementInfo(guid6, new DateTime(2021, 7, 20), guid5, "Host Family Training", new DateTime(2021, 7, 20), null, Guid.Empty, null)),
                    [guid2] = ImmutableList<CompletedRequirementInfo>.Empty
                        .Add(new CompletedRequirementInfo(guid6, new DateTime(2021, 7, 15), guid6, "Background Check", new DateTime(2021, 7, 13), null, Guid.Empty, null))
                        .Add(new CompletedRequirementInfo(guid6, new DateTime(2021, 7, 20), guid7, "Host Family Training", new DateTime(2021, 7, 20), null, Guid.Empty, null)),
                    [guid3] = ImmutableList<CompletedRequirementInfo>.Empty
                        .Add(new CompletedRequirementInfo(guid6, new DateTime(2021, 7, 15), guid8, "Background Check", new DateTime(2021, 7, 13), null, Guid.Empty, null))
                        .Add(new CompletedRequirementInfo(guid6, new DateTime(2021, 7, 20), guid9, "Host Family Training", new DateTime(2021, 7, 20), null, Guid.Empty, null)),
                }.ToImmutableDictionary(),
                ImmutableDictionary<Guid, ImmutableList<ExemptedRequirementInfo>>.Empty,
                new Dictionary<Guid, ImmutableList<RemovedRole>>
                {
                    [guid1] = ImmutableList<RemovedRole>.Empty,
                    [guid2] = ImmutableList<RemovedRole>.Empty,
                    [guid3] = ImmutableList<RemovedRole>.Empty
                }.ToImmutableDictionary());

            Assert.AreEqual(1, result.FamilyRoleApprovals.Count);
            Assert.AreEqual(2, result.FamilyRoleApprovals["Host Family"].Count);
            Assert.AreEqual(new RoleVersionApproval("v1", RoleApprovalStatus.Approved, null), result.FamilyRoleApprovals["Host Family"].Single(x => x.Version == "v1"));
            Assert.AreEqual(new RoleVersionApproval("v2", RoleApprovalStatus.Prospective, null), result.FamilyRoleApprovals["Host Family"].Single(x => x.Version == "v2"));
            Assert.AreEqual(3, result.IndividualVolunteers.Count);
            Assert.AreEqual(0, result.IndividualVolunteers[guid1].IndividualRoleApprovals.Count);
            Assert.AreEqual(0, result.IndividualVolunteers[guid2].IndividualRoleApprovals.Count);
            Assert.AreEqual(0, result.IndividualVolunteers[guid3].IndividualRoleApprovals.Count);
        }

        [TestMethod]
        public void TestCalculateVolunteerFamilyApprovalStatusWithCompletionBasedOnOptOuts()
        {
            var result = ApprovalCalculations.CalculateVolunteerFamilyApprovalStatus(volunteerPolicy,
                volunteerFamily, DateTime.UtcNow,
                new List<CompletedRequirementInfo>
                {
                    new CompletedRequirementInfo(guid6, new DateTime(2021, 7, 1), guid1, "Host Family Application", new DateTime(2021, 7, 1), null, Guid.Empty, null),
                    new CompletedRequirementInfo(guid6, new DateTime(2021, 7, 10), guid2, "Home Screening Checklist", new DateTime(2021, 7, 8), null, Guid.Empty, null),
                    new CompletedRequirementInfo(guid6, new DateTime(2021, 7, 10), guid3, "Host Family Interview", new DateTime(2021, 7, 10), null, Guid.Empty, null)
                }.ToImmutableList(),
                ImmutableList<ExemptedRequirementInfo>.Empty,
                ImmutableList<RemovedRole>.Empty,
                new Dictionary<Guid, ImmutableList<CompletedRequirementInfo>>
                {
                    [guid1] = ImmutableList<CompletedRequirementInfo>.Empty
                        .Add(new CompletedRequirementInfo(guid1, new DateTime(2021, 7, 14), guid4, "Background Check", new DateTime(2021, 7, 12), null, Guid.Empty, null))
                        .Add(new CompletedRequirementInfo(guid6, new DateTime(2021, 7, 20), guid5, "Host Family Training", new DateTime(2021, 7, 20), null, Guid.Empty, null)),
                    [guid2] = ImmutableList<CompletedRequirementInfo>.Empty
                        .Add(new CompletedRequirementInfo(guid1, new DateTime(2021, 7, 14), guid6, "Background Check", new DateTime(2021, 7, 12), null, Guid.Empty, null)),
                    [guid3] = ImmutableList<CompletedRequirementInfo>.Empty
                        .Add(new CompletedRequirementInfo(guid1, new DateTime(2021, 7, 14), guid7, "Background Check", new DateTime(2021, 7, 12), null, Guid.Empty, null))
                }.ToImmutableDictionary(),
                ImmutableDictionary<Guid, ImmutableList<ExemptedRequirementInfo>>.Empty,
                new Dictionary<Guid, ImmutableList<RemovedRole>>
                {
                    [guid1] = ImmutableList<RemovedRole>.Empty,
                    [guid2] = ImmutableList<RemovedRole>.Empty
                        .Add(new RemovedRole("Host Family", RoleRemovalReason.OptOut, "Not interested")),
                    [guid3] = ImmutableList<RemovedRole>.Empty
                        .Add(new RemovedRole("Host Family", RoleRemovalReason.Inactive, "No longer planning to volunteer"))
                }.ToImmutableDictionary());

            Assert.AreEqual(1, result.FamilyRoleApprovals.Count);
            Assert.AreEqual(2, result.FamilyRoleApprovals["Host Family"].Count);
            Assert.AreEqual(new RoleVersionApproval("v1", RoleApprovalStatus.Approved, null), result.FamilyRoleApprovals["Host Family"].Single(x => x.Version == "v1"));
            Assert.AreEqual(new RoleVersionApproval("v2", RoleApprovalStatus.Prospective, null), result.FamilyRoleApprovals["Host Family"].Single(x => x.Version == "v2"));
            Assert.AreEqual(3, result.IndividualVolunteers.Count);
            Assert.AreEqual(0, result.IndividualVolunteers[guid1].IndividualRoleApprovals.Count);
            Assert.AreEqual(0, result.IndividualVolunteers[guid2].IndividualRoleApprovals.Count);
            Assert.AreEqual(0, result.IndividualVolunteers[guid3].IndividualRoleApprovals.Count);
        }

        [TestMethod]
        public void TestCalculateVolunteerFamilyApprovalStatusWithMissingMandatoryStepsBasedOnOptOuts()
        {
            var result = ApprovalCalculations.CalculateVolunteerFamilyApprovalStatus(volunteerPolicy,
                volunteerFamily, DateTime.UtcNow,
                new List<CompletedRequirementInfo>
                {
                    new CompletedRequirementInfo(guid6, new DateTime(2021, 7, 1), guid1, "Host Family Application", new DateTime(2021, 7, 1), null, Guid.Empty, null),
                    new CompletedRequirementInfo(guid6, new DateTime(2021, 7, 10), guid2, "Home Screening Checklist", new DateTime(2021, 7, 8), null, Guid.Empty, null),
                    new CompletedRequirementInfo(guid6, new DateTime(2021, 7, 10), guid3, "Host Family Interview", new DateTime(2021, 7, 10), null, Guid.Empty, null)
                }.ToImmutableList(),
                ImmutableList<ExemptedRequirementInfo>.Empty,
                ImmutableList<RemovedRole>.Empty,
                new Dictionary<Guid, ImmutableList<CompletedRequirementInfo>>
                {
                    [guid1] = ImmutableList<CompletedRequirementInfo>.Empty
                        .Add(new CompletedRequirementInfo(guid1, new DateTime(2021, 7, 14), guid4, "Background Check", new DateTime(2021, 7, 12), null, Guid.Empty, null))
                        .Add(new CompletedRequirementInfo(guid6, new DateTime(2021, 7, 20), guid5, "Host Family Training", new DateTime(2021, 7, 20), null, Guid.Empty, null)),
                    [guid2] = ImmutableList<CompletedRequirementInfo>.Empty
                        .Add(new CompletedRequirementInfo(guid1, new DateTime(2021, 7, 14), guid6, "Background Check", new DateTime(2021, 7, 12), null, Guid.Empty, null)),
                    [guid3] = ImmutableList<CompletedRequirementInfo>.Empty
                }.ToImmutableDictionary(),
                ImmutableDictionary<Guid, ImmutableList<ExemptedRequirementInfo>>.Empty,
                new Dictionary<Guid, ImmutableList<RemovedRole>>
                {
                    [guid1] = ImmutableList<RemovedRole>.Empty,
                    [guid2] = ImmutableList<RemovedRole>.Empty
                        .Add(new RemovedRole("Host Family", RoleRemovalReason.OptOut, "Not interested")),
                    [guid3] = ImmutableList<RemovedRole>.Empty
                        .Add(new RemovedRole("Host Family", RoleRemovalReason.Inactive, "No longer planning to volunteer"))
                }.ToImmutableDictionary());

            Assert.AreEqual(1, result.FamilyRoleApprovals.Count);
            Assert.AreEqual(2, result.FamilyRoleApprovals["Host Family"].Count);
            Assert.AreEqual(new RoleVersionApproval("v1", RoleApprovalStatus.Prospective, null), result.FamilyRoleApprovals["Host Family"].Single(x => x.Version == "v1"));
            Assert.AreEqual(new RoleVersionApproval("v2", RoleApprovalStatus.Prospective, null), result.FamilyRoleApprovals["Host Family"].Single(x => x.Version == "v2"));
            Assert.AreEqual(3, result.IndividualVolunteers.Count);
            Assert.AreEqual(0, result.IndividualVolunteers[guid1].IndividualRoleApprovals.Count);
            Assert.AreEqual(0, result.IndividualVolunteers[guid2].IndividualRoleApprovals.Count);
            Assert.AreEqual(0, result.IndividualVolunteers[guid3].IndividualRoleApprovals.Count);
        }
    }
}

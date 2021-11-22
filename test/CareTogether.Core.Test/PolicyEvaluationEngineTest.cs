using CareTogether.Engines;
using CareTogether.Resources;
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
    public class PolicyEvaluationEngineTest
    {
        static readonly Guid guid1 = Guid.Parse("11111111-1111-1111-1111-111111111111");
        static readonly Guid guid2 = Guid.Parse("22222222-2222-2222-2222-222222222222");
        static readonly Guid guid3 = Guid.Parse("33333333-3333-3333-3333-333333333333");
        static readonly Guid guid4 = Guid.Parse("44444444-4444-4444-4444-444444444444");
        static readonly Guid guid5 = Guid.Parse("55555555-5555-5555-5555-555555555555");
        static readonly Guid guid6 = Guid.Parse("66666666-6666-6666-6666-666666666666");

        static readonly Family volunteerFamily = new Family(guid4, guid1,
            ImmutableList<(Person, FamilyAdultRelationshipInfo)>.Empty
                .Add((new Person(guid1, null, "John", "Voluntold", Gender.Male, new ExactAge(new DateTime(2000, 1, 1)), "Ethnic",
                    ImmutableList<Address>.Empty, null, ImmutableList<PhoneNumber>.Empty, null, ImmutableList<EmailAddress>.Empty, null, null, "Works from home"),
                    new FamilyAdultRelationshipInfo("Dad", true)))
                .Add((new Person(guid2, null, "Jane", "Voluntold", Gender.Female, new ExactAge(new DateTime(2000, 1, 1)), "Ethnic",
                    ImmutableList<Address>.Empty, null, ImmutableList<PhoneNumber>.Empty, null, ImmutableList<EmailAddress>.Empty, null, null, "Travels for work"),
                    new FamilyAdultRelationshipInfo("Mom", true)))
                .Add((new Person(guid3, null, "Janet", "Staywithus", Gender.Female, new ExactAge(new DateTime(2002, 1, 1)), "Ethnic",
                    ImmutableList<Address>.Empty, null, ImmutableList<PhoneNumber>.Empty, null, ImmutableList<EmailAddress>.Empty, null,
                    "Likely sleep-deprived as she's getting her master's in social work", "Living with sister & brother-in-law during college"),
                    new FamilyAdultRelationshipInfo("Relative", true))),
            ImmutableList<Person>.Empty
                .Add(new Person(guid4, null, "Joe", "Voluntold", Gender.Male, new AgeInYears(4, new DateTime(2021, 7, 1)), "Ethnic",
                    ImmutableList<Address>.Empty, null, ImmutableList<PhoneNumber>.Empty, null, ImmutableList<EmailAddress>.Empty, null, null, null))
                .Add(new Person(guid5, null, "Jill", "Notours", Gender.Female, new AgeInYears(2, new DateTime(2021, 7, 1)), "Ethnic",
                    ImmutableList<Address>.Empty, null, ImmutableList<PhoneNumber>.Empty, null, ImmutableList<EmailAddress>.Empty, null, null, null)),
            ImmutableList<CustodialRelationship>.Empty
                .Add(new CustodialRelationship(guid4, guid1, CustodialRelationshipType.ParentWithCustody))
                .Add(new CustodialRelationship(guid4, guid2, CustodialRelationshipType.ParentWithCustody))
                .Add(new CustodialRelationship(guid5, guid1, CustodialRelationshipType.LegalGuardian))
                .Add(new CustodialRelationship(guid5, guid2, CustodialRelationshipType.LegalGuardian)),
            ImmutableList<UploadedDocumentInfo>.Empty);

#nullable disable
        private PolicyEvaluationEngine dut;
#nullable restore

        [TestInitialize]
        public async Task TestInitialize()
        {
            var configurationStore = new MemoryMultitenantObjectStore<OrganizationConfiguration>();
            var policiesStore = new MemoryMultitenantObjectStore<EffectiveLocationPolicy>();
            await TestDataProvider.PopulatePolicies(policiesStore);
            var policiesResource = new PoliciesResource(configurationStore, policiesStore);
            dut = new PolicyEvaluationEngine(policiesResource);
        }

        [TestMethod]
        public async Task TestCalculateVolunteerFamilyApprovalStatusWithNoActions()
        {
            var result = await dut.CalculateVolunteerFamilyApprovalStatusAsync(guid1, guid2, volunteerFamily,
                new List<CompletedRequirementInfo>
                {
                }.ToImmutableList(),
                ImmutableList<RemovedRole>.Empty,
                new Dictionary<Guid, ImmutableList<CompletedRequirementInfo>>
                {
                    [guid1] = ImmutableList<CompletedRequirementInfo>.Empty,
                    [guid2] = ImmutableList<CompletedRequirementInfo>.Empty,
                    [guid3] = ImmutableList<CompletedRequirementInfo>.Empty
                }.ToImmutableDictionary(),
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
        public async Task TestCalculateVolunteerFamilyApprovalStatusWithJustApplications()
        {
            var result = await dut.CalculateVolunteerFamilyApprovalStatusAsync(guid1, guid2, volunteerFamily,
                new List<CompletedRequirementInfo>
                {
                    new CompletedRequirementInfo(guid6, new DateTime(2021, 7, 1), "Host Family Application", new DateTime(2021, 7, 1), Guid.Empty)
                }.ToImmutableList(),
                ImmutableList<RemovedRole>.Empty,
                new Dictionary<Guid, ImmutableList<CompletedRequirementInfo>>
                {
                    [guid1] = ImmutableList<CompletedRequirementInfo>.Empty
                        .Add(new CompletedRequirementInfo(guid6, new DateTime(2021, 7, 1), "Family Friend Application", new DateTime(2021, 7, 1), Guid.Empty))
                        .Add(new CompletedRequirementInfo(guid6, new DateTime(2021, 7, 1), "Family Coach Application", new DateTime(2021, 7, 1), Guid.Empty)),
                    [guid2] = ImmutableList<CompletedRequirementInfo>.Empty
                        .Add(new CompletedRequirementInfo(guid6, new DateTime(2021, 7, 1), "Family Friend Application", new DateTime(2021, 7, 1), Guid.Empty)),
                    [guid3] = ImmutableList<CompletedRequirementInfo>.Empty
                }.ToImmutableDictionary(),
                new Dictionary<Guid, ImmutableList<RemovedRole>>
                {
                    [guid1] = ImmutableList<RemovedRole>.Empty,
                    [guid2] = ImmutableList<RemovedRole>.Empty,
                    [guid3] = ImmutableList<RemovedRole>.Empty
                }.ToImmutableDictionary());

            Assert.AreEqual(1, result.FamilyRoleApprovals.Count);
            Assert.AreEqual(2, result.FamilyRoleApprovals["Host Family"].Count);
            Assert.AreEqual(new RoleVersionApproval("v1", RoleApprovalStatus.Prospective), result.FamilyRoleApprovals["Host Family"].Single(x => x.Version == "v1"));
            Assert.AreEqual(new RoleVersionApproval("v2", RoleApprovalStatus.Prospective), result.FamilyRoleApprovals["Host Family"].Single(x => x.Version == "v2"));
            Assert.AreEqual(3, result.IndividualVolunteers.Count);
            Assert.AreEqual(2, result.IndividualVolunteers[guid1].IndividualRoleApprovals.Count);
            Assert.AreEqual(2, result.IndividualVolunteers[guid1].IndividualRoleApprovals["Family Friend"].Count);
            Assert.AreEqual(2, result.IndividualVolunteers[guid1].IndividualRoleApprovals["Family Coach"].Count);
            Assert.AreEqual(new RoleVersionApproval("v1", RoleApprovalStatus.Prospective), result.IndividualVolunteers[guid1].IndividualRoleApprovals["Family Friend"].Single(x => x.Version == "v1"));
            Assert.AreEqual(new RoleVersionApproval("v2", RoleApprovalStatus.Prospective), result.IndividualVolunteers[guid1].IndividualRoleApprovals["Family Friend"].Single(x => x.Version == "v2"));
            Assert.AreEqual(new RoleVersionApproval("v1", RoleApprovalStatus.Prospective), result.IndividualVolunteers[guid1].IndividualRoleApprovals["Family Coach"].Single(x => x.Version == "v1"));
            Assert.AreEqual(new RoleVersionApproval("v2", RoleApprovalStatus.Prospective), result.IndividualVolunteers[guid1].IndividualRoleApprovals["Family Coach"].Single(x => x.Version == "v2"));
            Assert.AreEqual(1, result.IndividualVolunteers[guid2].IndividualRoleApprovals.Count);
            Assert.AreEqual(2, result.IndividualVolunteers[guid2].IndividualRoleApprovals["Family Friend"].Count);
            Assert.AreEqual(new RoleVersionApproval("v1", RoleApprovalStatus.Prospective), result.IndividualVolunteers[guid2].IndividualRoleApprovals["Family Friend"].Single(x => x.Version == "v1"));
            Assert.AreEqual(new RoleVersionApproval("v2", RoleApprovalStatus.Prospective), result.IndividualVolunteers[guid2].IndividualRoleApprovals["Family Friend"].Single(x => x.Version == "v2"));
            Assert.AreEqual(0, result.IndividualVolunteers[guid3].IndividualRoleApprovals.Count);
        }

        [TestMethod]
        public async Task TestCalculateVolunteerFamilyApprovalStatusWithPartialHostFamilyProgress()
        {
            var result = await dut.CalculateVolunteerFamilyApprovalStatusAsync(guid1, guid2, volunteerFamily,
                new List<CompletedRequirementInfo>
                {
                    new CompletedRequirementInfo(guid6, new DateTime(2021, 7, 1), "Host Family Application", new DateTime(2021, 7, 1), Guid.Empty),
                    new CompletedRequirementInfo(guid6, new DateTime(2021, 7, 10), "Home Screening Checklist", new DateTime(2021, 7, 8), Guid.Empty),
                    new CompletedRequirementInfo(guid6, new DateTime(2021, 7, 10), "Host Family Interview", new DateTime(2021, 7, 10), Guid.Empty)
                }.ToImmutableList(),
                ImmutableList<RemovedRole>.Empty,
                new Dictionary<Guid, ImmutableList<CompletedRequirementInfo>>
                {
                    [guid1] = ImmutableList<CompletedRequirementInfo>.Empty
                        .Add(new CompletedRequirementInfo(guid1, new DateTime(2021, 7, 14), "Background Check", new DateTime(2021, 7, 12), Guid.Empty)),
                    [guid2] = ImmutableList<CompletedRequirementInfo>.Empty,
                    [guid3] = ImmutableList<CompletedRequirementInfo>.Empty
                }.ToImmutableDictionary(),
                new Dictionary<Guid, ImmutableList<RemovedRole>>
                {
                    [guid1] = ImmutableList<RemovedRole>.Empty,
                    [guid2] = ImmutableList<RemovedRole>.Empty,
                    [guid3] = ImmutableList<RemovedRole>.Empty
                }.ToImmutableDictionary());

            Assert.AreEqual(1, result.FamilyRoleApprovals.Count);
            Assert.AreEqual(2, result.FamilyRoleApprovals["Host Family"].Count);
            Assert.AreEqual(new RoleVersionApproval("v1", RoleApprovalStatus.Prospective), result.FamilyRoleApprovals["Host Family"].Single(x => x.Version == "v1"));
            Assert.AreEqual(new RoleVersionApproval("v2", RoleApprovalStatus.Prospective), result.FamilyRoleApprovals["Host Family"].Single(x => x.Version == "v2"));
            Assert.AreEqual(3, result.IndividualVolunteers.Count);
            Assert.AreEqual(0, result.IndividualVolunteers[guid1].IndividualRoleApprovals.Count);
            Assert.AreEqual(0, result.IndividualVolunteers[guid2].IndividualRoleApprovals.Count);
            Assert.AreEqual(0, result.IndividualVolunteers[guid3].IndividualRoleApprovals.Count);
        }

        [TestMethod]
        public async Task TestCalculateVolunteerFamilyApprovalStatusWithCompleteHostFamilyProgress()
        {
            var result = await dut.CalculateVolunteerFamilyApprovalStatusAsync(guid1, guid2, volunteerFamily,
                new List<CompletedRequirementInfo>
                {
                    new CompletedRequirementInfo(guid6, new DateTime(2021, 7, 1), "Host Family Application", new DateTime(2021, 7, 1), Guid.Empty),
                    new CompletedRequirementInfo(guid6, new DateTime(2021, 7, 10), "Home Screening Checklist", new DateTime(2021, 7, 8), Guid.Empty),
                    new CompletedRequirementInfo(guid6, new DateTime(2021, 7, 10), "Host Family Interview", new DateTime(2021, 7, 10), Guid.Empty)
                }.ToImmutableList(),
                ImmutableList<RemovedRole>.Empty,
                new Dictionary<Guid, ImmutableList<CompletedRequirementInfo>>
                {
                    [guid1] = ImmutableList<CompletedRequirementInfo>.Empty
                        .Add(new CompletedRequirementInfo(guid6, new DateTime(2021, 7, 14), "Background Check", new DateTime(2021, 7, 12), Guid.Empty))
                        .Add(new CompletedRequirementInfo(guid6, new DateTime(2021, 7, 20), "Host Family Training", new DateTime(2021, 7, 20), Guid.Empty)),
                    [guid2] = ImmutableList<CompletedRequirementInfo>.Empty
                        .Add(new CompletedRequirementInfo(guid6, new DateTime(2021, 7, 15), "Background Check", new DateTime(2021, 7, 13), Guid.Empty))
                        .Add(new CompletedRequirementInfo(guid6, new DateTime(2021, 7, 20), "Host Family Training", new DateTime(2021, 7, 20), Guid.Empty)),
                    [guid3] = ImmutableList<CompletedRequirementInfo>.Empty
                        .Add(new CompletedRequirementInfo(guid6, new DateTime(2021, 7, 15), "Background Check", new DateTime(2021, 7, 13), Guid.Empty))
                        .Add(new CompletedRequirementInfo(guid6, new DateTime(2021, 7, 20), "Host Family Training", new DateTime(2021, 7, 20), Guid.Empty)),
                }.ToImmutableDictionary(),
                new Dictionary<Guid, ImmutableList<RemovedRole>>
                {
                    [guid1] = ImmutableList<RemovedRole>.Empty,
                    [guid2] = ImmutableList<RemovedRole>.Empty,
                    [guid3] = ImmutableList<RemovedRole>.Empty
                }.ToImmutableDictionary());

            Assert.AreEqual(1, result.FamilyRoleApprovals.Count);
            Assert.AreEqual(2, result.FamilyRoleApprovals["Host Family"].Count);
            Assert.AreEqual(new RoleVersionApproval("v1", RoleApprovalStatus.Approved), result.FamilyRoleApprovals["Host Family"].Single(x => x.Version == "v1"));
            Assert.AreEqual(new RoleVersionApproval("v2", RoleApprovalStatus.Prospective), result.FamilyRoleApprovals["Host Family"].Single(x => x.Version == "v2"));
            Assert.AreEqual(3, result.IndividualVolunteers.Count);
            Assert.AreEqual(0, result.IndividualVolunteers[guid1].IndividualRoleApprovals.Count);
            Assert.AreEqual(0, result.IndividualVolunteers[guid2].IndividualRoleApprovals.Count);
            Assert.AreEqual(0, result.IndividualVolunteers[guid3].IndividualRoleApprovals.Count);
        }

        [TestMethod]
        public async Task TestCalculateVolunteerFamilyApprovalStatusWithCompletionBasedOnOptOuts()
        {
            var result = await dut.CalculateVolunteerFamilyApprovalStatusAsync(guid1, guid2, volunteerFamily,
                new List<CompletedRequirementInfo>
                {
                    new CompletedRequirementInfo(guid6, new DateTime(2021, 7, 1), "Host Family Application", new DateTime(2021, 7, 1), Guid.Empty),
                    new CompletedRequirementInfo(guid6, new DateTime(2021, 7, 10), "Home Screening Checklist", new DateTime(2021, 7, 8), Guid.Empty),
                    new CompletedRequirementInfo(guid6, new DateTime(2021, 7, 10), "Host Family Interview", new DateTime(2021, 7, 10), Guid.Empty)
                }.ToImmutableList(),
                ImmutableList<RemovedRole>.Empty,
                new Dictionary<Guid, ImmutableList<CompletedRequirementInfo>>
                {
                    [guid1] = ImmutableList<CompletedRequirementInfo>.Empty
                        .Add(new CompletedRequirementInfo(guid1, new DateTime(2021, 7, 14), "Background Check", new DateTime(2021, 7, 12), Guid.Empty))
                        .Add(new CompletedRequirementInfo(guid6, new DateTime(2021, 7, 20), "Host Family Training", new DateTime(2021, 7, 20), Guid.Empty)),
                    [guid2] = ImmutableList<CompletedRequirementInfo>.Empty
                        .Add(new CompletedRequirementInfo(guid1, new DateTime(2021, 7, 14), "Background Check", new DateTime(2021, 7, 12), Guid.Empty)),
                    [guid3] = ImmutableList<CompletedRequirementInfo>.Empty
                        .Add(new CompletedRequirementInfo(guid1, new DateTime(2021, 7, 14), "Background Check", new DateTime(2021, 7, 12), Guid.Empty))
                }.ToImmutableDictionary(),
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
            Assert.AreEqual(new RoleVersionApproval("v1", RoleApprovalStatus.Approved), result.FamilyRoleApprovals["Host Family"].Single(x => x.Version == "v1"));
            Assert.AreEqual(new RoleVersionApproval("v2", RoleApprovalStatus.Prospective), result.FamilyRoleApprovals["Host Family"].Single(x => x.Version == "v2"));
            Assert.AreEqual(3, result.IndividualVolunteers.Count);
            Assert.AreEqual(0, result.IndividualVolunteers[guid1].IndividualRoleApprovals.Count);
            Assert.AreEqual(0, result.IndividualVolunteers[guid2].IndividualRoleApprovals.Count);
            Assert.AreEqual(0, result.IndividualVolunteers[guid3].IndividualRoleApprovals.Count);
        }

        [TestMethod]
        public async Task TestCalculateVolunteerFamilyApprovalStatusWithMissingMandatoryStepsBasedOnOptOuts()
        {
            var result = await dut.CalculateVolunteerFamilyApprovalStatusAsync(guid1, guid2, volunteerFamily,
                new List<CompletedRequirementInfo>
                {
                    new CompletedRequirementInfo(guid6, new DateTime(2021, 7, 1), "Host Family Application", new DateTime(2021, 7, 1), Guid.Empty),
                    new CompletedRequirementInfo(guid6, new DateTime(2021, 7, 10), "Home Screening Checklist", new DateTime(2021, 7, 8), Guid.Empty),
                    new CompletedRequirementInfo(guid6, new DateTime(2021, 7, 10), "Host Family Interview", new DateTime(2021, 7, 10), Guid.Empty)
                }.ToImmutableList(),
                ImmutableList<RemovedRole>.Empty,
                new Dictionary<Guid, ImmutableList<CompletedRequirementInfo>>
                {
                    [guid1] = ImmutableList<CompletedRequirementInfo>.Empty
                        .Add(new CompletedRequirementInfo(guid1, new DateTime(2021, 7, 14), "Background Check", new DateTime(2021, 7, 12), Guid.Empty))
                        .Add(new CompletedRequirementInfo(guid6, new DateTime(2021, 7, 20), "Host Family Training", new DateTime(2021, 7, 20), Guid.Empty)),
                    [guid2] = ImmutableList<CompletedRequirementInfo>.Empty
                        .Add(new CompletedRequirementInfo(guid1, new DateTime(2021, 7, 14), "Background Check", new DateTime(2021, 7, 12), Guid.Empty)),
                    [guid3] = ImmutableList<CompletedRequirementInfo>.Empty
                }.ToImmutableDictionary(),
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
            Assert.AreEqual(new RoleVersionApproval("v1", RoleApprovalStatus.Prospective), result.FamilyRoleApprovals["Host Family"].Single(x => x.Version == "v1"));
            Assert.AreEqual(new RoleVersionApproval("v2", RoleApprovalStatus.Prospective), result.FamilyRoleApprovals["Host Family"].Single(x => x.Version == "v2"));
            Assert.AreEqual(3, result.IndividualVolunteers.Count);
            Assert.AreEqual(0, result.IndividualVolunteers[guid1].IndividualRoleApprovals.Count);
            Assert.AreEqual(0, result.IndividualVolunteers[guid2].IndividualRoleApprovals.Count);
            Assert.AreEqual(0, result.IndividualVolunteers[guid3].IndividualRoleApprovals.Count);
        }
    }
}

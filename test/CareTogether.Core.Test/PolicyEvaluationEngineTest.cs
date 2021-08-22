using CareTogether.Engines;
using CareTogether.Resources;
using CareTogether.TestData;
using Microsoft.VisualStudio.TestTools.UnitTesting;
using System;
using System.Collections.Generic;
using System.Collections.Immutable;
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

        static readonly Family volunteerFamily = new Family(guid4,
            new List<(Person, FamilyAdultRelationshipInfo)>
            {
                (new Person(guid1, null, "John", "Voluntold", Gender.Male, new ExactAge(new DateTime(2000, 1, 1)), "Ethnic"),
                    new FamilyAdultRelationshipInfo("Dad", "Works from home", true, true, null)),
                (new Person(guid2, null, "Jane", "Voluntold", Gender.Female, new ExactAge(new DateTime(2000, 1, 1)), "Ethnic"),
                    new FamilyAdultRelationshipInfo("Mom", "Travels for work", true, false, null)),
                (new Person(guid3, null, "Janet", "Staywithus", Gender.Female, new ExactAge(new DateTime(2002, 1, 1)), "Ethnic"),
                    new FamilyAdultRelationshipInfo("Relative", "Living with sister & brother-in-law during college",
                        true, false, "Likely sleep-deprived as she's getting her master's in social work"))
            },
            new List<Person>
            {
                new Person(guid4, null, "Joe", "Voluntold", Gender.Male, new AgeInYears(4, new DateTime(2021, 7, 1)), "Ethnic"),
                new Person(guid5, null, "Jill", "Notours", Gender.Female, new AgeInYears(2, new DateTime(2021, 7, 1)), "Ethnic"),
            },
            new List<CustodialRelationship>
            {
                new CustodialRelationship(guid4, guid1, CustodialRelationshipType.ParentWithCustody),
                new CustodialRelationship(guid4, guid2, CustodialRelationshipType.ParentWithCustody),
                new CustodialRelationship(guid5, guid1, CustodialRelationshipType.LegalGuardian),
                new CustodialRelationship(guid5, guid2, CustodialRelationshipType.LegalGuardian)
            });

        private PolicyEvaluationEngine dut;

        [TestInitialize]
        public async Task TestInitialize()
        {
            var policiesStore = new MemoryMultitenantObjectStore<EffectiveLocationPolicy>();
            await TestDataProvider.PopulatePolicies(policiesStore);
            var policiesResource = new PoliciesResource(policiesStore);
            dut = new PolicyEvaluationEngine(policiesResource);
        }

        [TestMethod]
        public async Task TestCalculateVolunteerFamilyApprovalStatusWithNoActions()
        {
            var result = await dut.CalculateVolunteerFamilyApprovalStatusAsync(guid1, guid2, volunteerFamily,
                new List<FormUploadInfo>
                {
                }.ToImmutableList(),
                new List<ActivityInfo>
                {
                }.ToImmutableList(),
                new Dictionary<Guid, (ImmutableList<FormUploadInfo> FormUploads, ImmutableList<ActivityInfo> ActivitiesPerformed)>
                {
                    [guid1] = (ImmutableList<FormUploadInfo>.Empty, ImmutableList<ActivityInfo>.Empty),
                    [guid2] = (ImmutableList<FormUploadInfo>.Empty, ImmutableList<ActivityInfo>.Empty),
                    [guid3] = (ImmutableList<FormUploadInfo>.Empty, ImmutableList<ActivityInfo>.Empty)
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
                new List<FormUploadInfo>
                {
                    new FormUploadInfo(guid6, new DateTime(2021, 7, 1), new DateTime(2021, 7, 1), "Host Family Application", "v1", "abc.pdf", Guid.Empty)
                }.ToImmutableList(),
                new List<ActivityInfo>
                {
                }.ToImmutableList(),
                new Dictionary<Guid, (ImmutableList<FormUploadInfo> FormUploads, ImmutableList<ActivityInfo> ActivitiesPerformed)>
                {
                    [guid1] = (ImmutableList<FormUploadInfo>.Empty
                        .Add(new FormUploadInfo(guid6, new DateTime(2021, 7, 1), new DateTime(2021, 7, 1), "Family Friend Application", "v1", "ff1.docx", Guid.Empty))
                        .Add(new FormUploadInfo(guid6, new DateTime(2021, 7, 1), new DateTime(2021, 7, 1), "Family Coach Application", "v1", "fc.docx", Guid.Empty)),
                        ImmutableList<ActivityInfo>.Empty),
                    [guid2] = (ImmutableList<FormUploadInfo>.Empty
                        .Add(new FormUploadInfo(guid6, new DateTime(2021, 7, 1), new DateTime(2021, 7, 1), "Family Friend Application", "v1", "ff2.docx", Guid.Empty)),
                        ImmutableList<ActivityInfo>.Empty),
                    [guid3] = (ImmutableList<FormUploadInfo>.Empty, ImmutableList<ActivityInfo>.Empty)
                }.ToImmutableDictionary());

            Assert.AreEqual(1, result.FamilyRoleApprovals.Count);
            Assert.AreEqual(RoleApprovalStatus.Prospective, result.FamilyRoleApprovals["Host Family"]);
            Assert.AreEqual(3, result.IndividualVolunteers.Count);
            Assert.AreEqual(2, result.IndividualVolunteers[guid1].IndividualRoleApprovals.Count);
            Assert.AreEqual(RoleApprovalStatus.Prospective, result.IndividualVolunteers[guid1].IndividualRoleApprovals["Family Friend"]);
            Assert.AreEqual(RoleApprovalStatus.Prospective, result.IndividualVolunteers[guid1].IndividualRoleApprovals["Family Coach"]);
            Assert.AreEqual(1, result.IndividualVolunteers[guid2].IndividualRoleApprovals.Count);
            Assert.AreEqual(RoleApprovalStatus.Prospective, result.IndividualVolunteers[guid1].IndividualRoleApprovals["Family Friend"]);
            Assert.AreEqual(0, result.IndividualVolunteers[guid3].IndividualRoleApprovals.Count);
        }

        [TestMethod]
        public async Task TestCalculateVolunteerFamilyApprovalStatusWithPartialHostFamilyProgress()
        {
            var result = await dut.CalculateVolunteerFamilyApprovalStatusAsync(guid1, guid2, volunteerFamily,
                new List<FormUploadInfo>
                {
                    new FormUploadInfo(guid6, new DateTime(2021, 7, 1), new DateTime(2021, 7, 1), "Host Family Application", "v1", "abc.pdf", Guid.Empty),
                    new FormUploadInfo(guid6, new DateTime(2021, 7, 10), new DateTime(2021, 7, 8), "Home Screening Checklist", "v1", "def.pdf", Guid.Empty)
                }.ToImmutableList(),
                new List<ActivityInfo>
                {
                    new ActivityInfo(guid6, new DateTime(2021, 7, 10), "Host Family Interview", new DateTime(2021, 7, 10), guid1)
                }.ToImmutableList(),
                new Dictionary<Guid, (ImmutableList<FormUploadInfo> FormUploads, ImmutableList<ActivityInfo> ActivitiesPerformed)>
                {
                    [guid1] = (ImmutableList<FormUploadInfo>.Empty
                        .Add(new FormUploadInfo(guid1, new DateTime(2021, 7, 14), new DateTime(2021, 7, 12), "Background Check", "v1", "bg1.pdf", Guid.Empty)),
                        ImmutableList<ActivityInfo>.Empty),
                    [guid2] = (ImmutableList<FormUploadInfo>.Empty, ImmutableList<ActivityInfo>.Empty),
                    [guid3] = (ImmutableList<FormUploadInfo>.Empty, ImmutableList<ActivityInfo>.Empty)
                }.ToImmutableDictionary());

            Assert.AreEqual(1, result.FamilyRoleApprovals.Count);
            Assert.AreEqual(RoleApprovalStatus.Prospective, result.FamilyRoleApprovals["Host Family"]);
            Assert.AreEqual(3, result.IndividualVolunteers.Count);
            Assert.AreEqual(0, result.IndividualVolunteers[guid1].IndividualRoleApprovals.Count);
            Assert.AreEqual(0, result.IndividualVolunteers[guid2].IndividualRoleApprovals.Count);
            Assert.AreEqual(0, result.IndividualVolunteers[guid3].IndividualRoleApprovals.Count);
        }

        [TestMethod]
        public async Task TestCalculateVolunteerFamilyApprovalStatusWithCompleteHostFamilyProgress()
        {
            var result = await dut.CalculateVolunteerFamilyApprovalStatusAsync(guid1, guid2, volunteerFamily,
                new List<FormUploadInfo>
                {
                    new FormUploadInfo(guid6, new DateTime(2021, 7, 1), new DateTime(2021, 7, 1), "Host Family Application", "v1", "abc.pdf", Guid.Empty),
                    new FormUploadInfo(guid6, new DateTime(2021, 7, 10), new DateTime(2021, 7, 8), "Home Screening Checklist", "v1", "def.pdf", Guid.Empty)
                }.ToImmutableList(),
                new List<ActivityInfo>
                {
                    new ActivityInfo(guid6, new DateTime(2021, 7, 10), "Host Family Interview", new DateTime(2021, 7, 10), guid1)
                }.ToImmutableList(),
                new Dictionary<Guid, (ImmutableList<FormUploadInfo> FormUploads, ImmutableList<ActivityInfo> ActivitiesPerformed)>
                {
                    [guid1] = (ImmutableList<FormUploadInfo>.Empty
                        .Add(new FormUploadInfo(guid6, new DateTime(2021, 7, 14), new DateTime(2021, 7, 12), "Background Check", "v1", "bg1.pdf", Guid.Empty)), ImmutableList<ActivityInfo>.Empty),
                    [guid2] = (ImmutableList<FormUploadInfo>.Empty
                        .Add(new FormUploadInfo(guid6, new DateTime(2021, 7, 15), new DateTime(2021, 7, 13), "Background Check", "v1", "bg1.pdf", Guid.Empty)), ImmutableList<ActivityInfo>.Empty),
                    [guid3] = (ImmutableList<FormUploadInfo>.Empty
                        .Add(new FormUploadInfo(guid6, new DateTime(2021, 7, 15), new DateTime(2021, 7, 13), "Background Check", "v1", "bg1.pdf", Guid.Empty)), ImmutableList<ActivityInfo>.Empty)
                }.ToImmutableDictionary());

            Assert.AreEqual(1, result.FamilyRoleApprovals.Count);
            Assert.AreEqual(RoleApprovalStatus.Approved, result.FamilyRoleApprovals["Host Family"]);
            Assert.AreEqual(3, result.IndividualVolunteers.Count);
            Assert.AreEqual(0, result.IndividualVolunteers[guid1].IndividualRoleApprovals.Count);
            Assert.AreEqual(0, result.IndividualVolunteers[guid2].IndividualRoleApprovals.Count);
            Assert.AreEqual(0, result.IndividualVolunteers[guid3].IndividualRoleApprovals.Count);
        }
    }
}

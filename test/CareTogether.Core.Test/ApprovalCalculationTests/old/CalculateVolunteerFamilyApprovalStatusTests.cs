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
        // [TestMethod]
        // public void TestCalculateVolunteerFamilyApprovalStatusWithNoActions()
        // {
        //     var result = ApprovalCalculations.CalculateVolunteerFamilyApprovalStatus(volunteerPolicy,
        //         volunteerFamily, DateTime.UtcNow,
        //         new List<CompletedRequirementInfo>
        //         {
        //         }.ToImmutableList(),
        //         ImmutableList<ExemptedRequirementInfo>.Empty,
        //         ImmutableList<RemovedRole>.Empty,
        //         new Dictionary<Guid, ImmutableList<CompletedRequirementInfo>>
        //         {
        //             [guid1] = ImmutableList<CompletedRequirementInfo>.Empty,
        //             [guid2] = ImmutableList<CompletedRequirementInfo>.Empty,
        //             [guid3] = ImmutableList<CompletedRequirementInfo>.Empty
        //         }.ToImmutableDictionary(),
        //         ImmutableDictionary<Guid, ImmutableList<ExemptedRequirementInfo>>.Empty,
        //         new Dictionary<Guid, ImmutableList<RemovedRole>>
        //         {
        //             [guid1] = ImmutableList<RemovedRole>.Empty,
        //             [guid2] = ImmutableList<RemovedRole>.Empty,
        //             [guid3] = ImmutableList<RemovedRole>.Empty
        //         }.ToImmutableDictionary());

        //     Assert.AreEqual(0, result.FamilyRoleApprovals.Count);
        //     Assert.AreEqual(3, result.IndividualVolunteers.Count);
        //     Assert.AreEqual(0, result.IndividualVolunteers[guid1].IndividualRoleApprovals.Count);
        //     Assert.AreEqual(0, result.IndividualVolunteers[guid2].IndividualRoleApprovals.Count);
        //     Assert.AreEqual(0, result.IndividualVolunteers[guid3].IndividualRoleApprovals.Count);
        // }

        // [TestMethod]
        // public void TestCalculateVolunteerFamilyApprovalStatusWithJustApplications()
        // {
        //     var result = ApprovalCalculations.CalculateVolunteerFamilyApprovalStatus(volunteerPolicy,
        //         volunteerFamily, DateTime.UtcNow,
        //         new List<CompletedRequirementInfo>
        //         {
        //             new CompletedRequirementInfo(guid6, new DateTime(2021, 7, 1), guid1, "Host Family Application", new DateTime(2021, 7, 1), null, Guid.Empty, null)
        //         }.ToImmutableList(),
        //         ImmutableList<ExemptedRequirementInfo>.Empty,
        //         ImmutableList<RemovedRole>.Empty,
        //         new Dictionary<Guid, ImmutableList<CompletedRequirementInfo>>
        //         {
        //             [guid1] = ImmutableList<CompletedRequirementInfo>.Empty
        //                 .Add(new CompletedRequirementInfo(guid6, new DateTime(2021, 7, 1), guid2, "Family Friend Application", new DateTime(2021, 7, 1), null, Guid.Empty, null))
        //                 .Add(new CompletedRequirementInfo(guid6, new DateTime(2021, 7, 1), guid3, "Family Coach Application", new DateTime(2021, 7, 1), null, Guid.Empty, null)),
        //             [guid2] = ImmutableList<CompletedRequirementInfo>.Empty
        //                 .Add(new CompletedRequirementInfo(guid6, new DateTime(2021, 7, 1), guid4, "Family Friend Application", new DateTime(2021, 7, 1), null, Guid.Empty, null)),
        //             [guid3] = ImmutableList<CompletedRequirementInfo>.Empty
        //         }.ToImmutableDictionary(),
        //         ImmutableDictionary<Guid, ImmutableList<ExemptedRequirementInfo>>.Empty,
        //         new Dictionary<Guid, ImmutableList<RemovedRole>>
        //         {
        //             [guid1] = ImmutableList<RemovedRole>.Empty,
        //             [guid2] = ImmutableList<RemovedRole>.Empty,
        //             [guid3] = ImmutableList<RemovedRole>.Empty
        //         }.ToImmutableDictionary());

        //     Assert.AreEqual(1, result.FamilyRoleApprovals.Count);
        //     Assert.AreEqual(2, result.FamilyRoleApprovals["Host Family"].Count);
        //     Assert.AreEqual(new RoleVersionApproval("v1", RoleApprovalStatus.Prospective, null), result.FamilyRoleApprovals["Host Family"].Single(x => x.Version == "v1"));
        //     Assert.AreEqual(new RoleVersionApproval("v2", RoleApprovalStatus.Prospective, null), result.FamilyRoleApprovals["Host Family"].Single(x => x.Version == "v2"));
        //     Assert.AreEqual(3, result.IndividualVolunteers.Count);
        //     Assert.AreEqual(2, result.IndividualVolunteers[guid1].IndividualRoleApprovals.Count);
        //     Assert.AreEqual(2, result.IndividualVolunteers[guid1].IndividualRoleApprovals["Family Friend"].Count);
        //     Assert.AreEqual(2, result.IndividualVolunteers[guid1].IndividualRoleApprovals["Family Coach"].Count);
        //     Assert.AreEqual(new RoleVersionApproval("v1", RoleApprovalStatus.Prospective, null), result.IndividualVolunteers[guid1].IndividualRoleApprovals["Family Friend"].Single(x => x.Version == "v1"));
        //     Assert.AreEqual(new RoleVersionApproval("v2", RoleApprovalStatus.Prospective, null), result.IndividualVolunteers[guid1].IndividualRoleApprovals["Family Friend"].Single(x => x.Version == "v2"));
        //     Assert.AreEqual(new RoleVersionApproval("v1", RoleApprovalStatus.Prospective, null), result.IndividualVolunteers[guid1].IndividualRoleApprovals["Family Coach"].Single(x => x.Version == "v1"));
        //     Assert.AreEqual(new RoleVersionApproval("v2", RoleApprovalStatus.Prospective, null), result.IndividualVolunteers[guid1].IndividualRoleApprovals["Family Coach"].Single(x => x.Version == "v2"));
        //     Assert.AreEqual(1, result.IndividualVolunteers[guid2].IndividualRoleApprovals.Count);
        //     Assert.AreEqual(2, result.IndividualVolunteers[guid2].IndividualRoleApprovals["Family Friend"].Count);
        //     Assert.AreEqual(new RoleVersionApproval("v1", RoleApprovalStatus.Prospective, null), result.IndividualVolunteers[guid2].IndividualRoleApprovals["Family Friend"].Single(x => x.Version == "v1"));
        //     Assert.AreEqual(new RoleVersionApproval("v2", RoleApprovalStatus.Prospective, null), result.IndividualVolunteers[guid2].IndividualRoleApprovals["Family Friend"].Single(x => x.Version == "v2"));
        //     Assert.AreEqual(0, result.IndividualVolunteers[guid3].IndividualRoleApprovals.Count);
        // }

        // [TestMethod]
        // public void TestCalculateVolunteerFamilyApprovalStatusWithPartialHostFamilyProgress()
        // {
        //     var result = ApprovalCalculations.CalculateVolunteerFamilyApprovalStatus(volunteerPolicy,
        //         volunteerFamily, DateTime.UtcNow,
        //         new List<CompletedRequirementInfo>
        //         {
        //             new CompletedRequirementInfo(guid6, new DateTime(2021, 7, 1), guid1, "Host Family Application", new DateTime(2021, 7, 1), null, Guid.Empty, null),
        //             new CompletedRequirementInfo(guid6, new DateTime(2021, 7, 10), guid2, "Home Screening Checklist", new DateTime(2021, 7, 8), null, Guid.Empty, null),
        //             new CompletedRequirementInfo(guid6, new DateTime(2021, 7, 10), guid3, "Host Family Interview", new DateTime(2021, 7, 10), null, Guid.Empty, null)
        //         }.ToImmutableList(),
        //         ImmutableList<ExemptedRequirementInfo>.Empty,
        //         ImmutableList<RemovedRole>.Empty,
        //         new Dictionary<Guid, ImmutableList<CompletedRequirementInfo>>
        //         {
        //             [guid1] = ImmutableList<CompletedRequirementInfo>.Empty
        //                 .Add(new CompletedRequirementInfo(guid1, new DateTime(2021, 7, 14), guid4, "Background Check", new DateTime(2021, 7, 12), null, Guid.Empty, null)),
        //             [guid2] = ImmutableList<CompletedRequirementInfo>.Empty,
        //             [guid3] = ImmutableList<CompletedRequirementInfo>.Empty
        //         }.ToImmutableDictionary(),
        //         ImmutableDictionary<Guid, ImmutableList<ExemptedRequirementInfo>>.Empty,
        //         new Dictionary<Guid, ImmutableList<RemovedRole>>
        //         {
        //             [guid1] = ImmutableList<RemovedRole>.Empty,
        //             [guid2] = ImmutableList<RemovedRole>.Empty,
        //             [guid3] = ImmutableList<RemovedRole>.Empty
        //         }.ToImmutableDictionary());

        //     Assert.AreEqual(1, result.FamilyRoleApprovals.Count);
        //     Assert.AreEqual(2, result.FamilyRoleApprovals["Host Family"].Count);
        //     Assert.AreEqual(new RoleVersionApproval("v1", RoleApprovalStatus.Prospective, null), result.FamilyRoleApprovals["Host Family"].Single(x => x.Version == "v1"));
        //     Assert.AreEqual(new RoleVersionApproval("v2", RoleApprovalStatus.Prospective, null), result.FamilyRoleApprovals["Host Family"].Single(x => x.Version == "v2"));
        //     Assert.AreEqual(3, result.IndividualVolunteers.Count);
        //     Assert.AreEqual(0, result.IndividualVolunteers[guid1].IndividualRoleApprovals.Count);
        //     Assert.AreEqual(0, result.IndividualVolunteers[guid2].IndividualRoleApprovals.Count);
        //     Assert.AreEqual(0, result.IndividualVolunteers[guid3].IndividualRoleApprovals.Count);
        // }

        // [TestMethod]
        // public void TestCalculateVolunteerFamilyApprovalStatusWithCompleteHostFamilyProgress()
        // {
        //     var result = ApprovalCalculations.CalculateVolunteerFamilyApprovalStatus(volunteerPolicy,
        //         volunteerFamily, DateTime.UtcNow,
        //         new List<CompletedRequirementInfo>
        //         {
        //             new CompletedRequirementInfo(guid6, new DateTime(2021, 7, 1), guid1, "Host Family Application", new DateTime(2021, 7, 1), null, Guid.Empty, null),
        //             new CompletedRequirementInfo(guid6, new DateTime(2021, 7, 10), guid2, "Home Screening Checklist", new DateTime(2021, 7, 8), null, Guid.Empty, null),
        //             new CompletedRequirementInfo(guid6, new DateTime(2021, 7, 10), guid3, "Host Family Interview", new DateTime(2021, 7, 10), null, Guid.Empty, null)
        //         }.ToImmutableList(),
        //         ImmutableList<ExemptedRequirementInfo>.Empty,
        //         ImmutableList<RemovedRole>.Empty,
        //         new Dictionary<Guid, ImmutableList<CompletedRequirementInfo>>
        //         {
        //             [guid1] = ImmutableList<CompletedRequirementInfo>.Empty
        //                 .Add(new CompletedRequirementInfo(guid6, new DateTime(2021, 7, 14), guid4, "Background Check", new DateTime(2021, 7, 12), null, Guid.Empty, null))
        //                 .Add(new CompletedRequirementInfo(guid6, new DateTime(2021, 7, 20), guid5, "Host Family Training", new DateTime(2021, 7, 20), null, Guid.Empty, null)),
        //             [guid2] = ImmutableList<CompletedRequirementInfo>.Empty
        //                 .Add(new CompletedRequirementInfo(guid6, new DateTime(2021, 7, 15), guid6, "Background Check", new DateTime(2021, 7, 13), null, Guid.Empty, null))
        //                 .Add(new CompletedRequirementInfo(guid6, new DateTime(2021, 7, 20), guid7, "Host Family Training", new DateTime(2021, 7, 20), null, Guid.Empty, null)),
        //             [guid3] = ImmutableList<CompletedRequirementInfo>.Empty
        //                 .Add(new CompletedRequirementInfo(guid6, new DateTime(2021, 7, 15), guid8, "Background Check", new DateTime(2021, 7, 13), null, Guid.Empty, null))
        //                 .Add(new CompletedRequirementInfo(guid6, new DateTime(2021, 7, 20), guid9, "Host Family Training", new DateTime(2021, 7, 20), null, Guid.Empty, null)),
        //         }.ToImmutableDictionary(),
        //         ImmutableDictionary<Guid, ImmutableList<ExemptedRequirementInfo>>.Empty,
        //         new Dictionary<Guid, ImmutableList<RemovedRole>>
        //         {
        //             [guid1] = ImmutableList<RemovedRole>.Empty,
        //             [guid2] = ImmutableList<RemovedRole>.Empty,
        //             [guid3] = ImmutableList<RemovedRole>.Empty
        //         }.ToImmutableDictionary());

        //     Assert.AreEqual(1, result.FamilyRoleApprovals.Count);
        //     Assert.AreEqual(2, result.FamilyRoleApprovals["Host Family"].Count);
        //     Assert.AreEqual(new RoleVersionApproval("v1", RoleApprovalStatus.Approved, null), result.FamilyRoleApprovals["Host Family"].Single(x => x.Version == "v1"));
        //     Assert.AreEqual(new RoleVersionApproval("v2", RoleApprovalStatus.Prospective, null), result.FamilyRoleApprovals["Host Family"].Single(x => x.Version == "v2"));
        //     Assert.AreEqual(3, result.IndividualVolunteers.Count);
        //     Assert.AreEqual(0, result.IndividualVolunteers[guid1].IndividualRoleApprovals.Count);
        //     Assert.AreEqual(0, result.IndividualVolunteers[guid2].IndividualRoleApprovals.Count);
        //     Assert.AreEqual(0, result.IndividualVolunteers[guid3].IndividualRoleApprovals.Count);
        // }

        // [TestMethod]
        // public void TestCalculateVolunteerFamilyApprovalStatusWithCompletionBasedOnOptOuts()
        // {
        //     var result = ApprovalCalculations.CalculateVolunteerFamilyApprovalStatus(volunteerPolicy,
        //         volunteerFamily, DateTime.UtcNow,
        //         new List<CompletedRequirementInfo>
        //         {
        //             new CompletedRequirementInfo(guid6, new DateTime(2021, 7, 1), guid1, "Host Family Application", new DateTime(2021, 7, 1), null, Guid.Empty, null),
        //             new CompletedRequirementInfo(guid6, new DateTime(2021, 7, 10), guid2, "Home Screening Checklist", new DateTime(2021, 7, 8), null, Guid.Empty, null),
        //             new CompletedRequirementInfo(guid6, new DateTime(2021, 7, 10), guid3, "Host Family Interview", new DateTime(2021, 7, 10), null, Guid.Empty, null)
        //         }.ToImmutableList(),
        //         ImmutableList<ExemptedRequirementInfo>.Empty,
        //         ImmutableList<RemovedRole>.Empty,
        //         new Dictionary<Guid, ImmutableList<CompletedRequirementInfo>>
        //         {
        //             [guid1] = ImmutableList<CompletedRequirementInfo>.Empty
        //                 .Add(new CompletedRequirementInfo(guid1, new DateTime(2021, 7, 14), guid4, "Background Check", new DateTime(2021, 7, 12), null, Guid.Empty, null))
        //                 .Add(new CompletedRequirementInfo(guid6, new DateTime(2021, 7, 20), guid5, "Host Family Training", new DateTime(2021, 7, 20), null, Guid.Empty, null)),
        //             [guid2] = ImmutableList<CompletedRequirementInfo>.Empty
        //                 .Add(new CompletedRequirementInfo(guid1, new DateTime(2021, 7, 14), guid6, "Background Check", new DateTime(2021, 7, 12), null, Guid.Empty, null)),
        //             [guid3] = ImmutableList<CompletedRequirementInfo>.Empty
        //                 .Add(new CompletedRequirementInfo(guid1, new DateTime(2021, 7, 14), guid7, "Background Check", new DateTime(2021, 7, 12), null, Guid.Empty, null))
        //         }.ToImmutableDictionary(),
        //         ImmutableDictionary<Guid, ImmutableList<ExemptedRequirementInfo>>.Empty,
        //         new Dictionary<Guid, ImmutableList<RemovedRole>>
        //         {
        //             [guid1] = ImmutableList<RemovedRole>.Empty,
        //             [guid2] = ImmutableList<RemovedRole>.Empty
        //                 .Add(new RemovedRole("Host Family", RoleRemovalReason.OptOut, "Not interested")),
        //             [guid3] = ImmutableList<RemovedRole>.Empty
        //                 .Add(new RemovedRole("Host Family", RoleRemovalReason.Inactive, "No longer planning to volunteer"))
        //         }.ToImmutableDictionary());

        //     Assert.AreEqual(1, result.FamilyRoleApprovals.Count);
        //     Assert.AreEqual(2, result.FamilyRoleApprovals["Host Family"].Count);
        //     Assert.AreEqual(new RoleVersionApproval("v1", RoleApprovalStatus.Approved, null), result.FamilyRoleApprovals["Host Family"].Single(x => x.Version == "v1"));
        //     Assert.AreEqual(new RoleVersionApproval("v2", RoleApprovalStatus.Prospective, null), result.FamilyRoleApprovals["Host Family"].Single(x => x.Version == "v2"));
        //     Assert.AreEqual(3, result.IndividualVolunteers.Count);
        //     Assert.AreEqual(0, result.IndividualVolunteers[guid1].IndividualRoleApprovals.Count);
        //     Assert.AreEqual(0, result.IndividualVolunteers[guid2].IndividualRoleApprovals.Count);
        //     Assert.AreEqual(0, result.IndividualVolunteers[guid3].IndividualRoleApprovals.Count);
        // }

        // [TestMethod]
        // public void TestCalculateVolunteerFamilyApprovalStatusWithMissingMandatoryStepsBasedOnOptOuts()
        // {
        //     var result = ApprovalCalculations.CalculateVolunteerFamilyApprovalStatus(volunteerPolicy,
        //         volunteerFamily, DateTime.UtcNow,
        //         new List<CompletedRequirementInfo>
        //         {
        //             new CompletedRequirementInfo(guid6, new DateTime(2021, 7, 1), guid1, "Host Family Application", new DateTime(2021, 7, 1), null, Guid.Empty, null),
        //             new CompletedRequirementInfo(guid6, new DateTime(2021, 7, 10), guid2, "Home Screening Checklist", new DateTime(2021, 7, 8), null, Guid.Empty, null),
        //             new CompletedRequirementInfo(guid6, new DateTime(2021, 7, 10), guid3, "Host Family Interview", new DateTime(2021, 7, 10), null, Guid.Empty, null)
        //         }.ToImmutableList(),
        //         ImmutableList<ExemptedRequirementInfo>.Empty,
        //         ImmutableList<RemovedRole>.Empty,
        //         new Dictionary<Guid, ImmutableList<CompletedRequirementInfo>>
        //         {
        //             [guid1] = ImmutableList<CompletedRequirementInfo>.Empty
        //                 .Add(new CompletedRequirementInfo(guid1, new DateTime(2021, 7, 14), guid4, "Background Check", new DateTime(2021, 7, 12), null, Guid.Empty, null))
        //                 .Add(new CompletedRequirementInfo(guid6, new DateTime(2021, 7, 20), guid5, "Host Family Training", new DateTime(2021, 7, 20), null, Guid.Empty, null)),
        //             [guid2] = ImmutableList<CompletedRequirementInfo>.Empty
        //                 .Add(new CompletedRequirementInfo(guid1, new DateTime(2021, 7, 14), guid6, "Background Check", new DateTime(2021, 7, 12), null, Guid.Empty, null)),
        //             [guid3] = ImmutableList<CompletedRequirementInfo>.Empty
        //         }.ToImmutableDictionary(),
        //         ImmutableDictionary<Guid, ImmutableList<ExemptedRequirementInfo>>.Empty,
        //         new Dictionary<Guid, ImmutableList<RemovedRole>>
        //         {
        //             [guid1] = ImmutableList<RemovedRole>.Empty,
        //             [guid2] = ImmutableList<RemovedRole>.Empty
        //                 .Add(new RemovedRole("Host Family", RoleRemovalReason.OptOut, "Not interested")),
        //             [guid3] = ImmutableList<RemovedRole>.Empty
        //                 .Add(new RemovedRole("Host Family", RoleRemovalReason.Inactive, "No longer planning to volunteer"))
        //         }.ToImmutableDictionary());

        //     Assert.AreEqual(1, result.FamilyRoleApprovals.Count);
        //     Assert.AreEqual(2, result.FamilyRoleApprovals["Host Family"].Count);
        //     Assert.AreEqual(new RoleVersionApproval("v1", RoleApprovalStatus.Prospective, null), result.FamilyRoleApprovals["Host Family"].Single(x => x.Version == "v1"));
        //     Assert.AreEqual(new RoleVersionApproval("v2", RoleApprovalStatus.Prospective, null), result.FamilyRoleApprovals["Host Family"].Single(x => x.Version == "v2"));
        //     Assert.AreEqual(3, result.IndividualVolunteers.Count);
        //     Assert.AreEqual(0, result.IndividualVolunteers[guid1].IndividualRoleApprovals.Count);
        //     Assert.AreEqual(0, result.IndividualVolunteers[guid2].IndividualRoleApprovals.Count);
        //     Assert.AreEqual(0, result.IndividualVolunteers[guid3].IndividualRoleApprovals.Count);
        // }
    }
}

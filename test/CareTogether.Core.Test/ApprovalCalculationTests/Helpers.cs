using CareTogether.Engines.PolicyEvaluation;
using CareTogether.Resources;
using CareTogether.Resources.Approvals;
using CareTogether.Resources.Policies;
using Microsoft.VisualStudio.TestTools.UnitTesting;
using System;
using System.Collections.Generic;
using System.Collections.Immutable;
using System.Linq;
using Timelines;

namespace CareTogether.Core.Test.ApprovalCalculationTests
{
    internal class Helpers
    {
        private static Guid Id(char x) => Guid.Parse("xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx".Replace('x', x));
        public static readonly Guid guid0 = Id('0');
        public static readonly Guid guid1 = Id('1');
        public static readonly Guid guid2 = Id('2');
        public static readonly Guid guid3 = Id('3');
        public static readonly Guid guid4 = Id('4');
        public static readonly Guid guid5 = Id('5');
        public static readonly Guid guid6 = Id('6');
        public static readonly Guid guid7 = Id('7');
        public static readonly Guid guid8 = Id('8');
        public static readonly Guid guid9 = Id('9');
        public static readonly Guid guida = Id('a');
        public static readonly Guid guidb = Id('b');
        public static readonly Guid guidc = Id('c');
        public static readonly Guid guidd = Id('d');
        public static readonly Guid guide = Id('e');
        public static readonly Guid guidf = Id('f');

        public const int YEAR = 2024;

        public static DateOnly D(int day) => new(YEAR, 1, day);
        public static DateTime DT(int day) => new(YEAR, 1, day);
        public static DateRange DR(int start, int? end) => new(D(start), end.HasValue ? D(end.Value) : DateOnly.MaxValue);
        public static DateRange<T> DR<T>(int start, int? end, T tag) => new(D(start), end.HasValue ? D(end.Value) : DateOnly.MaxValue, tag);

        public static void AssertDatesAre(DateOnlyTimeline dut, params int[] dates)
        {
            // Set the max date to check to something past where we'll be testing.
            for (var i = 1; i <= 31; i++)
                Assert.AreEqual(dates.Contains(i), dut.Contains(D(i)), $"Failed on {i}");
        }

        public static ImmutableList<CompletedRequirementInfo> Completed(params (string, int)[] completionsWithDates) =>
            completionsWithDates.Select(completion =>
                new CompletedRequirementInfo(Guid.Empty, DateTime.MinValue,
                    Guid.Empty, completion.Item1, new DateTime(YEAR, 1, completion.Item2), ExpiresAtUtc: null, null, null))
            .ToImmutableList();

        public static ImmutableList<CompletedRequirementInfo> CompletedUntil(params (string, int, int?)[] completionsWithDates) =>
            completionsWithDates.Select(completion =>
                new CompletedRequirementInfo(Guid.Empty, DateTime.MinValue,
                    Guid.Empty, completion.Item1, new DateTime(YEAR, 1, completion.Item2), ExpiresAtUtc: completion.Item3.HasValue ? new DateTime(YEAR, 1, completion.Item3.Value) : null, null, null))
            .ToImmutableList();

        public static ImmutableList<CompletedRequirementInfo> CompletedWithExpiry(params (string, int, int?)[] completionsWithDates) =>
            completionsWithDates.Select(completion =>
                new CompletedRequirementInfo(Guid.Empty, DateTime.MinValue,
                    Guid.Empty, completion.Item1, new DateTime(YEAR, 1, completion.Item2),
                    ExpiresAtUtc: completion.Item3.HasValue ? new DateTime(YEAR, 1, completion.Item3.Value) : null, null, null))
            .ToImmutableList();

        public static ImmutableList<ExemptedRequirementInfo> Exempted(params (string, int?)[] exemptionsWithExpirations) =>
            exemptionsWithExpirations.Select(exemption =>
                new ExemptedRequirementInfo(Guid.Empty, DateTime.MinValue,
                    exemption.Item1, DueDate: null, "", exemption.Item2.HasValue ? new DateTime(YEAR, 1, exemption.Item2.Value) : null))
            .ToImmutableList();

        public static ImmutableList<ExemptedRequirementInfo> ExemptedOn(params (string, int, int?)[] datedExemptionsWithExpirations) =>
            datedExemptionsWithExpirations.Select(exemption =>
                new ExemptedRequirementInfo(Guid.Empty, new DateTime(YEAR, 1, exemption.Item2),
                    exemption.Item1, DueDate: null, "", exemption.Item3.HasValue ? new DateTime(YEAR, 1, exemption.Item3.Value) : null))
            .ToImmutableList();

        public static ImmutableList<RoleRemoval> Removed(params string[] removedRoles) =>
            removedRoles.Select(removed =>
                new RoleRemoval(removed, RoleRemovalReason.OptOut, DateOnly.MinValue, null, null))
            .ToImmutableList();

        public static
            ImmutableDictionary<Guid, ImmutableList<CompletedRequirementInfo>>
            CompletedIndividualRequirements(params (Guid, string, int)[] completedIndividualRequirements) =>
            ImmutableDictionary<Guid, ImmutableList<CompletedRequirementInfo>>.Empty.AddRange(
                completedIndividualRequirements
                    .GroupBy(completed => completed.Item1, completed => (completed.Item2, new DateTime(YEAR, 1, completed.Item3)))
                    .Select(completed => new KeyValuePair<Guid, ImmutableList<CompletedRequirementInfo>>(completed.Key,
                        completed.Select(c => new CompletedRequirementInfo(Guid.Empty, DateTime.MinValue, new Guid(),
                            c.Item1, c.Item2, ExpiresAtUtc: null, null, null))
                        .ToImmutableList())));

        public static
            ImmutableDictionary<Guid, ImmutableList<CompletedRequirementInfo>>
            CompletedIndividualRequirementsWithExpiry(params (Guid, string, int, int?)[] completedIndividualRequirements) =>
            ImmutableDictionary<Guid, ImmutableList<CompletedRequirementInfo>>.Empty.AddRange(
                completedIndividualRequirements
                    .GroupBy(completed => completed.Item1,
                        completed => (completed.Item2, new DateTime(YEAR, 1, completed.Item3),
                            completed.Item4.HasValue ? new DateTime(YEAR, 1, completed.Item4.Value) as DateTime? : null))
                    .Select(completed => new KeyValuePair<Guid, ImmutableList<CompletedRequirementInfo>>(completed.Key,
                        completed.Select(c => new CompletedRequirementInfo(Guid.Empty, DateTime.MinValue, new Guid(),
                            c.Item1, c.Item2, ExpiresAtUtc: c.Item3, null, null))
                        .ToImmutableList())));

        public static
            ImmutableDictionary<Guid, ImmutableList<ExemptedRequirementInfo>>
            ExemptedIndividualRequirements(params (Guid, string, int?)[] exemptedIndividualRequirements) =>
            ImmutableDictionary<Guid, ImmutableList<ExemptedRequirementInfo>>.Empty.AddRange(
                exemptedIndividualRequirements
                    .GroupBy(exempted => exempted.Item1, exempted => exempted)
                    .Select(exempted => new KeyValuePair<Guid, ImmutableList<ExemptedRequirementInfo>>(exempted.Key,
                        exempted.Select(e => new ExemptedRequirementInfo(Guid.Empty, DateTime.MinValue,
                            e.Item2, DueDate: null, "", e.Item3.HasValue ? new DateTime(YEAR, 1, e.Item3.Value) : null))
                            .ToImmutableList())));

        public static
            ImmutableDictionary<Guid, ImmutableList<RoleRemoval>>
            RemovedIndividualRoles(params (Guid, string)[] removedIndividualRoles) =>
            ImmutableDictionary<Guid, ImmutableList<RoleRemoval>>.Empty.AddRange(
                removedIndividualRoles
                    .GroupBy(removed => removed.Item1, removed => removed.Item2)
                    .Select(removed => new KeyValuePair<Guid, ImmutableList<RoleRemoval>>(removed.Key,
                        removed.Select(r => new RoleRemoval(r, RoleRemovalReason.OptOut, DateOnly.MinValue, null, AdditionalComments: null))
                        .ToImmutableList())));

        public static
            ImmutableList<(Guid Id, ImmutableList<CompletedRequirementInfo> CompletedRequirements, ImmutableList<ExemptedRequirementInfo> ExemptedRequirements)>
            ActiveAdults(params (Guid, ImmutableList<CompletedRequirementInfo>, ImmutableList<ExemptedRequirementInfo>)[] activeAdults) =>
                activeAdults.ToImmutableList();

        public static
            ImmutableList<(string ActionName, RequirementStage Stage, VolunteerFamilyRequirementScope Scope, bool RequirementMetOrExempted, List<Guid> RequirementMissingForIndividuals)>
            FamilyRequirementsMet(params (string, RequirementStage, VolunteerFamilyRequirementScope, bool, List<Guid>)[] requirementsMet) =>
            requirementsMet.ToImmutableList();

        public static
            ImmutableList<(string ActionName, RequirementStage Stage, SharedCalculations.RequirementCheckResult RequirementMetOrExempted)>
            IndividualRequirementsMet(params (string, RequirementStage, bool)[] requirementsMet) =>
            requirementsMet.Select(x => (x.Item1, x.Item2, new SharedCalculations.RequirementCheckResult(x.Item3, null))).ToImmutableList();

        public static
            ImmutableList<(string ActionName, RequirementStage Stage, SharedCalculations.RequirementCheckResult RequirementMetOrExempted)>
            IndividualRequirementsMetWithExpiry(params (string, RequirementStage, bool, int?)[] requirementsMet) =>
            requirementsMet.Select(x => (x.Item1, x.Item2, new SharedCalculations.RequirementCheckResult(x.Item3, x.Item4.HasValue ? new DateOnly(YEAR, 1, x.Item4.Value) : null))).ToImmutableList();

        public static
            ImmutableList<(string ActionName, RequirementStage Stage, bool RequirementMetOrExempted)>
            IndividualRequirementsMetSimple(params (string, RequirementStage, bool)[] requirementsMet) =>
            requirementsMet.ToImmutableList();

        public static ImmutableList<VolunteerApprovalRequirement> IndividualApprovalRequirements(params (RequirementStage, string)[] requirements) =>
            requirements.Select(requirement =>
                new VolunteerApprovalRequirement(requirement.Item1, requirement.Item2))
            .ToImmutableList();

        public static ImmutableList<VolunteerFamilyApprovalRequirement> FamilyApprovalRequirements(params (RequirementStage, string, VolunteerFamilyRequirementScope)[] requirements) =>
            requirements.Select(requirement =>
                new VolunteerFamilyApprovalRequirement(requirement.Item1, requirement.Item2, requirement.Item3))
            .ToImmutableList();
    }
}

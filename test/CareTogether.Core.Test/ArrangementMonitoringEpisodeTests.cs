using System;
using System.Collections.Generic;
using System.Collections.Immutable;
using System.Linq;
using System.Threading.Tasks;
using Azure;
using CareTogether.Engines.PolicyEvaluation;
using CareTogether.Resources.Policies;
using CareTogether.Resources.V1Cases;
using Microsoft.VisualStudio.TestTools.UnitTesting;
using Newtonsoft.Json;
using H = CareTogether.Core.Test.V1CaseCalculationTests.CalculateMissingMonitoringRequirements;

namespace CareTogether.Core.Test
{
    [TestClass]
    public sealed class ArrangementMonitoringEpisodeTests
    {
        private static readonly Guid FamilyId = Guid.NewGuid();
        private static readonly Guid CaseId = Guid.NewGuid();
        private static readonly Guid ArrangementId = Guid.NewGuid();
        private static readonly Guid UserId = Guid.NewGuid();
        private static readonly DateTime Start = new(2027, 1, 1, 0, 0, 0, DateTimeKind.Utc);
        private const string Action = "Safety visit";

        private static MonitoringRequirement Rule() => new(
            new RequirementDefinition(Action, true),
            new DurationStagesRecurrencePolicy([new(TimeSpan.FromDays(2), null)]),
            Guid.NewGuid()
        );

        private static ArrangementStatusFixture Create() => new();

        [TestMethod]
        public void SeparatesRulesAndRecurringOccurrencesAndPreservesDeadlineTransitions()
        {
            var fixture = Create();
            var first = Rule();
            var second = Rule();
            var upcoming = fixture.Project(2, first, second);
            var overdue = fixture.Project(3, first, second);

            Assert.HasCount(2, upcoming);
            Assert.AreNotEqual(upcoming[0].Occurrence, upcoming[1].Occurrence);
            Assert.AreEqual(upcoming[0], overdue[0]);
            Assert.AreNotEqual(overdue[0].Occurrence, overdue[1].Occurrence);
            CollectionAssert.AreEquivalent(upcoming, fixture.Project(2, second, first));
            CollectionAssert.AreEqual(upcoming, fixture.Project(2, first, second));
            Assert.AreNotEqual(upcoming[0].Occurrence, Create().Project(2, first)[0].Occurrence);
            Assert.AreNotEqual(
                upcoming[0].Occurrence,
                fixture.Project(2, first with
                {
                    Recurrence = new OneTimeRecurrencePolicy(TimeSpan.FromDays(2)),
                })[0].Occurrence
            );
        }

        [TestMethod]
        public void PolicyWritesInvalidateTheEpisodeWithoutChangingTheOccurrence()
        {
            var fixture = Create();
            var rule = Rule();
            var firstRevision = new ETag("\"first\"");
            var nextRevision = new ETag("\"restored\"");
            var first = fixture.RowsAtRevision(2, firstRevision, rule)[0].MonitoringEpisode!;
            var overdue = fixture.RowsAtRevision(3, firstRevision, rule)[0].MonitoringEpisode!;
            var restored = fixture.RowsAtRevision(2, nextRevision, rule)[0].MonitoringEpisode!;

            Assert.AreEqual(first, overdue);
            Assert.AreEqual(first.Occurrence, restored.Occurrence);
            Assert.AreNotEqual(first, restored);
            Assert.AreEqual(firstRevision, first.PolicyRevision);
            Assert.AreEqual(nextRevision, restored.PolicyRevision);
        }

        [TestMethod]
        public async Task EvidenceEventsChangeEpisodesAndReplayPreservesTheirProvenance()
        {
            var fixture = Create();
            var rule = Rule() with { Recurrence = new OneTimeRecurrencePolicy(TimeSpan.FromDays(2)) };
            var original = fixture.Project(2, rule).Single();
            var completion = Guid.NewGuid();
            fixture.Apply(new CompleteArrangementRequirement(
                FamilyId, CaseId, [ArrangementId], completion, Action, Start.AddDays(1), null, null
            ));
            Assert.HasCount(0, fixture.Project(2, rule));
            fixture.Apply(new MarkArrangementRequirementIncomplete(
                FamilyId, CaseId, [ArrangementId], completion, Action
            ));
            var reactivated = fixture.Project(2, rule).Single();
            Assert.AreEqual(original.Occurrence, reactivated.Occurrence);
            Assert.AreNotEqual(original, reactivated);

            fixture.Apply(new ExemptArrangementRequirement(
                FamilyId, CaseId, [ArrangementId], Action, null, "", Start.AddDays(4)
            ));
            Assert.HasCount(0, fixture.Project(2, rule));
            var expired = fixture.Project(5, rule).Single();
            Assert.AreEqual(original.Occurrence, expired.Occurrence);
            Assert.AreNotEqual(reactivated, expired);

            fixture.Apply(new UnexemptArrangementRequirement(FamilyId, CaseId, [ArrangementId], Action, null));
            var unexempted = fixture.Project(2, rule).Single();
            Assert.AreNotEqual(expired, unexempted);
            fixture.Apply(new UpdateArrangementComments(FamilyId, CaseId, [ArrangementId], "Changed"));
            fixture.Apply(new CompleteArrangementRequirement(
                FamilyId, CaseId, [ArrangementId], Guid.NewGuid(), "Different action", Start, null, null
            ));
            Assert.AreEqual(unexempted, fixture.Project(2, rule).Single());
            var derived = fixture.Rows(2, rule with { Id = null }).Single().MonitoringEpisode!;
            Assert.AreEqual(unexempted.Occurrence with { RuleId = derived.Occurrence.RuleId }, derived.Occurrence);
            Assert.AreNotEqual(rule.Id, derived.Occurrence.RuleId);

            var restored = await V1CaseModel.InitializeAsync(Replay(fixture.Events));
            Assert.AreEqual(unexempted, ProjectRows(restored, 2, [rule]).Single().MonitoringEpisode);
            var legacy = await V1CaseModel.InitializeAsync(Replay(fixture.Events.Select(
                domainEvent => domainEvent is ArrangementsCommandExecuted arrangementEvent
                    ? arrangementEvent with { MonitoringChangeId = null }
                    : domainEvent
            )));
            Assert.IsNull(ProjectRows(legacy, 2, [rule]).Single().MonitoringEpisode);
        }

        private static ImmutableList<MissingArrangementRequirement> ProjectRows(
            V1CaseModel model,
            int day,
            ImmutableList<MonitoringRequirement> rules,
            ETag? policyRevision = null
        ) =>
            V1CaseCalculations.CalculateMissingMonitoringRequirements(
                H.MonitoringRequirements(rules),
                new PolicyEvaluationEngine(null!).ToArrangementEntryForCalculation(
                    model.GetV1CaseEntry(CaseId).Arrangements[ArrangementId], TimeZoneInfo.Utc
                ),
                new DateOnly(2027, 1, day),
                policyRevision
            );

        private static async IAsyncEnumerable<(V1CaseEvent, long)> Replay(IEnumerable<V1CaseEvent> events)
        {
            await Task.CompletedTask;
            var position = 0L;
            foreach (var domainEvent in events)
                yield return (JsonConvert.DeserializeObject<V1CaseEvent>(JsonConvert.SerializeObject(domainEvent))!, ++position);
        }

        private sealed class ArrangementStatusFixture
        {
            private readonly V1CaseModel model = new();
            internal List<V1CaseEvent> Events { get; } = [];

            internal ArrangementStatusFixture()
            {
                var opened = model.ExecuteV1CaseCommand(
                    new CreateReferral(FamilyId, CaseId, Start), UserId, Start
                );
                Events.Add(opened.Event);
                opened.OnCommit();
                Apply(new CreateArrangement(FamilyId, CaseId, [ArrangementId], "Hosting", Start, UserId, null));
                Apply(new StartArrangements(FamilyId, CaseId, [ArrangementId], Start));
            }

            internal void Apply(ArrangementsCommand command)
            {
                var result = model.ExecuteArrangementsCommand(command, UserId, Start);
                Events.Add(result.Event);
                result.OnCommit();
            }

            internal ImmutableList<MissingArrangementRequirement> Rows(int day, params MonitoringRequirement[] rules) =>
                ProjectRows(model, day, rules.ToImmutableList());

            internal ImmutableList<MissingArrangementRequirement> RowsAtRevision(
                int day, ETag revision, params MonitoringRequirement[] rules
            ) => ProjectRows(model, day, rules.ToImmutableList(), revision);

            internal ArrangementMonitoringEpisode[] Project(int day, params MonitoringRequirement[] rules) =>
                Rows(day, rules).Select(row => row.MonitoringEpisode!).ToArray();
        }
    }
}

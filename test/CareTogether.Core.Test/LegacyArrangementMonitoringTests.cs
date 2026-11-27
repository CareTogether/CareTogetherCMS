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
    public sealed class LegacyArrangementMonitoringTests
    {
        private static readonly Guid FamilyId = Guid.NewGuid();
        private static readonly Guid CaseId = Guid.NewGuid();
        private static readonly Guid ArrangementId = Guid.NewGuid();
        private static readonly Guid UserId = Guid.NewGuid();
        private static readonly DateTime Start = new(2026, 9, 1, 0, 0, 0, DateTimeKind.Utc);
        private static readonly (Guid, Guid) Stream = (Guid.NewGuid(), Guid.NewGuid());
        private static readonly ETag Revision = new("\"policy\"");
        private const string Action = "Family Coach Supervision";

        private static readonly MonitoringRequirement LegacyRule = new(
            new RequirementDefinition(Action, true),
            new DurationStagesRecurrencePolicy([new(TimeSpan.FromDays(7), null)])
        );

        private static List<V1CaseEvent> LegacyEvents(params ArrangementsCommand[] extra)
        {
            var model = new V1CaseModel();
            var events = new List<V1CaseEvent>();
            var opened = model.ExecuteV1CaseCommand(
                new CreateReferral(FamilyId, CaseId, Start),
                UserId,
                Start
            );
            events.Add(opened.Event);
            opened.OnCommit();
            foreach (
                var command in new ArrangementsCommand[]
                {
                    new CreateArrangement(
                        FamilyId,
                        CaseId,
                        [ArrangementId],
                        "Hosting",
                        Start,
                        UserId,
                        null
                    ),
                    new StartArrangements(FamilyId, CaseId, [ArrangementId], Start),
                }.Concat(extra)
            )
            {
                var result = model.ExecuteArrangementsCommand(command, UserId, Start);
                events.Add(result.Event with { MonitoringChangeId = null });
                result.OnCommit();
            }
            return events;
        }

        private static async IAsyncEnumerable<(V1CaseEvent, long)> Replay(
            IEnumerable<V1CaseEvent> events
        )
        {
            await Task.CompletedTask;
            var position = 0L;
            foreach (var domainEvent in events)
                yield return (
                    JsonConvert.DeserializeObject<V1CaseEvent>(
                        JsonConvert.SerializeObject(domainEvent)
                    )!,
                    ++position
                );
        }

        private static Task<V1CaseModel> Process(
            IEnumerable<V1CaseEvent> events,
            (Guid, Guid)? stream = null
        ) => V1CaseModel.InitializeAsync(Replay(events), stream ?? Stream);

        private static ImmutableList<MissingArrangementRequirement> Rows(
            V1CaseModel model,
            int day,
            ImmutableList<MonitoringRequirement> rules,
            ETag? revision = null
        ) =>
            V1CaseCalculations.CalculateMissingMonitoringRequirements(
                H.MonitoringRequirements(rules) with
                {
                    ArrangementType = "Hosting",
                },
                new PolicyEvaluationEngine(null!).ToArrangementEntryForCalculation(
                    model.GetV1CaseEntry(CaseId).Arrangements[ArrangementId],
                    TimeZoneInfo.Utc
                ),
                new DateOnly(2026, 9, day),
                revision ?? Revision
            );

        private static ArrangementMonitoringEpisode? Episode(
            V1CaseModel model,
            int day,
            params MonitoringRequirement[] rules
        ) =>
            Rows(model, day, [.. rules])
                .Single(row =>
                    row.Action.ActionName == Action
                    && (row.DueBy ?? row.PastDueSince) == new DateOnly(2026, 9, 8)
                )
                .MonitoringEpisode;

        private static void Apply(V1CaseModel model, ArrangementsCommand command)
        {
            var result = model.ExecuteArrangementsCommand(command, UserId, Start);
            result.OnCommit();
        }

        [TestMethod]
        public async Task LegacyReplayIdentityIsStableAcrossProcessesAndScopedToItsStream()
        {
            var events = LegacyEvents();
            var first = Episode(await Process(events), 2, LegacyRule);
            Assert.IsNotNull(first);
            Assert.AreEqual(first, Episode(await Process(events), 2, LegacyRule));
            Assert.AreNotEqual(
                first,
                Episode(await Process(events, (Guid.NewGuid(), Guid.NewGuid())), 2, LegacyRule)
            );
            Assert.IsNull(
                Episode(await V1CaseModel.InitializeAsync(Replay(events)), 2, LegacyRule)
            );

            var unrelated = new V1CaseModel()
                .ExecuteV1CaseCommand(
                    new CreateReferral(Guid.NewGuid(), Guid.NewGuid(), Start),
                    UserId,
                    Start
                )
                .Event;
            var shifted = new List<V1CaseEvent> { unrelated };
            shifted.AddRange(events);
            Assert.AreNotEqual(
                first.LifecycleChangeId,
                Episode(await Process(shifted), 2, LegacyRule)?.LifecycleChangeId
            );
        }

        [TestMethod]
        public async Task PersistedEventIdentitiesArePreservedAlongsideLegacyHistory()
        {
            var events = LegacyEvents();
            var model = await Process(events);
            var persisted = Guid.NewGuid();
            var start = new ArrangementsCommandExecuted(
                UserId,
                Start,
                new StartArrangements(FamilyId, CaseId, [ArrangementId], Start)
            )
            {
                MonitoringChangeId = persisted,
            };
            var restarted = await Process(events.Take(2).Append(start));
            Assert.AreEqual(persisted, Episode(restarted, 3, LegacyRule)!.LifecycleChangeId);
            Assert.AreNotEqual(Episode(model, 3, LegacyRule), Episode(restarted, 3, LegacyRule));
        }

        [TestMethod]
        public async Task LegacyRuleIdentityIsContentScopedAndRejectsAmbiguity()
        {
            var model = await Process(LegacyEvents());
            var other = new MonitoringRequirement(
                new RequirementDefinition("One Time Checkin", true),
                new OneTimeRecurrencePolicy(TimeSpan.FromDays(3))
            );
            var baseline = Episode(model, 2, LegacyRule, other);
            Assert.IsNotNull(baseline);
            Assert.AreEqual(baseline, Episode(model, 2, other, LegacyRule));
            Assert.IsNotNull(
                Rows(model, 2, [LegacyRule, other])
                    .Single(row => row.Action.ActionName == "One Time Checkin")
                    .MonitoringEpisode
            );

            Assert.IsTrue(
                Rows(model, 2, [LegacyRule, LegacyRule]).All(row => row.MonitoringEpisode is null)
            );
            var conflicting = LegacyRule with
            {
                Recurrence = new DurationStagesRecurrencePolicy([new(TimeSpan.FromDays(7), 2)]),
            };
            Assert.IsTrue(
                Rows(model, 2, [LegacyRule, conflicting]).All(row => row.MonitoringEpisode is null)
            );
            var persisted = LegacyRule with { Id = Guid.NewGuid() };
            Assert.AreEqual(persisted.Id, Episode(model, 2, persisted)!.Occurrence.RuleId);
            Assert.IsNull(Episode(model, 2, LegacyRule with { Id = Guid.Empty }));

            var hosting = H.MonitoringRequirements([LegacyRule]) with
            {
                ArrangementType = "Hosting",
            };
            var friending = hosting with { ArrangementType = "Friending" };
            Assert.AreNotEqual(
                ArrangementMonitoringEpisode.RuleIdentity(hosting, LegacyRule),
                ArrangementMonitoringEpisode.RuleIdentity(friending, LegacyRule)
            );
            Assert.AreNotEqual(
                ArrangementMonitoringEpisode.RuleIdentity(hosting, LegacyRule),
                ArrangementMonitoringEpisode.RuleIdentity(hosting, conflicting)
            );
            var childCare = ArrangementMonitoringEpisode.RuleIdentity(
                hosting,
                LegacyRule with
                {
                    Recurrence = new ChildCareOccurrenceBasedRecurrencePolicy(
                        TimeSpan.FromDays(1),
                        1,
                        0,
                        false
                    ),
                }
            );
            Assert.IsNotNull(childCare);
            Assert.AreNotEqual(
                ArrangementMonitoringEpisode.RuleIdentity(hosting, LegacyRule),
                childCare
            );
        }

        [TestMethod]
        public async Task LegacyEpisodesTransitionAndReactivateLikeStampedEpisodes()
        {
            var model = await Process(LegacyEvents());
            var upcoming = Episode(model, 2, LegacyRule)!;
            Assert.AreEqual(upcoming, Episode(model, 8, LegacyRule));
            Assert.AreNotEqual(
                upcoming,
                Rows(model, 2, [LegacyRule], new ETag("\"restored\"")).Single().MonitoringEpisode
            );
            Assert.AreEqual(
                upcoming.Occurrence,
                Rows(model, 2, [LegacyRule], new ETag("\"restored\""))
                    .Single()
                    .MonitoringEpisode!.Occurrence
            );

            var completion = Guid.NewGuid();
            Apply(
                model,
                new CompleteArrangementRequirement(
                    FamilyId,
                    CaseId,
                    [ArrangementId],
                    completion,
                    Action,
                    Start.AddDays(7),
                    null,
                    null
                )
            );
            Apply(
                model,
                new MarkArrangementRequirementIncomplete(
                    FamilyId,
                    CaseId,
                    [ArrangementId],
                    completion,
                    Action
                )
            );
            var reactivated = Episode(model, 2, LegacyRule)!;
            Assert.AreEqual(upcoming.Occurrence, reactivated.Occurrence);
            Assert.AreNotEqual(upcoming, reactivated);

            Apply(
                model,
                new ExemptArrangementRequirement(
                    FamilyId,
                    CaseId,
                    [ArrangementId],
                    Action,
                    null,
                    "",
                    Start.AddDays(3)
                )
            );
            Assert.IsFalse(Rows(model, 2, [LegacyRule]).Any());
            var expired = Episode(model, 4, LegacyRule)!;
            Assert.AreNotEqual(reactivated, expired);
            Apply(
                model,
                new UnexemptArrangementRequirement(FamilyId, CaseId, [ArrangementId], Action, null)
            );
            Assert.AreNotEqual(expired, Episode(model, 2, LegacyRule));
        }

        [TestMethod]
        public async Task LegacyReactivationHistoryReplaysToTheSameEpisode()
        {
            var completion = Guid.NewGuid();
            var events = LegacyEvents(
                new CompleteArrangementRequirement(
                    FamilyId,
                    CaseId,
                    [ArrangementId],
                    completion,
                    Action,
                    Start.AddDays(7),
                    null,
                    null
                ),
                new MarkArrangementRequirementIncomplete(
                    FamilyId,
                    CaseId,
                    [ArrangementId],
                    completion,
                    Action
                )
            );
            var replayed = Episode(await Process(events), 2, LegacyRule)!;
            Assert.AreEqual(replayed, Episode(await Process(events), 2, LegacyRule));
            Assert.AreNotEqual(Episode(await Process(events.Take(3)), 2, LegacyRule), replayed);
            Assert.IsNotNull(replayed.EvidenceChangeId);
        }
    }
}

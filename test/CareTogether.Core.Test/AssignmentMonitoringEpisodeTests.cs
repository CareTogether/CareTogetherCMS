using System;
using System.Collections.Generic;
using System.Collections.Immutable;
using System.Linq;
using System.Threading.Tasks;
using Azure;
using CareTogether.Engines.PolicyEvaluation;
using CareTogether.Managers.Records;
using CareTogether.Resources.Policies;
using CareTogether.Resources.V1Cases;
using Microsoft.VisualStudio.TestTools.UnitTesting;
using Newtonsoft.Json;
using H = CareTogether.Core.Test.V1CaseCalculationTests.CalculateMissingMonitoringRequirements;

namespace CareTogether.Core.Test
{
    [TestClass]
    public sealed class AssignmentMonitoringEpisodeTests
    {
        private static readonly Guid FamilyId = Guid.NewGuid();
        private static readonly Guid CaseId = Guid.NewGuid();
        private static readonly Guid ArrangementId = Guid.NewGuid();
        private static readonly Guid UserId = Guid.NewGuid();
        private static readonly Guid Volunteers = Guid.NewGuid();
        private static readonly Guid OtherVolunteers = Guid.NewGuid();
        private static readonly Guid FirstCoach = Guid.NewGuid();
        private static readonly Guid SecondCoach = Guid.NewGuid();
        private static readonly DateTime Start = new(2026, 9, 1, 0, 0, 0, DateTimeKind.Utc);
        private static readonly (Guid, Guid) Stream = (Guid.NewGuid(), Guid.NewGuid());
        private static readonly ETag Revision = new("\"policy\"");
        private const string Function = "Family Coach";
        private const string Variant = "Primary";
        private const string Action = "Family Coach Safety Visit";

        private static readonly MonitoringRequirement PerChildLocation = new(
            new RequirementDefinition(Action, true),
            new DurationStagesPerChildLocationRecurrencePolicy([
                new(TimeSpan.FromDays(2), 1),
                new(TimeSpan.FromDays(7), null),
            ])
        );

        private static readonly MonitoringRequirement PerOccurrence = new(
            new RequirementDefinition(Action, true),
            new ChildCareOccurrenceBasedRecurrencePolicy(TimeSpan.FromDays(1), 1, 0, true)
        );

        private static ArrangementPolicy Policy(params MonitoringRequirement[] rules) =>
            H.MonitoringRequirements([]) with
            {
                ArrangementType = "Hosting",
                ArrangementFunctions =
                [
                    new ArrangementFunction(
                        Function,
                        FunctionRequirement.ZeroOrMore,
                        null,
                        null,
                        null,
                        [
                            new ArrangementFunctionVariant(
                                Variant,
                                [],
                                [],
                                [],
                                null,
                                [.. rules],
                                null
                            ),
                        ]
                    ),
                ],
            };

        private sealed class Fixture
        {
            internal V1CaseModel Model { get; private set; } = new();
            internal List<V1CaseEvent> Events { get; } = [];

            internal Fixture()
            {
                var opened = Model.ExecuteV1CaseCommand(
                    new CreateReferral(FamilyId, CaseId, Start),
                    UserId,
                    Start
                );
                Events.Add(opened.Event);
                opened.OnCommit();
                Apply(
                    new CreateArrangement(
                        FamilyId,
                        CaseId,
                        [ArrangementId],
                        "Hosting",
                        Start,
                        UserId,
                        null
                    )
                );
                Apply(new StartArrangements(FamilyId, CaseId, [ArrangementId], Start));
                Apply(AssignFamily(Volunteers));
                Apply(AssignCoach(FirstCoach));
                Apply(AssignCoach(SecondCoach));
                Apply(Location(Volunteers, 0));
            }

            internal void Apply(ArrangementsCommand command)
            {
                var result = Model.ExecuteArrangementsCommand(command, UserId, Start);
                Events.Add(result.Event);
                result.OnCommit();
            }

            internal async Task<Fixture> Replayed(bool legacy, (Guid, Guid)? stream = null)
            {
                var replayed = new Fixture();
                replayed.Events.Clear();
                replayed.Events.AddRange(Events);
                replayed.Model = await V1CaseModel.InitializeAsync(
                    Replay(
                        legacy
                            ? Events.Select(domainEvent =>
                                domainEvent is ArrangementsCommandExecuted executed
                                    ? executed with
                                    {
                                        MonitoringChangeId = null,
                                    }
                                    : domainEvent
                            )
                            : Events
                    ),
                    stream ?? Stream
                );
                return replayed;
            }

            internal Engines.PolicyEvaluation.ArrangementEntry Calculation(
                TimeZoneInfo? timeZone = null
            ) =>
                new PolicyEvaluationEngine(null!).ToArrangementEntryForCalculation(
                    Model.GetV1CaseEntry(CaseId).Arrangements[ArrangementId],
                    timeZone ?? TimeZoneInfo.Utc
                );

            internal ImmutableList<MissingArrangementRequirement> Rows(
                int day,
                MonitoringRequirement rule,
                Engines.PolicyEvaluation.ArrangementEntry? calculation = null
            ) =>
                V1CaseCalculations.CalculateMissingMonitoringRequirements(
                    Policy(rule),
                    calculation ?? Calculation(),
                    new DateOnly(2026, 9, day),
                    Revision
                );

            internal ArrangementMonitoringEpisode? Episode(
                int day,
                MonitoringRequirement rule,
                Guid volunteerFamily,
                Guid? person,
                int dueDay
            ) =>
                Rows(day, rule)
                    .Single(row =>
                        row.VolunteerFamilyId == volunteerFamily
                        && row.PersonId == person
                        && (row.DueBy ?? row.PastDueSince) == new DateOnly(2026, 9, dueDay)
                    )
                    .MonitoringEpisode;
        }

        private static AssignVolunteerFamily AssignFamily(Guid volunteerFamily) =>
            new(FamilyId, CaseId, [ArrangementId], volunteerFamily, Function, Variant);

        private static UnassignVolunteerFamily UnassignFamily(Guid volunteerFamily) =>
            new(FamilyId, CaseId, [ArrangementId], volunteerFamily, Function, Variant);

        private static AssignIndividualVolunteer AssignCoach(Guid person) =>
            new(FamilyId, CaseId, [ArrangementId], Volunteers, person, Function, Variant);

        private static UnassignIndividualVolunteer UnassignCoach(Guid person) =>
            new(FamilyId, CaseId, [ArrangementId], Volunteers, person, Function, Variant);

        private static TrackChildLocationChange Location(
            Guid locationFamily,
            int day,
            ChildLocationPlan plan = ChildLocationPlan.OvernightHousing
        ) =>
            new(
                FamilyId,
                CaseId,
                [ArrangementId],
                Start.AddDays(day),
                locationFamily,
                Guid.Empty,
                plan,
                null
            );

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

        [TestMethod]
        public async Task FamilyAndIndividualAssignmentsHaveIndependentStableEpisodes()
        {
            var fixture = new Fixture();
            var family = fixture.Episode(2, PerChildLocation, Volunteers, null, 3)!;
            var first = fixture.Episode(2, PerChildLocation, Volunteers, FirstCoach, 3)!;
            var second = fixture.Episode(2, PerChildLocation, Volunteers, SecondCoach, 3)!;

            Assert.AreEqual(3, new[] { family, first, second }.Distinct().Count());
            Assert.AreEqual(
                3,
                new[] { family, first, second }
                    .Select(episode => ArrangementSnoozeCertification.Token(episode, Revision))
                    .Distinct()
                    .Count()
            );
            Assert.AreEqual(
                first.Occurrence with
                {
                    AssignmentLifetimeId = second.Occurrence.AssignmentLifetimeId,
                },
                second.Occurrence
            );
            Assert.AreEqual(first, fixture.Episode(3, PerChildLocation, Volunteers, FirstCoach, 3));

            var restarted = await fixture.Replayed(legacy: false);
            Assert.AreEqual(
                first,
                restarted.Episode(2, PerChildLocation, Volunteers, FirstCoach, 3)
            );

            var legacy = await fixture.Replayed(legacy: true);
            var legacyFirst = legacy.Episode(2, PerChildLocation, Volunteers, FirstCoach, 3);
            Assert.IsNotNull(legacyFirst);
            Assert.AreEqual(
                legacyFirst,
                (await fixture.Replayed(legacy: true)).Episode(
                    2,
                    PerChildLocation,
                    Volunteers,
                    FirstCoach,
                    3
                )
            );
            Assert.AreNotEqual(
                legacyFirst,
                (await fixture.Replayed(legacy: true, (Guid.NewGuid(), Guid.NewGuid()))).Episode(
                    2,
                    PerChildLocation,
                    Volunteers,
                    FirstCoach,
                    3
                )
            );
            Assert.IsNull(
                (
                    await V1CaseModel.InitializeAsync(
                        Replay(
                            fixture.Events.Select(domainEvent =>
                                domainEvent is ArrangementsCommandExecuted executed
                                    ? executed with
                                    {
                                        MonitoringChangeId = null,
                                    }
                                    : domainEvent
                            )
                        )
                    )
                )
                    .GetV1CaseEntry(CaseId)
                    .Arrangements[ArrangementId]
                    .MonitoringHistory
            );
        }

        [TestMethod]
        public void ReassignmentStartsANewLifetimeWithoutAffectingOtherAssignments()
        {
            var fixture = new Fixture();
            var family = fixture.Episode(2, PerChildLocation, Volunteers, null, 3)!;
            var coach = fixture.Episode(2, PerChildLocation, Volunteers, FirstCoach, 3)!;

            fixture.Apply(UnassignCoach(FirstCoach));
            Assert.IsFalse(
                fixture.Rows(2, PerChildLocation).Any(row => row.PersonId == FirstCoach)
            );
            fixture.Apply(AssignCoach(FirstCoach));
            var reassigned = fixture.Episode(2, PerChildLocation, Volunteers, FirstCoach, 3)!;
            Assert.AreNotEqual(coach, reassigned);
            Assert.AreEqual(
                coach.Occurrence with
                {
                    AssignmentLifetimeId = reassigned.Occurrence.AssignmentLifetimeId,
                },
                reassigned.Occurrence
            );
            Assert.AreEqual(family, fixture.Episode(2, PerChildLocation, Volunteers, null, 3));

            fixture.Apply(UnassignFamily(Volunteers));
            fixture.Apply(AssignFamily(Volunteers));
            Assert.AreNotEqual(family, fixture.Episode(2, PerChildLocation, Volunteers, null, 3));
        }

        [TestMethod]
        public void DuplicateAssignmentsAndAmbiguousRulesStayVisibleWithoutEpisodes()
        {
            var fixture = new Fixture();
            fixture.Apply(AssignFamily(Volunteers));
            var duplicated = fixture
                .Rows(2, PerChildLocation)
                .Where(row => row.PersonId is null)
                .ToList();
            Assert.IsNotEmpty(duplicated);
            Assert.IsTrue(duplicated.All(row => row.MonitoringEpisode is null));
            Assert.IsTrue(
                fixture
                    .Rows(2, PerChildLocation)
                    .Where(row => row.PersonId is not null)
                    .All(row => row.MonitoringEpisode is not null)
            );

            fixture.Apply(UnassignFamily(Volunteers));
            fixture.Apply(AssignFamily(Volunteers));
            Assert.IsNotNull(fixture.Episode(2, PerChildLocation, Volunteers, null, 3));

            var ambiguous = V1CaseCalculations.CalculateMissingMonitoringRequirements(
                Policy(
                    PerChildLocation,
                    PerChildLocation with
                    {
                        Recurrence = PerOccurrence.Recurrence,
                    }
                ),
                fixture.Calculation(),
                new DateOnly(2026, 9, 2),
                Revision
            );
            Assert.IsNotEmpty(ambiguous);
            Assert.IsTrue(ambiguous.All(row => row.MonitoringEpisode is null));

            var persisted = PerChildLocation with { Id = Guid.NewGuid() };
            Assert.AreEqual(
                persisted.Id,
                fixture.Rows(2, persisted).First().MonitoringEpisode!.Occurrence.RuleId
            );
        }

        [TestMethod]
        public void AssignmentEvidenceChangesOnlyTheAffectedAssignment()
        {
            var fixture = new Fixture();
            var family = fixture.Episode(2, PerChildLocation, Volunteers, null, 3)!;
            var coach = fixture.Episode(2, PerChildLocation, Volunteers, FirstCoach, 3)!;
            var completion = Guid.NewGuid();

            fixture.Apply(
                new CompleteIndividualVolunteerAssignmentRequirement(
                    FamilyId,
                    CaseId,
                    [ArrangementId],
                    Function,
                    Variant,
                    Volunteers,
                    FirstCoach,
                    completion,
                    Action,
                    Start.AddDays(2),
                    null,
                    null
                )
            );
            Assert.IsFalse(
                fixture
                    .Rows(2, PerChildLocation)
                    .Any(row => row.PersonId == FirstCoach && row.DueBy == new DateOnly(2026, 9, 3))
            );
            fixture.Apply(
                new MarkIndividualVolunteerAssignmentRequirementIncomplete(
                    FamilyId,
                    CaseId,
                    [ArrangementId],
                    Function,
                    Variant,
                    Volunteers,
                    FirstCoach,
                    completion,
                    Action
                )
            );
            var reactivated = fixture.Episode(2, PerChildLocation, Volunteers, FirstCoach, 3)!;
            Assert.AreNotEqual(coach, reactivated);
            Assert.AreEqual(coach.Occurrence, reactivated.Occurrence);
            Assert.AreEqual(family, fixture.Episode(2, PerChildLocation, Volunteers, null, 3));

            fixture.Apply(
                new ExemptVolunteerFamilyAssignmentRequirement(
                    FamilyId,
                    CaseId,
                    [ArrangementId],
                    Function,
                    Variant,
                    Volunteers,
                    null,
                    Action,
                    null,
                    "",
                    Start.AddDays(3)
                )
            );
            Assert.IsFalse(fixture.Rows(2, PerChildLocation).Any(row => row.PersonId is null));
            var expired = fixture.Episode(4, PerChildLocation, Volunteers, null, 3)!;
            Assert.AreNotEqual(family, expired);
            fixture.Apply(
                new UnexemptVolunteerFamilyAssignmentRequirement(
                    FamilyId,
                    CaseId,
                    [ArrangementId],
                    Function,
                    Variant,
                    Volunteers,
                    null,
                    Action,
                    null
                )
            );
            Assert.AreNotEqual(expired, fixture.Episode(2, PerChildLocation, Volunteers, null, 3));
            Assert.AreEqual(
                reactivated,
                fixture.Episode(2, PerChildLocation, Volunteers, FirstCoach, 3)
            );
        }

        [TestMethod]
        public void PerChildLocationEpisodesFollowOnlyTheHistoryBeforeTheirDueDate()
        {
            var fixture = new Fixture();
            var upcoming = fixture.Episode(2, PerChildLocation, Volunteers, null, 3)!;
            Assert.AreEqual(upcoming, fixture.Episode(3, PerChildLocation, Volunteers, null, 3));

            fixture.Apply(Location(OtherVolunteers, 6));
            Assert.AreEqual(upcoming, fixture.Episode(3, PerChildLocation, Volunteers, null, 3));
            Assert.IsTrue(
                fixture
                    .Rows(12, PerChildLocation)
                    .Where(row => row.VolunteerFamilyId == Volunteers)
                    .All(row => row.MonitoringEpisode is not null)
            );

            fixture.Apply(
                new DeleteChildLocationChange(
                    FamilyId,
                    CaseId,
                    [ArrangementId],
                    Start,
                    Volunteers,
                    Guid.Empty,
                    null
                )
            );
            fixture.Apply(Location(Volunteers, 1));
            var moved = fixture.Episode(3, PerChildLocation, Volunteers, null, 4)!;
            Assert.AreNotEqual(upcoming.Occurrence, moved.Occurrence);
            Assert.AreNotEqual(
                upcoming.Occurrence.ChildcareProvenance,
                moved.Occurrence.ChildcareProvenance
            );
        }

        [TestMethod]
        public void ChildCareOccurrencesAreIndependentlyIdentified()
        {
            var fixture = new Fixture();
            fixture.Apply(Location(FamilyId, 1, ChildLocationPlan.WithParent));
            fixture.Apply(Location(Volunteers, 4));
            var first = fixture.Episode(6, PerOccurrence, Volunteers, null, 2)!;
            var second = fixture.Episode(6, PerOccurrence, Volunteers, null, 6)!;
            Assert.AreNotEqual(first.Occurrence, second.Occurrence);
            Assert.AreNotEqual(
                ArrangementSnoozeCertification.Token(first, Revision),
                ArrangementSnoozeCertification.Token(second, Revision)
            );
            Assert.AreEqual(first, fixture.Episode(1, PerOccurrence, Volunteers, null, 2));

            fixture.Apply(Location(FamilyId, 8, ChildLocationPlan.WithParent));
            fixture.Apply(Location(Volunteers, 9));
            Assert.AreEqual(first, fixture.Episode(11, PerOccurrence, Volunteers, null, 2));
            Assert.AreEqual(second, fixture.Episode(11, PerOccurrence, Volunteers, null, 6));

            fixture.Apply(
                new DeleteChildLocationChange(
                    FamilyId,
                    CaseId,
                    [ArrangementId],
                    Start,
                    Volunteers,
                    Guid.Empty,
                    null
                )
            );
            Assert.IsFalse(
                fixture
                    .Rows(11, PerOccurrence)
                    .Any(row => (row.DueBy ?? row.PastDueSince) == new DateOnly(2026, 9, 2))
            );
            Assert.AreNotEqual(second, fixture.Episode(11, PerOccurrence, Volunteers, null, 6));
        }

        [TestMethod]
        public void ArrangementLevelChildcareRulesAreSupportedWithoutAssignmentScope()
        {
            var fixture = new Fixture();
            var rows = V1CaseCalculations.CalculateMissingMonitoringRequirements(
                H.MonitoringRequirements([PerChildLocation]) with
                {
                    ArrangementType = "Hosting",
                },
                fixture.Calculation(),
                new DateOnly(2026, 9, 2),
                Revision
            );
            var episode = rows.Single(row => row.VolunteerFamilyId is null).MonitoringEpisode!;
            Assert.IsNull(episode.Occurrence.AssignmentLifetimeId);
            Assert.IsNotNull(episode.Occurrence.ChildcareProvenance);
        }

        [TestMethod]
        public void ArrangementLevelTokensKeepTheirExistingEncoding()
        {
            var rule = new MonitoringRequirement(
                new RequirementDefinition("Family Coach Supervision", true),
                new DurationStagesRecurrencePolicy([new(TimeSpan.FromDays(7), null)])
            );
            var policy = H.MonitoringRequirements([rule]) with { ArrangementType = "Hosting" };
            Assert.AreEqual(
                new Guid(
                    System
                        .Security.Cryptography.SHA256.HashData(
                            System.Text.Encoding.UTF8.GetBytes(
                                System.Text.Json.JsonSerializer.Serialize(
                                    new object?[]
                                    {
                                        "legacy-monitoring-rule",
                                        "Hosting",
                                        rule.Action.ActionName,
                                        true,
                                        System.Text.Json.JsonSerializer.Serialize(
                                            new object?[]
                                            {
                                                "duration",
                                                new[]
                                                {
                                                    new object?[]
                                                    {
                                                        TimeSpan.FromDays(7).Ticks,
                                                        null,
                                                    },
                                                },
                                            }
                                        ),
                                    }
                                )
                            )
                        )
                        .AsSpan(0, 16)
                ),
                ArrangementMonitoringEpisode.RuleIdentity(policy, rule)
            );

            var episode = V1CaseCalculations
                .CalculateMissingMonitoringRequirements(
                    policy,
                    new Fixture().Calculation(),
                    new DateOnly(2026, 9, 9),
                    Revision
                )
                .First()
                .MonitoringEpisode!;
            Assert.IsNull(episode.Occurrence.AssignmentLifetimeId);
            Assert.IsNull(episode.Occurrence.ChildcareProvenance);
            var occurrence = episode.Occurrence;
            var previousEncoding = Convert
                .ToBase64String(
                    System.Security.Cryptography.SHA256.HashData(
                        System.Text.Encoding.UTF8.GetBytes(
                            System.Text.Json.JsonSerializer.Serialize(
                                new string?[]
                                {
                                    "arrangement-monitoring",
                                    occurrence.ArrangementId.ToString(),
                                    occurrence.ArrangementCreationId.ToString(),
                                    occurrence.RuleId.ToString(),
                                    occurrence.Schedule,
                                    occurrence.ScheduleStart.ToString("O"),
                                    occurrence.DueDate.ToString("O"),
                                    episode.LifecycleChangeId.ToString(),
                                    episode.EvidenceChangeId?.ToString(),
                                    Revision.ToString(),
                                }
                            )
                        )
                    )
                )
                .TrimEnd('=')
                .Replace('+', '-')
                .Replace('/', '_');
            Assert.AreEqual(
                previousEncoding,
                ArrangementSnoozeCertification.Token(episode, Revision)
            );
        }

        [TestMethod]
        public void SameDateChildCareOccurrencesStayVisibleWithoutSharedEpisodes()
        {
            var fixture = new Fixture();
            fixture.Apply(
                new TrackChildLocationChange(
                    FamilyId,
                    CaseId,
                    [ArrangementId],
                    Start.AddHours(6),
                    Volunteers,
                    Guid.NewGuid(),
                    ChildLocationPlan.DaytimeChildCare,
                    null
                )
            );
            fixture.Apply(Location(Volunteers, 4));
            var rows = fixture.Rows(6, PerOccurrence).Where(row => row.PersonId is null).ToList();
            var sameDate = rows.Where(row =>
                    (row.DueBy ?? row.PastDueSince) == new DateOnly(2026, 9, 2)
                )
                .ToList();
            Assert.HasCount(2, sameDate);
            Assert.IsTrue(sameDate.All(row => row.MonitoringEpisode is null));
            Assert.IsNotNull(fixture.Episode(6, PerOccurrence, Volunteers, null, 6));
        }

        [TestMethod]
        public void LocationTimeZoneDeterminesOccurrenceDates()
        {
            var fixture = new Fixture();
            fixture.Apply(Location(OtherVolunteers, 6));
            var hawaii = TimeZoneInfo.CreateCustomTimeZone(
                "UTC-10",
                TimeSpan.FromHours(-10),
                "UTC-10",
                "UTC-10"
            );
            var tokyo = TimeZoneInfo.CreateCustomTimeZone(
                "UTC+9",
                TimeSpan.FromHours(9),
                "UTC+9",
                "UTC+9"
            );
            ArrangementMonitoringEpisode[] Episodes(TimeZoneInfo timeZone) =>
                [
                    .. V1CaseCalculations
                        .CalculateMissingMonitoringRequirements(
                            Policy(PerChildLocation),
                            fixture.Calculation(timeZone),
                            new DateOnly(2026, 9, 2),
                            Revision
                        )
                        .Where(row => row.PersonId is null)
                        .Select(row => row.MonitoringEpisode!),
                ];
            var utc = Episodes(TimeZoneInfo.Utc);
            CollectionAssert.AreEqual(utc, Episodes(tokyo));
            Assert.IsTrue(
                utc.Zip(Episodes(hawaii))
                    .All(pair => pair.First.Occurrence != pair.Second.Occurrence)
            );
        }
    }
}

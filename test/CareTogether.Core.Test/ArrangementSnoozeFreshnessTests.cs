using System;
using System.Collections.Generic;
using System.Collections.Immutable;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using Azure;
using Azure.Storage.Blobs;
using Azure.Storage.Blobs.Models;
using CareTogether.Engines.PolicyEvaluation;
using CareTogether.Managers;
using CareTogether.Managers.Records;
using CareTogether.Resources.Accounts;
using CareTogether.Resources.Policies;
using CareTogether.Resources.V1Cases;
using CareTogether.Utilities.EventLog;
using CareTogether.Utilities.ObjectStore;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.VisualStudio.TestTools.UnitTesting;
using Newtonsoft.Json;
using H = CareTogether.Core.Test.V1CaseCalculationTests.CalculateMissingMonitoringRequirements;

namespace CareTogether.Core.Test
{
    [TestClass]
    public sealed class ArrangementSnoozeFreshnessTests
    {
        private static readonly Guid UserId = Guid.NewGuid();
        private static readonly DateTime Start = new(2027, 1, 1, 0, 0, 0, DateTimeKind.Utc);
        private const string Action = "Safety visit";

        private static readonly MonitoringRequirement Rule = new(
            new RequirementDefinition(Action, true),
            new DurationStagesRecurrencePolicy([new(TimeSpan.FromDays(2), null)]),
            Guid.NewGuid()
        );

        private Guid organizationId;
        private Guid locationId;
        private Guid familyId;
        private Guid caseId;
        private Guid arrangementId;
        private BlobServiceClient client = null!;

        [TestInitialize]
        public async Task Initialize()
        {
            var options = new BlobClientOptions(BlobClientOptions.ServiceVersion.V2021_10_04);
            options.Retry.MaxRetries = 0;
            client = new BlobServiceClient("UseDevelopmentStorage=true", options);
            try
            {
                await client.GetPropertiesAsync();
            }
            catch (RequestFailedException ex) when (ex.Status == 0)
            {
                Assert.Inconclusive("Local Azurite Blob service is unavailable.");
            }
            (organizationId, locationId, familyId, caseId, arrangementId) = (
                Guid.NewGuid(),
                Guid.NewGuid(),
                Guid.NewGuid(),
                Guid.NewGuid(),
                Guid.NewGuid()
            );
        }

        [TestCleanup]
        public async Task Cleanup() =>
            await client.GetBlobContainerClient(organizationId.ToString()).DeleteIfExistsAsync();

        private V1CasesResource Process() =>
            new(new AppendBlobEventLog<V1CaseEvent>(client, "ReferralsEventLog"));

        private PoliciesResource Policies() =>
            new(
                new MemoryObjectStore<OrganizationConfiguration>(),
                new JsonBlobObjectStore<EffectiveLocationPolicy>(
                    client,
                    "LocationPolicies",
                    new MemoryCache(new MemoryCacheOptions()),
                    TimeSpan.FromMinutes(1)
                ),
                new MemoryObjectStore<OrganizationSecrets>(),
                new MemoryEventLog<PersonAccessEvent>()
            );

        private static EffectiveLocationPolicy PolicyFixture() =>
            JsonConvert.DeserializeObject<EffectiveLocationPolicy>(
                File.ReadAllText(
                    Path.Combine(
                        AppContext.BaseDirectory,
                        "Fixtures",
                        "asf-role-reference-policy.json"
                    )
                )
            )!;

        private Task<Resources.V1Cases.V1CaseEntry> Arrange(
            V1CasesResource process,
            ArrangementsCommand command
        ) => process.ExecuteArrangementsCommandAsync(organizationId, locationId, command, UserId);

        private async Task OpenStartedArrangement(V1CasesResource process)
        {
            await process.ExecuteV1CaseCommandAsync(
                organizationId,
                locationId,
                new CreateReferral(familyId, caseId, Start),
                UserId
            );
            await Arrange(
                process,
                new CreateArrangement(
                    familyId,
                    caseId,
                    [arrangementId],
                    "Hosting",
                    Start,
                    UserId,
                    null
                )
            );
            await Arrange(process, new StartArrangements(familyId, caseId, [arrangementId], Start));
        }

        private async Task<long?> Verify(V1CasesResource process) =>
            await process.GetReplayPositionAsync(organizationId, locationId) is { } position
                ? await process.VerifyReplayPositionAsync(organizationId, locationId, position)
                : null;

        [TestMethod]
        public async Task ReplayPositionIsCertifiedOnlyWhileItMatchesTheAuthoritativeStream()
        {
            var first = Process();
            var empty = await first.GetReplayPositionAsync(organizationId, locationId);
            Assert.AreEqual(new EventLogPosition(0, null, default, 0), empty);
            Assert.AreEqual(0L, await Verify(first));

            await first.ExecuteV1CaseCommandAsync(
                organizationId,
                locationId,
                new CreateReferral(familyId, caseId, Start),
                UserId
            );
            Assert.AreEqual(1L, await Verify(first));

            var second = Process();
            Assert.AreEqual(
                await first.GetReplayPositionAsync(organizationId, locationId),
                await second.GetReplayPositionAsync(organizationId, locationId)
            );
            Assert.AreEqual(1L, await Verify(second));

            await Arrange(
                first,
                new CreateArrangement(
                    familyId,
                    caseId,
                    [arrangementId],
                    "Hosting",
                    Start,
                    UserId,
                    null
                )
            );
            Assert.AreEqual(2L, await Verify(first));
            Assert.IsNull(await Verify(second), "A process that missed an append is stale.");

            var staleArrangementId = Guid.NewGuid();
            await Arrange(
                second,
                new CreateArrangement(
                    familyId,
                    caseId,
                    [staleArrangementId],
                    "Hosting",
                    Start,
                    UserId,
                    null
                )
            );
            Assert.IsNull(
                await second.GetReplayPositionAsync(organizationId, locationId),
                "An append that did not continue the known tail cannot be certified."
            );
            Assert.IsNull(await Verify(second));
            Assert.IsNull(await Verify(first));

            var restarted = Process();
            Assert.AreEqual(3L, await Verify(restarted));
            var replayed = (await restarted.ListV1CasessAsync(organizationId, locationId)).Single();
            CollectionAssert.AreEquivalent(
                new[] { arrangementId, staleArrangementId },
                replayed.Arrangements.Keys.ToArray()
            );
        }

        [TestMethod]
        public async Task PolicyRevisionValidationRejectsStaleCachedSnapshotsFromOtherProcesses()
        {
            var policy = PolicyFixture();
            var writer = new JsonBlobObjectStore<EffectiveLocationPolicy>(
                client,
                "LocationPolicies",
                new MemoryCache(new MemoryCacheOptions()),
                TimeSpan.FromMinutes(1)
            );
            await writer.UpsertAsync(organizationId, locationId, "policy", policy);
            var reader = Policies();
            var (_, cached) = await reader.ReadPolicySnapshotAsync(organizationId, locationId);
            Assert.AreEqual(
                cached,
                await reader.ValidatePolicyRevisionAsync(organizationId, locationId)
            );

            await writer.UpsertAsync(organizationId, locationId, "policy", policy);
            Assert.AreEqual(
                cached,
                (await reader.ReadPolicySnapshotAsync(organizationId, locationId)).Revision,
                "The independent cache still serves the earlier snapshot."
            );
            var restored = await reader.ValidatePolicyRevisionAsync(organizationId, locationId);
            Assert.IsNotNull(restored);
            Assert.AreNotEqual(cached, restored, "Restoring identical content is a new revision.");
            Assert.AreEqual(
                restored,
                (await reader.ReadPolicySnapshotAsync(organizationId, locationId)).Revision
            );

            await client
                .GetBlobContainerClient(organizationId.ToString())
                .GetBlobClient($"{locationId}/LocationPolicies/policy.json")
                .DeleteAsync();
            Assert.IsNull(await reader.ValidatePolicyRevisionAsync(organizationId, locationId));
        }

        private static FamilyRecordsAggregate FamilyAggregate(
            Guid familyId,
            Guid caseId,
            Guid arrangementId,
            ImmutableList<MissingArrangementRequirement> requirements
        )
        {
            var info = JsonConvert.DeserializeObject<CombinedFamilyInfo>(
                JsonConvert.SerializeObject(
                    new
                    {
                        Family = new { Id = familyId },
                        PartneringFamilyInfo = new
                        {
                            OpenV1Case = new
                            {
                                Id = caseId,
                                Arrangements = new[]
                                {
                                    new
                                    {
                                        Id = arrangementId,
                                        MissingRequirements = Array.Empty<object>(),
                                        MissingOptionalRequirements = Array.Empty<object>(),
                                    },
                                },
                            },
                            ClosedV1Cases = Array.Empty<object>(),
                        },
                    }
                )
            )!;
            var open = info.PartneringFamilyInfo!.OpenV1Case!;
            return new FamilyRecordsAggregate(
                info with
                {
                    PartneringFamilyInfo = info.PartneringFamilyInfo with
                    {
                        OpenV1Case = open with
                        {
                            Arrangements =
                            [
                                open.Arrangements[0] with
                                {
                                    MissingRequirements = requirements,
                                    MissingOptionalRequirements = requirements,
                                },
                            ],
                        },
                    },
                }
            );
        }

        private Func<Task<ImmutableList<RecordsAggregate>>> Render(
            V1CasesResource process,
            PoliciesResource policies,
            int day,
            MonitoringRequirement? rule = null
        ) =>
            async () =>
            {
                var entry = (await process.ListV1CasessAsync(organizationId, locationId)).Single();
                var (_, revision) = await policies.ReadPolicySnapshotAsync(
                    organizationId,
                    locationId
                );
                var requirements = V1CaseCalculations.CalculateMissingMonitoringRequirements(
                    H.MonitoringRequirements([rule ?? Rule]),
                    new PolicyEvaluationEngine(null!).ToArrangementEntryForCalculation(
                        entry.Arrangements[arrangementId],
                        TimeZoneInfo.Utc
                    ),
                    new DateOnly(2027, 1, day),
                    revision
                );
                return [FamilyAggregate(familyId, caseId, arrangementId, requirements)];
            };

        private static (string? Token, RequirementSnoozeFreshness? Freshness) Read(
            ImmutableList<RecordsAggregate> aggregates
        )
        {
            var family = (FamilyRecordsAggregate)aggregates.Single();
            var arrangement = family.Family.PartneringFamilyInfo!.OpenV1Case!.Arrangements.Single();
            Assert.IsTrue(
                arrangement.MissingOptionalRequirements.All(r => r.SnoozeEpisodeToken is null)
            );
            var tokens = arrangement.MissingRequirements.Select(r => r.SnoozeEpisodeToken).ToList();
            Assert.AreEqual(tokens.Count, tokens.Distinct().Count());
            return (
                arrangement
                    .MissingRequirements.Single(r =>
                        (r.DueBy ?? r.PastDueSince) == new DateOnly(2027, 1, 3)
                    )
                    .SnoozeEpisodeToken,
                family.SnoozeFreshness
            );
        }

        private async Task<(string? Token, RequirementSnoozeFreshness? Freshness)> Certified(
            V1CasesResource process,
            PoliciesResource policies,
            int day,
            MonitoringRequirement? rule = null
        ) =>
            Read(
                await ArrangementSnoozeCertification.CertifyAsync(
                    process,
                    policies,
                    organizationId,
                    locationId,
                    Render(process, policies, day, rule)
                )
            );

        [TestMethod]
        public async Task RecordsCertificationIssuesStableTokensOnlyForVerifiedSnapshots()
        {
            var writer = new JsonBlobObjectStore<EffectiveLocationPolicy>(
                client,
                "LocationPolicies",
                new MemoryCache(new MemoryCacheOptions()),
                TimeSpan.FromMinutes(1)
            );
            var policy = PolicyFixture();
            await writer.UpsertAsync(organizationId, locationId, "policy", policy);
            var authoritative = Process();
            var policies = Policies();
            await OpenStartedArrangement(authoritative);

            var upcoming = await Certified(authoritative, policies, 2);
            Assert.IsNotNull(upcoming.Token);
            Assert.AreEqual(3L, upcoming.Freshness!.ReferralsRevision);
            Assert.AreEqual(upcoming, await Certified(authoritative, policies, 2));
            var overdue = await Certified(authoritative, policies, 3);
            Assert.AreEqual(
                upcoming.Token,
                overdue.Token,
                "Upcoming to past due keeps the occurrence."
            );

            var stale = Process();
            await stale.GetReplayPositionAsync(organizationId, locationId);
            await Arrange(
                authoritative,
                new UpdateArrangementComments(familyId, caseId, [arrangementId], "Unrelated")
            );
            Assert.AreEqual((null, null), await Certified(stale, policies, 2));
            var afterComment = await Certified(authoritative, policies, 2);
            Assert.AreEqual(upcoming.Token, afterComment.Token);
            Assert.AreEqual(4L, afterComment.Freshness!.ReferralsRevision);

            var completion = Guid.NewGuid();
            await Arrange(
                authoritative,
                new CompleteArrangementRequirement(
                    familyId,
                    caseId,
                    [arrangementId],
                    completion,
                    Action,
                    Start.AddDays(1),
                    null,
                    null
                )
            );
            await Arrange(
                authoritative,
                new MarkArrangementRequirementIncomplete(
                    familyId,
                    caseId,
                    [arrangementId],
                    completion,
                    Action
                )
            );
            var reactivated = await Certified(authoritative, policies, 2);
            Assert.IsNotNull(reactivated.Token);
            Assert.AreNotEqual(upcoming.Token, reactivated.Token);
            Assert.AreEqual(reactivated, await Certified(Process(), Policies(), 2));

            await writer.UpsertAsync(organizationId, locationId, "policy", policy);
            var stalePolicy = await Certified(authoritative, policies, 2);
            Assert.IsNull(stalePolicy.Token, "A stale cached policy cannot certify its episode.");
            Assert.AreNotEqual(
                reactivated.Freshness!.PolicyRevision,
                stalePolicy.Freshness!.PolicyRevision
            );
            var restored = await Certified(authoritative, policies, 2);
            Assert.IsNotNull(restored.Token);
            Assert.AreNotEqual(reactivated.Token, restored.Token);
            Assert.AreEqual(stalePolicy.Freshness, restored.Freshness);
        }

        private static readonly MonitoringRequirement LegacyRule = Rule with { Id = null };

        private Task AppendLegacy(long sequenceNumber, V1CaseEvent domainEvent) =>
            new AppendBlobEventLog<V1CaseEvent>(client, "ReferralsEventLog").AppendEventAsync(
                organizationId,
                locationId,
                domainEvent,
                sequenceNumber
            );

        private V1CaseEvent[] LegacyHistory() =>
            [
                new ReferralCommandExecuted(
                    UserId,
                    Start,
                    new CreateReferral(familyId, caseId, Start)
                ),
                new ArrangementsCommandExecuted(
                    UserId,
                    Start,
                    new CreateArrangement(
                        familyId,
                        caseId,
                        [arrangementId],
                        "Hosting",
                        Start,
                        UserId,
                        null
                    )
                ),
                new ArrangementsCommandExecuted(
                    UserId,
                    Start,
                    new StartArrangements(familyId, caseId, [arrangementId], Start)
                ),
                new ArrangementsCommandExecuted(
                    UserId,
                    Start,
                    new UpdateArrangementComments(familyId, caseId, [arrangementId], "Legacy")
                ),
            ];

        private async Task<PoliciesResource> StorePolicy()
        {
            await new JsonBlobObjectStore<EffectiveLocationPolicy>(
                client,
                "LocationPolicies",
                new MemoryCache(new MemoryCacheOptions()),
                TimeSpan.FromMinutes(1)
            ).UpsertAsync(organizationId, locationId, "policy", PolicyFixture());
            return Policies();
        }

        [TestMethod]
        public async Task LegacyHistoryAcrossSegmentsCertifiesIdenticallyInIndependentProcesses()
        {
            var history = LegacyHistory();
            foreach (
                var (sequenceNumber, domainEvent) in new[] { 1L, 2L, 50001L, 50002L }.Zip(history)
            )
                await AppendLegacy(sequenceNumber, domainEvent);
            var segments = new List<string>();
            await foreach (
                var blob in client
                    .GetBlobContainerClient(organizationId.ToString())
                    .GetBlobsAsync(
                        BlobTraits.None,
                        BlobStates.None,
                        $"{locationId}/ReferralsEventLog/",
                        default
                    )
            )
                segments.Add(blob.Name[(blob.Name.LastIndexOf('/') + 1)..]);
            CollectionAssert.AreEqual(new[] { "00001.ndjson", "00002.ndjson" }, segments);

            var policies = await StorePolicy();
            var first = await Certified(Process(), policies, 2, LegacyRule);
            Assert.IsNotNull(first.Token, "Replay must apply the second segment after the first.");
            Assert.AreEqual(4L, first.Freshness!.ReferralsRevision);
            Assert.AreEqual(first, await Certified(Process(), Policies(), 2, LegacyRule));
            Assert.AreEqual(
                first.Token,
                (await Certified(Process(), policies, 3, LegacyRule)).Token
            );
        }

        [TestMethod]
        public async Task LegacyHistoryReactivationAndPolicyRestorationAreSharedThroughStorage()
        {
            foreach (var (domainEvent, index) in LegacyHistory().Select((e, i) => (e, i)))
                await AppendLegacy(index + 1, domainEvent);
            var policies = await StorePolicy();
            var authoritative = Process();
            var stale = Process();
            var original = await Certified(authoritative, policies, 2, LegacyRule);
            Assert.IsNotNull(original.Token);
            Assert.AreEqual(original, await Certified(stale, policies, 2, LegacyRule));

            var completion = Guid.NewGuid();
            await Arrange(
                authoritative,
                new CompleteArrangementRequirement(
                    familyId,
                    caseId,
                    [arrangementId],
                    completion,
                    Action,
                    Start.AddDays(1),
                    null,
                    null
                )
            );
            await Arrange(
                authoritative,
                new MarkArrangementRequirementIncomplete(
                    familyId,
                    caseId,
                    [arrangementId],
                    completion,
                    Action
                )
            );
            var reactivated = await Certified(authoritative, policies, 2, LegacyRule);
            Assert.IsNotNull(reactivated.Token);
            Assert.AreNotEqual(original.Token, reactivated.Token);
            Assert.AreEqual(6L, reactivated.Freshness!.ReferralsRevision);
            Assert.AreEqual((null, null), await Certified(stale, policies, 2, LegacyRule));
            Assert.AreEqual(reactivated, await Certified(Process(), Policies(), 2, LegacyRule));

            await StorePolicy();
            Assert.IsNull((await Certified(authoritative, policies, 2, LegacyRule)).Token);
            var restored = await Certified(authoritative, policies, 2, LegacyRule);
            Assert.IsNotNull(restored.Token);
            Assert.AreNotEqual(reactivated.Token, restored.Token);
        }

        [TestMethod]
        public void CertificationLeavesUnsupportedRequirementsVisibleAndSerializesOnlyTheToken()
        {
            var revision = new ETag("\"policy\"");
            var legacy = new MissingArrangementRequirement(
                null,
                null,
                null,
                null,
                new RequirementDefinition(Action, true),
                new DateOnly(2027, 1, 2),
                null
            );
            var other = new ETag("\"other\"");
            var occurrence = new ArrangementMonitoringOccurrence(
                Guid.NewGuid(),
                Guid.NewGuid(),
                Guid.NewGuid(),
                "{}",
                new DateOnly(2027, 1, 1),
                new DateOnly(2027, 1, 2)
            );
            var episode = new ArrangementMonitoringEpisode(
                occurrence,
                Guid.NewGuid(),
                null,
                revision
            );
            var supported = legacy with { MonitoringEpisode = episode };
            var mismatched = legacy with
            {
                MonitoringEpisode = episode with { PolicyRevision = other },
            };
            var nextOccurrence = legacy with
            {
                MonitoringEpisode = episode with
                {
                    Occurrence = occurrence with { DueDate = new DateOnly(2027, 1, 4) },
                },
            };

            var aggregates = ArrangementSnoozeCertification.Certify(
                [
                    FamilyAggregate(
                        Guid.NewGuid(),
                        Guid.NewGuid(),
                        Guid.NewGuid(),
                        [legacy, supported, mismatched, nextOccurrence]
                    ),
                ],
                7,
                revision
            );
            var family = (FamilyRecordsAggregate)aggregates.Single();
            var tokens = family
                .Family.PartneringFamilyInfo!.OpenV1Case!.Arrangements.Single()
                .MissingRequirements.Select(requirement => requirement.SnoozeEpisodeToken)
                .ToArray();
            Assert.IsNull(tokens[0]);
            Assert.IsNotNull(tokens[1]);
            Assert.IsNull(tokens[2]);
            Assert.IsNotNull(tokens[3]);
            Assert.AreNotEqual(tokens[1], tokens[3]);
            Assert.AreEqual(7L, family.SnoozeFreshness!.ReferralsRevision);

            var json = JsonConvert.SerializeObject(
                family
                    .Family.PartneringFamilyInfo.OpenV1Case.Arrangements.Single()
                    .MissingRequirements
            );
            StringAssert.Contains(json, $"\"SnoozeEpisodeToken\":\"{tokens[1]}\"");
            Assert.AreEqual(2, json.Split("SnoozeEpisodeToken").Length - 1);
            Assert.IsFalse(
                json.Contains("MonitoringEpisode") || json.Contains(occurrence.RuleId.ToString())
            );
            Assert.IsFalse(json.Contains("PolicyRevision") || json.Contains("MonitoringRuleId"));
        }
    }
}

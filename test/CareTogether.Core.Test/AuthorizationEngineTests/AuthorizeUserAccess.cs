using System;
using System.Collections.Immutable;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using CareTogether.Engines.Authorization;
using CareTogether.Resources.Accounts;
using CareTogether.Resources.Approvals;
using CareTogether.Resources.Communities;
using CareTogether.Resources.Directory;
using CareTogether.Resources.Goals;
using CareTogether.Resources.Notes;
using CareTogether.Resources.Policies;
using CareTogether.Resources.V1Cases;
using CareTogether.TestData;
using CareTogether.Utilities.FileStore;
using Microsoft.VisualStudio.TestTools.UnitTesting;
using Moq;

namespace CareTogether.Core.Test.AuthorizationEngineTests
{
    [TestClass]
    public class AuthorizeUserAccess
    {
        private static Guid Id(char x) =>
            Guid.Parse("xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx".Replace('x', x));

        static readonly Guid guid0 = Id('0');
        static readonly Guid guid1 = Id('1');
        static readonly Guid guid2 = Id('2');
        static readonly Guid guid3 = Id('3');
        static readonly Guid guid4 = Id('4');
        static readonly Guid guid5 = Id('5');

        private static ClaimsPrincipal PersonUserWithRoles(Guid personId, params string[] roles) =>
            new(
                new ClaimsIdentity(
                    new Claim[]
                    {
                        new Claim(Claims.PersonId.ToString(), personId.ToString()),
                    }.Concat(
                        roles.Select(role => new Claim(
                            ClaimsIdentity.DefaultRoleClaimType,
                            role.ToString()
                        ))
                    ),
                    $"{guid1}:{guid2}"
                )
            );

        private static Permission[] allPermissions = Enum.GetValues<Permission>();

        private UserAccessCalculation? userAccessCalculation;

        [TestInitialize]
        public async Task TestInitializeAsync()
        {
            var accountsEventLog = new MemoryEventLog<AccountEvent>();
            var personAccessEventLog = new MemoryEventLog<PersonAccessEvent>();
            var directoryEventLog = new MemoryEventLog<DirectoryEvent>();
            var goalsEventLog = new MemoryEventLog<GoalCommandExecutedEvent>();
            var referralsEventLog = new MemoryEventLog<V1CaseEvent>();
            var approvalsEventLog = new MemoryEventLog<ApprovalEvent>();
            var notesEventLog = new MemoryEventLog<NotesEvent>();
            var communitiesEventLog = new MemoryEventLog<CommunityCommandExecutedEvent>();
            var draftNotesStore = new MemoryObjectStore<string?>();
            var configurationStore = new MemoryObjectStore<OrganizationConfiguration>();
            var policiesStore = new MemoryObjectStore<EffectiveLocationPolicy>();
            var organizationSecretsStore = new MemoryObjectStore<OrganizationSecrets>();

            await TestDataProvider.PopulateTestDataAsync(
                accountsEventLog,
                personAccessEventLog,
                directoryEventLog,
                goalsEventLog,
                referralsEventLog,
                approvalsEventLog,
                notesEventLog,
                communitiesEventLog,
                draftNotesStore,
                configurationStore,
                policiesStore,
                organizationSecretsStore,
                testSourceSmsPhoneNumber: null
            );

            var directoryResource = new DirectoryResource(directoryEventLog, Mock.Of<IFileStore>());
            var policiesResource = new PoliciesResource(
                configurationStore,
                policiesStore,
                organizationSecretsStore,
                personAccessEventLog
            );
            var referralsResource = new V1CasesResource(referralsEventLog);
            var approvalsResource = new ApprovalsResource(approvalsEventLog);
            var communitiesResource = new CommunitiesResource(
                communitiesEventLog,
                Mock.Of<IFileStore>()
            );

            userAccessCalculation = new UserAccessCalculation(
                policiesResource,
                directoryResource,
                referralsResource,
                approvalsResource,
                communitiesResource
            );
        }

        [DataTestMethod]
        [DataRow('0', 0, 0, 0, 0, 0, 0, 0, 0)]
        [DataRow('1', 0, 0, 0, 0, 0, 0, 0, 0)]
        [DataRow('2', 0, 0, 0, 0, 0, 0, 0, 0)]
        [DataRow('3', 0, 0, 0, 0, 0, 0, 0, 0)]
        [DataRow('4', 0, 0, 0, 0, 0, 0, 0, 0)]
        [DataRow('5', 0, 0, 0, 0, 0, 0, 0, 0)]
        [DataRow('6', 0, 0, 0, 0, 0, 0, 0, 0)]
        [DataRow('7', 0, 0, 0, 0, 0, 0, 0, 0)]
        [DataRow('8', 0, 0, 0, 0, 0, 0, 0, 0)]
        [DataRow('9', 0, 0, 0, 0, 0, 0, 0, 0)]
        [DataRow('a', 0, 0, 0, 0, 0, 0, 0, 0)]
        [DataRow('b', 0, 0, 0, 0, 0, 0, 0, 0)]
        [DataRow('c', 0, 0, 0, 0, 0, 0, 0, 0)]
        [DataRow('d', 0, 0, 0, 0, 0, 0, 0, 0)]
        [DataRow('e', 0, 0, 0, 0, 0, 0, 0, 0)]
        [DataRow('f', 0, 0, 0, 0, 0, 0, 0, 0)]
        public async Task TestAccessWithNoRoles(
            char personId,
            int expected0,
            int expected1,
            int expected2,
            int expected3,
            int expected4,
            int expected5,
            int expectedCommunity1,
            int expectedCommunity2
        )
        {
            var user = PersonUserWithRoles(Id(personId));
            await EvaluateAccess(
                user,
                personId,
                expected0,
                expected1,
                expected2,
                expected3,
                expected4,
                expected5,
                expectedCommunity1,
                expectedCommunity2
            );
        }

        [DataTestMethod]
        [DataRow('0', -1, -1, -1, -1, -1, -1, -1, -1)]
        [DataRow('1', -1, -1, -1, -1, -1, -1, -1, -1)]
        [DataRow('2', -1, -1, -1, -1, -1, -1, -1, -1)]
        [DataRow('3', -1, -1, -1, -1, -1, -1, -1, -1)]
        [DataRow('4', -1, -1, -1, -1, -1, -1, -1, -1)]
        [DataRow('5', -1, -1, -1, -1, -1, -1, -1, -1)]
        [DataRow('6', -1, -1, -1, -1, -1, -1, -1, -1)]
        [DataRow('7', -1, -1, -1, -1, -1, -1, -1, -1)]
        [DataRow('8', -1, -1, -1, -1, -1, -1, -1, -1)]
        [DataRow('9', -1, -1, -1, -1, -1, -1, -1, -1)]
        [DataRow('a', -1, -1, -1, -1, -1, -1, -1, -1)]
        [DataRow('b', -1, -1, -1, -1, -1, -1, -1, -1)]
        [DataRow('c', -1, -1, -1, -1, -1, -1, -1, -1)]
        [DataRow('d', -1, -1, -1, -1, -1, -1, -1, -1)]
        [DataRow('e', -1, -1, -1, -1, -1, -1, -1, -1)]
        [DataRow('f', -1, -1, -1, -1, -1, -1, -1, -1)]
        public async Task TestAccessWithOrganizationAdministratorRole(
            char personId,
            int expected0,
            int expected1,
            int expected2,
            int expected3,
            int expected4,
            int expected5,
            int expectedCommunity1,
            int expectedCommunity2
        )
        {
            var user = PersonUserWithRoles(Id(personId), "OrganizationAdministrator");
            await EvaluateAccess(
                user,
                personId,
                expected0,
                expected1,
                expected2,
                expected3,
                expected4,
                expected5,
                expectedCommunity1,
                expectedCommunity2
            );
        }

        [DataTestMethod]
        [DataRow('0', 6, 3, 3, 3, 3, 3, 3, 3)]
        [DataRow('1', 3, 6, 3, 3, 3, 3, 3, 3)]
        [DataRow('2', 3, 6, 3, 3, 3, 3, 3, 3)]
        [DataRow('3', 3, 6, 3, 3, 3, 3, 3, 3)]
        [DataRow('4', 11, 12, 12, 13, 15, 5, 5, 3)]
        [DataRow('5', 3, 12, 6, 4, 4, 3, 3, 3)]
        [DataRow('6', 3, 12, 6, 4, 4, 3, 3, 3)]
        [DataRow('7', 3, 12, 6, 4, 4, 3, 3, 3)]
        [DataRow('8', 11, 11, 12, 17, 16, 8, 5, 3)]
        [DataRow('9', 11, 11, 12, 15, 13, 5, 4, 3)]
        [DataRow('a', 3, 12, 6, 4, 4, 3, 3, 3)]
        [DataRow('b', 11, 11, 11, 13, 13, 7, 4, 3)]
        [DataRow('c', 11, 11, 11, 13, 13, 7, 4, 3)]
        [DataRow('d', 3, 3, 3, 3, 3, 3, 3, 3)]
        [DataRow('e', 3, 3, 3, 3, 3, 3, 3, 3)]
        [DataRow('f', 3, 3, 3, 3, 3, 3, 3, 3)]
        public async Task TestAccessWithVolunteerRole(
            char personId,
            int expected0,
            int expected1,
            int expected2,
            int expected3,
            int expected4,
            int expected5,
            int expectedCommunity1,
            int expectedCommunity2
        )
        {
            var user = PersonUserWithRoles(Id(personId), "Volunteer");
            await EvaluateAccess(
                user,
                personId,
                expected0,
                expected1,
                expected2,
                expected3,
                expected4,
                expected5,
                expectedCommunity1,
                expectedCommunity2
            );
        }

        [DataTestMethod]
        [DataRow('0', -1, -1, -1, -1, -1, -1, -1, -1)]
        [DataRow('1', -1, -1, -1, -1, -1, -1, -1, -1)]
        [DataRow('2', -1, -1, -1, -1, -1, -1, -1, -1)]
        [DataRow('3', -1, -1, -1, -1, -1, -1, -1, -1)]
        [DataRow('4', -1, -1, -1, -1, -1, -1, -1, -1)]
        [DataRow('5', -1, -1, -1, -1, -1, -1, -1, -1)]
        [DataRow('6', -1, -1, -1, -1, -1, -1, -1, -1)]
        [DataRow('7', -1, -1, -1, -1, -1, -1, -1, -1)]
        [DataRow('8', -1, -1, -1, -1, -1, -1, -1, -1)]
        [DataRow('9', -1, -1, -1, -1, -1, -1, -1, -1)]
        [DataRow('a', -1, -1, -1, -1, -1, -1, -1, -1)]
        [DataRow('b', -1, -1, -1, -1, -1, -1, -1, -1)]
        [DataRow('c', -1, -1, -1, -1, -1, -1, -1, -1)]
        [DataRow('d', -1, -1, -1, -1, -1, -1, -1, -1)]
        [DataRow('e', -1, -1, -1, -1, -1, -1, -1, -1)]
        [DataRow('f', -1, -1, -1, -1, -1, -1, -1, -1)]
        public async Task TestAccessWithOrganizationAdministratorAndVolunteerRoles(
            char personId,
            int expected0,
            int expected1,
            int expected2,
            int expected3,
            int expected4,
            int expected5,
            int expectedCommunity1,
            int expectedCommunity2
        )
        {
            var user = PersonUserWithRoles(Id(personId), "OrganizationAdministrator", "Volunteer");
            await EvaluateAccess(
                user,
                personId,
                expected0,
                expected1,
                expected2,
                expected3,
                expected4,
                expected5,
                expectedCommunity1,
                expectedCommunity2
            );
        }

        private async Task EvaluateAccess(
            ClaimsPrincipal user,
            char personId,
            int expected0,
            int expected1,
            int expected2,
            int expected3,
            int expected4,
            int expected5,
            int expectedCommunity1,
            int expectedCommunity2
        )
        {
            static void PrintResults(string header, ImmutableList<Permission> result)
            {
                Console.WriteLine(
                    $"{header}: {result.Count}\t{string.Join(", ", result.Select(r => Enum.GetName<Permission>(r)))}"
                );
            }

            var result0 = await userAccessCalculation!.AuthorizeUserAccessAsync(
                guid1,
                guid2,
                user,
                new FamilyAuthorizationContext(guid0)
            );
            var result1 = await userAccessCalculation!.AuthorizeUserAccessAsync(
                guid1,
                guid2,
                user,
                new FamilyAuthorizationContext(guid1)
            );
            var result2 = await userAccessCalculation!.AuthorizeUserAccessAsync(
                guid1,
                guid2,
                user,
                new FamilyAuthorizationContext(guid2)
            );
            var result3 = await userAccessCalculation!.AuthorizeUserAccessAsync(
                guid1,
                guid2,
                user,
                new FamilyAuthorizationContext(guid3)
            );
            var result4 = await userAccessCalculation!.AuthorizeUserAccessAsync(
                guid1,
                guid2,
                user,
                new FamilyAuthorizationContext(guid4)
            );
            var result5 = await userAccessCalculation!.AuthorizeUserAccessAsync(
                guid1,
                guid2,
                user,
                new FamilyAuthorizationContext(guid5)
            );
            var resultCommunity1 = await userAccessCalculation!.AuthorizeUserAccessAsync(
                guid1,
                guid2,
                user,
                new CommunityAuthorizationContext(guid1)
            );
            var resultCommunity2 = await userAccessCalculation!.AuthorizeUserAccessAsync(
                guid1,
                guid2,
                user,
                new CommunityAuthorizationContext(guid2)
            );

            PrintResults($"Person '{personId}' -> Family '0'", result0);
            PrintResults($"Person '{personId}' -> Family '1'", result1);
            PrintResults($"Person '{personId}' -> Family '2'", result2);
            PrintResults($"Person '{personId}' -> Family '3'", result3);
            PrintResults($"Person '{personId}' -> Family '4'", result4);
            PrintResults($"Person '{personId}' -> Family '5'", result5);
            PrintResults($"Person '{personId}' -> Community '1'", resultCommunity1);
            PrintResults($"Person '{personId}' -> Community '2'", resultCommunity2);

            int X(int expected) => expected == -1 ? allPermissions.Length : expected;

            Assert.AreEqual(
                X(expected0),
                result0.Count,
                $"\nPerson '{personId}' access to family '0' expected {X(expected0)} but was {result0.Count}"
            );
            Assert.AreEqual(
                X(expected1),
                result1.Count,
                $"\nPerson '{personId}' access to family '1' expected {X(expected1)} but was {result1.Count}"
            );
            Assert.AreEqual(
                X(expected2),
                result2.Count,
                $"\nPerson '{personId}' access to family '2' expected {X(expected2)} but was {result2.Count}"
            );
            Assert.AreEqual(
                X(expected3),
                result3.Count,
                $"\nPerson '{personId}' access to family '3' expected {X(expected3)} but was {result3.Count}"
            );
            Assert.AreEqual(
                X(expected4),
                result4.Count,
                $"\nPerson '{personId}' access to family '4' expected {X(expected4)} but was {result4.Count}"
            );
            Assert.AreEqual(
                X(expected5),
                result5.Count,
                $"\nPerson '{personId}' access to family '5' expected {X(expected5)} but was {result5.Count}"
            );
            Assert.AreEqual(
                X(expectedCommunity1),
                resultCommunity1.Count,
                $"\nPerson '{personId}' access to community '1' expected {X(expectedCommunity1)} but was {resultCommunity1.Count}"
            );
            Assert.AreEqual(
                X(expectedCommunity2),
                resultCommunity2.Count,
                $"\nPerson '{personId}' access to community '2' expected {X(expectedCommunity2)} but was {resultCommunity2.Count}"
            );
        }
    }
}

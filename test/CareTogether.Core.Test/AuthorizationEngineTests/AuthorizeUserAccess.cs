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
using CareTogether.Resources.Referrals;
using CareTogether.TestData;
using CareTogether.Utilities.FileStore;
using Microsoft.VisualStudio.TestTools.UnitTesting;
using Moq;

namespace CareTogether.Core.Test.AuthorizationEngineTests
{
    [TestClass]
    public class AuthorizeUserAccess
    {
        static readonly Guid _Guid0 = Id('0');
        static readonly Guid _Guid1 = Id('1');
        static readonly Guid _Guid2 = Id('2');
        static readonly Guid _Guid3 = Id('3');
        static readonly Guid _Guid4 = Id('4');
        static readonly Guid _Guid5 = Id('5');

        static readonly Permission[] _AllPermissions = Enum.GetValues<Permission>();

        AuthorizationEngine? _Dut;

        static Guid Id(char x)
        {
            return Guid.Parse("xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx".Replace('x', x));
        }

        static ClaimsPrincipal PersonUserWithRoles(Guid personId, params string[] roles)
        {
            return new ClaimsPrincipal(
                new ClaimsIdentity(
                    new[] { new Claim(Claims.PersonId.ToString(), personId.ToString()) }.Concat(
                        roles.Select(role => new Claim(ClaimsIdentity.DefaultRoleClaimType, role.ToString()))
                    ),
                    $"{_Guid1}:{_Guid2}"
                )
            );
        }

        [TestInitialize]
        public async Task TestInitializeAsync()
        {
            MemoryEventLog<AccountEvent> accountsEventLog = new();
            MemoryEventLog<PersonAccessEvent> personAccessEventLog = new();
            MemoryEventLog<DirectoryEvent> directoryEventLog = new();
            MemoryEventLog<GoalCommandExecutedEvent> goalsEventLog = new();
            MemoryEventLog<ReferralEvent> referralsEventLog = new();
            MemoryEventLog<ApprovalEvent> approvalsEventLog = new();
            MemoryEventLog<NotesEvent> notesEventLog = new();
            MemoryEventLog<CommunityCommandExecutedEvent> communitiesEventLog = new();
            MemoryObjectStore<string?> draftNotesStore = new();
            MemoryObjectStore<OrganizationConfiguration> configurationStore = new();
            MemoryObjectStore<EffectiveLocationPolicy> policiesStore = new();
            MemoryObjectStore<OrganizationSecrets> organizationSecretsStore = new();

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
                null
            );

            DirectoryResource directoryResource = new(directoryEventLog, Mock.Of<IFileStore>());
            PoliciesResource policiesResource = new(configurationStore, policiesStore, organizationSecretsStore);
            ReferralsResource referralsResource = new(referralsEventLog);
            ApprovalsResource approvalsResource = new(approvalsEventLog);
            CommunitiesResource communitiesResource = new(communitiesEventLog, Mock.Of<IFileStore>());
            AccountsResource accountsResource = new(accountsEventLog, personAccessEventLog);

            _Dut = new AuthorizationEngine(
                policiesResource,
                directoryResource,
                referralsResource,
                approvalsResource,
                communitiesResource,
                accountsResource
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
            ClaimsPrincipal user = PersonUserWithRoles(Id(personId));
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
            ClaimsPrincipal user = PersonUserWithRoles(Id(personId), "OrganizationAdministrator");
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
        [DataRow('4', 3, 11, 4, 5, 7, 5, 5, 3)]
        [DataRow('5', 3, 11, 6, 4, 4, 3, 3, 3)]
        [DataRow('6', 3, 11, 6, 4, 4, 3, 3, 3)]
        [DataRow('7', 3, 11, 6, 4, 4, 3, 3, 3)]
        [DataRow('8', 3, 3, 4, 9, 8, 8, 5, 3)]
        [DataRow('9', 3, 3, 4, 7, 5, 5, 4, 3)]
        [DataRow('a', 3, 11, 6, 4, 4, 3, 3, 3)]
        [DataRow('b', 3, 3, 3, 5, 5, 7, 4, 3)]
        [DataRow('c', 3, 3, 3, 5, 5, 7, 4, 3)]
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
            ClaimsPrincipal user = PersonUserWithRoles(Id(personId), "Volunteer");
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
            ClaimsPrincipal user = PersonUserWithRoles(Id(personId), "OrganizationAdministrator", "Volunteer");
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

        async Task EvaluateAccess(
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
                    $"{header}: {result.Count}\t{string.Join(", ", result.Select(r => Enum.GetName(r)))}"
                );
            }

            ImmutableList<Permission> result0 = await _Dut!.AuthorizeUserAccessAsync(
                _Guid1,
                _Guid2,
                user,
                new FamilyAuthorizationContext(_Guid0)
            );
            ImmutableList<Permission> result1 = await _Dut!.AuthorizeUserAccessAsync(
                _Guid1,
                _Guid2,
                user,
                new FamilyAuthorizationContext(_Guid1)
            );
            ImmutableList<Permission> result2 = await _Dut!.AuthorizeUserAccessAsync(
                _Guid1,
                _Guid2,
                user,
                new FamilyAuthorizationContext(_Guid2)
            );
            ImmutableList<Permission> result3 = await _Dut!.AuthorizeUserAccessAsync(
                _Guid1,
                _Guid2,
                user,
                new FamilyAuthorizationContext(_Guid3)
            );
            ImmutableList<Permission> result4 = await _Dut!.AuthorizeUserAccessAsync(
                _Guid1,
                _Guid2,
                user,
                new FamilyAuthorizationContext(_Guid4)
            );
            ImmutableList<Permission> result5 = await _Dut!.AuthorizeUserAccessAsync(
                _Guid1,
                _Guid2,
                user,
                new FamilyAuthorizationContext(_Guid5)
            );
            ImmutableList<Permission> resultCommunity1 = await _Dut!.AuthorizeUserAccessAsync(
                _Guid1,
                _Guid2,
                user,
                new CommunityAuthorizationContext(_Guid1)
            );
            ImmutableList<Permission> resultCommunity2 = await _Dut!.AuthorizeUserAccessAsync(
                _Guid1,
                _Guid2,
                user,
                new CommunityAuthorizationContext(_Guid2)
            );

            PrintResults($"Person '{personId}' -> Family '0'", result0);
            PrintResults($"Person '{personId}' -> Family '1'", result1);
            PrintResults($"Person '{personId}' -> Family '2'", result2);
            PrintResults($"Person '{personId}' -> Family '3'", result3);
            PrintResults($"Person '{personId}' -> Family '4'", result4);
            PrintResults($"Person '{personId}' -> Family '5'", result5);
            PrintResults($"Person '{personId}' -> Community '1'", resultCommunity1);
            PrintResults($"Person '{personId}' -> Community '2'", resultCommunity2);

            int X(int expected)
            {
                return expected == -1 ? _AllPermissions.Length : expected;
            }

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

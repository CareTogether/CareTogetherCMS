using CareTogether.Engines.Authorization;
using CareTogether.Resources.Accounts;
using CareTogether.Resources.Approvals;
using CareTogether.Resources.Directory;
using CareTogether.Resources.Goals;
using CareTogether.Resources.Notes;
using CareTogether.Resources.Policies;
using CareTogether.Resources.Referrals;
using CareTogether.TestData;
using Microsoft.VisualStudio.TestTools.UnitTesting;
using System;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;

namespace CareTogether.Core.Test.AuthorizationEngineTests
{
    [TestClass]
    public class AuthorizeUserAccess
    {
        private static Guid Id(char x) => Guid.Parse("xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx".Replace('x', x));
        static readonly Guid guid0 = Id('0');
        static readonly Guid guid1 = Id('1');
        static readonly Guid guid2 = Id('2');
        static readonly Guid guid3 = Id('3');
        static readonly Guid guid4 = Id('4');
        static readonly Guid guid5 = Id('5');

        private static ClaimsPrincipal PersonUserWithRoles(Guid personId, params string[] roles) =>
            new(new ClaimsIdentity(
                new Claim[] { new Claim(Claims.PersonId.ToString(), personId.ToString()) }
                    .Concat(roles.Select(role => new Claim(ClaimsIdentity.DefaultRoleClaimType, role.ToString()))),
                $"{guid1}:{guid2}"));

        private static Permission[] allPermissions = Enum.GetValues<Permission>();

        private AuthorizationEngine? dut;

        [TestInitialize]
        public async Task TestInitializeAsync()
        {
            var directoryEventLog = new MemoryEventLog<DirectoryEvent>();
            var goalsEventLog = new MemoryEventLog<GoalCommandExecutedEvent>();
            var referralsEventLog = new MemoryEventLog<ReferralEvent>();
            var approvalsEventLog = new MemoryEventLog<ApprovalEvent>();
            var notesEventLog = new MemoryEventLog<NotesEvent>();
            var draftNotesStore = new MemoryObjectStore<string?>();
            var configurationStore = new MemoryObjectStore<OrganizationConfiguration>();
            var policiesStore = new MemoryObjectStore<EffectiveLocationPolicy>();
            var userTenantAccessStore = new MemoryObjectStore<UserTenantAccessSummary>();

            await TestDataProvider.PopulateTestDataAsync(
                directoryEventLog,
                goalsEventLog,
                referralsEventLog,
                approvalsEventLog,
                notesEventLog,
                draftNotesStore,
                configurationStore,
                policiesStore,
                userTenantAccessStore,
                testSourceSmsPhoneNumber: null);

            var directoryResource = new DirectoryResource(directoryEventLog);
            var policiesResource = new PoliciesResource(configurationStore, policiesStore);
            var referralsResource = new ReferralsResource(referralsEventLog);
            var approvalsResource = new ApprovalsResource(approvalsEventLog);

            dut = new AuthorizationEngine(policiesResource, directoryResource,
                referralsResource, approvalsResource);
        }

        [DataTestMethod]
        [DataRow('0', 0, 0, 0, 0, 0, 0)]
        [DataRow('1', 0, 0, 0, 0, 0, 0)]
        [DataRow('2', 0, 0, 0, 0, 0, 0)]
        [DataRow('3', 0, 0, 0, 0, 0, 0)]
        [DataRow('4', 0, 0, 0, 0, 0, 0)]
        [DataRow('5', 0, 0, 0, 0, 0, 0)]
        [DataRow('6', 0, 0, 0, 0, 0, 0)]
        [DataRow('7', 0, 0, 0, 0, 0, 0)]
        [DataRow('8', 0, 0, 0, 0, 0, 0)]
        [DataRow('9', 0, 0, 0, 0, 0, 0)]
        [DataRow('a', 0, 0, 0, 0, 0, 0)]
        [DataRow('b', 0, 0, 0, 0, 0, 0)]
        [DataRow('c', 0, 0, 0, 0, 0, 0)]
        [DataRow('d', 0, 0, 0, 0, 0, 0)]
        [DataRow('e', 0, 0, 0, 0, 0, 0)]
        [DataRow('f', 0, 0, 0, 0, 0, 0)]
        public async Task TestAccessWithNoRoles(char personId,
            int expected0, int expected1, int expected2, int expected3, int expected4, int expected5)
        {
            var user = PersonUserWithRoles(Id(personId));
            await EvaluateAccess(user, personId, expected0, expected1, expected2, expected3, expected4, expected5);
        }

        [DataTestMethod]
        [DataRow('0', -1, -1, -1, -1, -1, -1)]
        [DataRow('1', -1, -1, -1, -1, -1, -1)]
        [DataRow('2', -1, -1, -1, -1, -1, -1)]
        [DataRow('3', -1, -1, -1, -1, -1, -1)]
        [DataRow('4', -1, -1, -1, -1, -1, -1)]
        [DataRow('5', -1, -1, -1, -1, -1, -1)]
        [DataRow('6', -1, -1, -1, -1, -1, -1)]
        [DataRow('7', -1, -1, -1, -1, -1, -1)]
        [DataRow('8', -1, -1, -1, -1, -1, -1)]
        [DataRow('9', -1, -1, -1, -1, -1, -1)]
        [DataRow('a', -1, -1, -1, -1, -1, -1)]
        [DataRow('b', -1, -1, -1, -1, -1, -1)]
        [DataRow('c', -1, -1, -1, -1, -1, -1)]
        [DataRow('d', -1, -1, -1, -1, -1, -1)]
        [DataRow('e', -1, -1, -1, -1, -1, -1)]
        [DataRow('f', -1, -1, -1, -1, -1, -1)]
        public async Task TestAccessWithOrganizationAdministratorRole(char personId,
            int expected0, int expected1, int expected2, int expected3, int expected4, int expected5)
        {
            var user = PersonUserWithRoles(Id(personId), "OrganizationAdministrator");
            await EvaluateAccess(user, personId, expected0, expected1, expected2, expected3, expected4, expected5);
        }

        [DataTestMethod]
        [DataRow('0', 5, 2, 2, 2, 2, 2)]
        [DataRow('1', 2, 5, 2, 2, 2, 2)]
        [DataRow('2', 2, 5, 2, 2, 2, 2)]
        [DataRow('3', 2, 5, 2, 2, 2, 2)]
        [DataRow('4', 2, 10, 3, 3, 5, 2)]
        [DataRow('5', 2, 10, 5, 3, 3, 2)]
        [DataRow('6', 2, 10, 5, 3, 3, 2)]
        [DataRow('7', 2, 10, 5, 3, 3, 2)]
        [DataRow('8', 2, 2, 3, 5, 3, 2)]
        [DataRow('9', 2, 2, 3, 5, 3, 2)]
        [DataRow('a', 2, 10, 5, 3, 3, 2)]
        [DataRow('b', 2, 2, 2, 2, 2, 5)]
        [DataRow('c', 2, 2, 2, 2, 2, 5)]
        [DataRow('d', 2, 2, 2, 2, 2, 2)]
        [DataRow('e', 2, 2, 2, 2, 2, 2)]
        [DataRow('f', 2, 2, 2, 2, 2, 2)]
        public async Task TestAccessWithVolunteerRole(char personId,
            int expected0, int expected1, int expected2, int expected3, int expected4, int expected5)
        {
            var user = PersonUserWithRoles(Id(personId), "Volunteer");
            await EvaluateAccess(user, personId, expected0, expected1, expected2, expected3, expected4, expected5);
        }

        [DataTestMethod]
        [DataRow('0', -1, -1, -1, -1, -1, -1)]
        [DataRow('1', -1, -1, -1, -1, -1, -1)]
        [DataRow('2', -1, -1, -1, -1, -1, -1)]
        [DataRow('3', -1, -1, -1, -1, -1, -1)]
        [DataRow('4', -1, -1, -1, -1, -1, -1)]
        [DataRow('5', -1, -1, -1, -1, -1, -1)]
        [DataRow('6', -1, -1, -1, -1, -1, -1)]
        [DataRow('7', -1, -1, -1, -1, -1, -1)]
        [DataRow('8', -1, -1, -1, -1, -1, -1)]
        [DataRow('9', -1, -1, -1, -1, -1, -1)]
        [DataRow('a', -1, -1, -1, -1, -1, -1)]
        [DataRow('b', -1, -1, -1, -1, -1, -1)]
        [DataRow('c', -1, -1, -1, -1, -1, -1)]
        [DataRow('d', -1, -1, -1, -1, -1, -1)]
        [DataRow('e', -1, -1, -1, -1, -1, -1)]
        [DataRow('f', -1, -1, -1, -1, -1, -1)]
        public async Task TestAccessWithOrganizationAdministratorAndVolunteerRoles(char personId,
            int expected0, int expected1, int expected2, int expected3, int expected4, int expected5)
        {
            var user = PersonUserWithRoles(Id(personId), "OrganizationAdministrator", "Volunteer");
            await EvaluateAccess(user, personId, expected0, expected1, expected2, expected3, expected4, expected5);
        }


        private async Task EvaluateAccess(ClaimsPrincipal user, char personId,
            int expected0, int expected1, int expected2, int expected3, int expected4, int expected5)
        {
            var result0 = await dut!.AuthorizeUserAccessAsync(guid1, guid2, user, new FamilyAuthorizationContext(guid0));
            var result1 = await dut!.AuthorizeUserAccessAsync(guid1, guid2, user, new FamilyAuthorizationContext(guid1));
            var result2 = await dut!.AuthorizeUserAccessAsync(guid1, guid2, user, new FamilyAuthorizationContext(guid2));
            var result3 = await dut!.AuthorizeUserAccessAsync(guid1, guid2, user, new FamilyAuthorizationContext(guid3));
            var result4 = await dut!.AuthorizeUserAccessAsync(guid1, guid2, user, new FamilyAuthorizationContext(guid4));
            var result5 = await dut!.AuthorizeUserAccessAsync(guid1, guid2, user, new FamilyAuthorizationContext(guid5));

            int X(int expected) => expected == -1 ? allPermissions.Length : expected;

            Assert.AreEqual(X(expected0), result0.Count, $"Person '{personId}' access to family '0' expected {X(expected0)} but was {result0.Count}");
            Assert.AreEqual(X(expected1), result1.Count, $"Person '{personId}' access to family '1' expected {X(expected1)} but was {result1.Count}");
            Assert.AreEqual(X(expected2), result2.Count, $"Person '{personId}' access to family '2' expected {X(expected2)} but was {result2.Count}");
            Assert.AreEqual(X(expected3), result3.Count, $"Person '{personId}' access to family '3' expected {X(expected3)} but was {result3.Count}");
            Assert.AreEqual(X(expected4), result4.Count, $"Person '{personId}' access to family '4' expected {X(expected4)} but was {result4.Count}");
            Assert.AreEqual(X(expected5), result5.Count, $"Person '{personId}' access to family '5' expected {X(expected5)} but was {result5.Count}");
        }
    }
}

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

namespace CareTogether.Core.Test.ReferralCalculationTests
{
    [TestClass]
    public class AuthorizeFamilyAccess
    {
        private static Guid Id(char x) => Guid.Parse("xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx".Replace('x', x));
        static readonly Guid guid0 = Id('0');
        static readonly Guid guid1 = Id('1');
        static readonly Guid guid2 = Id('2');
        static readonly Guid guid3 = Id('3');
        static readonly Guid guid4 = Id('4');
        static readonly Guid guid5 = Id('5');
        static readonly Guid guid6 = Id('6');

        private static ClaimsPrincipal UserFromPermissions(Guid personId, params Permission[] permissions) =>
            new(new ClaimsIdentity(
                new Claim[] { new Claim(Claims.PersonId.ToString(), personId.ToString()) }.Concat(
                    permissions.Select(permission => new Claim(Claims.Permission, permission.ToString()))),
                "Unit Test"));
        
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

            var approvalsResource = new ApprovalsResource(approvalsEventLog);
            var directoryResource = new DirectoryResource(directoryEventLog);
            var goalsResource = new GoalsResource(goalsEventLog);
            var policiesResource = new PoliciesResource(configurationStore, policiesStore);
            var accountsResource = new AccountsResource(userTenantAccessStore);
            var referralsResource = new ReferralsResource(referralsEventLog);
            var notesResource = new NotesResource(notesEventLog, draftNotesStore);

            dut = new AuthorizationEngine(policiesResource, directoryResource, referralsResource);
        }

        [DataTestMethod]
        [DataRow('0', true)]
        [DataRow('1', true)]
        [DataRow('2', true)]
        [DataRow('3', true)]
        [DataRow('4', true)]
        [DataRow('5', true)]
        [DataRow('6', true)]
        [DataRow('7', true)]
        [DataRow('8', true)]
        [DataRow('9', true)]
        public async Task TestAnyPersonWithViewAllFamiliesPermission(char personId, bool expectedAccess)
        {
            var user = UserFromPermissions(Id(personId), Permission.ViewAllFamilies);

            var result = await dut!.AuthorizeFamilyAccessAsync(guid1, guid2, user, guid3);
            
            Assert.AreEqual(expectedAccess, result);
        }
    }
}

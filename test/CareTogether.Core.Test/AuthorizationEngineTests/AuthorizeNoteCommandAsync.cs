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
    public class AuthorizeNoteCommandAsync
    {
        private static Guid Id(char x) =>
            Guid.Parse("xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx".Replace('x', x));

        static readonly Guid guid0 = Id('0');
        static readonly Guid guid1 = Id('1');
        static readonly Guid guid2 = Id('2');
        static readonly Guid guid3 = Id('3');
        static readonly Guid guid4 = Id('4');
        static readonly Guid guid5 = Id('5');
        static readonly Guid newDraftNoteGuid = Guid.NewGuid();

        private static ClaimsPrincipal PersonUserWithRoles(
            Guid personId,
            Guid userId,
            params string[] roles
        ) =>
            new(
                new ClaimsIdentity(
                    new Claim[]
                    {
                        new Claim(Claims.PersonId.ToString(), personId.ToString()),
                        new Claim(Claims.UserId, userId.ToString()),
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

        private AuthorizationEngine? dut;
        private Mock<IUserAccessCalculation>? mockUserAccessCalculation; // Change to interface

        [TestInitialize]
        public async Task TestInitializeAsync()
        {
            var accountsEventLog = new MemoryEventLog<AccountEvent>();
            var personAccessEventLog = new MemoryEventLog<PersonAccessEvent>();
            var directoryEventLog = new MemoryEventLog<DirectoryEvent>();
            var goalsEventLog = new MemoryEventLog<GoalCommandExecutedEvent>();
            var referralsEventLog = new MemoryEventLog<ReferralEvent>();
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
            var accountsResource = new AccountsResource(accountsEventLog, personAccessEventLog);

            var notesResource = new NotesResource(notesEventLog, draftNotesStore);

            // Replace UserAccess with IUserAccess mock:
            mockUserAccessCalculation = new Mock<IUserAccessCalculation>();

            dut = new AuthorizationEngine(
                policiesResource,
                directoryResource,
                accountsResource,
                notesResource,
                mockUserAccessCalculation.Object // Use the interface mock here
            );
        }

        [TestMethod]
        public async Task UserHasNoAccessToNotes()
        {
            var user = PersonUserWithRoles(
                Id('4'),
                Guid.Parse("e3aaef77-0e97-47a6-b788-a67c237c781e")
            );

            mockUserAccessCalculation!
                .Setup(x =>
                    x.AuthorizeUserAccessAsync(
                        It.IsAny<Guid>(),
                        It.IsAny<Guid>(),
                        It.IsAny<ClaimsPrincipal>(),
                        It.IsAny<AuthorizationContext>()
                    )
                )
                .ReturnsAsync(ImmutableList<Permission>.Empty);

            var response = await dut!.AuthorizeNoteCommandAsync(
                guid1,
                guid2,
                user,
                new CreateDraftNote(guid1, newDraftNoteGuid, "Test Note", null)
            );

            Assert.IsFalse(response);
        }

        [DataTestMethod]
        [DataRow("CreateDraftNote")]
        [DataRow("EditDraftNote")]
        [DataRow("DiscardDraftNote")]
        public async Task UserCanAccessAllDraftNotes(string commandType)
        {
            var user = PersonUserWithRoles(
                Id('4'),
                Guid.Parse("e3aaef77-0e97-47a6-b788-a67c237c781e"),
                "Volunteer"
            );

            mockUserAccessCalculation!
                .Setup(x =>
                    x.AuthorizeUserAccessAsync(
                        It.IsAny<Guid>(),
                        It.IsAny<Guid>(),
                        It.IsAny<ClaimsPrincipal>(),
                        It.IsAny<AuthorizationContext>()
                    )
                )
                .ReturnsAsync([Permission.AddEditDraftNotes, Permission.DiscardDraftNotes]);

            NoteCommand command = commandType switch
            {
                "CreateDraftNote" => new CreateDraftNote(
                    guid1,
                    newDraftNoteGuid,
                    "Test Note",
                    null
                ),
                "EditDraftNote" => new EditDraftNote(guid1, newDraftNoteGuid, "Test Note", null),
                "DiscardDraftNote" => new DiscardDraftNote(guid1, newDraftNoteGuid),
                _ => throw new ArgumentException("Invalid command type", nameof(commandType)),
            };

            var response = await dut!.AuthorizeNoteCommandAsync(guid1, guid2, user, command);

            Assert.IsTrue(response);
        }

        [DataTestMethod]
        [DataRow("EditDraftNote")]
        [DataRow("DiscardDraftNote")]
        public async Task NoteNotFound(string commandType)
        {
            var user = PersonUserWithRoles(Id('4'), guid0, "Volunteer");

            mockUserAccessCalculation!
                .Setup(x =>
                    x.AuthorizeUserAccessAsync(
                        It.IsAny<Guid>(),
                        It.IsAny<Guid>(),
                        It.IsAny<ClaimsPrincipal>(),
                        It.IsAny<AuthorizationContext>()
                    )
                )
                .ReturnsAsync([Permission.AddEditOwnDraftNotes, Permission.DiscardOwnDraftNotes]);

            NoteCommand command = commandType switch
            {
                "EditDraftNote" => new EditDraftNote(guid3, guid0, "Test Note", null),
                "DiscardDraftNote" => new DiscardDraftNote(guid3, guid0),
                _ => throw new ArgumentException("Invalid command type", nameof(commandType)),
            };

            var response = await dut!.AuthorizeNoteCommandAsync(guid1, guid2, user, command);

            Assert.IsFalse(response);
        }

        [DataTestMethod]
        [DataRow("EditDraftNote")]
        [DataRow("DiscardDraftNote")]
        public async Task UserHasNoAccessToOthersNotes(string commandType)
        {
            var user = PersonUserWithRoles(Id('4'), guid0, "Volunteer");

            mockUserAccessCalculation!
                .Setup(x =>
                    x.AuthorizeUserAccessAsync(
                        It.IsAny<Guid>(),
                        It.IsAny<Guid>(),
                        It.IsAny<ClaimsPrincipal>(),
                        It.IsAny<AuthorizationContext>()
                    )
                )
                .ReturnsAsync([Permission.AddEditOwnDraftNotes, Permission.DiscardOwnDraftNotes]);

            NoteCommand command = commandType switch
            {
                "EditDraftNote" => new EditDraftNote(guid1, guid0, "Test Note", null),
                "DiscardDraftNote" => new DiscardDraftNote(guid1, guid0),
                _ => throw new ArgumentException("Invalid command type", nameof(commandType)),
            };

            var response = await dut!.AuthorizeNoteCommandAsync(guid1, guid2, user, command);

            Assert.IsFalse(response);
        }

        [DataTestMethod]
        [DataRow("CreateDraftNote")]
        [DataRow("EditDraftNote")]
        [DataRow("DiscardDraftNote")]
        public async Task UserCanAccessOwnNotes(string commandType)
        {
            var user = PersonUserWithRoles(
                Id('4'),
                Guid.Parse("e3aaef77-0e97-47a6-b788-a67c237c781e"),
                "Volunteer"
            );

            mockUserAccessCalculation!
                .Setup(x =>
                    x.AuthorizeUserAccessAsync(
                        It.IsAny<Guid>(),
                        It.IsAny<Guid>(),
                        It.IsAny<ClaimsPrincipal>(),
                        It.IsAny<AuthorizationContext>()
                    )
                )
                .ReturnsAsync([Permission.AddEditOwnDraftNotes, Permission.DiscardOwnDraftNotes]);

            NoteCommand command = commandType switch
            {
                "CreateDraftNote" => new CreateDraftNote(
                    guid1,
                    newDraftNoteGuid,
                    "Test Note",
                    null
                ),
                "EditDraftNote" => new EditDraftNote(guid1, guid0, "Test Note", null),
                "DiscardDraftNote" => new DiscardDraftNote(guid1, guid0),
                _ => throw new ArgumentException("Invalid command type", nameof(commandType)),
            };

            var response = await dut!.AuthorizeNoteCommandAsync(guid1, guid2, user, command);

            Assert.IsTrue(response);
        }
    }
}

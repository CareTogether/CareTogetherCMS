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
    public class AuthorizeNoteCommandAsync
    {
        private static Guid Id(char x) =>
            Guid.Parse("xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx".Replace('x', x));

        /// <summary>
        /// Generates a Guid by filling the standard Guid template with hexadecimal characters from the provided string.
        /// Only characters 0-9, a-f, and A-F are used; all others are ignored. The string is repeated as needed to fill the template.
        /// </summary>
        /// <param name="s">A string containing one or more hexadecimal characters.</param>
        /// <returns>A Guid constructed from the provided hexadecimal characters.</returns>
        /// <exception cref="ArgumentException">Thrown if the input string contains no hexadecimal characters.</exception>
        /// <example>
        /// Id("a") => aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa
        /// Id("123") => 12312312-3123-1231-2312-312312312312
        /// Id("deadbeef") => deadbeef-dead-beef-dead-beefdeadbeef
        /// Id("abcxyz") => abcabcab-cabc-abca-bcab-cabcabcabcab (x, y, z ignored)
        /// Id("g123") => 12312312-3123-1231-2312-312312312312 ('g' ignored)
        /// </example>
        private static Guid Id(string s)
        {
            const string template = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx";
            // Filter only hexadecimal characters
            var hex = new string(s.Where(c => "0123456789abcdefABCDEF".Contains(c)).ToArray());
            if (string.IsNullOrEmpty(hex))
                throw new ArgumentException(
                    "Input string must contain at least one hexadecimal character.",
                    nameof(s)
                );
            var filled = string.Concat(
                template.Select((c, i) => c == 'x' ? hex[i % hex.Length] : c)
            );
            return Guid.Parse(filled);
        }

        static readonly Guid guid0 = Id('0');
        static readonly Guid guid1 = Id('1');
        static readonly Guid guid2 = Id('2');
        static readonly Guid guid3 = Id('3');
        static readonly Guid guid4 = Id('4');
        static readonly Guid guid5 = Id('5');
        static readonly Guid guidA = Id('a');
        static readonly Guid noteId0 = Id('0');
        static readonly Guid noteId1 = Id('1');
        static readonly Guid noteId2 = Id('2');
        static readonly Guid noteId3 = Id('3');
        static readonly Guid noteId4 = Id('4');
        static readonly Guid noteId5 = Id('5');
        static readonly Guid noteIdA = Id('a');
        static readonly Guid noteIdB = Id('b');
        static readonly Guid noteIdC = Id('c');
        static readonly Guid noteIdD = Id('d');
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
                    $"{noteId1}:{noteId2}"
                )
            );

        private AuthorizationEngine? dut;
        private Mock<IUserAccessCalculation>? mockUserAccessCalculation; // Change to interface

        private void MockUserAccessCalculation(params Permission[] permissions) =>
            mockUserAccessCalculation!
                .Setup(x =>
                    x.AuthorizeUserAccessAsync(
                        It.IsAny<Guid>(),
                        It.IsAny<Guid>(),
                        It.IsAny<ClaimsPrincipal>(),
                        It.IsAny<AuthorizationContext>()
                    )
                )
                .ReturnsAsync(ImmutableList.Create(permissions));

        [TestInitialize]
        public async Task TestInitializeAsync()
        {
            var accountsEventLog = new MemoryEventLog<AccountEvent>();
            var personAccessEventLog = new MemoryEventLog<PersonAccessEvent>();
            var directoryEventLog = new MemoryEventLog<DirectoryEvent>();
            var goalsEventLog = new MemoryEventLog<GoalCommandExecutedEvent>();
            var v1CasesEventLog = new MemoryEventLog<V1CaseEvent>();
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
                v1CasesEventLog,
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

            MockUserAccessCalculation([]);

            var response = await dut!.AuthorizeNoteCommandAsync(
                noteId1,
                noteId2,
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

            MockUserAccessCalculation([Permission.AddEditDraftNotes, Permission.DiscardDraftNotes]);

            NoteCommand command = commandType switch
            {
                "CreateDraftNote" => new CreateDraftNote(guid1, Guid.NewGuid(), "Test Note", null),
                "EditDraftNote" => new EditDraftNote(guid1, noteId3, "Test Note", null),
                "DiscardDraftNote" => new DiscardDraftNote(guid1, noteId3),
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

            MockUserAccessCalculation(
                [Permission.AddEditOwnDraftNotes, Permission.DiscardOwnDraftNotes]
            );

            NoteCommand command = commandType switch
            {
                "EditDraftNote" => new EditDraftNote(guid3, noteId0, "Test Note", null),
                "DiscardDraftNote" => new DiscardDraftNote(guid3, noteId0),
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

            MockUserAccessCalculation(
                [Permission.AddEditOwnDraftNotes, Permission.DiscardOwnDraftNotes]
            );

            NoteCommand command = commandType switch
            {
                "EditDraftNote" => new EditDraftNote(guid1, noteIdD, "Test Note", null),
                "DiscardDraftNote" => new DiscardDraftNote(guid1, noteIdD),
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

            MockUserAccessCalculation(
                [Permission.AddEditOwnDraftNotes, Permission.DiscardOwnDraftNotes]
            );

            NoteCommand command = commandType switch
            {
                "CreateDraftNote" => new CreateDraftNote(
                    guid1,
                    newDraftNoteGuid,
                    "Test Note",
                    null
                ),
                "EditDraftNote" => new EditDraftNote(guid1, noteId3, "Test Note", null),
                "DiscardDraftNote" => new DiscardDraftNote(guid1, noteId3),
                _ => throw new ArgumentException("Invalid command type", nameof(commandType)),
            };

            var response = await dut!.AuthorizeNoteCommandAsync(guid1, guid2, user, command);

            Assert.IsTrue(response);
        }
    }
}

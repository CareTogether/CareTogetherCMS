using System;
using System.Collections.Generic;
using System.Collections.Immutable;
using System.Linq;
using System.Threading.Tasks;
using CareTogether.Resources;
using CareTogether.Resources.Directory;
using CareTogether.Utilities.FileStore;
using Microsoft.VisualStudio.TestTools.UnitTesting;
using Moq;

namespace CareTogether.Core.Test
{
    [TestClass]
    public class DirectoryResourceTest
    {
        private static Guid Id(char x) =>
            Guid.Parse("xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx".Replace('x', x));

        static readonly Guid guid0 = Id('0');
        static readonly Guid guid1 = Id('1');
        static readonly Guid guid2 = Id('2');
        static readonly Guid guid3 = Id('3');
        static readonly Guid guid4 = Id('4');
        static readonly Guid guid5 = Id('5');
        static readonly Guid guid6 = Id('6');
        static readonly Guid guid7 = Id('7');

#nullable disable
        MemoryEventLog<DirectoryEvent> events;

#nullable restore

        [TestInitialize]
        public async Task TestInitialize()
        {
            events = new MemoryEventLog<DirectoryEvent>();
            foreach (
                var (domainEvent, index) in EventSequence(
                    new PersonCommandExecuted(
                        guid0,
                        new DateTime(2021, 7, 1),
                        new CreatePerson(
                            guid1,
                            "John",
                            "Doe",
                            Gender.Male,
                            new ExactAge(new DateTime(1980, 7, 1)),
                            "Ethnic",
                            ImmutableList<Address>.Empty,
                            null,
                            ImmutableList<PhoneNumber>.Empty,
                            null,
                            ImmutableList<EmailAddress>.Empty,
                            null,
                            "Test",
                            "ABC"
                        )
                    ),
                    new PersonCommandExecuted(
                        guid0,
                        new DateTime(2021, 7, 1),
                        new CreatePerson(
                            guid2,
                            "Jane",
                            "Smith",
                            Gender.Female,
                            new AgeInYears(42, new DateTime(2021, 1, 1)),
                            "Ethnic",
                            ImmutableList<Address>.Empty,
                            null,
                            ImmutableList<PhoneNumber>.Empty,
                            null,
                            ImmutableList<EmailAddress>.Empty,
                            null,
                            null,
                            "DEF"
                        )
                    ),
                    new PersonCommandExecuted(
                        guid0,
                        new DateTime(2021, 7, 1),
                        new UpdatePersonName(guid2, "Jane", "Doe")
                    ),
                    new PersonCommandExecuted(
                        guid0,
                        new DateTime(2021, 7, 1),
                        new UpdatePersonAge(guid1, new ExactAge(new DateTime(1975, 1, 1)))
                    ),
                    new PersonCommandExecuted(
                        guid0,
                        new DateTime(2021, 7, 1),
                        new UpdatePersonAge(guid2, new ExactAge(new DateTime(1979, 7, 1)))
                    ),
                    new FamilyCommandExecuted(
                        guid0,
                        new DateTime(2021, 7, 1),
                        new CreateFamily(
                            guid5,
                            guid1,
                            ImmutableList<(Guid, FamilyAdultRelationshipInfo)>.Empty.Add(
                                (guid1, new FamilyAdultRelationshipInfo("Dad", true))
                            ),
                            ImmutableList<Guid>.Empty,
                            ImmutableList<CustodialRelationship>.Empty
                        )
                    ),
                    new FamilyCommandExecuted(
                        guid0,
                        new DateTime(2021, 7, 1),
                        new AddAdultToFamily(
                            guid5,
                            guid2,
                            new FamilyAdultRelationshipInfo("Mom", true)
                        )
                    ),
                    new PersonCommandExecuted(
                        guid0,
                        new DateTime(2021, 7, 1),
                        new CreatePerson(
                            guid6,
                            "Eric",
                            "Doe",
                            Gender.Male,
                            new AgeInYears(12, new DateTime(2021, 1, 1)),
                            "Ethnic",
                            ImmutableList<Address>.Empty,
                            null,
                            ImmutableList<PhoneNumber>.Empty,
                            null,
                            ImmutableList<EmailAddress>.Empty,
                            null,
                            null,
                            null
                        )
                    ),
                    new FamilyCommandExecuted(
                        guid0,
                        new DateTime(2021, 7, 1),
                        new AddChildToFamily(
                            guid5,
                            guid6,
                            ImmutableList<CustodialRelationship>
                                .Empty.Add(
                                    new CustodialRelationship(
                                        guid6,
                                        guid1,
                                        CustodialRelationshipType.ParentWithCustody
                                    )
                                )
                                .Add(
                                    new CustodialRelationship(
                                        guid6,
                                        guid2,
                                        CustodialRelationshipType.ParentWithCustody
                                    )
                                )
                        )
                    ),
                    new FamilyCommandExecuted(
                        guid0,
                        new DateTime(2021, 7, 1),
                        new UpdateAdultRelationshipToFamily(
                            guid5,
                            guid1,
                            new FamilyAdultRelationshipInfo("Dad", false)
                        )
                    ),
                    new FamilyCommandExecuted(
                        guid0,
                        new DateTime(2021, 7, 1),
                        new RemoveCustodialRelationship(guid5, guid6, guid1)
                    ),
                    new FamilyCommandExecuted(
                        guid0,
                        new DateTime(2021, 7, 1),
                        new UpdateCustodialRelationshipType(
                            guid5,
                            guid6,
                            guid2,
                            CustodialRelationshipType.ParentWithCourtAppointedCustody
                        )
                    ),
                    new FamilyCommandExecuted(
                        guid0,
                        new DateTime(2021, 7, 1),
                        new AddCustodialRelationship(
                            guid5,
                            new CustodialRelationship(
                                guid6,
                                guid1,
                                CustodialRelationshipType.ParentWithCourtAppointedCustody
                            )
                        )
                    )
                )
            )
                await events.AppendEventAsync(guid1, guid2, domainEvent, index);
        }

        [TestCleanup]
        public void TestCleanup()
        {
            events = null;
        }

        [TestMethod]
        public async Task TestListPeople()
        {
            var dut = new DirectoryResource(events, Mock.Of<IFileStore>());

            var people = await dut.ListPeopleAsync(guid1, guid2);

            Assert.AreEqual(3, people.Count);
        }

        [TestMethod]
        public async Task TestListFamilies()
        {
            var dut = new DirectoryResource(events, Mock.Of<IFileStore>());

            var families1 = await dut.ListFamiliesAsync(guid1, guid2);
            var families2 = await dut.ListFamiliesAsync(guid2, guid1);

            Assert.AreEqual(1, families1.Count);
            Assert.AreEqual(0, families2.Count);
        }

        [TestMethod]
        public async Task TestExecutePersonCommand()
        {
            var dut = new DirectoryResource(events, Mock.Of<IFileStore>());

            var result1 = await dut.ExecutePersonCommandAsync(
                guid1,
                guid2,
                new UpdatePersonAge(guid6, new ExactAge(new DateTime(2021, 7, 1))),
                guid0
            );
            await Assert.ThrowsExceptionAsync<KeyNotFoundException>(
                () =>
                    dut.ExecutePersonCommandAsync(
                        guid1,
                        guid2,
                        new UpdatePersonAge(guid5, new ExactAge(new DateTime(2021, 7, 2))),
                        guid0
                    )
            );
            await Assert.ThrowsExceptionAsync<KeyNotFoundException>(
                () =>
                    dut.ExecutePersonCommandAsync(
                        guid2,
                        guid1,
                        new UpdatePersonAge(guid6, new ExactAge(new DateTime(2021, 7, 3))),
                        guid0
                    )
            );

            Assert.AreEqual(
                new Person(
                    guid6,
                    true,
                    "Eric",
                    "Doe",
                    Gender.Male,
                    new ExactAge(new DateTime(2021, 7, 1)),
                    "Ethnic",
                    ImmutableList<Address>.Empty,
                    null,
                    ImmutableList<PhoneNumber>.Empty,
                    null,
                    ImmutableList<EmailAddress>.Empty,
                    null,
                    null,
                    null
                ),
                result1
            );
        }

        private static IEnumerable<(DirectoryEvent, long)> EventSequence(
            params DirectoryEvent[] events
        ) => events.Select((e, i) => (e, (long)i + 1));
    }
}

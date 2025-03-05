using System;
using System.Collections.Generic;
using System.Collections.Immutable;
using System.Linq;
using System.Threading.Tasks;
using CareTogether.Resources.Directory;
using CareTogether.Utilities.FileStore;
using Microsoft.VisualStudio.TestTools.UnitTesting;
using Moq;

namespace CareTogether.Core.Test
{
    [TestClass]
    public class DirectoryResourceTest
    {
        static readonly Guid _Guid0 = Id('0');
        static readonly Guid _Guid1 = Id('1');
        static readonly Guid _Guid2 = Id('2');
        static readonly Guid _Guid3 = Id('3');
        static readonly Guid _Guid4 = Id('4');
        static readonly Guid _Guid5 = Id('5');
        static readonly Guid _Guid6 = Id('6');
        static readonly Guid _Guid7 = Id('7');

#nullable disable
        MemoryEventLog<DirectoryEvent> _Events;

#nullable restore
        static Guid Id(char x)
        {
            return Guid.Parse("xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx".Replace('x', x));
        }

        [TestInitialize]
        public async Task TestInitialize()
        {
            _Events = new MemoryEventLog<DirectoryEvent>();
            foreach (
                (DirectoryEvent domainEvent, long index) in EventSequence(
                    new PersonCommandExecuted(
                        _Guid0,
                        new DateTime(2021, 7, 1),
                        new CreatePerson(
                            _Guid1,
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
                        _Guid0,
                        new DateTime(2021, 7, 1),
                        new CreatePerson(
                            _Guid2,
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
                        _Guid0,
                        new DateTime(2021, 7, 1),
                        new UpdatePersonName(_Guid2, "Jane", "Doe")
                    ),
                    new PersonCommandExecuted(
                        _Guid0,
                        new DateTime(2021, 7, 1),
                        new UpdatePersonAge(_Guid1, new ExactAge(new DateTime(1975, 1, 1)))
                    ),
                    new PersonCommandExecuted(
                        _Guid0,
                        new DateTime(2021, 7, 1),
                        new UpdatePersonAge(_Guid2, new ExactAge(new DateTime(1979, 7, 1)))
                    ),
                    new FamilyCommandExecuted(
                        _Guid0,
                        new DateTime(2021, 7, 1),
                        new CreateFamily(
                            _Guid5,
                            _Guid1,
                            ImmutableList<(Guid, FamilyAdultRelationshipInfo)>.Empty.Add(
                                (_Guid1, new FamilyAdultRelationshipInfo("Dad", true))
                            ),
                            ImmutableList<Guid>.Empty,
                            ImmutableList<CustodialRelationship>.Empty
                        )
                    ),
                    new FamilyCommandExecuted(
                        _Guid0,
                        new DateTime(2021, 7, 1),
                        new AddAdultToFamily(_Guid5, _Guid2, new FamilyAdultRelationshipInfo("Mom", true))
                    ),
                    new PersonCommandExecuted(
                        _Guid0,
                        new DateTime(2021, 7, 1),
                        new CreatePerson(
                            _Guid6,
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
                        _Guid0,
                        new DateTime(2021, 7, 1),
                        new AddChildToFamily(
                            _Guid5,
                            _Guid6,
                            ImmutableList<CustodialRelationship>
                                .Empty.Add(
                                    new CustodialRelationship(
                                        _Guid6,
                                        _Guid1,
                                        CustodialRelationshipType.ParentWithCustody
                                    )
                                )
                                .Add(
                                    new CustodialRelationship(
                                        _Guid6,
                                        _Guid2,
                                        CustodialRelationshipType.ParentWithCustody
                                    )
                                )
                        )
                    ),
                    new FamilyCommandExecuted(
                        _Guid0,
                        new DateTime(2021, 7, 1),
                        new UpdateAdultRelationshipToFamily(
                            _Guid5,
                            _Guid1,
                            new FamilyAdultRelationshipInfo("Dad", false)
                        )
                    ),
                    new FamilyCommandExecuted(
                        _Guid0,
                        new DateTime(2021, 7, 1),
                        new RemoveCustodialRelationship(_Guid5, _Guid6, _Guid1)
                    ),
                    new FamilyCommandExecuted(
                        _Guid0,
                        new DateTime(2021, 7, 1),
                        new UpdateCustodialRelationshipType(
                            _Guid5,
                            _Guid6,
                            _Guid2,
                            CustodialRelationshipType.ParentWithCourtAppointedCustody
                        )
                    ),
                    new FamilyCommandExecuted(
                        _Guid0,
                        new DateTime(2021, 7, 1),
                        new AddCustodialRelationship(
                            _Guid5,
                            new CustodialRelationship(
                                _Guid6,
                                _Guid1,
                                CustodialRelationshipType.ParentWithCourtAppointedCustody
                            )
                        )
                    )
                )
            )
            {
                await _Events.AppendEventAsync(_Guid1, _Guid2, domainEvent, index);
            }
        }

        [TestCleanup]
        public void TestCleanup()
        {
            _Events = null;
        }

        [TestMethod]
        public async Task TestListPeople()
        {
            DirectoryResource dut = new(_Events, Mock.Of<IFileStore>());

            ImmutableList<Person> people = await dut.ListPeopleAsync(_Guid1, _Guid2);

            Assert.AreEqual(3, people.Count);
        }

        [TestMethod]
        public async Task TestListFamilies()
        {
            DirectoryResource dut = new(_Events, Mock.Of<IFileStore>());

            ImmutableList<Family> families1 = await dut.ListFamiliesAsync(_Guid1, _Guid2);
            ImmutableList<Family> families2 = await dut.ListFamiliesAsync(_Guid2, _Guid1);

            Assert.AreEqual(1, families1.Count);
            Assert.AreEqual(0, families2.Count);
        }

        [TestMethod]
        public async Task TestExecutePersonCommand()
        {
            DirectoryResource dut = new(_Events, Mock.Of<IFileStore>());

            Person result1 = await dut.ExecutePersonCommandAsync(
                _Guid1,
                _Guid2,
                new UpdatePersonAge(_Guid6, new ExactAge(new DateTime(2021, 7, 1))),
                _Guid0
            );
            await Assert.ThrowsExceptionAsync<KeyNotFoundException>(
                () =>
                    dut.ExecutePersonCommandAsync(
                        _Guid1,
                        _Guid2,
                        new UpdatePersonAge(_Guid5, new ExactAge(new DateTime(2021, 7, 2))),
                        _Guid0
                    )
            );
            await Assert.ThrowsExceptionAsync<KeyNotFoundException>(
                () =>
                    dut.ExecutePersonCommandAsync(
                        _Guid2,
                        _Guid1,
                        new UpdatePersonAge(_Guid6, new ExactAge(new DateTime(2021, 7, 3))),
                        _Guid0
                    )
            );

            Assert.AreEqual(
                new Person(
                    _Guid6,
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

        static IEnumerable<(DirectoryEvent, long)> EventSequence(params DirectoryEvent[] events)
        {
            return events.Select((e, i) => (e, (long)i + 1));
        }
    }
}

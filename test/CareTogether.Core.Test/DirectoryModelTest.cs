using System;
using System.Collections.Generic;
using System.Collections.Immutable;
using System.Linq;
using System.Threading.Tasks;
using CareTogether.Resources;
using CareTogether.Resources.Directory;
using Microsoft.VisualStudio.TestTools.UnitTesting;

namespace CareTogether.Core.Test
{
    [TestClass]
    public class DirectoryModelTest
    {
        static readonly Guid _Guid0 = Id('0');
        static readonly Guid _Guid1 = Id('1');
        static readonly Guid _Guid2 = Id('2');
        static readonly Guid _Guid3 = Id('3');
        static readonly Guid _Guid4 = Id('4');
        static readonly Guid _Guid5 = Id('5');
        static readonly Guid _Guid6 = Id('6');

        static Guid Id(char x)
        {
            return Guid.Parse("xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx".Replace('x', x));
        }

        [TestMethod]
        public async Task TestInitializeAsyncWithNoEvents()
        {
            DirectoryModel dut = await DirectoryModel.InitializeAsync(EventSequence());

            Assert.AreEqual(-1, dut.LastKnownSequenceNumber);
            Assert.AreEqual(0, dut.FindFamilies(x => true).Count);
            Assert.AreEqual(0, dut.FindPeople(x => true).Count);
        }

        [TestMethod]
        public async Task TestInitializeAsyncWithAnEvent()
        {
            DirectoryModel dut = await DirectoryModel.InitializeAsync(
                EventSequence(
                    new PersonCommandExecuted(
                        _Guid0,
                        new DateTime(2021, 7, 1),
                        new CreatePerson(
                            _Guid1,
                            "John",
                            "Smith",
                            Gender.Male,
                            new ExactAge(new DateTime(1980, 7, 1)),
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
                    )
                )
            );

            Assert.AreEqual(0, dut.LastKnownSequenceNumber);
            Assert.AreEqual(0, dut.FindFamilies(x => true).Count);
            ImmutableList<Person> people = dut.FindPeople(x => true);
            Assert.AreEqual(1, people.Count);
            Assert.AreEqual(_Guid1, people[0].Id);
            Assert.AreEqual("John", people[0].FirstName);
            Assert.AreEqual("Smith", people[0].LastName);
            Assert.AreEqual(new ExactAge(new DateTime(1980, 7, 1)), people[0].Age);
        }

        [TestMethod]
        public async Task TestInitializeAsyncWithSeveralEvents()
        {
            DirectoryModel dut = await DirectoryModel.InitializeAsync(
                EventSequence(
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
                            null,
                            null
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
                            null
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
                    )
                )
            );

            Assert.AreEqual(4, dut.LastKnownSequenceNumber);
            Assert.AreEqual(0, dut.FindFamilies(x => true).Count);
            ImmutableList<Person> people = dut.FindPeople(x => true);
            Assert.AreEqual(2, people.Count);
            Assert.AreEqual(_Guid1, people[0].Id);
            Assert.AreEqual("John", people[0].FirstName);
            Assert.AreEqual("Doe", people[0].LastName);
            Assert.AreEqual(new ExactAge(new DateTime(1975, 1, 1)), people[0].Age);
            Assert.AreEqual(_Guid2, people[1].Id);
            Assert.AreEqual("Jane", people[1].FirstName);
            Assert.AreEqual("Doe", people[1].LastName);
            Assert.AreEqual(new ExactAge(new DateTime(1979, 7, 1)), people[1].Age);
        }

        [TestMethod]
        public async Task TestInitializeAsyncWithEvenMoreEvents()
        {
            DirectoryModel dut = await DirectoryModel.InitializeAsync(
                EventSequence(
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
            );

            Assert.AreEqual(12, dut.LastKnownSequenceNumber);
            ImmutableList<Family> families = dut.FindFamilies(x => true);
            ImmutableList<Person> people = dut.FindPeople(x => true);
            Assert.AreEqual(3, people.Count);
            Assert.AreEqual(
                new Person(
                    _Guid1,
                    true,
                    "John",
                    "Doe",
                    Gender.Male,
                    new ExactAge(new DateTime(1975, 1, 1)),
                    "Ethnic",
                    ImmutableList<Address>.Empty,
                    null,
                    ImmutableList<PhoneNumber>.Empty,
                    null,
                    ImmutableList<EmailAddress>.Empty,
                    null,
                    "Test",
                    "ABC"
                ),
                people.Single(p => p.Id == _Guid1)
            );
            Assert.AreEqual(
                new Person(
                    _Guid2,
                    true,
                    "Jane",
                    "Doe",
                    Gender.Female,
                    new ExactAge(new DateTime(1979, 7, 1)),
                    "Ethnic",
                    ImmutableList<Address>.Empty,
                    null,
                    ImmutableList<PhoneNumber>.Empty,
                    null,
                    ImmutableList<EmailAddress>.Empty,
                    null,
                    null,
                    "DEF"
                ),
                people.Single(p => p.Id == _Guid2)
            );
            Assert.AreEqual(
                new Person(
                    _Guid6,
                    true,
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
                ),
                people.Single(p => p.Id == _Guid6)
            );
            Assert.AreEqual(1, families.Count);
            Family actualFamily = families[0];
            Family expectedFamily =
                new(
                    _Guid5,
                    true,
                    _Guid4,
                    ImmutableList<(Person, FamilyAdultRelationshipInfo)>
                        .Empty.Add(
                            (
                                new Person(
                                    _Guid1,
                                    true,
                                    "John",
                                    "Doe",
                                    Gender.Male,
                                    new ExactAge(new DateTime(1975, 1, 1)),
                                    "Ethnic",
                                    ImmutableList<Address>.Empty,
                                    null,
                                    ImmutableList<PhoneNumber>.Empty,
                                    null,
                                    ImmutableList<EmailAddress>.Empty,
                                    null,
                                    "Test",
                                    "ABC"
                                ),
                                new FamilyAdultRelationshipInfo("Dad", false)
                            )
                        )
                        .Add(
                            (
                                new Person(
                                    _Guid2,
                                    true,
                                    "Jane",
                                    "Doe",
                                    Gender.Female,
                                    new ExactAge(new DateTime(1979, 7, 1)),
                                    "Ethnic",
                                    ImmutableList<Address>.Empty,
                                    null,
                                    ImmutableList<PhoneNumber>.Empty,
                                    null,
                                    ImmutableList<EmailAddress>.Empty,
                                    null,
                                    null,
                                    "DEF"
                                ),
                                new FamilyAdultRelationshipInfo("Mom", true)
                            )
                        ),
                    ImmutableList<Person>.Empty.Add(
                        new Person(
                            _Guid6,
                            true,
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
                    ImmutableList<CustodialRelationship>
                        .Empty.Add(
                            new CustodialRelationship(
                                _Guid6,
                                _Guid2,
                                CustodialRelationshipType.ParentWithCourtAppointedCustody
                            )
                        )
                        .Add(
                            new CustodialRelationship(
                                _Guid6,
                                _Guid1,
                                CustodialRelationshipType.ParentWithCourtAppointedCustody
                            )
                        ),
                    ImmutableList<UploadedDocumentInfo>.Empty,
                    ImmutableList<Guid>.Empty,
                    ImmutableList<CompletedCustomFieldInfo>.Empty,
                    ImmutableList<Activity>.Empty
                );
            Assert.AreEqual(expectedFamily.Id, actualFamily.Id);
            Assert.AreEqual(expectedFamily.Adults.Count, actualFamily.Adults.Count);
            Assert.AreEqual(expectedFamily.Adults[0], actualFamily.Adults[0]);
            Assert.AreEqual(expectedFamily.Adults[1], actualFamily.Adults[1]);
            Assert.AreEqual(expectedFamily.Children.Count, actualFamily.Children.Count);
            Assert.AreEqual(expectedFamily.Children[0], actualFamily.Children[0]);
            Assert.AreEqual(expectedFamily.CustodialRelationships.Count, actualFamily.CustodialRelationships.Count);
            Assert.AreEqual(expectedFamily.CustodialRelationships[0], actualFamily.CustodialRelationships[0]);
            Assert.AreEqual(expectedFamily.CustodialRelationships[1], actualFamily.CustodialRelationships[1]);
        }

        static IAsyncEnumerable<(DirectoryEvent, long)> EventSequence(params DirectoryEvent[] directoryEvents)
        {
            return directoryEvents.Select((ce, i) => (ce, (long)i)).ToAsyncEnumerable();
        }
    }
}

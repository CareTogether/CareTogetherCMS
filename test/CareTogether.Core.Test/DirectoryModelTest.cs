using CareTogether.Resources;
using CareTogether.Resources.Directory;
using Microsoft.VisualStudio.TestTools.UnitTesting;
using System;
using System.Collections.Generic;
using System.Collections.Immutable;
using System.Linq;
using System.Threading.Tasks;

namespace CareTogether.Core.Test
{
    [TestClass]
    public class DirectoryModelTest
    {
        private static Guid Id(char x) => Guid.Parse("xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx".Replace('x', x));
        static readonly Guid guid0 = Id('0');
        static readonly Guid guid1 = Id('1');
        static readonly Guid guid2 = Id('2');
        static readonly Guid guid3 = Id('3');
        static readonly Guid guid4 = Id('4');
        static readonly Guid guid5 = Id('5');
        static readonly Guid guid6 = Id('6');


        [TestMethod]
        public async Task TestInitializeAsyncWithNoEvents()
        {
            var dut = await DirectoryModel.InitializeAsync(EventSequence());

            Assert.AreEqual(-1, dut.LastKnownSequenceNumber);
            Assert.AreEqual(0, dut.FindFamilies(x => true).Count);
            Assert.AreEqual(0, dut.FindPeople(x => true).Count);
        }

        [TestMethod]
        public async Task TestInitializeAsyncWithAnEvent()
        {
            var dut = await DirectoryModel.InitializeAsync(EventSequence(
                new PersonCommandExecuted(guid0, new DateTime(2021, 7, 1), new CreatePerson(guid1, null, "John", "Smith", Gender.Male, new ExactAge(new DateTime(1980, 7, 1)), "Ethnic",
                ImmutableList<Address>.Empty, null, ImmutableList<PhoneNumber>.Empty, null, ImmutableList<EmailAddress>.Empty, null, null, null))
            ));

            Assert.AreEqual(0, dut.LastKnownSequenceNumber);
            Assert.AreEqual(0, dut.FindFamilies(x => true).Count);
            var people = dut.FindPeople(x => true);
            Assert.AreEqual(1, people.Count);
            Assert.AreEqual(guid1, people[0].Id);
            Assert.AreEqual(null, people[0].UserId);
            Assert.AreEqual("John", people[0].FirstName);
            Assert.AreEqual("Smith", people[0].LastName);
            Assert.AreEqual(new ExactAge(new DateTime(1980, 7, 1)), people[0].Age);
        }

        [TestMethod]
        public async Task TestInitializeAsyncWithSeveralEvents()
        {
            var dut = await DirectoryModel.InitializeAsync(EventSequence(
                new PersonCommandExecuted(guid0, new DateTime(2021, 7, 1), new CreatePerson(guid1, null, "John", "Doe", Gender.Male, new ExactAge(new DateTime(1980, 7, 1)), "Ethnic",
                ImmutableList<Address>.Empty, null, ImmutableList<PhoneNumber>.Empty, null, ImmutableList<EmailAddress>.Empty, null, null, null)),
                new PersonCommandExecuted(guid0, new DateTime(2021, 7, 1), new CreatePerson(guid2, guid3, "Jane", "Smith", Gender.Female, new AgeInYears(42, new DateTime(2021, 1, 1)), "Ethnic",
                ImmutableList<Address>.Empty, null, ImmutableList<PhoneNumber>.Empty, null, ImmutableList<EmailAddress>.Empty, null, null, null)),
                new PersonCommandExecuted(guid0, new DateTime(2021, 7, 1), new UpdatePersonName(guid2, "Jane", "Doe")),
                new PersonCommandExecuted(guid0, new DateTime(2021, 7, 1), new UpdatePersonAge(guid1, new ExactAge(new DateTime(1975, 1, 1)))),
                new PersonCommandExecuted(guid0, new DateTime(2021, 7, 1), new UpdatePersonAge(guid2, new ExactAge(new DateTime(1979, 7, 1)))),
                new PersonCommandExecuted(guid0, new DateTime(2021, 7, 1), new UpdatePersonUserLink(guid1, guid4))
            ));

            Assert.AreEqual(5, dut.LastKnownSequenceNumber);
            Assert.AreEqual(0, dut.FindFamilies(x => true).Count);
            var people = dut.FindPeople(x => true);
            Assert.AreEqual(2, people.Count);
            Assert.AreEqual(guid1, people[0].Id);
            Assert.AreEqual(guid4, people[0].UserId);
            Assert.AreEqual("John", people[0].FirstName);
            Assert.AreEqual("Doe", people[0].LastName);
            Assert.AreEqual(new ExactAge(new DateTime(1975, 1, 1)), people[0].Age);
            Assert.AreEqual(guid2, people[1].Id);
            Assert.AreEqual(guid3, people[1].UserId);
            Assert.AreEqual("Jane", people[1].FirstName);
            Assert.AreEqual("Doe", people[1].LastName);
            Assert.AreEqual(new ExactAge(new DateTime(1979, 7, 1)), people[1].Age);
        }

        [TestMethod]
        public async Task TestInitializeAsyncWithEvenMoreEvents()
        {
            var dut = await DirectoryModel.InitializeAsync(EventSequence(
                new PersonCommandExecuted(guid0, new DateTime(2021, 7, 1), new CreatePerson(guid1, null, "John", "Doe", Gender.Male, new ExactAge(new DateTime(1980, 7, 1)), "Ethnic",
                ImmutableList<Address>.Empty, null, ImmutableList<PhoneNumber>.Empty, null, ImmutableList<EmailAddress>.Empty, null, "Test", "ABC")),
                new PersonCommandExecuted(guid0, new DateTime(2021, 7, 1), new CreatePerson(guid2, guid3, "Jane", "Smith", Gender.Female, new AgeInYears(42, new DateTime(2021, 1, 1)), "Ethnic",
                ImmutableList<Address>.Empty, null, ImmutableList<PhoneNumber>.Empty, null, ImmutableList<EmailAddress>.Empty, null, null, "DEF")),
                new PersonCommandExecuted(guid0, new DateTime(2021, 7, 1), new UpdatePersonName(guid2, "Jane", "Doe")),
                new PersonCommandExecuted(guid0, new DateTime(2021, 7, 1), new UpdatePersonAge(guid1, new ExactAge(new DateTime(1975, 1, 1)))),
                new PersonCommandExecuted(guid0, new DateTime(2021, 7, 1), new UpdatePersonAge(guid2, new ExactAge(new DateTime(1979, 7, 1)))),
                new PersonCommandExecuted(guid0, new DateTime(2021, 7, 1), new UpdatePersonUserLink(guid1, guid4)),
                new FamilyCommandExecuted(guid0, new DateTime(2021, 7, 1), new CreateFamily(guid5, guid1,
                    ImmutableList<(Guid, FamilyAdultRelationshipInfo)>.Empty.Add((guid1, new FamilyAdultRelationshipInfo("Dad", true))),
                    ImmutableList<Guid>.Empty, ImmutableList<CustodialRelationship>.Empty)),
                new FamilyCommandExecuted(guid0, new DateTime(2021, 7, 1), new AddAdultToFamily(guid5, guid2, new FamilyAdultRelationshipInfo("Mom", true))),
                new PersonCommandExecuted(guid0, new DateTime(2021, 7, 1), new CreatePerson(guid6, null, "Eric", "Doe", Gender.Male, new AgeInYears(12, new DateTime(2021, 1, 1)), "Ethnic",
                ImmutableList<Address>.Empty, null, ImmutableList<PhoneNumber>.Empty, null, ImmutableList<EmailAddress>.Empty, null, null, null)),
                new FamilyCommandExecuted(guid0, new DateTime(2021, 7, 1), new AddChildToFamily(guid5, guid6, ImmutableList<CustodialRelationship>.Empty
                    .Add(new CustodialRelationship(guid6, guid1, CustodialRelationshipType.ParentWithCustody))
                    .Add(new CustodialRelationship(guid6, guid2, CustodialRelationshipType.ParentWithCustody)))),
                new FamilyCommandExecuted(guid0, new DateTime(2021, 7, 1), new UpdateAdultRelationshipToFamily(guid5, guid1, new FamilyAdultRelationshipInfo("Dad", false))),
                new FamilyCommandExecuted(guid0, new DateTime(2021, 7, 1), new RemoveCustodialRelationship(guid5, guid6, guid1)),
                new FamilyCommandExecuted(guid0, new DateTime(2021, 7, 1), new UpdateCustodialRelationshipType(guid5, guid6, guid2, CustodialRelationshipType.ParentWithCourtAppointedCustody)),
                new FamilyCommandExecuted(guid0, new DateTime(2021, 7, 1), new AddCustodialRelationship(guid5, new CustodialRelationship(guid6, guid1, CustodialRelationshipType.ParentWithCourtAppointedCustody)))
            ));

            Assert.AreEqual(13, dut.LastKnownSequenceNumber);
            var families = dut.FindFamilies(x => true);
            var people = dut.FindPeople(x => true);
            Assert.AreEqual(3, people.Count);
            Assert.AreEqual(new Person(guid1, guid4, true, "John", "Doe", Gender.Male, new ExactAge(new DateTime(1975, 1, 1)), "Ethnic",
                ImmutableList<Address>.Empty, null, ImmutableList<PhoneNumber>.Empty, null, ImmutableList<EmailAddress>.Empty, null, "Test", "ABC"), people.Single(p => p.Id == guid1));
            Assert.AreEqual(new Person(guid2, guid3, true, "Jane", "Doe", Gender.Female, new ExactAge(new DateTime(1979, 7, 1)), "Ethnic",
                ImmutableList<Address>.Empty, null, ImmutableList<PhoneNumber>.Empty, null, ImmutableList<EmailAddress>.Empty, null, null, "DEF"), people.Single(p => p.Id == guid2));
            Assert.AreEqual(new Person(guid6, null, true, "Eric", "Doe", Gender.Male, new AgeInYears(12, new DateTime(2021, 1, 1)), "Ethnic",
                ImmutableList<Address>.Empty, null, ImmutableList<PhoneNumber>.Empty, null, ImmutableList<EmailAddress>.Empty, null, null, null), people.Single(p => p.Id == guid6));
            Assert.AreEqual(1, families.Count);
            var actualFamily = families[0];
            var expectedFamily = new Family(guid5, guid4,
                ImmutableList<(Person, FamilyAdultRelationshipInfo)>.Empty
                    .Add((new Person(guid1, guid4, true, "John", "Doe", Gender.Male, new ExactAge(new DateTime(1975, 1, 1)), "Ethnic",
                        ImmutableList<Address>.Empty, null, ImmutableList<PhoneNumber>.Empty, null, ImmutableList<EmailAddress>.Empty, null,"Test", "ABC"),
                        new FamilyAdultRelationshipInfo("Dad", false)))
                    .Add((new Person(guid2, guid3, true, "Jane", "Doe", Gender.Female, new ExactAge(new DateTime(1979, 7, 1)), "Ethnic",
                        ImmutableList<Address>.Empty, null, ImmutableList<PhoneNumber>.Empty, null, ImmutableList<EmailAddress>.Empty, null,null, "DEF"),
                        new FamilyAdultRelationshipInfo("Mom", true))),
                ImmutableList<Person>.Empty
                    .Add(new Person(guid6, null, true, "Eric", "Doe", Gender.Male, new AgeInYears(12, new DateTime(2021, 1, 1)), "Ethnic",
                        ImmutableList<Address>.Empty, null, ImmutableList<PhoneNumber>.Empty, null, ImmutableList<EmailAddress>.Empty, null,null, null)),
                ImmutableList<CustodialRelationship>.Empty
                    .Add(new CustodialRelationship(guid6, guid2, CustodialRelationshipType.ParentWithCourtAppointedCustody))
                    .Add(new CustodialRelationship(guid6, guid1, CustodialRelationshipType.ParentWithCourtAppointedCustody)),
                ImmutableList<UploadedDocumentInfo>.Empty, ImmutableList<Guid>.Empty,
                ImmutableDictionary<string, CompletedCustomFieldInfo>.Empty, ImmutableList<Activity>.Empty);
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


        private static IAsyncEnumerable<(DirectoryEvent, long)> EventSequence(params DirectoryEvent[] directoryEvents) =>
            directoryEvents
                .Select((ce, i) => (ce, (long)i))
                .ToAsyncEnumerable();
    }
}

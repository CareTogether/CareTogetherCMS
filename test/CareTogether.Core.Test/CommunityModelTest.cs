using CareTogether.Resources;
using CareTogether.Resources.Models;
using Microsoft.VisualStudio.TestTools.UnitTesting;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace CareTogether.Core.Test
{
    [TestClass]
    public class CommunityModelTest
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
            var dut = await CommunityModel.InitializeAsync(EventSequence());

            Assert.AreEqual(-1, dut.LastKnownSequenceNumber);
            Assert.AreEqual(0, dut.FindFamilies(x => true).Count);
            Assert.AreEqual(0, dut.FindPeople(x => true).Count);
        }

        [TestMethod]
        public async Task TestInitializeAsyncWithAnEvent()
        {
            var dut = await CommunityModel.InitializeAsync(EventSequence(
                new PersonCommandExecuted(guid0, new DateTime(2021, 7, 1), new CreatePerson(guid1, null, "John", "Smith", null))
            ));

            Assert.AreEqual(0, dut.LastKnownSequenceNumber);
            Assert.AreEqual(0, dut.FindFamilies(x => true).Count);
            var people = dut.FindPeople(x => true);
            Assert.AreEqual(1, people.Count);
            Assert.AreEqual(guid1, people[0].Id);
            Assert.AreEqual(null, people[0].UserId);
            Assert.AreEqual("John", people[0].FirstName);
            Assert.AreEqual("Smith", people[0].LastName);
            Assert.AreEqual(null, people[0].Age);
        }

        [TestMethod]
        public async Task TestInitializeAsyncWithSeveralEvents()
        {
            var dut = await CommunityModel.InitializeAsync(EventSequence(
                new PersonCommandExecuted(guid0, new DateTime(2021, 7, 1), new CreatePerson(guid1, null, "John", "Doe", null)),
                new PersonCommandExecuted(guid0, new DateTime(2021, 7, 1), new CreatePerson(guid2, guid3, "Jane", "Smith", new AgeInYears(42, new DateTime(2021, 1, 1)))),
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
            var dut = await CommunityModel.InitializeAsync(EventSequence(
                new PersonCommandExecuted(guid0, new DateTime(2021, 7, 1), new CreatePerson(guid1, null, "John", "Doe", null)),
                new PersonCommandExecuted(guid0, new DateTime(2021, 7, 1), new CreatePerson(guid2, guid3, "Jane", "Smith", new AgeInYears(42, new DateTime(2021, 1, 1)))),
                new PersonCommandExecuted(guid0, new DateTime(2021, 7, 1), new UpdatePersonName(guid2, "Jane", "Doe")),
                new PersonCommandExecuted(guid0, new DateTime(2021, 7, 1), new UpdatePersonAge(guid1, new ExactAge(new DateTime(1975, 1, 1)))),
                new PersonCommandExecuted(guid0, new DateTime(2021, 7, 1), new UpdatePersonAge(guid2, new ExactAge(new DateTime(1979, 7, 1)))),
                new PersonCommandExecuted(guid0, new DateTime(2021, 7, 1), new UpdatePersonUserLink(guid1, guid4)),
                new FamilyCommandExecuted(guid0, new DateTime(2021, 7, 1), new CreateFamily(guid5,
                    new List<(Guid, FamilyAdultRelationshipInfo)> { (guid1, new FamilyAdultRelationshipInfo(FamilyAdultRelationshipType.Dad, "ABC", true, true, "Test")) },
                    null, null)),
                new FamilyCommandExecuted(guid0, new DateTime(2021, 7, 1), new AddAdultToFamily(guid5, guid2, new FamilyAdultRelationshipInfo(FamilyAdultRelationshipType.Mom, "DEF", true, true, null))),
                new PersonCommandExecuted(guid0, new DateTime(2021, 7, 1), new CreatePerson(guid6, null, "Eric", "Doe", new AgeInYears(12, new DateTime(2021, 1, 1)))),
                new FamilyCommandExecuted(guid0, new DateTime(2021, 7, 1), new AddChildToFamily(guid5, guid6, new List<CustodialRelationship>
                {
                    new CustodialRelationship(guid6, guid1, CustodialRelationshipType.ParentWithCustody),
                    new CustodialRelationship(guid6, guid2, CustodialRelationshipType.ParentWithCustody)
                })),
                new FamilyCommandExecuted(guid0, new DateTime(2021, 7, 1), new UpdateAdultRelationshipToFamily(guid5, guid1, new FamilyAdultRelationshipInfo(FamilyAdultRelationshipType.Dad, "ABC123", false, false, "XYZ"))),
                new FamilyCommandExecuted(guid0, new DateTime(2021, 7, 1), new RemoveCustodialRelationship(guid5, guid6, guid1)),
                new FamilyCommandExecuted(guid0, new DateTime(2021, 7, 1), new UpdateCustodialRelationshipType(guid5, guid6, guid2, CustodialRelationshipType.ParentWithCourtAppointedCustody)),
                new FamilyCommandExecuted(guid0, new DateTime(2021, 7, 1), new AddCustodialRelationship(guid5, guid6, guid1, CustodialRelationshipType.ParentWithCourtAppointedCustody))
            ));

            Assert.AreEqual(13, dut.LastKnownSequenceNumber);
            var families = dut.FindFamilies(x => true);
            var people = dut.FindPeople(x => true);
            Assert.AreEqual(3, people.Count);
            Assert.AreEqual(new Person(guid1, guid4, "John", "Doe", new ExactAge(new DateTime(1975, 1, 1))), people.Single(p => p.Id == guid1));
            Assert.AreEqual(new Person(guid2, guid3, "Jane", "Doe", new ExactAge(new DateTime(1979, 7, 1))), people.Single(p => p.Id == guid2));
            Assert.AreEqual(new Person(guid6, null, "Eric", "Doe", new AgeInYears(12, new DateTime(2021, 1, 1))), people.Single(p => p.Id == guid6));
            Assert.AreEqual(1, families.Count);
            var actualFamily = families[0];
            var expectedFamily = new Family(guid5,
                new List<(Person, FamilyAdultRelationshipInfo)>
                {
                    (new Person(guid1, guid4, "John", "Doe", new ExactAge(new DateTime(1975, 1, 1))),
                        new FamilyAdultRelationshipInfo(FamilyAdultRelationshipType.Dad, "ABC123", false, false, "XYZ")),
                    (new Person(guid2, guid3, "Jane", "Doe", new ExactAge(new DateTime(1979, 7, 1))),
                        new FamilyAdultRelationshipInfo(FamilyAdultRelationshipType.Mom, "DEF", true, true, null))
                },
                new List<Person>
                {
                    new Person(guid6, null, "Eric", "Doe", new AgeInYears(12, new DateTime(2021, 1, 1)))
                },
                new List<CustodialRelationship>
                {
                    new CustodialRelationship(guid6, guid2, CustodialRelationshipType.ParentWithCourtAppointedCustody),
                    new CustodialRelationship(guid6, guid1, CustodialRelationshipType.ParentWithCourtAppointedCustody)
                });
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


        private IAsyncEnumerable<(CommunityEvent, long)> EventSequence(params CommunityEvent[] communityEvents) =>
            communityEvents
                .Select((ce, i) => (ce, (long)i))
                .ToAsyncEnumerable();
    }
}

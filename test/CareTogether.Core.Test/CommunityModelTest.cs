using CareTogether.Resources;
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
        static readonly Guid guid1 = Guid.Parse("11111111-1111-1111-1111-111111111111");
        static readonly Guid guid2 = Guid.Parse("22222222-2222-2222-2222-222222222222");
        static readonly Guid guid3 = Guid.Parse("33333333-3333-3333-3333-333333333333");
        static readonly Guid guid4 = Guid.Parse("44444444-4444-4444-4444-444444444444");
        static readonly Guid guid5 = Guid.Parse("55555555-5555-5555-5555-555555555555");
        static readonly Guid guid6 = Guid.Parse("66666666-6666-6666-6666-666666666666");


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
                new PersonCommandExecuted(new CreatePerson(guid1, null, "John", "Smith", null))
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
                new PersonCommandExecuted(new CreatePerson(guid1, null, "John", "Doe", null)),
                new PersonCommandExecuted(new CreatePerson(guid2, guid3, "Jane", "Smith", new AgeInYears(42, new DateTime(2021, 1, 1)))),
                new PersonCommandExecuted(new UpdatePersonName(guid2, "Jane", "Doe")),
                new PersonCommandExecuted(new UpdatePersonAge(guid1, new ExactAge(new DateTime(1975, 1, 1)))),
                new PersonCommandExecuted(new UpdatePersonAge(guid2, new ExactAge(new DateTime(1979, 7, 1)))),
                new PersonCommandExecuted(new UpdatePersonUserLink(guid1, guid4))
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
                new PersonCommandExecuted(new CreatePerson(guid1, null, "John", "Doe", null)),
                new PersonCommandExecuted(new CreatePerson(guid2, guid3, "Jane", "Smith", new AgeInYears(42, new DateTime(2021, 1, 1)))),
                new PersonCommandExecuted(new UpdatePersonName(guid2, "Jane", "Doe")),
                new PersonCommandExecuted(new UpdatePersonAge(guid1, new ExactAge(new DateTime(1975, 1, 1)))),
                new PersonCommandExecuted(new UpdatePersonAge(guid2, new ExactAge(new DateTime(1979, 7, 1)))),
                new PersonCommandExecuted(new UpdatePersonUserLink(guid1, guid4)),
                new FamilyCommandExecuted(new CreateFamily(guid5, VolunteerFamilyStatus.Active, null,
                    new List<(Guid, FamilyAdultRelationshipInfo)> { (guid1, new FamilyAdultRelationshipInfo(FamilyAdultRelationshipType.Dad, "ABC", true, true, "Test")) },
                    null, null)),
                new FamilyCommandExecuted(new AddAdultToFamily(guid5, guid2, new FamilyAdultRelationshipInfo(FamilyAdultRelationshipType.Mom, "DEF", true, true, null))),
                new PersonCommandExecuted(new CreatePerson(guid6, null, "Eric", "Doe", new AgeInYears(12, new DateTime(2021, 1, 1)))),
                new FamilyCommandExecuted(new AddChildToFamily(guid5, guid6, new List<CustodialRelationship>
                {
                    new CustodialRelationship(guid6, guid1, CustodialRelationshipType.ParentWithCustody),
                    new CustodialRelationship(guid6, guid2, CustodialRelationshipType.ParentWithCustody)
                })),
                new FamilyCommandExecuted(new UpdateAdultRelationshipToFamily(guid5, guid1, new FamilyAdultRelationshipInfo(FamilyAdultRelationshipType.Dad, "ABC123", false, false, "XYZ"))),
                new FamilyCommandExecuted(new RemoveCustodialRelationship(guid5, guid6, guid1)),
                new FamilyCommandExecuted(new UpdateCustodialRelationshipType(guid5, guid6, guid2, CustodialRelationshipType.ParentWithCourtAppointedCustody)),
                new FamilyCommandExecuted(new AddCustodialRelationship(guid5, guid6, guid1, CustodialRelationshipType.ParentWithCourtAppointedCustody))
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
            var expectedFamily = new Family(guid5, VolunteerFamilyStatus.Active, null,
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
            Assert.AreEqual(expectedFamily.PartneringFamilyStatus, actualFamily.PartneringFamilyStatus);
            Assert.AreEqual(expectedFamily.VolunteerFamilyStatus, actualFamily.VolunteerFamilyStatus);
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

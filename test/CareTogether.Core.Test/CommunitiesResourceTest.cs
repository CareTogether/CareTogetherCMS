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
    public class CommunitiesModelTest
    {
        private static Guid Id(char x) => Guid.Parse("xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx".Replace('x', x));
        static readonly Guid guid0 = Id('0');
        static readonly Guid guid1 = Id('1');
        static readonly Guid guid2 = Id('2');
        static readonly Guid guid3 = Id('3');
        static readonly Guid guid4 = Id('4');
        static readonly Guid guid5 = Id('5');
        static readonly Guid guid6 = Id('6');


        MemoryMultitenantEventLog<CommunityEvent> events;


        [TestInitialize]
        public async Task TestInitialize()
        {
            events = new MemoryMultitenantEventLog<CommunityEvent>();
            foreach (var (domainEvent, index) in EventSequence(
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
            ))
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
            var dut = new CommunitiesResource(events);

            var people = await dut.ListPeopleAsync(guid1, guid2);

            Assert.AreEqual(3, people.Count);
        }

        [TestMethod]
        public async Task TestFindUser()
        {
            var dut = new CommunitiesResource(events);

            var user2 = await dut.FindUserAsync(guid1, guid2, guid3);
            var user1 = await dut.FindUserAsync(guid1, guid2, guid4);

            Assert.AreEqual(guid2, user2.AsT0.Id);
            Assert.AreEqual(guid1, user1.AsT0.Id);
        }

        [TestMethod]
        public async Task TestListFamilies()
        {
            var dut = new CommunitiesResource(events);

            var families1 = await dut.ListFamiliesAsync(guid1, guid2);
            var families2 = await dut.ListFamiliesAsync(guid2, guid1);

            Assert.AreEqual(1, families1.Count);
            Assert.AreEqual(0, families2.Count);
        }

        [TestMethod]
        public async Task TestExecutePersonCommand()
        {
            var dut = new CommunitiesResource(events);

            var result1 = await dut.ExecutePersonCommandAsync(guid1, guid2, new UpdatePersonAge(guid6, null), guid0);
            var result2 = await dut.ExecutePersonCommandAsync(guid1, guid2, new UpdatePersonAge(guid5, null), guid0);
            var result3 = await dut.ExecutePersonCommandAsync(guid2, guid1, new UpdatePersonAge(guid6, null), guid0);

            Assert.AreEqual(new Person(guid6, null, "Eric", "Doe", null), result1.AsT0);
            Assert.AreEqual(ResourceResult.NotFound, result2.AsT1);
            Assert.AreEqual(ResourceResult.NotFound, result3.AsT1);
        }


        private IEnumerable<(CommunityEvent, long)> EventSequence(params CommunityEvent[] events) =>
            events.Select((e, i) => (e, (long)i + 1));
    }
}

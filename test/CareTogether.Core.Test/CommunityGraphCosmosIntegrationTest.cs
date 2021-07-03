using CareTogether.Resources;
using CareTogether.Views;
using ExRam.Gremlinq.Core;
using ExRam.Gremlinq.Providers.WebSocket;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Microsoft.VisualStudio.TestTools.UnitTesting;
using System;
using System.Threading.Tasks;
using static CareTogether.Views.CommunityGraph;

namespace CareTogether.Core.Test
{
    [TestClass]
    public class CommunityGraphCosmosIntegrationTest
    {
        static readonly Guid orgId = Guid.Parse("11111111-1111-1111-1111-111111111111");
        static readonly Guid locId = Guid.Parse("22222222-2222-2222-2222-222222222222");


        static IGremlinQuerySource gremlinQuerySource;


        [ClassInitialize]
        static public async Task ClassInitializeAsync(TestContext _)
        {
            var configuration = new ConfigurationBuilder()
                   .AddUserSecrets<CommunityGraphCosmosIntegrationTest>()
                   .Build();

            gremlinQuerySource = GremlinQuerySource.g
                //TODO: Logging stuff
                .ConfigureEnvironment(env => env
                    .UseModel(GraphModel
                        .FromBaseTypes<CommunityVertex, CommunityEdge>(lookup => lookup
                            .IncludeAssembliesOfBaseTypes())
                        .ConfigureProperties(model => model
                            .ConfigureElement<CommunityVertex>(conf => conf
                                .IgnoreOnUpdate(x => x.pk))))
                    .ConfigureOptions(options => options
                        .SetValue(WebSocketGremlinqOptions.QueryLogLogLevel, LogLevel.None))
                    .UseCosmosDb(builder => builder
                        .At(new Uri(configuration["CosmosGraphUri"]), configuration["CosmosGraphDatabase"], "communities")
                        .AuthenticateBy(configuration["CosmosGraphKey"])
                        .ConfigureWebSocket(_ => _
                            .ConfigureGremlinClient(client => client
                                .ObserveResultStatusAttributes((requestMessage, statusAttributes) =>
                                {
                                    //TODO: Optional Cosmos tracking stuff
                                })))));

            // Clear out the test graph
            await gremlinQuerySource.V().Drop();
        }

        [TestMethod]
        public async Task TestPersonCommandSequence()
        {
            var dut = new CommunityGraph(gremlinQuerySource);

            var userId = Guid.Parse("00000001-0000-0000-0000-000000000000");
            var ageAsOfDate = new DateTime(2021, 1, 1, 0, 0, 0, DateTimeKind.Utc);
            var dateOfBirth = new DateTime(1978, 7, 1, 0, 0, 0, DateTimeKind.Utc);

            var findResultBeforeCreating = await dut.FindUserAsync(orgId, locId, userId);
            Assert.IsTrue(findResultBeforeCreating.IsT1);

            var createPerson = new CreatePerson(PersonId: Guid.Empty, UserId: Guid.Empty, FirstName: "Firstly", LastName: "Lastly",
                Age: new AgeInYears(42, ageAsOfDate));
            var createResult = await dut.ExecutePersonCommandAsync(orgId, locId, createPerson);
            Assert.IsTrue(createResult.IsT0);
            var created = createResult.AsT0;
            Assert.AreNotEqual(Guid.Empty, created.Id);
            Assert.AreEqual(Guid.Empty, created.UserId);
            Assert.AreEqual("Firstly", created.FirstName);
            Assert.AreEqual("Lastly", created.LastName);
            Assert.AreEqual(new AgeInYears(42, ageAsOfDate), created.Age);
            //Assert.IsTrue(created.CreatedUtc.Subtract(DateTime.UtcNow).TotalSeconds < 5,
            //    "Created timestamp was not set correctly, or test ran too slowly (this may happen when debugging with breakpoints).");

            var findResultByFirstNameSubstring = await dut.FindPeopleAsync(orgId, locId, partialFirstOrLastName: "irstly");
            Assert.AreEqual(1, findResultByFirstNameSubstring.Count);
            var foundResult = findResultByFirstNameSubstring[0];
            Assert.AreEqual(created, foundResult);

            var updateName = new UpdatePersonName(created.Id, "Changed", "Surname");
            var updateNameResult = await dut.ExecutePersonCommandAsync(orgId, locId, updateName);
            var expectedUpdatedName = created with { FirstName = "Changed", LastName = "Surname" };
            Assert.AreEqual(expectedUpdatedName, updateNameResult.AsT0);

            var findResultAfterCreating = await dut.FindUserAsync(orgId, locId, userId);
            Assert.IsTrue(findResultAfterCreating.IsT1);

            var findResultByLastNameSubstring = await dut.FindPeopleAsync(orgId, locId, partialFirstOrLastName: "urn");
            Assert.AreEqual(1, findResultByLastNameSubstring.Count);
            var foundResult2 = findResultByLastNameSubstring[0];
            Assert.AreEqual(expectedUpdatedName, foundResult2);

            var findResultWithoutMatch = await dut.FindPeopleAsync(orgId, locId, partialFirstOrLastName: "xyz");
            Assert.AreEqual(0, findResultWithoutMatch.Count);

            var updateUserLink = new UpdatePersonUserLink(created.Id, userId);
            var updateUserLinkResult = await dut.ExecutePersonCommandAsync(orgId, locId, updateUserLink);
            var expectedUpdatedUserLink = expectedUpdatedName with { UserId = userId };
            Assert.AreEqual(expectedUpdatedUserLink, updateUserLinkResult.AsT0);

            var findResultAfterUpdatingUserLink = await dut.FindUserAsync(orgId, locId, userId);
            Assert.AreEqual(expectedUpdatedUserLink, findResultAfterUpdatingUserLink.AsT0);

            var updateAge = new UpdatePersonAge(created.Id, new ExactAge(dateOfBirth));
            var updateAgeResult = await dut.ExecutePersonCommandAsync(orgId, locId, updateAge);
            var expectedUpdatedAge = expectedUpdatedUserLink with { Age = new ExactAge(dateOfBirth) };
            Assert.AreEqual(expectedUpdatedAge, updateAgeResult.AsT0);
        }
    }
}

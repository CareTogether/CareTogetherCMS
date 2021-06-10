using CareTogether.Abstractions;
using CareTogether.Utilities;
using ExRam.Gremlinq.Core;
using Gremlin.Net.Driver;
using Newtonsoft.Json;
using OneOf.Types;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace CareTogether.Resources
{
    public sealed class CommunitiesResource : ICommunitiesResource
    {
#pragma warning disable IDE1006 // 'pk' must be lowercase to match Cosmos DB -- TODO: Recreate as 'Partition'!!!
        internal abstract record CommunityVertex(string Id, string pk, DateTime CreatedUtc);
#pragma warning restore IDE1006
        internal abstract record CommunityEdge(DateTime CreatedUtc);

        internal record FamilyVertex(string Id, string pk, DateTime CreatedUtc, string PartnerStatus, string VolunteerStatus)
            : CommunityVertex(Id, pk, CreatedUtc);
        internal record PersonVertex(string Id, string pk, DateTime CreatedUtc, string UserId, string FirstName, string LastName,
            int? AgeYears, DateTime? AgeYearsAsOf, DateTime? AgeDateOfBirth)
            : CommunityVertex(Id, pk, CreatedUtc);

        //TODO: Update edge types so labels reflect types!
        internal record FamilyAdultRelationshipEdge(string AdultRelationship, Guid FamilyId, Guid PersonId, DateTime CreatedUtc)
            : CommunityEdge(CreatedUtc);
        internal record FamilyChildRelationshipEdge(Guid FamilyId, Guid PersonId, DateTime CreatedUtc)
            : CommunityEdge(CreatedUtc);
        internal record ChildAdultCustodialRelationshipEdge(string CustodialRelationship, Guid ChildId, Guid AdultId, DateTime CreatedUtc)
            : CommunityEdge(CreatedUtc);


        private readonly IGremlinQuerySource gremlin;


        public CommunitiesResource(IGremlinQuerySource gremlinQuerySource)
        {
            gremlin = gremlinQuerySource;
        }


        public async Task<ResourceResult<Person>> FindUserAsync(Guid organizationId, Guid locationId, Guid userId)
        {
            var partitionKeyString = $"{organizationId:N}-{locationId:N}"; //TODO: Can we just use the 'locationId'? It's not supposed to add any security and should be just as useful, plus more convenient!
            var userIdString = userId.ToString("N");

            var results = await gremlin
                .V<PersonVertex>()
                .Where(p => p.pk == partitionKeyString)
                .Where(p => p.UserId == userIdString)
                .ToArrayAsync();

            if (results.Length == 0)
                return ResourceResult.NotFound;
            else if (results.Length == 1)
                return PersonFromVertex(results[0]);
            else
                throw new InvalidOperationException("More than one person was found to have the same user ID.");
        }

        public async Task<List<Person>> FindPeopleAsync(Guid organizationId, Guid locationId, string partialFirstOrLastName)
        {
            var partitionKeyString = $"{organizationId:N}-{locationId:N}";

            var results = await gremlin
                .V<PersonVertex>()
                .Where(p => p.pk == partitionKeyString)
                .Where(p => p.FirstName.Contains(partialFirstOrLastName) || p.LastName.Contains(partialFirstOrLastName))
                .ToArrayAsync();

            return results
                .Select(vertex => PersonFromVertex(vertex))
                .ToList();
        }

        //public IAsyncEnumerable<Family> FindVolunteerFamilies(Guid organizationId, Guid locationId, VolunteerFamilyStatus status)
        //{
        //    var activeVolunteerFamilyVertices = await gremlinClient.SubmitAsync<dynamic>(
        //        $"g.V().hasLabel('{LABEL_FAMILY}').has('{PROPKEY_VOLUNTEER_STATUS}','active')");//.outE().V().outE().subgraph('family').cap('family')");
            
        //    //var results = await gremlinClient.SubmitAsync<dynamic>(
        //    //    $"g.V().hasLabel('{LABEL_FAMILY}').has('{PROPKEY_VOLUNTEER_STATUS}','active').outE().V().outE().subgraph('family').cap('family')");

        //    foreach (string familyId in activeVolunteerFamilyVertices.Select(v => BuildFamilyVertexRecord(v)))
        //    {

        //        // The vertex results are formed as Dictionaries with a nested dictionary for their properties
        //        string output = JsonConvert.SerializeObject(result);
        //        Console.WriteLine($"\t{output}");
        //    }
        //    //var families = communitiesGraphStore.FindVerticesByLabelAsync(
        //    //    organizationId, locationId, LABEL_FAMILY)
        //    //    .Where(familyVertex => (string)familyVertex.Properties[PROPKEY_VOLUNTEER_STATUS] ==
        //    //        (status switch { VolunteerFamilyStatus.Active => "active", VolunteerFamilyStatus.Inactive => "inactive" }))
        //    //    .SelectAwait(familyVertex => FamilyFromVertexAsync(familyVertex));

        //    //return families;
        //}

        ////private static FamilyVertex BuildFamilyVertexRecord(dynamic vertex) =>
        ////    new FamilyVertex(
        ////        Id: Guid.Parse(vertex["id"]),
        ////        PartnerStatus: vertex["properties"][PROPKEY_PARTNERING_STATUS].SingleOrDefault,
        ////        VolunteerStatus: vertex["properties"][PROPKEY_VOLUNTEER_STATUS].SingleOrDefault);

        ////private static PersonVertex BuildPersonVertexRecord(dynamic vertex) =>
        ////    new PersonVertex(
        ////        Id: Guid.Parse(vertex["id"]),
        ////        FirstName: vertex["properties"][PROPKEY_FIRST_NAME].SingleOrDefault,
        ////        LastName: vertex["properties"][PROPKEY_LAST_NAME].SingleOrDefault, );

        //public IAsyncEnumerable<Family> FindPartneringFamilies(Guid organizationId, Guid locationId, PartneringFamilyStatus status)
        //{
        //    //var families = communitiesGraphStore.FindVerticesByLabelAsync(
        //    //    organizationId, locationId, LABEL_FAMILY)
        //    //    .Where(familyVertex => (string)familyVertex.Properties[PROPKEY_PARTNERING_STATUS] ==
        //    //        (status switch { PartneringFamilyStatus.Active => "active", PartneringFamilyStatus.Inactive => "inactive" }))
        //    //    .SelectAwait(familyVertex => FamilyFromVertexAsync(familyVertex));

        //    //return families;
        //}

        public async Task<ResourceResult<Family>> ExecuteFamilyCommandAsync(Guid organizationId, Guid locationId, FamilyCommand command)
        {
            // When constructing or mutating a record with multiple properties that all need to reference the same ID,
            // the ID needs to be created ahead of time. For convenience, we'll create a single new ID here and use it
            // in situations where a new ID is needed. Currently all command implementations require at most one new ID.
            var newId = Guid.NewGuid();


            var partitionKeyString = $"{organizationId:N}-{locationId:N}";

            var query = command switch
            {
                CreateFamily c => gremlin,
                AddAdultToFamily c => gremlin,
                AddChildToFamily c => gremlin,
                UpdateAdultRelationshipToFamily c => gremlin,
                AddCustodialRelationship c => gremlin,
                UpdateCustodialRelationship c => gremlin,
                RemoveCustodialRelationship c => gremlin,

                /*CreatePerson c => gremlin
                    .AddV(new PersonVertex(
                        Id: Guid.NewGuid().ToString("N"),
                        pk: partitionKeyString,
                        CreatedUtc: DateTime.UtcNow,
                        UserId: c.UserId?.ToString("N"),
                        FirstName: c.FirstName,
                        LastName: c.LastName,
                        AgeYears: (c.Age as AgeInYears)?.Years,
                        AgeYearsAsOf: (c.Age as AgeInYears)?.AsOf,
                        AgeDateOfBirth: (c.Age as ExactAge)?.DateOfBirth)),
                UpdatePersonName c => gremlin
                    .V<PersonVertex>(c.PersonId.ToString("N"))
                    .Property(p => p.FirstName, c.FirstName)
                    .Property(p => p.LastName, c.LastName),
                UpdatePersonAge c => c.Age is AgeInYears a
                    ? gremlin
                        .V<PersonVertex>(c.PersonId.ToString("N"))
                        .Property(p => p.AgeYears, a.Years)
                        .Property(p => p.AgeYearsAsOf, a.AsOf)
                        .Property(p => p.AgeDateOfBirth, null)
                    : gremlin
                        .V<PersonVertex>(c.PersonId.ToString("N"))
                        .Property(p => p.AgeYears, null)
                        .Property(p => p.AgeYearsAsOf, null)
                        .Property(p => p.AgeDateOfBirth, (c.Age as ExactAge).DateOfBirth),
                UpdatePersonUserLink c => gremlin
                    .V<PersonVertex>(c.PersonId.ToString("N"))
                    .Property(p => p.UserId, c.UserId?.ToString("N")),*/
                _ => throw new NotImplementedException(
                    $"The command type '{command.GetType().FullName}' has not been implemented.")
            };

            //var result = await query.SingleOrDefaultAsync();

            //if (result == null)
                return ResourceResult.NotFound;
            //else
            //    return PersonFromVertex(result);

            /*
            g.addV('person').property('id','p1').property('firstName','Emily').property('lastName','Kemmann').property('ageDOB','6-17-1987').property('userId','simply.emily').property('created','2021-06-10T16:38:18Z').property('partition', 'af:clt')
            g.addV('person').property('id','p2').property('firstName','Lars').property('lastName','Kemmann').property('ageDOB','1-12-1989').property('userId','larsk').property('created','2021-06-10T16:38:18Z').property('partition', 'af:clt')
            g.addV('family').property('id','f1').property('volunteerStatus','active').property('created','2021-06-10T16:38:18Z').property('partition', 'af:clt')
            g.V('f1').addE('mom').to(g.V('p1')).property('notes','Wifey for Lifey').property('isInHousehold',true).property('isPrimaryFamilyContact',true)
            g.V('f1').addE('dad').to(g.V('p2')).property('notes','Forever and for Always').property('isInHousehold',true).property('isPrimaryFamilyContact',true)
            g.addV('person').property('id','p3').property('firstName','Mystery').property('lastName','Kemmann').property('ageYears','3').property('ageYearsAsOf','2021-06-10').property('created','2021-06-10T16:38:18Z').property('partition', 'af:clt')
            g.V('f1').addE('child').to(g.V('p3'))
            g.V('p3').addE('parentWithCustody').to(g.V('p1'))
            g.V('p3').addE('parentWithCustody').to(g.V('p2'))
            */
            //FamilyGraph familyGraph;
            //if (command is CreateFamily create)
            //    familyGraph = new FamilyGraph(newId, create.AdultPersonIds, create.ChildPersonIds, create.CustodialRelationshipsByChild, create.Type);
            //else
            //{
            //    var familyResult = await communitiesGraphStore.GetFamilyAsync(organizationId, locationId, command.FamilyId);
            //    if (familyResult.TryPickT1(out NotFound _, out familyGraph))
            //        return ResourceResult.NotFound;

            //    familyGraph = command switch
            //    {
            //        AddAdultToFamily c => familyGraph with
            //        {
            //            AdultIds = familyGraph.AdultIds.With(c.AdultPersonId)
            //        },
            //        AddChildToFamily c => familyGraph with
            //        {
            //            ChildIds = familyGraph.ChildIds.With(c.ChildPersonId),
            //            //CustodialRelationshipsByChild = familyGraph.CustodialRelationshipsByChild.With(c.ChildPersonId, c.CustodialRelationships)
            //        },
            //        UpdateAdultRelationshipToFamily c => familyGraph with
            //        {

            //        },
            //        UpdateAdultSafetyRiskNotes c => familyGraph with
            //        {

            //        },
            //        AddCustodialRelationship c => familyGraph with
            //        {
            //            //CustodialRelationshipsByChild = familyGraph.CustodialRelationshipsByChild.With(c.ChildPersonId, new ChildCustodialRelationship(c.AdultPersonId, c.Type))
            //        },
            //        UpdateCustodialRelationship c => familyGraph with
            //        {

            //        },
            //        RemoveCustodialRelationship c => familyGraph with
            //        {

            //        },
            //        _ => throw new NotImplementedException(
            //            $"The command type '{command.GetType().FullName}' has not been implemented.")
            //    };
            //}

            throw new NotImplementedException();
        }

        public async Task<ResourceResult<Person>> ExecutePersonCommandAsync(Guid organizationId, Guid locationId, PersonCommand command)
        {
            var partitionKeyString = $"{organizationId:N}-{locationId:N}";

            var query = command switch
            {
                CreatePerson c => gremlin
                    .AddV(new PersonVertex(
                        Id: Guid.NewGuid().ToString("N"),
                        pk: partitionKeyString,
                        CreatedUtc: DateTime.UtcNow,
                        UserId: c.UserId?.ToString("N"),
                        FirstName: c.FirstName,
                        LastName: c.LastName,
                        AgeYears: (c.Age as AgeInYears)?.Years,
                        AgeYearsAsOf: (c.Age as AgeInYears)?.AsOf,
                        AgeDateOfBirth: (c.Age as ExactAge)?.DateOfBirth)),
                UpdatePersonName c => gremlin
                    .V<PersonVertex>(c.PersonId.ToString("N"))
                    .Property(p => p.FirstName, c.FirstName)
                    .Property(p => p.LastName, c.LastName),
                UpdatePersonAge c => c.Age is AgeInYears a
                    ? gremlin
                        .V<PersonVertex>(c.PersonId.ToString("N"))
                        .Property(p => p.AgeYears, a.Years)
                        .Property(p => p.AgeYearsAsOf, a.AsOf)
                        .Property(p => p.AgeDateOfBirth, null)
                    : gremlin
                        .V<PersonVertex>(c.PersonId.ToString("N"))
                        .Property(p => p.AgeYears, null)
                        .Property(p => p.AgeYearsAsOf, null)
                        .Property(p => p.AgeDateOfBirth, (c.Age as ExactAge).DateOfBirth),
                UpdatePersonUserLink c => gremlin
                    .V<PersonVertex>(c.PersonId.ToString("N"))
                    .Property(p => p.UserId, c.UserId?.ToString("N")),
                _ => throw new NotImplementedException(
                    $"The command type '{command.GetType().FullName}' has not been implemented.")
            };

            var result = await query.SingleOrDefaultAsync();

            if (result == null)
                return ResourceResult.NotFound;
            else
                return PersonFromVertex(result);
        }


        private static Person PersonFromVertex(PersonVertex vertex) =>
            new Person(
                Id: Guid.Parse(vertex.Id),
                UserId: Guid.TryParse(vertex.UserId, out var userId) ? userId : null,
                FirstName: vertex.FirstName,
                LastName: vertex.LastName,
                Age: vertex.AgeDateOfBirth is not null
                    ? new ExactAge(vertex.AgeDateOfBirth.Value)
                    : vertex.AgeYears is not null
                        ? new AgeInYears(vertex.AgeYears.Value, vertex.AgeYearsAsOf.Value)
                        : null,
                CreatedUtc: vertex.CreatedUtc);

    }
}

using CareTogether.Abstractions;
using CareTogether.Utilities;
using OneOf.Types;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace CareTogether.Resources
{
    public sealed class CommunitiesResource : ICommunitiesResource
    {
        const string LABEL_PERSON = "person";
        const string PROPKEY_USER_ID = "user_id";
        const string PROPKEY_FIRST_NAME = "first_name";
        const string PROPKEY_LAST_NAME = "last_name";
        const string PROPKEY_AGE_YEARS = "age_years";
        const string PROPKEY_AGE_DOB = "age_dob";
        const string PROPKEY_CREATED = "created";


        private readonly IMultitenantGraphStore communitiesGraphStore;


        public CommunitiesResource(IMultitenantGraphStore communitiesGraphStore)
        {
            this.communitiesGraphStore = communitiesGraphStore;
        }


        public async Task<ResourceResult<Person>> FindUserAsync(Guid organizationId, Guid locationId, Guid userId)
        {
            var userPersonVertex = await communitiesGraphStore.FindVerticesByLabelAndPropertyValueAsync(
                organizationId, locationId, LABEL_PERSON, PROPKEY_USER_ID, userId.ToString())
                .SingleOrDefaultAsync(); // Throws if the one-vertex-per-user-ID-and-partition invariant is violated.

            if (userPersonVertex == null)
                return ResourceResult.NotFound;
            else
                return PersonFromVertex(userPersonVertex);
        }

        private static Person PersonFromVertex(Vertex vertex) =>
            new Person(vertex.Id,
                UserId: vertex.Properties.TryGetValue(PROPKEY_USER_ID, out var userId) ? Guid.Parse((string)userId) : null,
                FirstName: vertex.Properties.TryGetValue(PROPKEY_FIRST_NAME, out var firstName) ? (string)firstName : null,
                LastName: vertex.Properties.TryGetValue(PROPKEY_LAST_NAME, out var lastName) ? (string)lastName : null,
                Age: vertex.Properties.TryGetValue(PROPKEY_AGE_YEARS, out var ageYears)
                    ? new AgeInYears((byte)ageYears :,
                CreatedUtc: vertex.Properties[PROPKEY_CREATED]);;

        public async IAsyncEnumerable<Person> FindPeople(Guid organizationId, Guid locationId, string partialName)
        {
            throw new NotImplementedException();
        }

        public IAsyncEnumerable<Family> FindVolunteerFamilies(Guid organizationId, Guid locationId, VolunteerFamilyStatus status)
        {
            throw new NotImplementedException();
        }

        public IAsyncEnumerable<Family> FindPartneringFamilies(Guid organizationId, Guid locationId, PartneringFamilyStatus status)
        {
            throw new NotImplementedException();
        }

        public async Task<ResourceResult<Family>> ExecuteFamilyCommandAsync(Guid organizationId, Guid locationId, FamilyCommand command)
        {
            // When constructing or mutating a record with multiple properties that all need to reference the same ID,
            // the ID needs to be created ahead of time. For convenience, we'll create a single new ID here and use it
            // in situations where a new ID is needed. Currently all command implementations require at most one new ID.
            var newId = Guid.NewGuid();

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
            throw new NotImplementedException();
        }
    }
}

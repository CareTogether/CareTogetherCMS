using CareTogether.Resources;
using OneOf;
using OneOf.Types;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace CareTogether.Abstractions
{
    public record Vertex(Guid Id, string Label, Dictionary<string, object> Properties, List<Edge> OutboundEdges);
    public record Edge(Guid SourceId, Guid TargetId, string Label, Dictionary<string, object> Properties);

    public interface IMultitenantGraphStore
    {
        Task<OneOf<Vertex, NotFound>> GetVertexByIdAsync(Guid organizationId, Guid locationId, Guid vertexId);

        IAsyncEnumerable<Vertex> FindVerticesByLabelAsync(Guid organizationId, Guid locationId, string label);

        IAsyncEnumerable<Vertex> FindVerticesByLabelAndPropertyValueAsync(Guid organizationId, Guid locationId,
            string label, string propertyKey, object propertyValue);

        Task UpsertVertexAsync(Guid organizationId, Guid locationId, Vertex vertex);

        
        
        //Task<ResourceResult<Family>> GetFamilyAsync(Guid organizationId, Guid locationId, Guid familyId);

        //Task CreatePersonVertexAsync(Guid organizationId, Guid locationId, Person person);

        //Task UpdatePersonNameAsync(Guid organizationId, Guid locationId, Guid personId, string firstName, string lastName);

        //Task UpdatePersonAgeAsync(Guid organizationId, Guid locationId, Guid personId, Age age);

        //Task UpdatePersonUserLinkAsync(Guid organizationId, Guid locationId, Guid personId, Guid? userId);

        
        //Task<OneOf<T, NotFound>> GetValueAsync(Guid organizationId, Guid locationId, Guid key);

        //IQueryable<T> QueryValues(Guid organizationId, Guid locationId);

        //Task UpsertValueAsync(Guid organizationId, Guid locationId, Guid key, T value);

    }
}

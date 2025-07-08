using System;
using System.Linq;
using NSwag.Generation.Processors;
using NSwag.Generation.Processors.Contexts;

namespace CareTogether.Api.OData
{
    public class ExcludeODataEndpointsDocumentProcessor : IDocumentProcessor
    {
        public void Process(DocumentProcessorContext context)
        {
            var pathsToRemove = context.Document.Paths
                .Where(p => p.Key.StartsWith("/api/odata/live", StringComparison.OrdinalIgnoreCase))
                .Select(p => p.Key)
                .ToList();

            foreach (string? path in pathsToRemove)
            {
                context.Document.Paths.Remove(path);
            }

            var schemasToRemove = context.Document.Components.Schemas
                .Where(s => s.Key.StartsWith("IEdm", StringComparison.OrdinalIgnoreCase) ||
                            s.Key.StartsWith("Edm", StringComparison.OrdinalIgnoreCase) ||
                            s.Key.StartsWith("OData", StringComparison.OrdinalIgnoreCase))
                .Select(s => s.Key)
                .ToList();

            foreach (string? schema in schemasToRemove)
            {
                context.Document.Components.Schemas.Remove(schema);
            }
        }
    }
}

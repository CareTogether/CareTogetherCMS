using Microsoft.OData.Edm;
using Microsoft.OData.ModelBuilder;

namespace CareTogether.Api.OData
{
    public class ODataModelProvider
    {
        public static IEdmModel GetEdmModel()
        {
            var builder = new ODataConventionModelBuilder();
            builder.Namespace = "CareTogether";
            builder.ContainerName = "CareTogether Data";

            //TODO: Register entities

            return builder.GetEdmModel();
        }
    }
}

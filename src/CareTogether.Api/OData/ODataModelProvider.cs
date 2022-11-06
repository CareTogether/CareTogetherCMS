using Microsoft.OData.Edm;
using Microsoft.OData.ModelBuilder;

namespace CareTogether.Api.OData
{
    public class ODataModelProvider
    {
        public static IEdmModel GetLiveEdmModel()
        {
            var builder = new ODataConventionModelBuilder();
            builder.Namespace = "CareTogether";
            builder.ContainerName = "CareTogether Data";

            builder.EntitySet<Organization>("Organizations");

            return builder.GetEdmModel();
        }
    }
}

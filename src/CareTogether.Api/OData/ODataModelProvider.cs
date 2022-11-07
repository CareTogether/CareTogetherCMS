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

            builder.EntitySet<Location>("Locations");
            builder.EntitySet<Family>("Families");
            builder.EntitySet<Person>("People");
            builder.EntitySet<Role>("Roles");
            builder.EntitySet<FamilyRoleApproval>("FamilyRoleApprovals");
            builder.EntitySet<IndividualRoleApproval>("IndividualRoleApprovals");
            builder.EntitySet<RoleApprovalStage>("ApprovalStages");

            return builder.GetEdmModel();
        }
    }
}

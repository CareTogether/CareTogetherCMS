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

            builder.EntitySet<Location>("Location");
            builder.EntitySet<Family>("Family");
            builder.EntitySet<Person>("Person");
            builder.EntitySet<Role>("Role");
            builder.EntitySet<FamilyRoleApproval>("FamilyRoleApprovals");
            builder.EntitySet<IndividualRoleApproval>("IndividualRoleApprovals");
            builder.EntitySet<FamilyRoleRemovedIndividual>("FamilyRoleRemovedIndividuals");
            builder.EntitySet<Referral>("Referral");
            builder.EntitySet<Arrangement>("Arrangement");
            builder.EntitySet<ArrangementType>("ArrangementType");
            builder.EntitySet<ChildLocationRecord>("ChildLocationRecords");
            builder.EntitySet<FamilyFunctionAssignment>("FamilyFunctionAssignments");
            builder.EntitySet<IndividualFunctionAssignment>("IndividualFunctionAssignments");

            return builder.GetEdmModel();
        }
    }
}

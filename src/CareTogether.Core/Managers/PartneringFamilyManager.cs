using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace CareTogether.Core.Managers
{
    public sealed class PartneringFamilyManager : IPartneringFamilyManager
    {
        public PartneringFamilyManager()
        {

        }


        public PartneringFamily PerformPartneringFamilyOperation(PartneringFamilyOperation operation)
        {
            //TODO:
            // Validate ->
            // Authorize (PolicyEvaluationEngine?) ->
            // Execute (returning new state & optionally events) ->
            // (optionally) Raise Domain Events ->
            // Apply Permissions Filters (PolicyEvaluationEngine) ->
            // Return New State
            throw new NotImplementedException();
        }

        public IQueryable<PartneringFamily> QueryPartneringFamilies()
        {
            throw new NotImplementedException();
        }
    }
}

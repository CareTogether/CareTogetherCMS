using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace CareTogether.Engines
{
    public interface IPolicyEvaluationEngine
    {
        Task CalculateVolunteerApprovalStatus(Guid VolunteerId);
    }
}

using CareTogether.Resources;
using System;
using System.Collections.Generic;
using System.Collections.Immutable;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace CareTogether.Managers
{
    public sealed class ApprovalManager : IApprovalManager
    {
        // contactsResourceAccess.CreateContact(volunteer.Id, volunteer.ContactInfo);
        // policiesEngine.CalculateVolunteerApprovalStatus();
        // approvalsResourceAccess.ImportApprovalInfo(); //TODO: Save approval info? Info vs docs/evidence vs status?
        public Task<IImmutableList<(Family, VolunteerFamilyApproval)>> ListVolunteerFamiliesAsync(AuthorizedUser user, Guid organizationId, Guid locationId)
        {
            throw new NotImplementedException();
        }
    }
}

using CareTogether.Resources;
using CareTogether.Resources.Approvals;
using System;
using System.Security.Claims;
using System.Threading.Tasks;

namespace CareTogether.Managers.Approval
{
    public interface IApprovalManager
    {
        Task<CombinedFamilyInfo> ExecuteVolunteerFamilyCommandAsync(Guid organizationId, Guid locationId,
            ClaimsPrincipal user, VolunteerFamilyCommand command);

        Task<CombinedFamilyInfo> ExecuteVolunteerCommandAsync(Guid organizationId, Guid locationId,
            ClaimsPrincipal user, VolunteerCommand command);
    }
}

using CareTogether.Engines;
using CareTogether.Resources;
using JsonPolymorph;
using System;
using System.Collections.Immutable;
using System.Security.Claims;
using System.Threading.Tasks;

namespace CareTogether.Managers
{
    public interface IApprovalManager
    {
        Task<ImmutableList<CombinedFamilyInfo>> ListVolunteerFamiliesAsync(
            ClaimsPrincipal user, Guid organizationId, Guid locationId);

        Task<CombinedFamilyInfo> ExecuteVolunteerFamilyCommandAsync(Guid organizationId, Guid locationId,
            ClaimsPrincipal user, VolunteerFamilyCommand command);

        Task<CombinedFamilyInfo> ExecuteVolunteerCommandAsync(Guid organizationId, Guid locationId,
            ClaimsPrincipal user, VolunteerCommand command);
    }
}

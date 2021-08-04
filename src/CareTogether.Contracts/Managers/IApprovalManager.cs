using CareTogether.Resources;
using JsonPolymorph;
using System;
using System.Collections.Immutable;
using System.Threading.Tasks;

namespace CareTogether.Managers
{
    public interface IApprovalManager
    {
        Task<ImmutableList<VolunteerFamily>> ListVolunteerFamiliesAsync(
            AuthorizedUser user, Guid organizationId, Guid locationId);

        Task<ManagerResult<VolunteerFamily>> ExecuteVolunteerFamilyCommandAsync(Guid organizationId, Guid locationId,
            AuthorizedUser user, VolunteerFamilyCommand command);

        Task<ManagerResult<VolunteerFamily>> ExecuteVolunteerCommandAsync(Guid organizationId, Guid locationId,
            AuthorizedUser user, VolunteerCommand command);
    }
}

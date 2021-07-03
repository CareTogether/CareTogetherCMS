using CareTogether.Resources;
using System;
using System.Collections.Immutable;
using System.Threading.Tasks;

namespace CareTogether.Managers
{
    public sealed record VolunteerFamily(Family Family, VolunteerFamilyApproval FamilyApproval);

    public sealed record VolunteerFamilyApproval();

    /// <summary>
    /// The <see cref="IApprovalManager"/> models the lifecycle of people's approval status with CareTogether organizations,
    /// including various forms, approval, renewals, and policy changes, as well as authorizing related queries.
    /// </summary>
    public interface IApprovalManager
    {
        Task<IImmutableList<(Family, VolunteerFamilyApproval)>> ListVolunteerFamiliesAsync(
            AuthorizedUser user, Guid organizationId, Guid locationId);


    }
}

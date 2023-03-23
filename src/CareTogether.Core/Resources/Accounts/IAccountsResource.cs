using JsonPolymorph;
using System;
using System.Collections.Immutable;
using System.Threading.Tasks;

namespace CareTogether.Resources.Accounts
{
    //TODO: This is only being kept for schema compatibility until the migration is completed.
    public sealed record UserTenantAccessSummary(Guid OrganizationId,
        ImmutableList<Guid> LocationIds);

    /// <summary>
    /// The <see cref="Account"/> exists at a global level, *across* organizational boundaries.
    /// </summary>
    public sealed record Account(Guid UserId, ImmutableList<UserOrganizationAccess> Organizations);
    public sealed record UserOrganizationAccess(Guid OrganizationId, ImmutableList<UserLocationAccess> Locations);
    public sealed record UserLocationAccess(Guid LocationId, Guid PersonId, ImmutableList<string> Roles);

    [JsonHierarchyBase]
    public abstract partial record AccountCommand(Guid UserId);
    public sealed record LinkPersonToAcccount(Guid UserId,
        Guid OrganizationId, Guid LocationId, Guid PersonId)
        : AccountCommand(UserId);

    /// <summary>
    /// Person access records exist at a per-location level *within* organizational boundaries.
    /// </summary>
    [JsonHierarchyBase]
    public abstract partial record PersonAccessCommand(Guid PersonId);
    public sealed record ChangePersonRoles(Guid PersonId, ImmutableList<string> Roles)
        : PersonAccessCommand(PersonId);

    /// <summary>
    /// The <see cref="IAccountsResource"/> is responsible for user account management in CareTogether.
    /// This consists of managing *two* interconnected models: a global accounts model and a
    /// per-organization-per-location person access model.
    /// </summary>
    public interface IAccountsResource
    {
        Task<Account> GetUserAccountAsync(Guid userId);

        Task<Account?> GetPersonUserAccountAsync(Guid organizationId, Guid locationId, Guid personId);

        Task<AccountEntry> ExecuteAccountCommandAsync(AccountCommand command, Guid userId);

        Task<PersonAccessEntry> ExecutePersonAccessCommandAsync(Guid organizationId, Guid locationId,
            PersonAccessCommand command, Guid userId);

        Task<byte[]> CreateUserInviteNonceAsync(Guid organizationId, Guid locationId, Guid personId, Guid userId);

        Task<Account> RedeemUserInviteNonceAsync(Guid organizationId, Guid locationId, Guid userId, byte[] nonce);
    }
}

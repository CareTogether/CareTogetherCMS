using JsonPolymorph;
using System;
using System.Collections.Immutable;
using System.Threading.Tasks;

namespace CareTogether.Resources.Accounts
{
    //TODO: Support multiple organizations per user.
    //TODO: This is only being kept for schema compatibility until the migration is completed.
    public sealed record UserTenantAccessSummary(Guid OrganizationId,
        ImmutableList<Guid> LocationIds);

    public sealed record Account(Guid Id, UserOrganizationAccess Organization);
    public sealed record UserOrganizationAccess(Guid OrganizationId, ImmutableList<UserLocationAccess> Locations);
    public sealed record UserLocationAccess(Guid LocationId, Guid PersonId, ImmutableList<string> Roles);

    [JsonHierarchyBase]
    public abstract partial record AccountCommand(Guid UserId);
    public sealed record CreateUserAccount(Guid UserId, UserOrganizationAccess InitialAccess)
        : AccountCommand(UserId);
    public sealed record ChangeUserLocationRoles(Guid UserId, Guid OrganizationId, Guid LocationId,
        ImmutableList<string> Roles)
        : AccountCommand(UserId);

    /// <summary>
    /// The <see cref="IAccountsResource"/> is responsible for user account management in CareTogether.
    /// </summary>
    public interface IAccountsResource
    {
        Task<Account> GetUserAccountAsync(Guid userId);

        Task<Account> ExecuteAccountCommandAsync(AccountCommand command, Guid userId);
    }
}

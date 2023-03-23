using JsonPolymorph;
using NJsonSchema.Annotations;
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
    /// <summary>
    /// The <see cref="InitializeUserAccount"/> command is only intended for system purposes, including
    /// user migrations and new organization/location onboarding experiences.
    /// </summary>
    [JsonSchemaIgnore]
    public sealed record InitializeUserAccount(Guid UserId, UserOrganizationAccess InitialAccess)
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

        Task<Account?> GetPersonUserAccountAsync(Guid organizationId, Guid locationId, Guid personId);

        Task<Account> ExecuteAccountCommandAsync(AccountCommand command, Guid userId);
    }
}

using System;
using System.Collections.Immutable;
using System.Threading.Tasks;
using JsonPolymorph;
using NJsonSchema.Annotations;

namespace CareTogether.Resources.Accounts
{
    //TODO: This is only being kept for schema compatibility until the migration is completed.
    public sealed record UserTenantAccessSummary(
        Guid OrganizationId,
        ImmutableList<Guid> LocationIds
    );

    /// <summary>
    /// The <see cref="Account"/> exists at a global level, *across* organizational boundaries.
    /// </summary>
    public sealed record Account(
        Guid UserId,
        ImmutableList<AccountOrganizationAccess> Organizations
    );

    public sealed record AccountOrganizationAccess(
        Guid OrganizationId,
        ImmutableList<AccountLocationAccess> Locations
    );

    public sealed record AccountLocationAccess(
        Guid LocationId,
        Guid PersonId,
        ImmutableList<string> Roles
    );

    [JsonHierarchyBase]
    [JsonSchemaIgnore]
    public abstract partial record AccountCommand(Guid UserId);

    [JsonSchemaIgnore]
    public sealed record LinkPersonToAcccount(
        Guid UserId,
        Guid OrganizationId,
        Guid LocationId,
        Guid PersonId
    ) : AccountCommand(UserId);

    /// <summary>
    /// Person access records exist at a per-location level *within* organizational boundaries.
    /// </summary>
    [JsonHierarchyBase]
    public abstract partial record PersonAccessCommand(Guid PersonId);

    public sealed record ChangePersonRoles(Guid PersonId, ImmutableList<string> Roles)
        : PersonAccessCommand(PersonId);

    [JsonSchemaIgnore]
    public sealed record GenerateUserInviteNonce(Guid PersonId, byte[] Nonce)
        : PersonAccessCommand(PersonId);

    [JsonSchemaIgnore]
    public sealed record RedeemUserInviteNonce(Guid PersonId, byte[] Nonce)
        : PersonAccessCommand(PersonId);

    /// <summary>
    /// The <see cref="IAccountsResource"/> is responsible for user account management in CareTogether.
    /// This consists of managing *two* interconnected models: a global accounts model and a
    /// per-organization-per-location person access model.
    /// </summary>
    public interface IAccountsResource
    {
        Task<Guid[]> GetValidOrganizationsAsync();

        Task<Account?> TryGetUserAccountAsync(Guid userId);

        Task<Account?> TryGetPersonUserAccountAsync(
            Guid organizationId,
            Guid locationId,
            Guid personId
        );

        Task<ImmutableList<string>?> TryGetPersonRolesAsync(
            Guid organizationId,
            Guid locationId,
            Guid personId
        );

        Task<AccountEntry> ExecuteAccountCommandAsync(AccountCommand command, Guid userId);

        Task<PersonAccessEntry> ExecutePersonAccessCommandAsync(
            Guid organizationId,
            Guid locationId,
            PersonAccessCommand command,
            Guid userId
        );

        Task<byte[]> GenerateUserInviteNonceAsync(
            Guid organizationId,
            Guid locationId,
            Guid personId,
            Guid userId
        );

        Task<AccountLocationAccess?> TryLookupUserInviteNoncePersonIdAsync(
            Guid organizationId,
            Guid locationId,
            byte[] nonce
        );

        Task<Account?> TryRedeemUserInviteNonceAsync(
            Guid organizationId,
            Guid locationId,
            Guid userId,
            byte[] nonce
        );
    }
}

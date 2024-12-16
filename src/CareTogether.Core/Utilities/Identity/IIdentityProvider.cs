using System;
using System.Threading.Tasks;

namespace CareTogether.Utilities.Identity
{
    public sealed record UserLoginInfo(
        Guid UserId,
        DateTimeOffset? LastSignIn,
        string? DisplayName,
        UserLoginIdentity[] Identities
    );

    public sealed record UserLoginIdentity(string? Issuer, string? SignInType, string? IssuerAssignedId);

    public interface IIdentityProvider
    {
        Task<UserLoginInfo> GetUserLoginInfoAsync(Guid userId);
    }
}

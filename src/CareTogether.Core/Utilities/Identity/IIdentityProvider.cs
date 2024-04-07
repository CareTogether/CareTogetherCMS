using System;
using System.Threading.Tasks;

namespace CareTogether.Utilities.Identity
{
    public sealed record UserLoginInfo(Guid UserId);

    public interface IIdentityProvider
    {
        Task<UserLoginInfo> GetUserLoginInfoAsync(Guid userId);
    }
}


using System;
using System.Threading.Tasks;

namespace CareTogether.Utilities.Identity
{
    public sealed class AzureAdB2cIdentityProvider : IIdentityProvider
    {
        public async Task<UserLoginInfo> GetUserLoginInfoAsync(Guid userId)
        {
            //TODO: Implement!
            await Task.Yield();
            return new UserLoginInfo(userId);
        }
    }
}
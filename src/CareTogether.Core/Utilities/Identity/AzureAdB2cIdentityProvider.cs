using System;
using System.Linq;
using System.Threading.Tasks;
using Azure.Identity;
using Microsoft.Graph;
using Microsoft.Graph.Models;

namespace CareTogether.Utilities.Identity
{
    public sealed class AzureAdB2cIdentityProvider : IIdentityProvider
    {
        readonly GraphServiceClient _GraphClient;

        public AzureAdB2cIdentityProvider(string b2cTenantId, string b2cClientId, string b2cClientSecret)
        {
            ClientSecretCredential credential = new(b2cTenantId, b2cClientId, b2cClientSecret);
            _GraphClient = new GraphServiceClient(credential);
        }

        public async Task<UserLoginInfo> GetUserLoginInfoAsync(Guid userId)
        {
            User user =
                await _GraphClient
                    .Users[userId.ToString()]
                    .GetAsync(requestConfiguration =>
                    {
                        requestConfiguration.QueryParameters.Select =
                        [
                            "id",
                            "identities",
                            "signInActivity",
                            "displayName",
                        ];
                    })
                ?? throw new InvalidOperationException($"User with ID '{userId}' not found in identity provider");

            DateTimeOffset? lastSignIn = user.SignInActivity?.LastSignInDateTime;
            string? displayName = user.DisplayName;
            UserLoginIdentity[] identities =
                user.Identities?.Select(identity => new UserLoginIdentity(
                        identity.Issuer,
                        identity.SignInType,
                        identity.IssuerAssignedId
                    ))
                    .ToArray() ?? [];

            return new UserLoginInfo(userId, lastSignIn, displayName, identities);
        }
    }
}

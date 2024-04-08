using System;
using System.Linq;
using System.Threading.Tasks;
using Azure.Identity;
using Microsoft.Graph;

namespace CareTogether.Utilities.Identity
{
    public sealed class AzureAdB2cIdentityProvider : IIdentityProvider
    {
        private readonly GraphServiceClient graphClient;

        public AzureAdB2cIdentityProvider(string b2cTenantId, string b2cClientId, string b2cClientSecret)
        {
            var credential = new ClientSecretCredential(b2cTenantId, b2cClientId, b2cClientSecret);
            graphClient = new GraphServiceClient(credential);
        }

        public async Task<UserLoginInfo> GetUserLoginInfoAsync(Guid userId)
        {
            var user = await graphClient.Users[userId.ToString()]
                .GetAsync(requestConfiguration =>
                {
                    requestConfiguration.QueryParameters.Select = [
                        "id",
                        "identities",
                        "signInActivity",
                        "displayName"
                    ];
                }) ?? throw new InvalidOperationException(
                    $"User with ID '{userId}' not found in identity provider");

            var lastSignIn = user.SignInActivity?.LastSignInDateTime;
            var displayName = user.DisplayName;
            var identities = user.Identities?.Select(identity => new UserLoginIdentity(
                identity.Issuer,
                identity.SignInType,
                identity.IssuerAssignedId
            )).ToArray() ?? [];

            return new UserLoginInfo(userId, lastSignIn, displayName, identities);
        }
    }
}
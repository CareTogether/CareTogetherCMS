using System;
using System.Collections.Immutable;
using System.Security.Claims;
using System.Threading.Tasks;
using CareTogether.Engines.Authorization;
using CareTogether.Resources.Accounts;
using CareTogether.Resources.Directory;
using CareTogether.Resources.Notes;
using CareTogether.Resources.Policies;
using CareTogether.Resources.V1Referrals;
using Microsoft.VisualStudio.TestTools.UnitTesting;
using Moq;

namespace CareTogether.Core.Test.AuthorizationEngineTests
{
    [TestClass]
    public sealed class AuthorizeLocationPolicyEditAsync
    {
        private static readonly Guid OrganizationId = Guid.Parse(
            "11111111-1111-1111-1111-111111111111"
        );
        private static readonly Guid LocationId = Guid.Parse(
            "22222222-2222-2222-2222-222222222222"
        );

        [TestMethod]
        public async Task SettingsAccessCanEditLocationPolicies()
        {
            var dut = CreateAuthorizationEngine(Permission.AccessSettingsScreen);

            var response = await dut.AuthorizeLocationPolicyEditAsync(
                OrganizationId,
                LocationId,
                UserContext()
            );

            Assert.IsTrue(response);
        }

        [TestMethod]
        public async Task OtherPermissionsCannotEditLocationPolicies()
        {
            var dut = CreateAuthorizationEngine(Permission.AccessVolunteersScreen);

            var response = await dut.AuthorizeLocationPolicyEditAsync(
                OrganizationId,
                LocationId,
                UserContext()
            );

            Assert.IsFalse(response);
        }

        [TestMethod]
        public async Task LocationPolicyEditUsesGlobalAuthorizationContext()
        {
            AuthorizationContext? authorizationContext = null;
            var dut = CreateAuthorizationEngine(
                [Permission.AccessSettingsScreen],
                context => authorizationContext = context
            );

            await dut.AuthorizeLocationPolicyEditAsync(OrganizationId, LocationId, UserContext());

            Assert.IsInstanceOfType(authorizationContext, typeof(GlobalAuthorizationContext));
        }

        private static AuthorizationEngine CreateAuthorizationEngine(
            params Permission[] permissions
        ) => CreateAuthorizationEngine(permissions, _ => { });

        private static AuthorizationEngine CreateAuthorizationEngine(
            Permission[] permissions,
            Action<AuthorizationContext> captureAuthorizationContext
        )
        {
            var userAccessCalculation = new Mock<IUserAccessCalculation>();
            userAccessCalculation
                .Setup(x =>
                    x.AuthorizeUserAccessAsync(
                        It.IsAny<Guid>(),
                        It.IsAny<Guid>(),
                        It.IsAny<SessionUserContext>(),
                        It.IsAny<AuthorizationContext>()
                    )
                )
                .Callback<Guid, Guid, SessionUserContext, AuthorizationContext>(
                    (_, _, _, context) => captureAuthorizationContext(context)
                )
                .ReturnsAsync(permissions.ToImmutableList());

            return new AuthorizationEngine(
                Mock.Of<IPoliciesResource>(),
                Mock.Of<IDirectoryResource>(),
                Mock.Of<IAccountsResource>(),
                Mock.Of<INotesResource>(),
                userAccessCalculation.Object,
                Mock.Of<IV1ReferralsResource>()
            );
        }

        private static SessionUserContext UserContext() =>
            new(new ClaimsPrincipal(new ClaimsIdentity("test")), null);
    }
}

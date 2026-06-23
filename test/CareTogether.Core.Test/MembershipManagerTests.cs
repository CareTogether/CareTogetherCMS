using System;
using System.Collections.Immutable;
using System.Security.Claims;
using System.Threading.Tasks;
using CareTogether.Engines.Authorization;
using CareTogether.Managers.Membership;
using CareTogether.Resources.Accounts;
using CareTogether.Resources.Directory;
using CareTogether.Resources.Policies;
using CareTogether.Utilities.Identity;
using Microsoft.VisualStudio.TestTools.UnitTesting;
using Moq;

namespace CareTogether.Core.Test
{
    [TestClass]
    public class MembershipManagerTests
    {
        [TestMethod]
        public async Task GetUserAccessAsync_IgnoresAccountLocationsThatAreNotConfigured()
        {
            var userId = Guid.NewGuid();
            var organizationId = Guid.NewGuid();
            var configuredLocationId = Guid.NewGuid();
            var missingLocationId = Guid.NewGuid();

            var accountsResource = new Mock<IAccountsResource>();
            accountsResource
                .Setup(x => x.TryGetUserAccountAsync(userId))
                .ReturnsAsync(
                    new Account(
                        userId,
                        ImmutableList.Create(
                            new AccountOrganizationAccess(
                                organizationId,
                                ImmutableList.Create(
                                    new AccountLocationAccess(
                                        configuredLocationId,
                                        Guid.NewGuid(),
                                        ImmutableList<string>.Empty
                                    ),
                                    new AccountLocationAccess(
                                        missingLocationId,
                                        Guid.NewGuid(),
                                        ImmutableList<string>.Empty
                                    )
                                )
                            )
                        )
                    )
                );

            var policiesResource = new Mock<IPoliciesResource>();
            policiesResource
                .Setup(x => x.GetConfigurationAsync(organizationId))
                .ReturnsAsync(
                    new OrganizationConfiguration(
                        "Test Organization",
                        ImmutableList.Create(
                            new LocationConfiguration(
                                configuredLocationId,
                                "Configured Location",
                                ImmutableList<string>.Empty,
                                ImmutableList<string>.Empty,
                                ImmutableList<string>.Empty,
                                ImmutableList<SourcePhoneNumberConfiguration>.Empty,
                                ImmutableList<AccessLevel>.Empty
                            )
                        ),
                        ImmutableList<RoleDefinition>.Empty,
                        ImmutableList<string>.Empty,
                        ImmutableList<string>.Empty,
                        ImmutableList<string>.Empty
                    )
                );

            var userAccessCalculation = new Mock<IUserAccessCalculation>();
            userAccessCalculation
                .Setup(x =>
                    x.AuthorizeUserAccessAsync(
                        organizationId,
                        configuredLocationId,
                        It.IsAny<SessionUserContext>(),
                        It.IsAny<AuthorizationContext>()
                    )
                )
                .ReturnsAsync(ImmutableList<Permission>.Empty);

            var membershipManager = new MembershipManager(
                accountsResource.Object,
                null!,
                userAccessCalculation.Object,
                new Mock<IDirectoryResource>().Object,
                policiesResource.Object,
                null!,
                new Mock<IIdentityProvider>().Object
            );

            var result = await membershipManager.GetUserAccessAsync(
                new ClaimsPrincipal(
                    new ClaimsIdentity(new[] { new Claim(Claims.UserId, userId.ToString()) })
                )
            );

            Assert.AreEqual(1, result.Organizations.Count);
            Assert.AreEqual(1, result.Organizations[0].Locations.Count);
            Assert.AreEqual(configuredLocationId, result.Organizations[0].Locations[0].LocationId);

            userAccessCalculation.Verify(
                x =>
                    x.AuthorizeUserAccessAsync(
                        organizationId,
                        missingLocationId,
                        It.IsAny<SessionUserContext>(),
                        It.IsAny<AuthorizationContext>()
                    ),
                Times.Never
            );
        }
    }
}

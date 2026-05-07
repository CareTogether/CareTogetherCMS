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
    public sealed class AuthorizeV1ReferralCommandAsync
    {
        private static readonly Guid OrganizationId = Guid.Parse(
            "11111111-1111-1111-1111-111111111111"
        );
        private static readonly Guid LocationId = Guid.Parse(
            "22222222-2222-2222-2222-222222222222"
        );
        private static readonly Guid ReferralId = Guid.Parse(
            "33333333-3333-3333-3333-333333333333"
        );

        private static AuthorizationEngine CreateAuthorizationEngine(params Permission[] permissions)
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
                .ReturnsAsync(ImmutableList.Create(permissions));

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

        private static V1ReferralCommand CommandFor(string commandName) =>
            commandName switch
            {
                nameof(CompleteReferralRequirement) => new CompleteReferralRequirement(
                    ReferralId,
                    Guid.NewGuid(),
                    "Intake Form",
                    DateTime.UtcNow,
                    null,
                    null
                ),
                nameof(MarkReferralRequirementIncomplete) =>
                    new MarkReferralRequirementIncomplete(
                        ReferralId,
                        Guid.NewGuid(),
                        "Intake Form"
                    ),
                nameof(ExemptReferralRequirement) => new ExemptReferralRequirement(
                    ReferralId,
                    "Intake Form",
                    "Not needed",
                    null
                ),
                nameof(UnexemptReferralRequirement) => new UnexemptReferralRequirement(
                    ReferralId,
                    "Intake Form"
                ),
                _ => throw new ArgumentOutOfRangeException(nameof(commandName), commandName, null),
            };

        [DataTestMethod]
        [DataRow(
            nameof(CompleteReferralRequirement),
            Permission.EditV1ReferralRequirementCompletion
        )]
        [DataRow(
            nameof(MarkReferralRequirementIncomplete),
            Permission.EditV1ReferralRequirementCompletion
        )]
        [DataRow(nameof(ExemptReferralRequirement), Permission.EditV1ReferralRequirementExemption)]
        [DataRow(
            nameof(UnexemptReferralRequirement),
            Permission.EditV1ReferralRequirementExemption
        )]
        public async Task ReferralRequirementCommandsRequireReferralRequirementPermissions(
            string commandName,
            Permission permission
        )
        {
            var dut = CreateAuthorizationEngine(permission);

            var response = await dut.AuthorizeV1ReferralCommandAsync(
                OrganizationId,
                LocationId,
                UserContext(),
                CommandFor(commandName)
            );

            Assert.IsTrue(response);
        }

        [DataTestMethod]
        [DataRow(
            nameof(CompleteReferralRequirement),
            Permission.EditV1CaseRequirementCompletion
        )]
        [DataRow(
            nameof(MarkReferralRequirementIncomplete),
            Permission.EditV1CaseRequirementCompletion
        )]
        [DataRow(nameof(ExemptReferralRequirement), Permission.EditV1CaseRequirementExemption)]
        [DataRow(
            nameof(UnexemptReferralRequirement),
            Permission.EditV1CaseRequirementExemption
        )]
        public async Task ReferralRequirementCommandsDoNotUseV1CaseRequirementPermissions(
            string commandName,
            Permission permission
        )
        {
            var dut = CreateAuthorizationEngine(permission);

            var response = await dut.AuthorizeV1ReferralCommandAsync(
                OrganizationId,
                LocationId,
                UserContext(),
                CommandFor(commandName)
            );

            Assert.IsFalse(response);
        }
    }
}

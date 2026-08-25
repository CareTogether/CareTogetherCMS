using System;
using System.Collections.Immutable;
using System.Security.Claims;
using System.Threading.Tasks;
using CareTogether.Engines.Authorization;
using CareTogether.Engines.PolicyEvaluation;
using CareTogether.Managers;
using CareTogether.Managers.Records;
using CareTogether.Resources.Accounts;
using CareTogether.Resources.Approvals;
using CareTogether.Resources.Communities;
using CareTogether.Resources.Directory;
using CareTogether.Resources.Notes;
using CareTogether.Resources.Policies;
using CareTogether.Resources.V1Cases;
using CareTogether.Resources.V1ReferralNotes;
using CareTogether.Resources.V1Referrals;
using Microsoft.VisualStudio.TestTools.UnitTesting;
using Moq;

namespace CareTogether.Core.Test
{
    [TestClass]
    public sealed class RecordsManagerReferralAuthorizationTests
    {
        private static readonly Guid OrganizationId = Guid.Parse(
            "11111111-1111-1111-1111-111111111111"
        );
        private static readonly Guid LocationId = Guid.Parse(
            "22222222-2222-2222-2222-222222222222"
        );
        private static readonly Guid UserId = Guid.Parse("33333333-3333-3333-3333-333333333333");
        private static readonly Guid ReferralId = Guid.Parse(
            "44444444-4444-4444-4444-444444444444"
        );

        [TestMethod]
        public async Task ReferralNoteCommandsAuthorizeAgainstReferralContext()
        {
            var v1ReferralNotesResource = new Mock<IV1ReferralNotesResource>();
            var dut = CreateRecordsManager(
                out var userAccessCalculation,
                out _,
                v1ReferralNotesResource
            );

            await dut.ExecuteAtomicRecordsCommandAsync(
                OrganizationId,
                LocationId,
                User(),
                new V1ReferralNoteRecordsCommand(
                    new CreateV1ReferralDraftNote(
                        ReferralId,
                        Guid.NewGuid(),
                        "Draft note",
                        null
                    )
                )
            );

            userAccessCalculation.Verify(
                x =>
                    x.AuthorizeUserAccessAsync(
                        OrganizationId,
                        LocationId,
                        It.IsAny<SessionUserContext>(),
                        It.Is<V1ReferralAuthorizationContext>(c => c.ReferralId == ReferralId)
                    ),
                Times.AtLeastOnce
            );
            userAccessCalculation.Verify(
                x =>
                    x.AuthorizeUserAccessAsync(
                        OrganizationId,
                        LocationId,
                        It.IsAny<SessionUserContext>(),
                        It.IsAny<GlobalAuthorizationContext>()
                    ),
                Times.Never
            );
            v1ReferralNotesResource.Verify(
                x =>
                    x.ExecuteReferralNoteCommandAsync(
                        OrganizationId,
                        LocationId,
                        It.IsAny<V1ReferralNoteCommand>(),
                        UserId
                    ),
                Times.Once
            );
        }

        [TestMethod]
        public async Task ReferralDocumentUploadUrlsAuthorizeAgainstReferralContext()
        {
            var documentId = Guid.Parse("55555555-5555-5555-5555-555555555555");
            var expectedUri = new Uri("https://example.com/upload");
            var v1ReferralsResource = new Mock<IV1ReferralsResource>();
            v1ReferralsResource
                .Setup(x =>
                    x.GetV1ReferralDocumentUploadValetUrl(
                        OrganizationId,
                        LocationId,
                        ReferralId,
                        documentId
                    )
                )
                .ReturnsAsync(expectedUri);

            var dut = CreateRecordsManager(
                out var userAccessCalculation,
                out _,
                v1ReferralsResource: v1ReferralsResource
            );

            var actualUri = await dut.GenerateV1ReferralDocumentUploadValetUrl(
                OrganizationId,
                LocationId,
                User(),
                ReferralId,
                documentId
            );

            Assert.AreEqual(expectedUri, actualUri);
            userAccessCalculation.Verify(
                x =>
                    x.AuthorizeUserAccessAsync(
                        OrganizationId,
                        LocationId,
                        It.IsAny<SessionUserContext>(),
                        It.Is<V1ReferralAuthorizationContext>(c => c.ReferralId == ReferralId)
                    ),
                Times.Once
            );
            userAccessCalculation.Verify(
                x =>
                    x.AuthorizeUserAccessAsync(
                        OrganizationId,
                        LocationId,
                        It.IsAny<SessionUserContext>(),
                        It.IsAny<GlobalAuthorizationContext>()
                    ),
                Times.Never
            );
        }

        private static RecordsManager CreateRecordsManager(
            out Mock<IUserAccessCalculation> userAccessCalculation,
            out Mock<IPolicyEvaluationEngine> policyEvaluationEngine,
            Mock<IV1ReferralNotesResource>? v1ReferralNotesResource = null,
            Mock<IV1ReferralsResource>? v1ReferralsResource = null
        )
        {
            var policiesResource = new Mock<IPoliciesResource>();
            policiesResource
                .Setup(x => x.GetCurrentPolicy(OrganizationId, LocationId))
                .ReturnsAsync((EffectiveLocationPolicy)null!);

            userAccessCalculation = new Mock<IUserAccessCalculation>();
            userAccessCalculation
                .Setup(x =>
                    x.AuthorizeUserAccessAsync(
                        OrganizationId,
                        LocationId,
                        It.IsAny<SessionUserContext>(),
                        It.IsAny<AuthorizationContext>()
                    )
                )
                .ReturnsAsync(
                    (
                        Guid _,
                        Guid _,
                        SessionUserContext _,
                        AuthorizationContext context
                    ) =>
                        context is V1ReferralAuthorizationContext referralContext
                        && referralContext.ReferralId == ReferralId
                            ? ImmutableList.Create(Permission.EditV1Referral)
                            : ImmutableList<Permission>.Empty
                );

            policyEvaluationEngine = new Mock<IPolicyEvaluationEngine>();
            policyEvaluationEngine
                .Setup(x =>
                    x.CalculateMissingV1ReferralIntakeRequirementsAsync(
                        OrganizationId,
                        LocationId,
                        It.IsAny<V1Referral>()
                    )
                )
                .ReturnsAsync(ImmutableList<RequirementDefinition>.Empty);

            var referralNotesResource = v1ReferralNotesResource ?? new Mock<IV1ReferralNotesResource>();
            referralNotesResource
                .Setup(x => x.ListReferralNotesAsync(OrganizationId, LocationId, ReferralId))
                .ReturnsAsync(ImmutableList<V1ReferralNoteEntry>.Empty);

            var referralsResource = v1ReferralsResource ?? new Mock<IV1ReferralsResource>();
            referralsResource
                .Setup(x => x.GetReferralAsync(OrganizationId, LocationId, ReferralId))
                .ReturnsAsync(Referral());

            var authorizationEngine = Mock.Of<IAuthorizationEngine>();
            var approvalsResource = Mock.Of<IApprovalsResource>();
            var v1CasesResource = Mock.Of<IV1CasesResource>();
            var directoryResource = Mock.Of<IDirectoryResource>();
            var notesResource = Mock.Of<INotesResource>();
            var accountsResource = Mock.Of<IAccountsResource>();
            var communitiesResource = Mock.Of<ICommunitiesResource>();

            var combinedFamilyInfoFormatter = new CombinedFamilyInfoFormatter(
                policyEvaluationEngine.Object,
                authorizationEngine,
                approvalsResource,
                v1CasesResource,
                referralsResource.Object,
                directoryResource,
                notesResource,
                policiesResource.Object,
                accountsResource
            );

            return new RecordsManager(
                policiesResource.Object,
                authorizationEngine,
                policyEvaluationEngine.Object,
                userAccessCalculation.Object,
                directoryResource,
                accountsResource,
                approvalsResource,
                v1CasesResource,
                referralsResource.Object,
                referralNotesResource.Object,
                notesResource,
                communitiesResource,
                combinedFamilyInfoFormatter
            );
        }

        private static ClaimsPrincipal User() =>
            new(
                new ClaimsIdentity(
                    new[] { new Claim(CareTogether.Claims.UserId, UserId.ToString()) },
                    "test"
                )
            );

        private static V1Referral Referral() =>
            new(
                ReferralId,
                null,
                DateTime.UtcNow,
                "Referral",
                V1ReferralStatus.Open,
                null,
                null,
                null,
                null,
                ImmutableDictionary<string, CareTogether.Resources.CompletedCustomFieldInfo>.Empty,
                ImmutableList<CareTogether.Resources.CompletedRequirementInfo>.Empty,
                ImmutableList<CareTogether.Resources.ExemptedRequirementInfo>.Empty,
                ImmutableList<CareTogether.Resources.UploadedDocumentInfo>.Empty,
                ImmutableList<Guid>.Empty,
                ImmutableList<CareTogether.Resources.AssignedIndividualVolunteer>.Empty,
                ImmutableList<CareTogether.Resources.Activity>.Empty,
                ImmutableList<V1ReferralNoteEntry>.Empty
            );
    }
}

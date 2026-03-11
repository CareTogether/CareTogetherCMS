using System;
using System.Threading.Tasks;
using CareTogether.Managers.Records;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CareTogether.Api.Controllers
{
    [ApiController]
    [Route("/api/{organizationId:guid}/{locationId:guid}/[controller]")]
    [Authorize(
        Policies.ForbidAnonymous,
        AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme
    )]
    public class FilesController : ControllerBase //TODO: Merge this into RecordsController
    {
        private readonly IRecordsManager recordsManager;

        public sealed record DocumentUploadInfo(Guid DocumentId, Uri ValetUrl);

        public FilesController(IRecordsManager recordsManager)
        {
            this.recordsManager = recordsManager;
        }

        [HttpGet("family/{familyId:guid}/{documentId:guid}")]
        public async Task<ActionResult<Uri>> GetFamilyDocumentReadValetUrl(
            Guid organizationId,
            Guid locationId,
            Guid familyId,
            Guid documentId
        )
        {
            var valetUrl = await recordsManager.GetFamilyDocumentReadValetUrl(
                organizationId,
                locationId,
                User,
                familyId,
                documentId
            );
            return Ok(valetUrl); //TODO: Don't return server errors (5xx) if there were client errors (should be 4xx)!
        }

        [HttpPost("upload/family/{familyId:guid}/{documentId:guid}")]
        public async Task<ActionResult<DocumentUploadInfo>> GenerateFamilyDocumentUploadValetUrl(
            Guid organizationId,
            Guid locationId,
            Guid familyId,
            Guid documentId
        )
        {
            var valetUrl = await recordsManager.GenerateFamilyDocumentUploadValetUrl(
                organizationId,
                locationId,
                User,
                familyId,
                documentId
            );
            return Ok(new DocumentUploadInfo(documentId, valetUrl));
        }

        [HttpGet("community/{communityId:guid}/{documentId:guid}")]
        public async Task<ActionResult<Uri>> GetCommunityDocumentReadValetUrl(
            Guid organizationId,
            Guid locationId,
            Guid communityId,
            Guid documentId
        )
        {
            var valetUrl = await recordsManager.GetCommunityDocumentReadValetUrl(
                organizationId,
                locationId,
                User,
                communityId,
                documentId
            );
            return Ok(valetUrl);
        }

        [HttpPost("upload/community/{communityId:guid}/{documentId:guid}")]
        public async Task<ActionResult<DocumentUploadInfo>> GenerateCommunityDocumentUploadValetUrl(
            Guid organizationId,
            Guid locationId,
            Guid communityId,
            Guid documentId
        )
        {
            var valetUrl = await recordsManager.GenerateCommunityDocumentUploadValetUrl(
                organizationId,
                locationId,
                User,
                communityId,
                documentId
            );
            return Ok(new DocumentUploadInfo(documentId, valetUrl));
        }

        [HttpGet("v1referral/{referralId:guid}/{documentId:guid}")]
        public async Task<ActionResult<Uri>> GetV1ReferralDocumentReadValetUrl(
            Guid organizationId,
            Guid locationId,
            Guid referralId,
            Guid documentId
        )
        {
            var valetUrl = await recordsManager.GetV1ReferralDocumentReadValetUrl(
                organizationId,
                locationId,
                User,
                referralId,
                documentId
            );
            return Ok(valetUrl);
        }

        [HttpPost("upload/v1referral/{referralId:guid}/{documentId:guid}")]
        public async Task<
            ActionResult<DocumentUploadInfo>
        > GenerateV1ReferralDocumentUploadValetUrl(
            Guid organizationId,
            Guid locationId,
            Guid referralId,
            Guid documentId
        )
        {
            var valetUrl = await recordsManager.GenerateV1ReferralDocumentUploadValetUrl(
                organizationId,
                locationId,
                User,
                referralId,
                documentId
            );
            return Ok(new DocumentUploadInfo(documentId, valetUrl));
        }
    }
}

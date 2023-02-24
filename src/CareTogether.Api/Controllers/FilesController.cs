using CareTogether.Managers.Records;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System;
using System.Threading.Tasks;

namespace CareTogether.Api.Controllers
{
    [ApiController]
    [Route("/api/{organizationId:guid}/{locationId:guid}/[controller]")]
    [Authorize(Policies.ForbidAnonymous, AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
    public class FilesController : ControllerBase
    {
        private readonly IRecordsManager recordsManager;


        public sealed record DocumentUploadInfo(Guid DocumentId, Uri ValetUrl);


        public FilesController(IRecordsManager recordsManager)
        {
            this.recordsManager = recordsManager;
        }


        [HttpGet("family/{familyId:guid}/{documentId:guid}")]
        public async Task<ActionResult<Uri>> GetReadValetUrl(Guid organizationId, Guid locationId, Guid familyId, Guid documentId)
        {
            var valetUrl = await recordsManager.GetFamilyDocumentReadValetUrl(organizationId, locationId, User,
                familyId, documentId);
            return Ok(valetUrl); //TODO: Don't return server errors if there were client errors!
        }

        [HttpPost("upload/family/{familyId:guid}/{documentId:guid}")]
        public async Task<ActionResult<DocumentUploadInfo>> GenerateUploadValetUrl(Guid organizationId, Guid locationId, Guid familyId, Guid documentId)
        {
            var valetUrl = await recordsManager.GenerateFamilyDocumentUploadValetUrl(organizationId, locationId, User,
                familyId, documentId);
            return Ok(new DocumentUploadInfo(documentId, valetUrl));
        }
    }
}

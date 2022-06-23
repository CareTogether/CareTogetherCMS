using CareTogether.Utilities.FileStore;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System;
using System.Threading.Tasks;

namespace CareTogether.Api.Controllers
{
    [Authorize]
    [ApiController]
    [Route("/api/{organizationId:guid}/{locationId:guid}/[controller]")]
    public class FilesController : ControllerBase
    {
        private readonly IFileStore fileStore;


        public sealed record DocumentUploadInfo(Guid DocumentId, Uri ValetUrl);


        public FilesController(IFileStore fileStore)
        {
            this.fileStore = fileStore;
        }


        [HttpGet("{documentId:guid}")]
        public async Task<ActionResult<Uri>> GetReadValetUrl(Guid organizationId, Guid locationId, Guid documentId)
        {
            if (User.HasPermission(Permission.ReadDocuments, organizationId, locationId))
            {
                //TODO: Authorize this via policy! Best to do this in the context of an associated referral or approval, instead of at this level.
                var valetUrl = await fileStore.GetValetReadUrlAsync(organizationId, locationId, documentId);
                return Ok(valetUrl);
            }
            else
                return BadRequest();
        }

        [HttpPost("upload")]
        public async Task<ActionResult<DocumentUploadInfo>> GenerateUploadValetUrl(Guid organizationId, Guid locationId)
        {
            if (User.HasPermission(Permission.UploadStandaloneDocuments, organizationId, locationId) ||
                User.HasPermission(Permission.EditApprovalRequirementCompletion, organizationId, locationId))
            {
                //TODO: Authorize this via policy! Best to do this in the context of an associated referral or approval, instead of at this level.
                var documentId = Guid.NewGuid();
                var valetUrl = await fileStore.GetValetCreateUrlAsync(organizationId, locationId, documentId);
                return Ok(new DocumentUploadInfo(documentId, valetUrl));
            }
            else
                return BadRequest();
        }
    }
}

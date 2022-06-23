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
            if (User.HasPermission(organizationId, locationId, Permission.ReadDocuments))
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
            if (User.HasPermission(organizationId, locationId, Permission.UploadStandaloneDocuments) ||
                User.HasPermission(organizationId, locationId, Permission.EditApprovalRequirementCompletion))
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

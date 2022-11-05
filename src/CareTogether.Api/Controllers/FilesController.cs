using CareTogether.Engines.Authorization;
using CareTogether.Utilities.FileStore;
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
        private readonly IFileStore fileStore;
        private readonly IAuthorizationEngine authorizationEngine;


        public sealed record DocumentUploadInfo(Guid DocumentId, Uri ValetUrl);


        public FilesController(IFileStore fileStore, IAuthorizationEngine authorizationEngine)
        {
            this.fileStore = fileStore;
            this.authorizationEngine = authorizationEngine;
        }


        [HttpGet("{documentId:guid}")]
        public async Task<ActionResult<Uri>> GetReadValetUrl(Guid organizationId, Guid locationId, Guid documentId)
        {
            var contextPermissions = await authorizationEngine.AuthorizeUserAccessAsync(
                organizationId, locationId, User, new GlobalAuthorizationContext()); //TODO: Authorize this in the context of the associated family.
            if (contextPermissions.Contains(Permission.ReadFamilyDocuments))
            {
                var valetUrl = await fileStore.GetValetReadUrlAsync(organizationId, locationId, documentId);
                return Ok(valetUrl);
            }
            else
                return BadRequest();
        }

        [HttpPost("upload")]
        public async Task<ActionResult<DocumentUploadInfo>> GenerateUploadValetUrl(Guid organizationId, Guid locationId)
        {
            var contextPermissions = await authorizationEngine.AuthorizeUserAccessAsync(
                organizationId, locationId, User, new GlobalAuthorizationContext()); //TODO: Authorize this in the context of the associated family.
            if (contextPermissions.Contains(Permission.UploadFamilyDocuments))
            {
                var documentId = Guid.NewGuid();
                var valetUrl = await fileStore.GetValetCreateUrlAsync(organizationId, locationId, documentId);
                return Ok(new DocumentUploadInfo(documentId, valetUrl));
            }
            else
                return BadRequest();
        }
    }
}

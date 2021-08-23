using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using System.Collections.Generic;
using System.Linq;

namespace CareTogether.Api.Controllers
{
    [Authorize]
    [ApiController]
    [Route("[controller]")]
    public class ClaimsController : ControllerBase
    {
        private readonly ILogger<ClaimsController> _logger;

        public ClaimsController(ILogger<ClaimsController> logger)
        {
            _logger = logger;
        }

        [HttpGet]
        public IEnumerable<string> Get()
        {
            _logger.LogInformation("User '{UserName}' was authenticated via '{AuthenticationType}'",
                User.Identity?.Name, User.Identity?.AuthenticationType);

            return User.Claims
                .Select(c => c.ToString())
                .ToList();
        }
    }
}

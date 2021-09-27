using CareTogether.Managers;
using CareTogether.Resources;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace CareTogether.Api.Controllers
{
    [Authorize]
    [ApiController]
    [Route("/api/{organizationId:guid}/{locationId:guid}/[controller]")]
    public class PeopleController : ControllerBase
    {
        private readonly IMembershipManager membershipManager;
        private readonly ILogger<PeopleController> logger;


        public PeopleController(IMembershipManager membershipManager, ILogger<PeopleController> logger)
        {
            this.membershipManager = membershipManager;
            this.logger = logger;
        }


        [HttpGet]
        public async Task<ActionResult<IEnumerable<Person>>> Get(Guid organizationId, Guid locationId)
        {
            logger.LogInformation("User '{UserName}' was authenticated via '{AuthenticationType}'",
                User.Identity?.Name, User.Identity?.AuthenticationType);

            var result = await membershipManager.QueryPeopleAsync(User, organizationId, locationId, "");
            return result;
        }

        public sealed record PersonDetails(Person Person, ContactInfo ContactInfo);

        [HttpGet("{personId:guid}")]
        public async Task<ActionResult<PersonDetails>> GetContactInfo(Guid organizationId, Guid locationId, Guid personId)
        {
            logger.LogInformation("User '{UserName}' was authenticated via '{AuthenticationType}'",
                User.Identity?.Name, User.Identity?.AuthenticationType);

            var people = await membershipManager.QueryPeopleAsync(User, organizationId, locationId, "");

            var person = people.SingleOrDefault(person => person.Id == personId);
            if (person != null)
            {
                var contactInfo = await membershipManager.GetContactInfoAsync(User, organizationId, locationId, personId);
                return Ok(new PersonDetails(person, contactInfo));
            }
            else
                return NotFound();
        }
    }
}

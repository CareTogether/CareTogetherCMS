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
            if (result.TryPickT0(out var people, out var error))
                return Ok(people);
            else
                return BadRequest(error);
        }

        public sealed record PersonDetails(Person Person, ContactInfo ContactInfo);

        [HttpGet("{personId:guid}")]
        public async Task<ActionResult<PersonDetails>> GetContactInfo(Guid organizationId, Guid locationId, Guid personId)
        {
            logger.LogInformation("User '{UserName}' was authenticated via '{AuthenticationType}'",
                User.Identity?.Name, User.Identity?.AuthenticationType);

            var result = await membershipManager.QueryPeopleAsync(User, organizationId, locationId, "");
            if (result.TryPickT0(out var people, out var error))
            {
                var person = people.SingleOrDefault(person => person.Id == personId);
                if (person != null)
                {
                    var contactInfoResult = await membershipManager.GetContactInfoAsync(User, organizationId, locationId, personId);
                    if (contactInfoResult.TryPickT0(out var contactInfo, out var contactInfoError))
                        return Ok(new PersonDetails(person, contactInfo));
                    else
                        return BadRequest(contactInfoError);
                }
                else
                    return NotFound();
            }
            else
                return BadRequest(error);
        }
    }
}

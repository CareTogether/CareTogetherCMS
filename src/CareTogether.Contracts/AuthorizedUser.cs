using CareTogether.Resources;
using System;
using System.Security.Claims;

namespace CareTogether
{
    public sealed record AuthorizedUser(ClaimsPrincipal Principal, Guid UserId, Person Person)
    {
        public Guid PersonId => Person.Id;
    }
}

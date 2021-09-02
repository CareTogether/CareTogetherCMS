using Microsoft.AspNetCore.Authentication;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;

namespace CareTogether.Api
{
    public class TenantUserClaimsTransformation : IClaimsTransformation
    {
        public Task<ClaimsPrincipal> TransformAsync(ClaimsPrincipal principal)
        {
            var claimsIdentity = new ClaimsIdentity();
            //TODO: Look up the user's organization ID and roles/permissions per location
            var claimType = "myNewClaim";
            if (!principal.HasClaim(claim => claim.Type == claimType))
            {
                claimsIdentity.AddClaim(new Claim(claimType, "myClaimValue"));
            }

            principal.AddIdentity(claimsIdentity);
            return Task.FromResult(principal);
        }
    }
}

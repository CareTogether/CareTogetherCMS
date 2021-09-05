using System;
using System.Collections.Generic;
using System.Security.Claims;

namespace CareTogether
{
    public static class Extensions
    {
        public static List<T> With<T>(this List<T> list, T valueToAdd)
        {
            list.Add(valueToAdd);
            return list;
        }

        public static List<T> With<T>(this List<T> list, T valueToUpdate, Predicate<T> predicate)
        {
            for (var i = 0; i < list.Count; i++)
                if (predicate(list[i]))
                    list[i] = valueToUpdate;
            return list;
        }


        public static Guid UserId(this ClaimsPrincipal principal)
        {
            try
            {
                return Guid.Parse(principal.FindFirst(Claims.UserId)!.Value);
            }
            catch (Exception ex)
            {
                throw new InvalidOperationException("The provided principal does not have a valid user ID claim.", ex);
            }
        }

        public static Guid PersonId(this ClaimsPrincipal principal)
        {
            try
            {
                return Guid.Parse(principal.FindFirst(Claims.PersonId)!.Value);
            }
            catch (Exception ex)
            {
                throw new InvalidOperationException("The provided principal does not have a valid person ID claim.", ex);
            }
        }

        public static void AddClaimOnlyOnce(this ClaimsPrincipal principal,
            ClaimsIdentity identity, string type, string value)
        {
            if (!principal.HasClaim(x => x.Type == type))
                identity.AddClaim(new Claim(type, value));
        }

        public static bool CanAccess(this ClaimsPrincipal user, Guid organizationId, Guid locationId) =>
            user.HasClaim(Claims.OrganizationId, organizationId.ToString()) &&
            user.HasClaim(Claims.LocationId, locationId.ToString());
    }
}

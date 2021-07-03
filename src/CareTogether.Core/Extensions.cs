using System;
using System.Collections.Generic;
using System.Security.Claims;

namespace CareTogether
{
    internal static class Extensions
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
                return Guid.Parse(principal.FindFirst(Claims.UserId).Value);
            }
            catch (Exception ex)
            {
                throw new InvalidOperationException("The provided principal does not have a valid user ID claim.", ex);
            }
        }

        public static bool IsInRole(this AuthorizedUser user, string role) =>
            user.Principal.IsInRole(role);

        public static bool CanAccess(this AuthorizedUser user, Guid organizationId, Guid locationId) =>
            user.Principal.HasClaim(Claims.OrganizationId, organizationId.ToString()) &&
            user.Principal.HasClaim(Claims.LocationId, locationId.ToString());
    }
}

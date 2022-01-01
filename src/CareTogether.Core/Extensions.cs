using System;
using System.Collections.Immutable;
using System.Linq;
using System.Security.Claims;

namespace CareTogether
{
    public static class Extensions
    {
        public static ImmutableList<T> With<T>(this ImmutableList<T> list, T valueToAdd)
        {
            return list.Add(valueToAdd);
        }

        public static ImmutableList<T> With<T>(this ImmutableList<T> list, T valueToUpdate, Predicate<T> predicate)
        {
            return list.Select(x => predicate(x) ? valueToUpdate : x).ToImmutableList();
        }

        public static ImmutableList<U> GetValueOrEmptyList<T, U>(this ImmutableDictionary<T, ImmutableList<U>> dictionary, T key)
            where T : notnull
        {
            return dictionary.TryGetValue(key, out var value)
                ? value
                : ImmutableList<U>.Empty;
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

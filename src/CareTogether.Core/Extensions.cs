using System;
using System.Collections.Generic;
using System.Collections.Immutable;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;

namespace CareTogether
{
    public static class Extensions
    {
        public static ImmutableList<T> With<T>(this ImmutableList<T> list, T valueToUpdate, Predicate<T> predicate)
        {
            return list.Select(x => predicate(x) ? valueToUpdate : x).ToImmutableList();
        }

        public static ImmutableList<T> UpdateSingle<T>(
            this ImmutableList<T> list,
            Func<T, bool> predicate,
            Func<T, T> selector
        )
        {
            T? oldValue = list.Single(predicate);
            T? newValue = selector(oldValue);
            return list.Replace(oldValue, newValue);
        }

        public static ImmutableList<T> UpdateAll<T>(
            this ImmutableList<T> list,
            Func<T, bool> predicate,
            Func<T, T> selector
        )
        {
            ImmutableList<T> result = list;
            foreach (T? match in list.Where(predicate))
            {
                T? newValue = selector(match);
                result = result.Replace(match, newValue);
            }

            return result;
        }

        public static ImmutableList<U> GetValueOrEmptyList<T, U>(
            this ImmutableDictionary<T, ImmutableList<U>> dictionary,
            T key
        )
            where T : notnull
        {
            return dictionary.TryGetValue(key, out ImmutableList<U>? value) ? value : ImmutableList<U>.Empty;
        }

        public static Guid UserId(this ClaimsPrincipal principal)
        {
            try
            {
                return Guid.Parse(principal.FindFirst(Claims.UserId)!.Value);
            }
            catch (Exception ex)
            {
                throw new InvalidOperationException("The principal does not have a valid user ID claim.", ex);
            }
        }

        public static Guid? UserIdOrDefault(this ClaimsPrincipal principal)
        {
            string? userId = principal.FindFirst(Claims.UserId)?.Value;
            return userId == null ? null : Guid.Parse(userId);
        }

        public static Guid? PersonId(this ClaimsPrincipal principal, Guid organizationId, Guid locationId)
        {
            ClaimsIdentity? locationIdentity = principal.LocationIdentity(organizationId, locationId);
            if (locationIdentity != null)
            {
                Claim? personIdClaim = locationIdentity.FindFirst(Claims.PersonId);
                if (personIdClaim != null)
                {
                    return Guid.Parse(personIdClaim.Value);
                }
            }

            return null;
        }

        public static void AddClaimOnlyOnce(
            this ClaimsPrincipal principal,
            ClaimsIdentity identity,
            string type,
            string value
        )
        {
            if (!principal.HasClaim(x => x.Type == type))
            {
                identity.AddClaim(new Claim(type, value));
            }
        }

        public static bool CanAccess(this ClaimsPrincipal principal, Guid organizationId, Guid locationId)
        {
            ClaimsIdentity? locationIdentity = principal.LocationIdentity(organizationId, locationId);

            return locationIdentity != null
                && locationIdentity.HasClaim(Claims.OrganizationId, organizationId.ToString())
                && locationIdentity.HasClaim(Claims.LocationId, locationId.ToString());
        }

        public static ClaimsIdentity? LocationIdentity(
            this ClaimsPrincipal principal,
            Guid organizationId,
            Guid locationId
        )
        {
            return principal.Identities.SingleOrDefault(identity =>
                identity.AuthenticationType == $"{organizationId}:{locationId}"
            );
        }

        public static async IAsyncEnumerable<U> SelectManyAsync<T, U>(
            this IEnumerable<T> values,
            Func<T, Task<IEnumerable<U>>> selector
        )
        {
            foreach (T? value in values)
            {
                IEnumerable<U> results = await selector(value);
                foreach (U? result in results)
                {
                    yield return result;
                }
            }
        }

        public static async IAsyncEnumerable<(T, U)> ZipSelectManyAsync<T, U>(
            this IEnumerable<T> values,
            Func<T, Task<ImmutableList<U>>> selector
        )
        {
            foreach (T? value in values)
            {
                ImmutableList<U> results = await selector(value);
                foreach (U? result in results)
                {
                    yield return (value, result);
                }
            }
        }

        public static async IAsyncEnumerable<U> SelectManyAsync<T, U>(
            this IEnumerable<T> values,
            Func<T, IAsyncEnumerable<U>> selector
        )
        {
            foreach (T? value in values)
            {
                await foreach (U? result in selector(value))
                {
                    yield return result;
                }
            }
        }

        public static IEnumerable<T> TakeWhilePlusOne<T>(this IEnumerable<T> source, Func<T, bool> predicate)
        {
            using (IEnumerator<T> enumerator = source.GetEnumerator())
            {
                while (enumerator.MoveNext())
                {
                    T? current = enumerator.Current;
                    if (predicate(current))
                    {
                        yield return current;
                    }
                    else
                    {
                        yield return current;
                        break;
                    }
                }
            }
        }
    }
}

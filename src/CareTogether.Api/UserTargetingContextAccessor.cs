using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.FeatureManagement.FeatureFilters;

namespace CareTogether.Api
{
    public sealed class UserTargetingContextAccessor : ITargetingContextAccessor
    {
        const string TargetingContextLookup = "TargetingContextAccessor.TargetingContext";

        readonly IHttpContextAccessor _HttpContextAccessor;

        public UserTargetingContextAccessor(IHttpContextAccessor httpContextAccessor)
        {
            _HttpContextAccessor = httpContextAccessor;
        }

        public ValueTask<TargetingContext> GetContextAsync()
        {
            // Use the HttpContext to cache the result of this lookup
            HttpContext? httpContext = _HttpContextAccessor.HttpContext!;
            if (httpContext.Items.TryGetValue(TargetingContextLookup, out object? value))
            {
                return ValueTask.FromResult((TargetingContext)value!);
            }

            TargetingContext? targetingContext =
                new()
                {
                    UserId = httpContext.User.UserId().ToString("D"),
                    Groups = new[]
                    {
                        httpContext.User.FindFirst(Claims.OrganizationId)!.Value,
                        httpContext.User.FindFirst(Claims.LocationId)!.Value,
                    },
                };

            httpContext.Items[TargetingContextLookup] = targetingContext;

            return ValueTask.FromResult(targetingContext);
        }
    }
}

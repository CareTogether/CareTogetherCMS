using Microsoft.AspNetCore.Http;
using Microsoft.FeatureManagement.FeatureFilters;
using System.Threading.Tasks;

namespace CareTogether.Api
{
    public sealed class UserTargetingContextAccessor : ITargetingContextAccessor
    {
        private const string TargetingContextLookup = "TargetingContextAccessor.TargetingContext";

        private readonly IHttpContextAccessor httpContextAccessor;


        public UserTargetingContextAccessor(IHttpContextAccessor httpContextAccessor)
        {
            this.httpContextAccessor = httpContextAccessor;
        }


        public ValueTask<TargetingContext> GetContextAsync()
        {
            // Use the HttpContext to cache the result of this lookup
            var httpContext = httpContextAccessor.HttpContext!;
            if (httpContext.Items.TryGetValue(TargetingContextLookup, out var value))
                return ValueTask.FromResult((TargetingContext)value!);
            
            var targetingContext = new TargetingContext
            {
                UserId = httpContext.User.UserId().ToString("D"),
                Groups = new[]
                {
                    httpContext.User.FindFirst(Claims.OrganizationId)!.Value,
                    httpContext.User.FindFirst(Claims.LocationId)!.Value
                }
            };

            httpContext.Items[TargetingContextLookup] = targetingContext;
            
            return ValueTask.FromResult(targetingContext);
        }
    }
}

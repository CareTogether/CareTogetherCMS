using System;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;

namespace CareTogether.Api
{
    /// <summary>
    /// Opts a single endpoint into Brotli/gzip response compression.
    /// </summary>
    /// <remarks>
    /// Compression is opt-in per endpoint, not global, because compressing a response that mixes
    /// a secret with attacker-influenced text can leak that secret through response sizes
    /// (BREACH). Only mark endpoints whose response bodies hold no secrets such as tokens.
    /// See https://github.com/CareTogether/CareTogetherCMS/issues/1199.
    /// </remarks>
    [AttributeUsage(AttributeTargets.Method, AllowMultiple = false)]
    public sealed class CompressResponseAttribute : Attribute { }

    public static class CompressResponseApplicationBuilderExtensions
    {
        /// <summary>
        /// Runs the response compression middleware only for endpoints marked with
        /// <see cref="CompressResponseAttribute"/>. Must be called after <c>UseRouting</c>,
        /// which selects the endpoint whose metadata is checked here.
        /// </summary>
        public static IApplicationBuilder UseResponseCompressionForMarkedEndpoints(
            this IApplicationBuilder app
        ) =>
            app.UseWhen(
                context =>
                    context.GetEndpoint()?.Metadata.GetMetadata<CompressResponseAttribute>()
                    != null,
                branch => branch.UseResponseCompression()
            );
    }
}

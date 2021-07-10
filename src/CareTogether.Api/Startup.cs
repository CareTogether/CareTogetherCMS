using Microsoft.AspNetCore.Authentication.JwtBearer;
using CareTogether.Managers;
using CareTogether.Resources;
using CareTogether.Utilities;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Identity.Web;
using Microsoft.IdentityModel.Logging;
using System;
using System.Collections.Generic;
using CareTogether.Engines;
using CareTogether.Abstractions;

namespace CareTogether.Api
{
    public class Startup
    {
        public IHostEnvironment HostEnvironment { get; }
        public IConfiguration Configuration { get; }

        public Startup(IHostEnvironment hostEnvironment, IConfiguration configuration)
        {
            HostEnvironment = hostEnvironment;
            Configuration = configuration;
        }


        public void ConfigureServices(IServiceCollection services)
        {
            services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
                .AddMicrosoftIdentityWebApi(Configuration.GetSection("AzureAdB2C"));

            // Data store services (use mock implementations for local development)
            IMultitenantEventLog<CommunityEvent> communityEventLog;
            IMultitenantEventLog<ContactCommandExecutedEvent> contactsEventLog;
            IMultitenantEventLog<GoalCommandExecutedEvent> goalsEventLog;
            IMultitenantEventLog<ReferralEvent> referralsEventLog;
            if (HostEnvironment.IsDevelopment())
            {
                communityEventLog = new MemoryMultitenantEventLog<CommunityEvent>();
                contactsEventLog = new MemoryMultitenantEventLog<ContactCommandExecutedEvent>();
                goalsEventLog = new MemoryMultitenantEventLog<GoalCommandExecutedEvent>();
                referralsEventLog = new MemoryMultitenantEventLog<ReferralEvent>();

#if DEBUG
                // Populate test data for debugging. The test data project dependency (and this call) is not included in release builds.
                CareTogether.TestData.TestDataProvider.PopulateTestDataAsync(
                    communityEventLog, contactsEventLog, goalsEventLog, referralsEventLog).Wait();
#endif
            }
            else
                throw new NotImplementedException("Durable event logs for system testing have not been implemented yet.");

            // Resource services
            var communitiesResource = new CommunitiesResource(communityEventLog);
            var profilesResource = new ProfilesResource(contactsEventLog, goalsEventLog);

            // Manager services
            services.AddSingleton<IMembershipManager>(new MembershipManager(communitiesResource, profilesResource));

            // Utility providers
            services.AddSingleton(new AuthorizationProvider(communitiesResource));

            // Use legacy Newtonsoft JSON to support JsonPolymorph & NSwag for polymorphic serialization
            services.AddControllers().AddNewtonsoftJson();

            services.AddAuthorization(options =>
            {
                // By default, all incoming requests will be authorized according to the default policy
                options.FallbackPolicy = options.DefaultPolicy;
            });

            services.AddOpenApiDocument(options =>
            {
                options.PostProcess = document =>
                {
                    document.Info.Version = "v1";
                    document.Info.Title = "CareTogether CMS API";
                    document.Info.Description = "API for the CareTogether Community Management System";
                    document.Info.Contact = new NSwag.OpenApiContact
                    {
                        Name = "CareTogether CMS Team",
                        Url = "https://caretogether.io/"
                    };
                    document.Info.License = new NSwag.OpenApiLicense
                    {
                        Name = "Use under AGPLv3",
                        Url = "https://www.gnu.org/licenses/agpl-3.0.en.html"
                    };
                };
            });
        }

        public void Configure(IApplicationBuilder app, IWebHostEnvironment env)
        {
            if (env.IsDevelopment())
            {
                IdentityModelEventSource.ShowPII = true;
                app.UseDeveloperExceptionPage();

                app.UseOpenApi();
                // ReDoc supports discriminators/polymorphism so we use that instead of Swagger UI.
                app.UseReDoc(config => { config.Path = "/redoc"; });

                app.UseCors(policy =>
                {
                    policy
                        .WithOrigins("http://localhost:3000")
                        .AllowAnyMethod()
                        .AllowAnyHeader()
                        .AllowCredentials();
                });
            }
            else
            {
                app.UseExceptionHandler("/Error");
                app.UseHsts();
            }

            app.UseHttpsRedirection();

            app.UseRouting();
            app.UseAuthentication();
            app.UseAuthorization();

            app.UseEndpoints(endpoints =>
            {
                endpoints.MapControllers();
            });
        }
    }
}

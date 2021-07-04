//using Microsoft.AspNetCore.Authentication.JwtBearer;
using CareTogether.Managers;
using CareTogether.Resources;
using CareTogether.Utilities;
using Microsoft.AspNetCore.Authentication.OpenIdConnect;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Identity.Web;
using Microsoft.IdentityModel.Logging;
using System;
using System.Collections.Generic;

namespace CareTogether.Api
{
    public class Startup
    {
        public IConfiguration Configuration { get; }

        public Startup(IConfiguration configuration)
        {
            Configuration = configuration;
        }


        public void ConfigureServices(IServiceCollection services)
        {
            services.AddAuthentication(OpenIdConnectDefaults.AuthenticationScheme)
            //services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
                .AddMicrosoftIdentityWebApp(Configuration.GetSection("AzureAdB2C"));
                //.AddMicrosoftIdentityWebApi(Configuration.GetSection("AzureAdB2C"));

            // Data store services
            var communityEventLog = new MemoryMultitenantEventLog<CommunityEvent>();
            var contactStore = new MemoryMultitenantKeyValueStore<ContactInfo>();
            var goalsStore = new MemoryMultitenantKeyValueStore<Dictionary<Guid, Goal>>();

            // Initialize static test data for local development
            //TODO: Configure this based on the environment
            TestDataProvider.PopulateTestDataAsync(communityEventLog, contactStore, goalsStore).Wait();

            // Resource services
            var communitiesResource = new CommunitiesResource(communityEventLog);
            var profilesResource = new ProfilesResource(contactStore, goalsStore);

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

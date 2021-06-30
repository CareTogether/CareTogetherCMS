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

            services.AddControllers();

            services.AddAuthorization(options =>
            {
                // By default, all incoming requests will be authorized according to the default policy
                options.FallbackPolicy = options.DefaultPolicy;
            });
        }

        public void Configure(IApplicationBuilder app, IWebHostEnvironment env)
        {
            if (env.IsDevelopment())
            {
                IdentityModelEventSource.ShowPII = true;
                app.UseDeveloperExceptionPage();
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

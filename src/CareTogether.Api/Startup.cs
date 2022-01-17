using Azure.Storage.Blobs;
using CareTogether.Engines;
using CareTogether.Managers;
using CareTogether.Resources;
using CareTogether.Resources.Models;
using CareTogether.Resources.Storage;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.FeatureManagement;
using Microsoft.FeatureManagement.FeatureFilters;
using Microsoft.Identity.Web;
using Microsoft.IdentityModel.Logging;

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
            services.AddFeatureManagement()
                .AddFeatureFilter<TargetingFilter>();

            services.AddSingleton<ITargetingContextAccessor, TargetingContextAccessor>();

            services.AddApplicationInsightsTelemetry();

            services.AddHealthChecks();

            services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
                .AddMicrosoftIdentityWebApi(Configuration.GetSection("AzureAdB2C"));
            
            services.AddTransient<IClaimsTransformation, TenantUserClaimsTransformation>();

            // Shared blob storage client configured to authenticate according to the environment
            var blobServiceClient = new BlobServiceClient(Configuration["Persistence:BlobStorageConnectionString"]);

            // Data store services
            var directoryEventLog = new AppendBlobMultitenantEventLog<DirectoryEvent>(blobServiceClient, "DirectoryEventLog");
            var goalsEventLog = new AppendBlobMultitenantEventLog<GoalCommandExecutedEvent>(blobServiceClient, "GoalsEventLog");
            var referralsEventLog = new AppendBlobMultitenantEventLog<ReferralEvent>(blobServiceClient, "ReferralsEventLog");
            var approvalsEventLog = new AppendBlobMultitenantEventLog<ApprovalEvent>(blobServiceClient, "ApprovalsEventLog");
            var notesEventLog = new AppendBlobMultitenantEventLog<NotesEvent>(blobServiceClient, "NotesEventLog");
            var draftNotesStore = new JsonBlobObjectStore<string?>(blobServiceClient, "DraftNotes");
            var configurationStore = new JsonBlobObjectStore<OrganizationConfiguration>(blobServiceClient, "Configuration");
            var policiesStore = new JsonBlobObjectStore<EffectiveLocationPolicy>(blobServiceClient, "LocationPolicies");
            var userTenantAccessStore = new JsonBlobObjectStore<UserTenantAccessSummary>(blobServiceClient, "UserTenantAccess");

            if (HostEnvironment.EnvironmentName != "OpenApiGen")
            {
                // Reset and populate data in the test tenant for debugging. Note that this will not affect other tenants.
                TestData.TestStorageHelper.ResetTestTenantData(blobServiceClient);
                TestData.TestDataProvider.PopulateTestDataAsync(
                    directoryEventLog,
                    goalsEventLog,
                    referralsEventLog,
                    approvalsEventLog,
                    notesEventLog,
                    draftNotesStore,
                    configurationStore,
                    policiesStore,
                    userTenantAccessStore).Wait();
            }

            // Resource services
            var approvalsResource = new ApprovalsResource(approvalsEventLog);
            var directoryResource = new DirectoryResource(directoryEventLog);
            var goalsResource = new GoalsResource(goalsEventLog);
            var policiesResource = new PoliciesResource(configurationStore, policiesStore);
            var accountsResource = new AccountsResource(userTenantAccessStore);
            var referralsResource = new ReferralsResource(referralsEventLog);
            var notesResource = new NotesResource(notesEventLog, draftNotesStore);

            //TODO: If we want to be strict about conventions, this should have a manager intermediary for authz.
            services.AddSingleton<IPoliciesResource>(policiesResource);
            services.AddSingleton<IAccountsResource>(accountsResource);

            // Engine services
            var authorizationEngine = new AuthorizationEngine(policiesResource);
            var policyEvaluationEngine = new PolicyEvaluationEngine(policiesResource);

            // Shared family info formatting logic used by all manager services
            var combinedFamilyInfoFormatter = new CombinedFamilyInfoFormatter(policyEvaluationEngine, authorizationEngine,
                approvalsResource, referralsResource, directoryResource, notesResource);

            // Manager services
            services.AddSingleton<IDirectoryManager>(new DirectoryManager(authorizationEngine, directoryResource,
                approvalsResource, referralsResource, notesResource, combinedFamilyInfoFormatter));
            services.AddSingleton<IReferralManager>(new ReferralManager(authorizationEngine, referralsResource,
                combinedFamilyInfoFormatter));
            services.AddSingleton<IApprovalManager>(new ApprovalManager(authorizationEngine, approvalsResource,
                combinedFamilyInfoFormatter));

            // Utility providers
            services.AddSingleton<IFileStore>(new BlobFileStore(blobServiceClient, "Uploads"));

            // Use legacy Newtonsoft JSON to support JsonPolymorph & NSwag for polymorphic serialization
            services.AddControllers().AddNewtonsoftJson();

            services.AddAuthorization(options =>
            {
                // Require all users to be authenticated and have access to the specified tenant -
                // the organization ID and location ID (if specified).
                options.FallbackPolicy = new AuthorizationPolicyBuilder()
                    .RequireAuthenticatedUser()
                    .RequireAssertion(context =>
                        context.Resource is HttpContext httpContext &&
                        (!httpContext.Request.RouteValues.TryGetValue("organizationId", out var orgId) ||
                            context.User.HasClaim("organizationId", (string)orgId!)) &&
                        (!httpContext.Request.RouteValues.TryGetValue("locationId", out var locId) ||
                            context.User.HasClaim("locationId", (string)locId!)))
                    .Build();
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
            }

            app.UseRouting();
            app.UseAuthentication();
            app.UseAuthorization();

            app.UseEndpoints(endpoints =>
            {
                endpoints.MapHealthChecks("/health").AllowAnonymous();

                endpoints.MapControllers();
            });
        }
    }
}

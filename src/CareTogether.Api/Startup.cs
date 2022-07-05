using Azure.Storage.Blobs;
using CareTogether.Engines.Authorization;
using CareTogether.Engines.PolicyEvaluation;
using CareTogether.Utilities.EventLog;
using CareTogether.Utilities.FileStore;
using CareTogether.Utilities.ObjectStore;
using CareTogether.Managers;
using CareTogether.Managers.Approval;
using CareTogether.Managers.Directory;
using CareTogether.Managers.Referrals;
using CareTogether.Resources;
using CareTogether.Resources.Accounts;
using CareTogether.Resources.Approvals;
using CareTogether.Resources.Directory;
using CareTogether.Resources.Goals;
using CareTogether.Resources.Notes;
using CareTogether.Resources.Policies;
using CareTogether.Resources.Referrals;
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
using CareTogether.Utilities.Telephony;

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
            services.AddApplicationInsightsTelemetry();

            services.AddSingleton<ITargetingContextAccessor, UserTargetingContextAccessor>();
            services.AddFeatureManagement()
                .AddFeatureFilter<TargetingFilter>();

            services.AddHealthChecks();

            services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
                .AddMicrosoftIdentityWebApi(Configuration.GetSection("AzureAdB2C"));

            services.AddTransient<IClaimsTransformation, TenantUserClaimsTransformation>();

            // Shared blob storage clients configured to authenticate according to the environment -
            // one for mutable storage and one for immutable storage.
            // Note that this only has an effect when running in Azure; the local (Azurite) emulated storage is always mutable.
            var immutableBlobServiceClient = new BlobServiceClient(Configuration["Persistence:ImmutableBlobStorageConnectionString"]);
            var mutableBlobServiceClient = new BlobServiceClient(Configuration["Persistence:MutableBlobStorageConnectionString"]);

            // Data store services
            var directoryEventLog = new AppendBlobEventLog<DirectoryEvent>(immutableBlobServiceClient, "DirectoryEventLog");
            var goalsEventLog = new AppendBlobEventLog<GoalCommandExecutedEvent>(immutableBlobServiceClient, "GoalsEventLog");
            var referralsEventLog = new AppendBlobEventLog<ReferralEvent>(immutableBlobServiceClient, "ReferralsEventLog");
            var approvalsEventLog = new AppendBlobEventLog<ApprovalEvent>(immutableBlobServiceClient, "ApprovalsEventLog");
            var notesEventLog = new AppendBlobEventLog<NotesEvent>(immutableBlobServiceClient, "NotesEventLog");
            var draftNotesStore = new JsonBlobObjectStore<string?>(mutableBlobServiceClient, "DraftNotes");
            var configurationStore = new JsonBlobObjectStore<OrganizationConfiguration>(immutableBlobServiceClient, "Configuration");
            var policiesStore = new JsonBlobObjectStore<EffectiveLocationPolicy>(immutableBlobServiceClient, "LocationPolicies");
            var userTenantAccessStore = new JsonBlobObjectStore<UserTenantAccessSummary>(immutableBlobServiceClient, "UserTenantAccess");

            if (Configuration["OpenApiGen"] != "true")
            {
                // Reset and populate data in the test tenant for debugging. Note that this will not affect other tenants.
                TestData.TestStorageHelper.ResetTestTenantData(immutableBlobServiceClient);
                TestData.TestStorageHelper.ResetTestTenantData(mutableBlobServiceClient);
                TestData.TestDataProvider.PopulateTestDataAsync(
                    directoryEventLog,
                    goalsEventLog,
                    referralsEventLog,
                    approvalsEventLog,
                    notesEventLog,
                    draftNotesStore,
                    configurationStore,
                    policiesStore,
                    userTenantAccessStore,
                    Configuration["TestData:SourceSmsPhoneNumber"]).Wait();
            }

            // Other utility services
            var telephony = new PlivoTelephony(
                authId: Configuration["Telephony:Plivo:AuthId"],
                authToken: Configuration["Telephony:Plivo:AuthToken"]);

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
            var authorizationEngine = new AuthorizationEngine(policiesResource, directoryResource, referralsResource);
            var policyEvaluationEngine = new PolicyEvaluationEngine(policiesResource);

            // Shared family info formatting logic used by all manager services
            var combinedFamilyInfoFormatter = new CombinedFamilyInfoFormatter(policyEvaluationEngine, authorizationEngine,
                approvalsResource, referralsResource, directoryResource, notesResource, policiesResource);

            // Manager services
            services.AddSingleton<IDirectoryManager>(new DirectoryManager(authorizationEngine, directoryResource,
                approvalsResource, referralsResource, notesResource, policiesResource, telephony,
                combinedFamilyInfoFormatter));
            services.AddSingleton<IReferralsManager>(new ReferralsManager(authorizationEngine, referralsResource,
                combinedFamilyInfoFormatter));
            services.AddSingleton<IApprovalManager>(new ApprovalManager(authorizationEngine, approvalsResource,
                combinedFamilyInfoFormatter));

            // Utility providers
            services.AddSingleton<IFileStore>(new BlobFileStore(immutableBlobServiceClient, "Uploads"));

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
                // Enable more detailed error response info for the time being.
                app.UseDeveloperExceptionPage();
                //app.UseExceptionHandler("/Error");
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

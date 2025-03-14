using Azure.Storage.Blobs;
using CareTogether.Api.OData;
using CareTogether.Engines.Authorization;
using CareTogether.Engines.PolicyEvaluation;
using CareTogether.Managers;
using CareTogether.Managers.Communications;
using CareTogether.Managers.Membership;
using CareTogether.Managers.Records;
using CareTogether.Resources.Accounts;
using CareTogether.Resources.Approvals;
using CareTogether.Resources.Communities;
using CareTogether.Resources.Directory;
using CareTogether.Resources.Goals;
using CareTogether.Resources.Notes;
using CareTogether.Resources.Policies;
using CareTogether.Resources.Referrals;
using CareTogether.Utilities.EventLog;
using CareTogether.Utilities.FileStore;
using CareTogether.Utilities.Identity;
using CareTogether.Utilities.ObjectStore;
using CareTogether.Utilities.Telephony;
using idunno.Authentication.Basic;
using LazyCache;
using LazyCache.Providers;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.OData;
using Microsoft.AspNetCore.OData.NewtonsoftJson;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Options;
using Microsoft.FeatureManagement;
using Microsoft.FeatureManagement.FeatureFilters;
using Microsoft.Identity.Web;
using Microsoft.IdentityModel.Logging;
using System;
using System.Security.Claims;

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

            services.AddMemoryCache();

            // Registers IAppCache for thread-safe caching of expensive calculations
            services.AddSingleton<IAppCache>(provider =>
            {
                //HACK: This works around a compatibility issue with NSwag's command-line generation process
                //      (see https://github.com/alastairtree/LazyCache/issues/186).
                //      The default LazyCache service registration (services.AddLazyCache()) assumes
                //      that no IMemoryCache already exists in the dependency injection container, but
                //      NSwag injects an IMemoryCache instance of its own when generating the OpenAPI model.
                //      If not for this conflict, we could just call services.AddLazyCache() and be done.
                var memoryCache = new MemoryCache(Options.Create(new MemoryCacheOptions()));
                var memoryCacheProvider = new MemoryCacheProvider(memoryCache);
                return new CachingService(memoryCacheProvider);
            });

            // Load shared application-specific configuration sections for use via dependency injection
            services.Configure<MembershipOptions>(Configuration.GetSection(MembershipOptions.Membership));

            // Configure the shared blob storage clients to authenticate according to the environment -
            // one for mutable storage and one for immutable storage.
            // Note that this only has an effect when running in Azure; the local (Azurite) emulated storage is always mutable.
            // Also note that we lock the blob storage service (API) version because Azurite occasionally lags behind in
            // support for the newest versions. This service version should be reviewed at least once a year to keep it current.
            var blobClientOptions = new BlobClientOptions(BlobClientOptions.ServiceVersion.V2021_10_04);
            var immutableBlobServiceClient = new BlobServiceClient(
                Configuration["Persistence:ImmutableBlobStorageConnectionString"], blobClientOptions);
            var mutableBlobServiceClient = new BlobServiceClient(
                Configuration["Persistence:MutableBlobStorageConnectionString"], blobClientOptions);

            // Utility providers
            var uploadsStore = new BlobFileStore(immutableBlobServiceClient, "Uploads");

            // Data store services
            var defaultMemoryCacheOptions = Options.Create(new MemoryCacheOptions());
            var accountsEventLog = new AppendBlobEventLog<AccountEvent>(immutableBlobServiceClient, "AccountsEventLog");
            var personAccessEventLog = new AppendBlobEventLog<PersonAccessEvent>(immutableBlobServiceClient, "PersonAccessEventLog");
            var directoryEventLog = new AppendBlobEventLog<DirectoryEvent>(immutableBlobServiceClient, "DirectoryEventLog");
            var goalsEventLog = new AppendBlobEventLog<GoalCommandExecutedEvent>(immutableBlobServiceClient, "GoalsEventLog");
            var referralsEventLog = new AppendBlobEventLog<ReferralEvent>(immutableBlobServiceClient, "ReferralsEventLog");
            var approvalsEventLog = new AppendBlobEventLog<ApprovalEvent>(immutableBlobServiceClient, "ApprovalsEventLog");
            var notesEventLog = new AppendBlobEventLog<NotesEvent>(immutableBlobServiceClient, "NotesEventLog");
            var communitiesEventLog = new AppendBlobEventLog<CommunityCommandExecutedEvent>(immutableBlobServiceClient, "CommunitiesEventLog");

            var draftNotesStore = new JsonBlobObjectStore<string?>(mutableBlobServiceClient, "DraftNotes",
                new MemoryCache(defaultMemoryCacheOptions), TimeSpan.FromMinutes(30));
            var configurationStore = new JsonBlobObjectStore<OrganizationConfiguration>(immutableBlobServiceClient, "Configuration",
                new MemoryCache(defaultMemoryCacheOptions), TimeSpan.FromMinutes(1));
            var policiesStore = new JsonBlobObjectStore<EffectiveLocationPolicy>(immutableBlobServiceClient, "LocationPolicies",
                new MemoryCache(defaultMemoryCacheOptions), TimeSpan.FromMinutes(1));
            var organizationSecretsStore = new JsonBlobObjectStore<OrganizationSecrets>(immutableBlobServiceClient, "Configuration",
                new MemoryCache(defaultMemoryCacheOptions), TimeSpan.FromMinutes(1));

            if (Configuration["OpenApiGen"] != "true")
            {
                // Reset and populate data in the test tenant for debugging. Note that this will not affect other tenants.
                TestData.TestStorageHelper.ResetTestTenantData(immutableBlobServiceClient);
                TestData.TestStorageHelper.ResetTestTenantData(mutableBlobServiceClient);
                TestData.TestDataProvider.PopulateTestDataAsync(
                    accountsEventLog,
                    personAccessEventLog,
                    directoryEventLog,
                    goalsEventLog,
                    referralsEventLog,
                    approvalsEventLog,
                    notesEventLog,
                    communitiesEventLog,
                    draftNotesStore,
                    configurationStore,
                    policiesStore,
                    organizationSecretsStore,
                    Configuration["TestData:SourceSmsPhoneNumber"]).Wait();
            }

            // Other utility services
            var telephony = new PlivoTelephony(
                authId: Configuration["Telephony:Plivo:AuthId"]!,
                authToken: Configuration["Telephony:Plivo:AuthToken"]!);
            var identityProvider = new AzureAdB2cIdentityProvider(
                Configuration["AzureAdB2C:TenantId"]!,
                Configuration["AzureAdB2C:ClientId"]!,
                Configuration["AzureAdB2C:ClientSecret"] ?? "");

            // Resource services
            var approvalsResource = new ApprovalsResource(approvalsEventLog);
            var directoryResource = new DirectoryResource(directoryEventLog, uploadsStore);
            var goalsResource = new GoalsResource(goalsEventLog);
            var policiesResource = new PoliciesResource(configurationStore, policiesStore, organizationSecretsStore, personAccessEventLog);
            var accountsResource = new AccountsResource(accountsEventLog, personAccessEventLog);
            var referralsResource = new ReferralsResource(referralsEventLog);
            var notesResource = new NotesResource(notesEventLog, draftNotesStore);
            var communitiesResource = new CommunitiesResource(communitiesEventLog, uploadsStore);

            //TODO: If we want to be strict about conventions, this should have a manager intermediary for authz.
            services.AddSingleton<IPoliciesResource>(policiesResource);
            services.AddSingleton<IAccountsResource>(accountsResource);

            // Engine services
            var authorizationEngine = new AuthorizationEngine(policiesResource, directoryResource,
                referralsResource, approvalsResource, communitiesResource, accountsResource);
            services.AddSingleton<IAuthorizationEngine>(authorizationEngine); //TODO: Temporary workaround for UsersController
            var policyEvaluationEngine = new PolicyEvaluationEngine(policiesResource);

            // Shared family info formatting logic used by all manager services
            var combinedFamilyInfoFormatter = new CombinedFamilyInfoFormatter(policyEvaluationEngine, authorizationEngine,
                approvalsResource, referralsResource, directoryResource, notesResource, policiesResource, accountsResource);

            // Manager services
            services.AddSingleton<ICommunicationsManager>(new CommunicationsManager(authorizationEngine, directoryResource,
                policiesResource, telephony));
            services.AddSingleton<IRecordsManager>(new RecordsManager(authorizationEngine, directoryResource,
                approvalsResource, referralsResource, notesResource, communitiesResource, combinedFamilyInfoFormatter));
            services.AddSingleton<IMembershipManager>(new MembershipManager(accountsResource, authorizationEngine,
                directoryResource, policiesResource, combinedFamilyInfoFormatter, identityProvider));

            services.AddAuthentication("Basic")
                .AddBasic("Basic", options =>
                {
                    options.AllowInsecureProtocol = true; // Azure Front Door handles SSL termination.
                    options.Realm = "CareTogether OData Feed";
                    options.Events = new BasicAuthenticationEvents
                    {
                        OnValidateCredentials = async context =>
                        {
                            if (context.Username == "Research" && context.Password == Configuration["Research:ApiKey"] &&
                                Guid.TryParse(Configuration["Research:OrganizationId"], out var researchOrganizationId))
                            {
                                context.Principal = new ClaimsPrincipal(new ClaimsIdentity(
                                [
                                    new Claim(Claims.OrganizationId, Configuration["Research:OrganizationId"]!),
                                    new Claim(Claims.Researcher, true.ToString())
                                ], "API Key"));
                                context.Success();
                                return;
                            }

                            if (!Guid.TryParse(context.Username, out var assertedOrganizationId))
                            {
                                context.Fail("The username must be an organization ID in GUID format.");
                                return;
                            }

                            try
                            {
                                // Note that it may be possible to leak valid organization IDs here via a timing attack.
                                var organizationSecrets = await policiesResource.GetOrganizationSecretsAsync(assertedOrganizationId);
                                if (organizationSecrets.ApiKey?.Length >= 32 && context.Password == organizationSecrets.ApiKey)
                                {
                                    context.Principal = new ClaimsPrincipal(new ClaimsIdentity(new Claim[]
                                    {
                                        new Claim(Claims.OrganizationId, context.Username)
                                    }, "API Key"));
                                    context.Success();
                                    return;
                                }
                            }
                            catch { }

                            context.Fail("The API key is invalid.");
                            return;
                        }
                    };
                })
                .AddMicrosoftIdentityWebApi(Configuration.GetSection("AzureAdB2C"));

            services.AddTransient<IClaimsTransformation, TenantUserClaimsTransformation>();

            // Use legacy Newtonsoft JSON to support JsonPolymorph & NSwag for polymorphic serialization.
            // Since we are using OData, .AddODataNewtonsoftJson() replaces .AddNewtonsoftJson().
            services
                .AddControllers()
                .AddOData(options =>
                {
                    options.EnableQueryFeatures();
                    options.AddRouteComponents("api/odata/live", ODataModelProvider.GetLiveEdmModel());
                })
                .AddODataNewtonsoftJson();

            services.AddAuthorization(options =>
            {
                options.AddPolicy(Policies.ForbidAnonymous, new AuthorizationPolicyBuilder()
                    .RequireAuthenticatedUser()
                    .Build());

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

                app.UseODataRouteDebug();

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
                endpoints.MapControllers();

                // This root endpoint is used by the Azure App Service Always On mechanism described here:
                // https://learn.microsoft.com/en-us/azure/app-service/configure-common?tabs=portal#configure-general-settings
                endpoints.MapHealthChecks("/").AllowAnonymous();

                // Accommodating the Azure App Service liveness check mechanism described here:
                // https://learn.microsoft.com/en-us/azure/app-service/configure-language-dotnetcore?pivots=platform-linux#robots933456-in-logs
                endpoints.MapHealthChecks("/robots933456.txt").AllowAnonymous();
            });
        }
    }
}

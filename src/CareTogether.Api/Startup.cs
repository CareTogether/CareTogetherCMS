using System;
using System.Security.Claims;
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
using CareTogether.TestData;
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
using NSwag;

namespace CareTogether.Api
{
    public class Startup
    {
        public Startup(IHostEnvironment hostEnvironment, IConfiguration configuration)
        {
            HostEnvironment = hostEnvironment;
            Configuration = configuration;
        }

        public IHostEnvironment HostEnvironment { get; }
        public IConfiguration Configuration { get; }

        public void ConfigureServices(IServiceCollection services)
        {
            services.AddApplicationInsightsTelemetry();

            services.AddSingleton<ITargetingContextAccessor, UserTargetingContextAccessor>();
            services.AddFeatureManagement().AddFeatureFilter<TargetingFilter>();

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
                MemoryCache memoryCache = new(Options.Create(new MemoryCacheOptions()));
                MemoryCacheProvider memoryCacheProvider = new(memoryCache);
                return new CachingService(memoryCacheProvider);
            });

            // Load shared application-specific configuration sections for use via dependency injection
            services.Configure<MembershipOptions>(Configuration.GetSection(MembershipOptions.Membership));

            // Configure the shared blob storage clients to authenticate according to the environment -
            // one for mutable storage and one for immutable storage.
            // Note that this only has an effect when running in Azure; the local (Azurite) emulated storage is always mutable.
            // Also note that we lock the blob storage service (API) version because Azurite occasionally lags behind in
            // support for the newest versions. This service version should be reviewed at least once a year to keep it current.
            BlobClientOptions blobClientOptions = new(BlobClientOptions.ServiceVersion.V2021_10_04);
            BlobServiceClient immutableBlobServiceClient =
                new(Configuration["Persistence:ImmutableBlobStorageConnectionString"], blobClientOptions);
            BlobServiceClient mutableBlobServiceClient =
                new(Configuration["Persistence:MutableBlobStorageConnectionString"], blobClientOptions);

            // Utility providers
            BlobFileStore uploadsStore = new(immutableBlobServiceClient, "Uploads");

            // Data store services
            IOptions<MemoryCacheOptions> defaultMemoryCacheOptions = Options.Create(new MemoryCacheOptions());
            AppendBlobEventLog<AccountEvent> accountsEventLog = new(immutableBlobServiceClient, "AccountsEventLog");
            AppendBlobEventLog<PersonAccessEvent> personAccessEventLog =
                new(immutableBlobServiceClient, "PersonAccessEventLog");
            AppendBlobEventLog<DirectoryEvent> directoryEventLog = new(immutableBlobServiceClient, "DirectoryEventLog");
            AppendBlobEventLog<GoalCommandExecutedEvent> goalsEventLog =
                new(immutableBlobServiceClient, "GoalsEventLog");
            AppendBlobEventLog<ReferralEvent> referralsEventLog = new(immutableBlobServiceClient, "ReferralsEventLog");
            AppendBlobEventLog<ApprovalEvent> approvalsEventLog = new(immutableBlobServiceClient, "ApprovalsEventLog");
            AppendBlobEventLog<NotesEvent> notesEventLog = new(immutableBlobServiceClient, "NotesEventLog");
            AppendBlobEventLog<CommunityCommandExecutedEvent> communitiesEventLog =
                new(immutableBlobServiceClient, "CommunitiesEventLog");

            JsonBlobObjectStore<string> draftNotesStore =
                new(
                    mutableBlobServiceClient,
                    "DraftNotes",
                    new MemoryCache(defaultMemoryCacheOptions),
                    TimeSpan.FromMinutes(30)
                );
            JsonBlobObjectStore<OrganizationConfiguration> configurationStore =
                new(
                    immutableBlobServiceClient,
                    "Configuration",
                    new MemoryCache(defaultMemoryCacheOptions),
                    TimeSpan.FromMinutes(1)
                );
            JsonBlobObjectStore<EffectiveLocationPolicy> policiesStore =
                new(
                    immutableBlobServiceClient,
                    "LocationPolicies",
                    new MemoryCache(defaultMemoryCacheOptions),
                    TimeSpan.FromMinutes(1)
                );
            JsonBlobObjectStore<OrganizationSecrets> organizationSecretsStore =
                new(
                    immutableBlobServiceClient,
                    "Configuration",
                    new MemoryCache(defaultMemoryCacheOptions),
                    TimeSpan.FromMinutes(1)
                );

            if (Configuration["OpenApiGen"] != "true")
            {
                // Reset and populate data in the test tenant for debugging. Note that this will not affect other tenants.
                TestStorageHelper.ResetTestTenantData(immutableBlobServiceClient);
                TestStorageHelper.ResetTestTenantData(mutableBlobServiceClient);
                TestDataProvider
                    .PopulateTestDataAsync(
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
                        Configuration["TestData:SourceSmsPhoneNumber"]
                    )
                    .Wait();
            }

            // Other utility services
            PlivoTelephony telephony =
                new(Configuration["Telephony:Plivo:AuthId"]!, Configuration["Telephony:Plivo:AuthToken"]!);
            AzureAdB2cIdentityProvider identityProvider =
                new(
                    Configuration["AzureAdB2C:TenantId"]!,
                    Configuration["AzureAdB2C:ClientId"]!,
                    Configuration["AzureAdB2C:ClientSecret"] ?? ""
                );

            // Resource services
            ApprovalsResource approvalsResource = new(approvalsEventLog);
            DirectoryResource directoryResource = new(directoryEventLog, uploadsStore);
            GoalsResource goalsResource = new(goalsEventLog);
            PoliciesResource policiesResource = new(configurationStore, policiesStore, organizationSecretsStore);
            AccountsResource accountsResource = new(accountsEventLog, personAccessEventLog);
            ReferralsResource referralsResource = new(referralsEventLog);
            NotesResource notesResource = new(notesEventLog, draftNotesStore);
            CommunitiesResource communitiesResource = new(communitiesEventLog, uploadsStore);

            //TODO: If we want to be strict about conventions, this should have a manager intermediary for authz.
            services.AddSingleton<IPoliciesResource>(policiesResource);
            services.AddSingleton<IAccountsResource>(accountsResource);

            // Engine services
            AuthorizationEngine authorizationEngine =
                new(
                    policiesResource,
                    directoryResource,
                    referralsResource,
                    approvalsResource,
                    communitiesResource,
                    accountsResource
                );
            services.AddSingleton<IAuthorizationEngine>(authorizationEngine); //TODO: Temporary workaround for UsersController
            PolicyEvaluationEngine policyEvaluationEngine = new(policiesResource);

            // Shared family info formatting logic used by all manager services
            CombinedFamilyInfoFormatter combinedFamilyInfoFormatter =
                new(
                    policyEvaluationEngine,
                    authorizationEngine,
                    approvalsResource,
                    referralsResource,
                    directoryResource,
                    notesResource,
                    policiesResource,
                    accountsResource
                );

            // Manager services
            services.AddSingleton<ICommunicationsManager>(
                new CommunicationsManager(authorizationEngine, directoryResource, policiesResource, telephony)
            );
            services.AddSingleton<IRecordsManager>(
                new RecordsManager(
                    authorizationEngine,
                    directoryResource,
                    approvalsResource,
                    referralsResource,
                    notesResource,
                    communitiesResource,
                    combinedFamilyInfoFormatter
                )
            );
            services.AddSingleton<IMembershipManager>(
                new MembershipManager(
                    accountsResource,
                    authorizationEngine,
                    directoryResource,
                    policiesResource,
                    combinedFamilyInfoFormatter,
                    identityProvider
                )
            );

            services
                .AddAuthentication("Basic")
                .AddBasic(
                    "Basic",
                    options =>
                    {
                        options.AllowInsecureProtocol = true; // Azure Front Door handles SSL termination.
                        options.Realm = "CareTogether OData Feed";
                        options.Events = new BasicAuthenticationEvents
                        {
                            OnValidateCredentials = async context =>
                            {
                                if (
                                    context.Username == "Research"
                                    && context.Password == Configuration["Research:ApiKey"]
                                    && Guid.TryParse(
                                        Configuration["Research:OrganizationId"],
                                        out Guid researchOrganizationId
                                    )
                                )
                                {
                                    context.Principal = new ClaimsPrincipal(
                                        new ClaimsIdentity(
                                            [
                                                new Claim(
                                                    Claims.OrganizationId,
                                                    Configuration["Research:OrganizationId"]!
                                                ),
                                                new Claim(Claims.Researcher, true.ToString()),
                                            ],
                                            "API Key"
                                        )
                                    );
                                    context.Success();
                                    return;
                                }

                                if (!Guid.TryParse(context.Username, out Guid assertedOrganizationId))
                                {
                                    context.Fail("The username must be an organization ID in GUID format.");
                                    return;
                                }

                                try
                                {
                                    // Note that it may be possible to leak valid organization IDs here via a timing attack.
                                    OrganizationSecrets organizationSecrets =
                                        await policiesResource.GetOrganizationSecretsAsync(assertedOrganizationId);
                                    if (
                                        organizationSecrets.ApiKey?.Length >= 32
                                        && context.Password == organizationSecrets.ApiKey
                                    )
                                    {
                                        context.Principal = new ClaimsPrincipal(
                                            new ClaimsIdentity(
                                                new[] { new Claim(Claims.OrganizationId, context.Username) },
                                                "API Key"
                                            )
                                        );
                                        context.Success();
                                        return;
                                    }
                                }
                                catch { }

                                context.Fail("The API key is invalid.");
                            },
                        };
                    }
                )
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
                options.AddPolicy(
                    Policies.ForbidAnonymous,
                    new AuthorizationPolicyBuilder().RequireAuthenticatedUser().Build()
                );

                // Require all users to be authenticated and have access to the specified tenant -
                // the organization ID and location ID (if specified).
                options.FallbackPolicy = new AuthorizationPolicyBuilder()
                    .RequireAuthenticatedUser()
                    .RequireAssertion(context =>
                        context.Resource is HttpContext httpContext
                        && (
                            !httpContext.Request.RouteValues.TryGetValue("organizationId", out object? orgId)
                            || context.User.HasClaim("organizationId", (string)orgId!)
                        )
                        && (
                            !httpContext.Request.RouteValues.TryGetValue("locationId", out object? locId)
                            || context.User.HasClaim("locationId", (string)locId!)
                        )
                    )
                    .Build();
            });

            services.AddOpenApiDocument(options =>
            {
                options.PostProcess = document =>
                {
                    document.Info.Version = "v1";
                    document.Info.Title = "CareTogether CMS API";
                    document.Info.Description = "API for the CareTogether Community Management System";
                    document.Info.Contact = new OpenApiContact
                    {
                        Name = "CareTogether CMS Team",
                        Url = "https://caretogether.io/",
                    };
                    document.Info.License = new OpenApiLicense
                    {
                        Name = "Use under AGPLv3",
                        Url = "https://www.gnu.org/licenses/agpl-3.0.en.html",
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
                app.UseReDoc(config =>
                {
                    config.Path = "/redoc";
                });

                app.UseCors(policy =>
                {
                    policy.WithOrigins("http://localhost:3000").AllowAnyMethod().AllowAnyHeader().AllowCredentials();
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

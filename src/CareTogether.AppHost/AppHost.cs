using Aspire.Hosting.ApplicationModel;

var builder = DistributedApplication.CreateBuilder(args);

var keycloak = builder.AddKeycloak("keycloak", 8080).WithRealmImport("./Realms");
var keycloakAuthority = ReferenceExpression.Create(
    $"{keycloak.GetEndpoint("http")}/realms/caretogether-local"
);

var api = builder
    .AddProject<Projects.CareTogether_Api>("api")
    .WithEnvironment("Authentication__Provider", "Keycloak")
    .WithEnvironment("Keycloak__Authority", keycloakAuthority)
    .WithReference(keycloak)
    .WaitFor(keycloak);

var web = builder
    .AddJavaScriptApp("web", "../caretogether-pwa")
    .WithHttpEndpoint(targetPort: 3000, port: 3000, env: "PORT", isProxied: false)
    .WithReference(api)
    .WithReference(keycloak)
    .WaitFor(api)
    .WaitFor(keycloak);

web.WithEnvironment("VITE_APP_API_HOST", api.GetEndpoint("http"));
web.WithEnvironment("VITE_APP_AUTH_PROVIDER", "keycloak");
web.WithEnvironment("VITE_APP_AUTH_CLIENT_ID", "caretogether-pwa");
web.WithEnvironment("VITE_APP_AUTH_AUTHORITY", keycloakAuthority);
web.WithEnvironment("VITE_APP_AUTH_SCOPES", "openid profile email");
web.WithEnvironment("VITE_APP_AUTH_REDIRECT_URI", web.GetEndpoint("http"));
web.WithEnvironment("VITE_APP_APPINSIGHTS_CONNECTIONSTRING", "");
web.WithEnvironment("VITE_APP_PUBLIC_POSTHOG_KEY", "");
web.WithEnvironment("VITE_APP_PUBLIC_POSTHOG_HOST", "");
web.WithEnvironment("VITE_APP_FEATUREBASE_APP_ID", "");
web.WithEnvironment("VITE_APP_LOCAL_FEATURE_FLAGS", "referrals");

builder.Build().Run();

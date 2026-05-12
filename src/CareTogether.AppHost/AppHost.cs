var builder = DistributedApplication.CreateBuilder(args);

var keycloak = builder.AddKeycloak("keycloak", 8080).WithRealmImport("./Realms");

var api = builder
    .AddProject<Projects.CareTogether_Api>("api")
    .WithEnvironment("Authentication__Provider", "Keycloak")
    .WithEnvironment("Keycloak__Authority", "http://localhost:8080/realms/caretogether-local")
    .WithReference(keycloak)
    .WaitFor(keycloak);

var web = builder
    .AddJavaScriptApp("web", "../caretogether-pwa")
    .WithHttpEndpoint(port: 3000, env: "PORT")
    .WithReference(api)
    .WithReference(keycloak)
    .WaitFor(keycloak);

web.WithEnvironment("VITE_APP_API_HOST", api.GetEndpoint("http"));
web.WithEnvironment("VITE_APP_AUTH_REDIRECT_URI", web.GetEndpoint("http"));

builder.Build().Run();

var builder = DistributedApplication.CreateBuilder(args);

var api = builder.AddProject<Projects.CareTogether_Api>("api");

var web = builder
    .AddJavaScriptApp("web", "../caretogether-pwa")
    .WithHttpEndpoint(port: 3000, env: "PORT")
    .WithReference(api);

web.WithEnvironment("VITE_APP_API_HOST", api.GetEndpoint("http"));
web.WithEnvironment("VITE_APP_AUTH_REDIRECT_URI", web.GetEndpoint("http"));

builder.Build().Run();

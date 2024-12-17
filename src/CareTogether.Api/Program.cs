using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Hosting;

namespace CareTogether.Api
{
    public class Program
    {
        public static void Main(string[] args)
        {
            CreateHostBuilder(args).Build().Run();
        }

        public static IHostBuilder CreateHostBuilder(string[] args)
        {
            return Host.CreateDefaultBuilder(args)
                .ConfigureWebHostDefaults(webBuilder =>
                    webBuilder
                        .ConfigureAppConfiguration(config =>
                        {
                            IConfigurationRoot? settings = config.Build();
                            if (settings.GetSection("AppConfigService").Exists())
                            {
                                string? connection = settings["AppConfigService:ConnectionString"];
                                config.AddAzureAppConfiguration(options =>
                                    options.Connect(connection).UseFeatureFlags()
                                );
                            }
                        })
                        .UseStartup<Startup>()
                );
        }
    }
}

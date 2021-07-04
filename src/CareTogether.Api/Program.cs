using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Hosting;

namespace CareTogether.Api
{
    public class Program
    {
        public static void Main(string[] args)
        {
            CreateHostBuilder(args).Build().Run();
        }

        public static IHostBuilder CreateHostBuilder(string[] args) =>
            Host.CreateDefaultBuilder(args)
                .ConfigureWebHostDefaults(webBuilder =>
                {
                    webBuilder.UseUrls("https://app.caretogether.io", "https://localhost:44359/");
                    webBuilder.UseStartup<Startup>();
                });
    }
}

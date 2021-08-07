using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Hosting;
using System;

namespace CareTogether.Api
{
    public class Program
    {
        public static void Main(string[] args)
        {
            Console.WriteLine(args == null
                ? "Main method called with no arguments"
                : "Main method called with arguments: " + string.Join(' ', args));
            try
            {
                CreateHostBuilder(args).Build().Run();
            }
            catch (Exception ex)
            {
                Console.WriteLine("Hosting exception was uncaught: " + ex.ToString());
                throw;
            }
        }

        public static IHostBuilder CreateHostBuilder(string[] args) =>
            Host.CreateDefaultBuilder(args)
                .ConfigureWebHostDefaults(webBuilder =>
                {
                    webBuilder.UseUrls(
                        "https://app.caretogether.io",
                        "http://caretogether-api.azurewebsites.net",
                        "https://caretogether-api.azurewebsites.net",
                        "https://localhost:44359/");
                    webBuilder.UseStartup<Startup>();
                });
    }
}

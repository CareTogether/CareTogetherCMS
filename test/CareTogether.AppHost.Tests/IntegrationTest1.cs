using System.Diagnostics;
using Microsoft.Extensions.Logging;

namespace CareTogether.AppHost.Tests.Tests;

public class IntegrationTest1
{
    private static readonly TimeSpan DefaultTimeout = TimeSpan.FromMinutes(10);

    [Fact]
    public async Task PlaywrightReferralWorkflowPassesAgainstAspireWeb()
    {
        var cancellationToken = CancellationToken.None;

        var appHost =
            await DistributedApplicationTestingBuilder.CreateAsync<Projects.CareTogether_AppHost>(
                cancellationToken
            );

        appHost.Services.AddLogging(logging =>
        {
            logging.SetMinimumLevel(LogLevel.Debug);
            logging.AddFilter(appHost.Environment.ApplicationName, LogLevel.Debug);
            logging.AddFilter("Aspire.", LogLevel.Debug);
        });

        await using var app = await appHost
            .BuildAsync(cancellationToken)
            .WaitAsync(DefaultTimeout, cancellationToken);

        await app.StartAsync(cancellationToken).WaitAsync(DefaultTimeout, cancellationToken);

        await app
            .ResourceNotifications.WaitForResourceHealthyAsync("web", cancellationToken)
            .WaitAsync(DefaultTimeout, cancellationToken);

        using var httpClient = app.CreateHttpClient("web");
        var baseUrl = httpClient.BaseAddress?.ToString()?.TrimEnd('/');

        Assert.False(string.IsNullOrWhiteSpace(baseUrl));

        var frontendPath = Path.GetFullPath(
            Path.Combine(
                AppContext.BaseDirectory,
                "..",
                "..",
                "..",
                "..",
                "..",
                "src",
                "caretogether-pwa"
            )
        );

        Assert.True(
            Directory.Exists(frontendPath),
            $"Frontend path does not exist: {frontendPath}"
        );
        var isWindows = OperatingSystem.IsWindows();
        var startInfo = new ProcessStartInfo
        {
            FileName = isWindows ? "cmd.exe" : "npx",
            WorkingDirectory = frontendPath,
            RedirectStandardOutput = true,
            RedirectStandardError = true,
            UseShellExecute = false,
        };

        if (isWindows)
        {
            startInfo.ArgumentList.Add("/c");
            startInfo.ArgumentList.Add("npx");
        }

        startInfo.ArgumentList.Add("playwright");
        startInfo.ArgumentList.Add("test");
        startInfo.ArgumentList.Add("playwright_test/referral-workflow.spec.ts");
        startInfo.ArgumentList.Add("--project=chromium");

        startInfo.Environment["PLAYWRIGHT_BASE_URL"] = baseUrl!;
        startInfo.Environment["CT_ADMIN_EMAIL"] = "test@bynalogic.com";
        startInfo.Environment["CT_ADMIN_PASSWORD"] = "P@ssw0rd";

        using var process = new Process { StartInfo = startInfo };

        process.Start();

        var stdoutTask = process.StandardOutput.ReadToEndAsync(cancellationToken);
        var stderrTask = process.StandardError.ReadToEndAsync(cancellationToken);

        await process
            .WaitForExitAsync(cancellationToken)
            .WaitAsync(DefaultTimeout, cancellationToken);

        var stdout = await stdoutTask;
        var stderr = await stderrTask;

        Assert.True(
            process.ExitCode == 0,
            $"Playwright failed with exit code {process.ExitCode}.{Environment.NewLine}"
                + $"BASE_URL: {baseUrl}{Environment.NewLine}"
                + $"STDOUT:{Environment.NewLine}{stdout}{Environment.NewLine}"
                + $"STDERR:{Environment.NewLine}{stderr}"
        );
    }
}

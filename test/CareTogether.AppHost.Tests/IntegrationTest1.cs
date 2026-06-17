using System.Diagnostics;
using System.Net.Sockets;
using Microsoft.Extensions.Logging;

namespace CareTogether.AppHost.Tests.Tests;

public class IntegrationTest1
{
    private static readonly TimeSpan DefaultTimeout = TimeSpan.FromMinutes(10);

    [Fact]
    public async Task PlaywrightReferralWorkflowPassesAgainstAspireWeb()
    {
        var cancellationToken = CancellationToken.None;

        await EnsureDockerDaemonAvailableAsync(cancellationToken);
        await EnsureAzuriteBlobServiceAvailableAsync(cancellationToken);

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
        startInfo.ArgumentList.Add("--project=chromium");
        startInfo.ArgumentList.Add("--workers=1");
        startInfo.ArgumentList.Add("--grep");
        startInfo.ArgumentList.Add("@pr");

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

    private static async Task EnsureDockerDaemonAvailableAsync(CancellationToken cancellationToken)
    {
        var startInfo = new ProcessStartInfo
        {
            FileName = "docker",
            RedirectStandardOutput = true,
            RedirectStandardError = true,
            UseShellExecute = false,
        };
        startInfo.ArgumentList.Add("info");

        try
        {
            using var process = new Process { StartInfo = startInfo };
            process.Start();

            var stdoutTask = process.StandardOutput.ReadToEndAsync(cancellationToken);
            var stderrTask = process.StandardError.ReadToEndAsync(cancellationToken);

            await process
                .WaitForExitAsync(cancellationToken)
                .WaitAsync(TimeSpan.FromSeconds(30), cancellationToken);

            var stdout = await stdoutTask;
            var stderr = await stderrTask;

            Assert.True(
                process.ExitCode == 0,
                "Docker is required for the local Aspire Keycloak resource, but the Docker daemon is not available."
                    + Environment.NewLine
                    + "Start Docker Desktop with the Linux engine enabled, then rerun the AppHost Playwright test."
                    + Environment.NewLine
                    + $"STDOUT:{Environment.NewLine}{TrimForFailure(stdout)}{Environment.NewLine}"
                    + $"STDERR:{Environment.NewLine}{TrimForFailure(stderr)}"
            );
        }
        catch (Exception ex)
            when (ex is System.ComponentModel.Win32Exception or FileNotFoundException)
        {
            Assert.Fail(
                "Docker is required for the local Aspire Keycloak resource, but the docker CLI was not found on PATH."
                    + Environment.NewLine
                    + "Install Docker Desktop, start it with the Linux engine enabled, then rerun the AppHost Playwright test."
            );
        }
        catch (TimeoutException)
        {
            Assert.Fail(
                "`docker info` timed out. Docker is required for the local Aspire Keycloak resource. "
                    + "Start or restart Docker Desktop with the Linux engine enabled, then rerun the AppHost Playwright test."
            );
        }
    }

    private static async Task EnsureAzuriteBlobServiceAvailableAsync(
        CancellationToken cancellationToken
    )
    {
        using var tcpClient = new TcpClient();

        try
        {
            await tcpClient
                .ConnectAsync("127.0.0.1", 10000, cancellationToken)
                .AsTask()
                .WaitAsync(TimeSpan.FromSeconds(5), cancellationToken);
        }
        catch (Exception ex) when (ex is SocketException or TimeoutException)
        {
            Assert.Fail(
                "Azurite Blob service is required because local API test data uses UseDevelopmentStorage=true, "
                    + "but 127.0.0.1:10000 is not accepting connections."
                    + Environment.NewLine
                    + "Start Azurite with `azurite-blob --loose` from the repository root, then rerun the AppHost Playwright test."
            );
        }
    }

    private static string TrimForFailure(string value)
    {
        const int maxLength = 2_000;

        if (string.IsNullOrWhiteSpace(value) || value.Length <= maxLength)
            return value;

        return value[..maxLength] + $"{Environment.NewLine}... output truncated ...";
    }
}

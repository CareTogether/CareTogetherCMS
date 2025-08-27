#nullable enable
using System;
using System.IO;
using System.Threading.Tasks;
using System.Collections.Generic;
using System.Linq;
using Azure.Storage.Blobs;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;

/*
Migration 001: Convert LocationConfiguration.timeZone from serialized TimeZoneInfo object to IANA time zone string

Execution:
  dotnet run src/Migrations/001_TimeZoneInfoToString.cs -- <connection-string> <container-prefix(optional)>

If running locally with Azurite and using the existing configured connection string, you can omit parameters
and it will read from appsettings.Development.json (Persistence:ImmutableBlobStorageConnectionString).

Strategy:
  - Enumerate all blob containers (organization IDs) unless a specific container prefix provided
  - For each configuration blob: <orgId>/Configuration/config.json
  - Load JSON, locate Locations[*].timeZone
  - If value is an object (has Id / DisplayName / StandardName etc) then map:
       1. If object has an Id (Windows registry id) try MapWindowsToIana(Id) else
       2. If object has DisplayName/StandardName use that for mapping
     Fallback: "UTC"
  - Replace value with mapped IANA string or leave string values unchanged
  - Write back only if any change performed

Mapping:
  - Very small built-in dictionary for common Windows->IANA time zones likely used
  - If not found, attempt System.TimeZoneInfo.FindSystemTimeZoneById to see if already IANA-form; if works keep
  - If it throws and mapping not found, set UTC

Safety:
  - Backup original blob beside it as config.pre-migration-001.json (only once)
*/

class Script
{
    static readonly Dictionary<string,string> WindowsToIana = new(StringComparer.OrdinalIgnoreCase)
    {
        // Add more as needed
        ["UTC"] = "UTC",
        ["Coordinated Universal Time"] = "UTC",
        ["Pacific Standard Time"] = "America/Los_Angeles",
        ["Eastern Standard Time"] = "America/New_York",
        ["Central Standard Time"] = "America/Chicago",
        ["Mountain Standard Time"] = "America/Denver",
        ["GMT Standard Time"] = "Europe/London",
        ["W. Europe Standard Time"] = "Europe/Berlin",
        ["Romance Standard Time"] = "Europe/Paris",
        ["Central Europe Standard Time"] = "Europe/Budapest",
        ["Central European Standard Time"] = "Europe/Warsaw",
        ["E. Europe Standard Time"] = "Europe/Bucharest",
        ["South Africa Standard Time"] = "Africa/Johannesburg",
        ["Tokyo Standard Time"] = "Asia/Tokyo",
        ["China Standard Time"] = "Asia/Shanghai",
        ["SE Asia Standard Time"] = "Asia/Bangkok",
        ["India Standard Time"] = "Asia/Kolkata",
        ["AUS Eastern Standard Time"] = "Australia/Sydney",
        ["New Zealand Standard Time"] = "Pacific/Auckland"
    };

    static string MapToIana(JToken tzToken)
    {
        if (tzToken == null || tzToken.Type == JTokenType.Null)
            return null!; // leave null

        if (tzToken.Type == JTokenType.String)
        {
            var str = tzToken.Value<string>()!;
            // If it's already IANA (contains '/') assume OK
            if (str.Contains('/')) return str;
            if (WindowsToIana.TryGetValue(str, out var mapped)) return mapped;
            try
            {
                // If system recognizes it (maybe running on Windows) try convert to IANA via Id
                var tz = TimeZoneInfo.FindSystemTimeZoneById(str);
                // If ID already acceptable, keep
                if (tz.Id.Contains('/')) return tz.Id;
                if (WindowsToIana.TryGetValue(tz.Id, out mapped)) return mapped;
            }
            catch {}
            return "UTC";
        }

        if (tzToken.Type == JTokenType.Object)
        {
            var obj = (JObject)tzToken;
            string[] candidateProps = {"Id","DisplayName","StandardName"};
            foreach (var prop in candidateProps)
            {
                var val = obj[prop]?.Value<string>();
                if (string.IsNullOrWhiteSpace(val)) continue;
                if (val.Contains('/')) return val; // already IANA-like
                if (WindowsToIana.TryGetValue(val, out var mapped)) return mapped;
            }
            return "UTC";
        }

        return "UTC"; // fallback
    }

    static async Task<int> Main(string[] args)
    {
        var (connectionString, containerFilter) = await ResolveConnectionStringAndFilter(args);

        var blobService = new BlobServiceClient(connectionString);

        await foreach (var container in blobService.GetBlobContainersAsync())
        {
            if (!string.IsNullOrEmpty(containerFilter) && !container.Name.StartsWith(containerFilter, StringComparison.OrdinalIgnoreCase))
                continue;

            var containerClient = blobService.GetBlobContainerClient(container.Name);
            var configBlob = containerClient.GetBlobClient("00000000-0000-0000-0000-000000000000/Configuration/config.json");
            if (!await configBlob.ExistsAsync()) continue;

            var download = await configBlob.DownloadContentAsync();
            var json = download.Value.Content.ToString();
            var root = JsonConvert.DeserializeObject<JObject>(json);
            if (root == null) continue;

            var locations = root["locations"] as JArray; // property names likely camelCase after serialization
            if (locations == null) continue;
            bool changed = false;
            foreach (var loc in locations.OfType<JObject>())
            {
                if (!loc.TryGetValue("timeZone", out var tzToken)) continue;
                if (tzToken == null || tzToken.Type == JTokenType.Null) continue;

                string newValue = MapToIana(tzToken);
                if (newValue == null) continue; // stays null
                if (tzToken.Type != JTokenType.String || tzToken.Value<string>() != newValue)
                {
                    loc["timeZone"] = newValue;
                    changed = true;
                }
            }

            if (changed)
            {
                // Backup once
                var backupBlob = containerClient.GetBlobClient("00000000-0000-0000-0000-000000000000/Configuration/config.pre-migration-001.json");
                if (!await backupBlob.ExistsAsync())
                {
                    await backupBlob.UploadAsync(BinaryData.FromString(json));
                }

                var updatedJson = JsonConvert.SerializeObject(root, Formatting.Indented);
                await configBlob.UploadAsync(BinaryData.FromString(updatedJson), overwrite:true);
                Console.WriteLine($"Updated {container.Name} configuration (time zones normalized)");
            }
            else
            {
                Console.WriteLine($"No change for {container.Name}");
            }
        }
        return 0;
    }

    static async Task<(string connectionString,string? containerFilter)> ResolveConnectionStringAndFilter(string[] args)
    {
        if (args.Length >= 2)
        {
            return (args[0], args[1]);
        }
        if (args.Length == 1)
        {
            return (args[0], null);
        }
        // Try reading appsettings.Development.json for Persistence:ImmutableBlobStorageConnectionString
        try
        {
            var text = await File.ReadAllTextAsync("appsettings.Development.json");
            var jo = JsonConvert.DeserializeObject<JObject>(text);
            var conn = jo?["Persistence:ImmutableBlobStorageConnectionString"]?.Value<string>();
            if (string.IsNullOrWhiteSpace(conn)) throw new Exception();
            return (conn!, null);
        }
        catch
        {
            Console.Error.WriteLine("Connection string not provided and could not read from appsettings.Development.json. Pass: dotnet run script.cs <connectionString> [containerPrefix]");
            throw;
        }
    }
}

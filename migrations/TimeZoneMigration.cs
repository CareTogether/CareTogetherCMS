#!/usr/bin/env dotnet-script
#r "nuget: Azure.Storage.Blobs, 12.20.0"
#r "nuget: Newtonsoft.Json, 13.0.3"
#r "nuget: System.Collections.Immutable, 8.0.0"

using System;
using System.Collections.Generic;
using System.Collections.Immutable;
using System.IO;
using System.Text;
using System.Threading.Tasks;
using Azure.Storage.Blobs;
using Azure.Storage.Blobs.Models;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;

// Configuration (adjust as needed)
var connectionString = "UseDevelopmentStorage=true;"; // For Azurite
// For Azure, use something like: "DefaultEndpointsProtocol=https;AccountName=...;AccountKey=...";

var blobServiceClient = new BlobServiceClient(connectionString);

Console.WriteLine("Starting data migration...");
Console.WriteLine("This migration will:");
Console.WriteLine("1. Convert TimeZoneInfo objects to IANA timezone strings");
Console.WriteLine("2. Migrate RequiredIntakeActionNames to IntakeRequirements");

try
{
    await RunMigrations();
    Console.WriteLine("Migration completed successfully!");
}
catch (Exception ex)
{
    Console.WriteLine($"Migration failed: {ex.Message}");
    Console.WriteLine($"Stack trace: {ex.StackTrace}");
    Environment.Exit(1);
}

async Task RunMigrations()
{
    int organizationsProcessed = 0;
    int timeZoneUpdates = 0;
    int intakeRequirementsUpdates = 0;
    
    // List all containers (each container represents an organization)
    await foreach (var containerItem in blobServiceClient.GetBlobContainersAsync())
    {
        var organizationId = containerItem.Name;
        Console.WriteLine($"Processing organization: {organizationId}");
        
        var containerClient = blobServiceClient.GetBlobContainerClient(organizationId);
        
        // Process configuration files
        await ProcessConfigurationFiles(containerClient, ref timeZoneUpdates);
        
        // Process policy files  
        await ProcessPolicyFiles(containerClient, ref intakeRequirementsUpdates);
        
        organizationsProcessed++;
    }
    
    Console.WriteLine($"Migration summary:");
    Console.WriteLine($"  Organizations processed: {organizationsProcessed}");
    Console.WriteLine($"  Timezone updates: {timeZoneUpdates}");
    Console.WriteLine($"  Intake requirements updates: {intakeRequirementsUpdates}");
}

async Task ProcessConfigurationFiles(BlobContainerClient containerClient, ref int timeZoneUpdates)
{
    // Look for configuration files in the format: {locationId}/Configuration/config.json
    await foreach (var blobItem in containerClient.GetBlobsAsync(prefix: ""))
    {
        if (blobItem.Name.EndsWith("/Configuration/config.json"))
        {
            var blobClient = containerClient.GetBlobClient(blobItem.Name);
            
            Console.WriteLine($"  Processing config: {blobItem.Name}");
            
            try
            {
                // Download the blob content
                var response = await blobClient.DownloadContentAsync();
                var content = response.Value.Content.ToString();
                
                // Parse JSON
                var config = JObject.Parse(content);
                
                bool hasChanges = false;
                
                // Check if there are locations to migrate
                var locations = config["Locations"] as JArray;
                if (locations != null)
                {
                    foreach (var location in locations)
                    {
                        var timeZone = location["timeZone"];
                        
                        if (timeZone != null && timeZone.Type == JTokenType.Object)
                        {
                            // This is a TimeZoneInfo object, convert it to IANA string
                            var id = timeZone["Id"]?.ToString();
                            if (!string.IsNullOrEmpty(id))
                            {
                                var ianaId = ConvertToIanaTimeZone(id);
                                if (!string.IsNullOrEmpty(ianaId))
                                {
                                    Console.WriteLine($"    Converting timezone from '{id}' to '{ianaId}'");
                                    location["timeZone"] = ianaId;
                                    hasChanges = true;
                                    timeZoneUpdates++;
                                }
                                else
                                {
                                    Console.WriteLine($"    Warning: Could not convert timezone '{id}' to IANA format");
                                    // Set to null if we can't convert
                                    location["timeZone"] = null;
                                    hasChanges = true;
                                }
                            }
                        }
                    }
                }
                
                // If there were changes, upload the updated configuration
                if (hasChanges)
                {
                    var updatedContent = config.ToString(Formatting.Indented);
                    var contentBytes = Encoding.UTF8.GetBytes(updatedContent);
                    
                    using (var stream = new MemoryStream(contentBytes))
                    {
                        await blobClient.UploadAsync(stream, overwrite: true);
                    }
                    
                    Console.WriteLine($"    Updated configuration saved");
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"    Error processing {blobItem.Name}: {ex.Message}");
            }
        }
    }
}

async Task ProcessPolicyFiles(BlobContainerClient containerClient, ref int intakeRequirementsUpdates)
{
    // Look for policy files in the format: {locationId}/LocationPolicies/policy.json
    await foreach (var blobItem in containerClient.GetBlobsAsync(prefix: ""))
    {
        if (blobItem.Name.EndsWith("/LocationPolicies/policy.json"))
        {
            var blobClient = containerClient.GetBlobClient(blobItem.Name);
            
            Console.WriteLine($"  Processing policy: {blobItem.Name}");
            
            try
            {
                // Download the blob content
                var response = await blobClient.DownloadContentAsync();
                var content = response.Value.Content.ToString();
                
                // Parse JSON
                var policy = JObject.Parse(content);
                
                bool hasChanges = false;
                
                // Navigate to ReferralPolicy
                var referralPolicy = policy["ReferralPolicy"];
                if (referralPolicy != null)
                {
                    // Check if RequiredIntakeActionNames exists and IntakeRequirements doesn't
                    var requiredIntakeActionNames = referralPolicy["RequiredIntakeActionNames"] as JArray;
                    var intakeRequirements = referralPolicy["IntakeRequirements"];
                    
                    if (requiredIntakeActionNames != null && intakeRequirements == null)
                    {
                        Console.WriteLine($"    Migrating RequiredIntakeActionNames to IntakeRequirements");
                        
                        // Convert RequiredIntakeActionNames to IntakeRequirements
                        var newIntakeRequirements = new JArray();
                        foreach (var actionName in requiredIntakeActionNames)
                        {
                            newIntakeRequirements.Add(new JObject
                            {
                                ["ActionName"] = actionName,
                                ["IsRequired"] = true
                            });
                        }
                        
                        // Add the new IntakeRequirements array
                        referralPolicy["IntakeRequirements"] = newIntakeRequirements;
                        
                        // Keep RequiredIntakeActionNames for backward compatibility for now
                        // (The application code will handle the transition)
                        
                        hasChanges = true;
                        intakeRequirementsUpdates++;
                    }
                    
                    // Also migrate ArrangementPolicies
                    var arrangementPolicies = referralPolicy["ArrangementPolicies"] as JArray;
                    if (arrangementPolicies != null)
                    {
                        foreach (var arrangement in arrangementPolicies)
                        {
                            hasChanges |= MigrateArrangementPolicy(arrangement);
                        }
                    }
                }
                
                // If there were changes, upload the updated policy
                if (hasChanges)
                {
                    var updatedContent = policy.ToString(Formatting.Indented);
                    var contentBytes = Encoding.UTF8.GetBytes(updatedContent);
                    
                    using (var stream = new MemoryStream(contentBytes))
                    {
                        await blobClient.UploadAsync(stream, overwrite: true);
                    }
                    
                    Console.WriteLine($"    Updated policy saved");
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"    Error processing {blobItem.Name}: {ex.Message}");
            }
        }
    }
}

bool MigrateArrangementPolicy(JToken arrangement)
{
    bool hasChanges = false;
    
    // Migrate RequiredSetupActionNames to RequiredSetupActions
    var requiredSetupActionNames = arrangement["RequiredSetupActionNames"] as JArray;
    var requiredSetupActions = arrangement["RequiredSetupActions"];
    
    if (requiredSetupActionNames != null && requiredSetupActions == null)
    {
        var newRequiredSetupActions = new JArray();
        foreach (var actionName in requiredSetupActionNames)
        {
            newRequiredSetupActions.Add(new JObject
            {
                ["ActionName"] = actionName,
                ["IsRequired"] = true
            });
        }
        arrangement["RequiredSetupActions"] = newRequiredSetupActions;
        hasChanges = true;
    }
    
    // Migrate RequiredMonitoringActions to RequiredMonitoringActionsNew
    var requiredMonitoringActions = arrangement["RequiredMonitoringActions"] as JArray;
    var requiredMonitoringActionsNew = arrangement["RequiredMonitoringActionsNew"];
    
    if (requiredMonitoringActions != null && requiredMonitoringActionsNew == null)
    {
        var newRequiredMonitoringActions = new JArray();
        foreach (var monitoringAction in requiredMonitoringActions)
        {
            var actionName = monitoringAction["ActionName"];
            var recurrence = monitoringAction["Recurrence"];
            
            newRequiredMonitoringActions.Add(new JObject
            {
                ["Action"] = new JObject
                {
                    ["ActionName"] = actionName,
                    ["IsRequired"] = true
                },
                ["Recurrence"] = recurrence
            });
        }
        arrangement["RequiredMonitoringActionsNew"] = newRequiredMonitoringActions;
        hasChanges = true;
    }
    
    // Migrate RequiredCloseoutActionNames to RequiredCloseoutActions
    var requiredCloseoutActionNames = arrangement["RequiredCloseoutActionNames"] as JArray;
    var requiredCloseoutActions = arrangement["RequiredCloseoutActions"];
    
    if (requiredCloseoutActionNames != null && requiredCloseoutActions == null)
    {
        var newRequiredCloseoutActions = new JArray();
        foreach (var actionName in requiredCloseoutActionNames)
        {
            newRequiredCloseoutActions.Add(new JObject
            {
                ["ActionName"] = actionName,
                ["IsRequired"] = true
            });
        }
        arrangement["RequiredCloseoutActions"] = newRequiredCloseoutActions;
        hasChanges = true;
    }
    
    // Also migrate ArrangementFunctionVariants
    var arrangementFunctions = arrangement["ArrangementFunctions"] as JArray;
    if (arrangementFunctions != null)
    {
        foreach (var function in arrangementFunctions)
        {
            var variants = function["Variants"] as JArray;
            if (variants != null)
            {
                foreach (var variant in variants)
                {
                    hasChanges |= MigrateArrangementFunctionVariant(variant);
                }
            }
        }
    }
    
    return hasChanges;
}

bool MigrateArrangementFunctionVariant(JToken variant)
{
    bool hasChanges = false;
    
    // Same migration logic as ArrangementPolicy
    
    // Migrate RequiredSetupActionNames to RequiredSetupActions
    var requiredSetupActionNames = variant["RequiredSetupActionNames"] as JArray;
    var requiredSetupActions = variant["RequiredSetupActions"];
    
    if (requiredSetupActionNames != null && requiredSetupActions == null)
    {
        var newRequiredSetupActions = new JArray();
        foreach (var actionName in requiredSetupActionNames)
        {
            newRequiredSetupActions.Add(new JObject
            {
                ["ActionName"] = actionName,
                ["IsRequired"] = true
            });
        }
        variant["RequiredSetupActions"] = newRequiredSetupActions;
        hasChanges = true;
    }
    
    // Migrate RequiredMonitoringActions to RequiredMonitoringActionsNew
    var requiredMonitoringActions = variant["RequiredMonitoringActions"] as JArray;
    var requiredMonitoringActionsNew = variant["RequiredMonitoringActionsNew"];
    
    if (requiredMonitoringActions != null && requiredMonitoringActionsNew == null)
    {
        var newRequiredMonitoringActions = new JArray();
        foreach (var monitoringAction in requiredMonitoringActions)
        {
            var actionName = monitoringAction["ActionName"];
            var recurrence = monitoringAction["Recurrence"];
            
            newRequiredMonitoringActions.Add(new JObject
            {
                ["Action"] = new JObject
                {
                    ["ActionName"] = actionName,
                    ["IsRequired"] = true
                },
                ["Recurrence"] = recurrence
            });
        }
        variant["RequiredMonitoringActionsNew"] = newRequiredMonitoringActions;
        hasChanges = true;
    }
    
    // Migrate RequiredCloseoutActionNames to RequiredCloseoutActions
    var requiredCloseoutActionNames = variant["RequiredCloseoutActionNames"] as JArray;
    var requiredCloseoutActions = variant["RequiredCloseoutActions"];
    
    if (requiredCloseoutActionNames != null && requiredCloseoutActions == null)
    {
        var newRequiredCloseoutActions = new JArray();
        foreach (var actionName in requiredCloseoutActionNames)
        {
            newRequiredCloseoutActions.Add(new JObject
            {
                ["ActionName"] = actionName,
                ["IsRequired"] = true
            });
        }
        variant["RequiredCloseoutActions"] = newRequiredCloseoutActions;
        hasChanges = true;
    }
    
    return hasChanges;
}

string ConvertToIanaTimeZone(string timeZoneId)
{
    // Common Windows timezone ID to IANA timezone ID mappings
    var timeZoneMap = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
    {
        // US/Canada
        {"Eastern Standard Time", "America/New_York"},
        {"Central Standard Time", "America/Chicago"},
        {"Mountain Standard Time", "America/Denver"},
        {"Pacific Standard Time", "America/Los_Angeles"},
        {"Alaskan Standard Time", "America/Anchorage"},
        {"Hawaiian Standard Time", "Pacific/Honolulu"},
        {"Atlantic Standard Time", "America/Halifax"},
        
        // Europe
        {"GMT Standard Time", "Europe/London"},
        {"Central European Standard Time", "Europe/Berlin"},
        {"Central Europe Standard Time", "Europe/Warsaw"},
        {"Romance Standard Time", "Europe/Paris"},
        {"W. Europe Standard Time", "Europe/Berlin"},
        {"Eastern European Standard Time", "Europe/Kiev"},
        
        // Australia
        {"AUS Eastern Standard Time", "Australia/Sydney"},
        {"AUS Central Standard Time", "Australia/Adelaide"},
        {"W. Australia Standard Time", "Australia/Perth"},
        
        // Asia
        {"China Standard Time", "Asia/Shanghai"},
        {"Tokyo Standard Time", "Asia/Tokyo"},
        {"India Standard Time", "Asia/Kolkata"},
        {"SE Asia Standard Time", "Asia/Bangkok"},
        
        // UTC
        {"UTC", "UTC"},
        {"Coordinated Universal Time", "UTC"},
    };
    
    if (timeZoneMap.TryGetValue(timeZoneId, out var ianaId))
    {
        return ianaId;
    }
    
    // If not found in our mapping, try to use the ID as-is if it looks like an IANA ID
    if (timeZoneId.Contains("/"))
    {
        return timeZoneId;
    }
    
    // Return null if we can't convert
    return null;
}

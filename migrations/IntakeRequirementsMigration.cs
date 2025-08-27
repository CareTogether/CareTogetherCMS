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

Console.WriteLine("Starting intake requirements migration...");
Console.WriteLine("This migration will convert RequiredIntakeActionNames to IntakeRequirements structure");

try
{
    await MigrateIntakeRequirements();
    Console.WriteLine("Migration completed successfully!");
}
catch (Exception ex)
{
    Console.WriteLine($"Migration failed: {ex.Message}");
    Console.WriteLine($"Stack trace: {ex.StackTrace}");
    Environment.Exit(1);
}

async Task MigrateIntakeRequirements()
{
    int organizationsProcessed = 0;
    int policiesUpdated = 0;
    
    // List all containers (each container represents an organization)
    await foreach (var containerItem in blobServiceClient.GetBlobContainersAsync())
    {
        var organizationId = containerItem.Name;
        Console.WriteLine($"Processing organization: {organizationId}");
        
        var containerClient = blobServiceClient.GetBlobContainerClient(organizationId);
        
        // Process policy files  
        var updatedCount = await ProcessPolicyFiles(containerClient);
        policiesUpdated += updatedCount;
        
        organizationsProcessed++;
    }
    
    Console.WriteLine($"Migration summary:");
    Console.WriteLine($"  Organizations processed: {organizationsProcessed}");
    Console.WriteLine($"  Policies updated: {policiesUpdated}");
}

async Task<int> ProcessPolicyFiles(BlobContainerClient containerClient)
{
    int policiesUpdated = 0;
    
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
                    // Check if RequiredIntakeActionNames exists and needs to be migrated
                    var requiredIntakeActionNames = referralPolicy["RequiredIntakeActionNames"] as JArray;
                    var intakeRequirements = referralPolicy["IntakeRequirements"] as JArray;
                    
                    if (requiredIntakeActionNames != null && requiredIntakeActionNames.Count > 0)
                    {
                        Console.WriteLine($"    Migrating {requiredIntakeActionNames.Count} RequiredIntakeActionNames to IntakeRequirements");
                        
                        // Initialize IntakeRequirements if it doesn't exist
                        if (intakeRequirements == null)
                        {
                            intakeRequirements = new JArray();
                            referralPolicy["IntakeRequirements"] = intakeRequirements;
                        }
                        
                        // Get existing action names to avoid duplicates
                        var existingActionNames = new HashSet<string>();
                        foreach (var requirement in intakeRequirements)
                        {
                            var actionName = requirement["ActionName"]?.ToString();
                            if (!string.IsNullOrEmpty(actionName))
                            {
                                existingActionNames.Add(actionName);
                            }
                        }
                        
                        // Add new requirements from RequiredIntakeActionNames
                        int addedCount = 0;
                        foreach (var actionName in requiredIntakeActionNames)
                        {
                            var actionNameStr = actionName.ToString();
                            if (!existingActionNames.Contains(actionNameStr))
                            {
                                intakeRequirements.Add(new JObject
                                {
                                    ["ActionName"] = actionNameStr,
                                    ["IsRequired"] = true
                                });
                                addedCount++;
                            }
                        }
                        
                        if (addedCount > 0)
                        {
                            hasChanges = true;
                            Console.WriteLine($"    Added {addedCount} new intake requirements from action names");
                            
                            // Clear RequiredIntakeActionNames since they've been migrated
                            referralPolicy["RequiredIntakeActionNames"] = new JArray();
                        }
                        else
                        {
                            Console.WriteLine($"    All action names already exist in IntakeRequirements, clearing RequiredIntakeActionNames");
                            // Still clear RequiredIntakeActionNames to complete the migration
                            referralPolicy["RequiredIntakeActionNames"] = new JArray();
                            hasChanges = true;
                        }
                    }
                    
                    // Also migrate ArrangementPolicies
                    var arrangementPolicies = referralPolicy["ArrangementPolicies"] as JArray;
                    if (arrangementPolicies != null)
                    {
                        foreach (var arrangement in arrangementPolicies)
                        {
                            var arrangementChanges = MigrateArrangementPolicy(arrangement);
                            if (arrangementChanges > 0)
                            {
                                hasChanges = true;
                                Console.WriteLine($"    Migrated {arrangementChanges} requirement types in arrangement policy");
                            }
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
                    policiesUpdated++;
                }
                else
                {
                    Console.WriteLine($"    No changes needed");
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"    Error processing {blobItem.Name}: {ex.Message}");
            }
        }
    }
    
    return policiesUpdated;
}

int MigrateArrangementPolicy(JToken arrangement)
{
    int changesCount = 0;
    
    // Migrate RequiredSetupActionNames to RequiredSetupActions
    var requiredSetupActionNames = arrangement["RequiredSetupActionNames"] as JArray;
    var requiredSetupActions = arrangement["RequiredSetupActions"] as JArray;
    
    if (requiredSetupActionNames != null && requiredSetupActionNames.Count > 0)
    {
        // Initialize RequiredSetupActions if it doesn't exist
        if (requiredSetupActions == null)
        {
            requiredSetupActions = new JArray();
            arrangement["RequiredSetupActions"] = requiredSetupActions;
        }
        
        // Get existing action names to avoid duplicates
        var existingActionNames = new HashSet<string>();
        foreach (var requirement in requiredSetupActions)
        {
            var actionName = requirement["ActionName"]?.ToString();
            if (!string.IsNullOrEmpty(actionName))
            {
                existingActionNames.Add(actionName);
            }
        }
        
        // Add new requirements from RequiredSetupActionNames
        int addedCount = 0;
        foreach (var actionName in requiredSetupActionNames)
        {
            var actionNameStr = actionName.ToString();
            if (!existingActionNames.Contains(actionNameStr))
            {
                requiredSetupActions.Add(new JObject
                {
                    ["ActionName"] = actionNameStr,
                    ["IsRequired"] = true
                });
                addedCount++;
            }
        }
        
        if (addedCount > 0)
        {
            changesCount++;
        }
        
        // Clear RequiredSetupActionNames since they've been migrated
        arrangement["RequiredSetupActionNames"] = new JArray();
    }
    
    // Migrate RequiredMonitoringActions to the new format
    var requiredMonitoringActions = arrangement["RequiredMonitoringActions"] as JArray;
    var requiredMonitoringActionsNew = arrangement["RequiredMonitoringActionsNew"] as JArray;
    
    // Check if RequiredMonitoringActions contains old-format data (direct objects with ActionName)
    // vs new-format data (objects with Action.ActionName structure)
    bool hasOldFormatData = false;
    if (requiredMonitoringActions != null && requiredMonitoringActions.Count > 0)
    {
        foreach (var item in requiredMonitoringActions)
        {
            // Old format has ActionName directly, new format has Action.ActionName
            if (item["ActionName"] != null && item["Action"] == null)
            {
                hasOldFormatData = true;
                break;
            }
        }
    }
    
    if (hasOldFormatData)
    {
        // Migrate old format data to new format
        var newFormatActions = new JArray();
        
        // First, copy any existing new-format data from RequiredMonitoringActionsNew
        if (requiredMonitoringActionsNew != null)
        {
            foreach (var item in requiredMonitoringActionsNew)
            {
                newFormatActions.Add(item);
            }
        }
        
        // Get existing action names to avoid duplicates
        var existingActionNames = new HashSet<string>();
        foreach (var requirement in newFormatActions)
        {
            var actionName = requirement["Action"]?["ActionName"]?.ToString();
            if (!string.IsNullOrEmpty(actionName))
            {
                existingActionNames.Add(actionName);
            }
        }
        
        // Convert old format to new format
        foreach (var monitoringAction in requiredMonitoringActions)
        {
            var actionName = monitoringAction["ActionName"]?.ToString();
            var recurrence = monitoringAction["Recurrence"];
            
            if (!string.IsNullOrEmpty(actionName) && !existingActionNames.Contains(actionName))
            {
                newFormatActions.Add(new JObject
                {
                    ["Action"] = new JObject
                    {
                        ["ActionName"] = actionName,
                        ["IsRequired"] = true
                    },
                    ["Recurrence"] = recurrence
                });
            }
        }
        
        // Replace RequiredMonitoringActions with new format data
        arrangement["RequiredMonitoringActions"] = newFormatActions;
        
        // Remove the temporary field if it exists
        if (requiredMonitoringActionsNew != null)
        {
            ((JObject)arrangement).Remove("RequiredMonitoringActionsNew");
        }
        
        changesCount++;
    }
    else if (requiredMonitoringActionsNew != null && requiredMonitoringActionsNew.Count > 0)
    {
        // No old format data, just move RequiredMonitoringActionsNew to RequiredMonitoringActions
        if (requiredMonitoringActions == null || requiredMonitoringActions.Count == 0)
        {
            arrangement["RequiredMonitoringActions"] = requiredMonitoringActionsNew;
            ((JObject)arrangement).Remove("RequiredMonitoringActionsNew");
            changesCount++;
        }
    }
    
    // Migrate RequiredCloseoutActionNames to RequiredCloseoutActions
    var requiredCloseoutActionNames = arrangement["RequiredCloseoutActionNames"] as JArray;
    var requiredCloseoutActions = arrangement["RequiredCloseoutActions"] as JArray;
    
    if (requiredCloseoutActionNames != null && requiredCloseoutActionNames.Count > 0)
    {
        // Initialize RequiredCloseoutActions if it doesn't exist
        if (requiredCloseoutActions == null)
        {
            requiredCloseoutActions = new JArray();
            arrangement["RequiredCloseoutActions"] = requiredCloseoutActions;
        }
        
        // Get existing action names to avoid duplicates
        var existingActionNames = new HashSet<string>();
        foreach (var requirement in requiredCloseoutActions)
        {
            var actionName = requirement["ActionName"]?.ToString();
            if (!string.IsNullOrEmpty(actionName))
            {
                existingActionNames.Add(actionName);
            }
        }
        
        // Add new requirements from RequiredCloseoutActionNames
        int addedCount = 0;
        foreach (var actionName in requiredCloseoutActionNames)
        {
            var actionNameStr = actionName.ToString();
            if (!existingActionNames.Contains(actionNameStr))
            {
                requiredCloseoutActions.Add(new JObject
                {
                    ["ActionName"] = actionNameStr,
                    ["IsRequired"] = true
                });
                addedCount++;
            }
        }
        
        if (addedCount > 0)
        {
            changesCount++;
        }
        
        // Clear RequiredCloseoutActionNames since they've been migrated
        arrangement["RequiredCloseoutActionNames"] = new JArray();
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
                    changesCount += MigrateArrangementFunctionVariant(variant);
                }
            }
        }
    }
    
    return changesCount;
}

int MigrateArrangementFunctionVariant(JToken variant)
{
    int changesCount = 0;
    
    // Same migration logic as ArrangementPolicy
    
    // Migrate RequiredSetupActionNames to RequiredSetupActions
    var requiredSetupActionNames = variant["RequiredSetupActionNames"] as JArray;
    var requiredSetupActions = variant["RequiredSetupActions"] as JArray;
    
    if (requiredSetupActionNames != null && requiredSetupActionNames.Count > 0)
    {
        // Initialize RequiredSetupActions if it doesn't exist
        if (requiredSetupActions == null)
        {
            requiredSetupActions = new JArray();
            variant["RequiredSetupActions"] = requiredSetupActions;
        }
        
        // Get existing action names to avoid duplicates
        var existingActionNames = new HashSet<string>();
        foreach (var requirement in requiredSetupActions)
        {
            var actionName = requirement["ActionName"]?.ToString();
            if (!string.IsNullOrEmpty(actionName))
            {
                existingActionNames.Add(actionName);
            }
        }
        
        // Add new requirements from RequiredSetupActionNames
        int addedCount = 0;
        foreach (var actionName in requiredSetupActionNames)
        {
            var actionNameStr = actionName.ToString();
            if (!existingActionNames.Contains(actionNameStr))
            {
                requiredSetupActions.Add(new JObject
                {
                    ["ActionName"] = actionNameStr,
                    ["IsRequired"] = true
                });
                addedCount++;
            }
        }
        
        if (addedCount > 0)
        {
            changesCount++;
        }
        
        // Clear RequiredSetupActionNames since they've been migrated
        variant["RequiredSetupActionNames"] = new JArray();
    }
    
    // Migrate RequiredMonitoringActions to the new format
    var requiredMonitoringActions = variant["RequiredMonitoringActions"] as JArray;
    var requiredMonitoringActionsNew = variant["RequiredMonitoringActionsNew"] as JArray;
    
    // Check if RequiredMonitoringActions contains old-format data (direct objects with ActionName)
    // vs new-format data (objects with Action.ActionName structure)
    bool hasOldFormatData = false;
    if (requiredMonitoringActions != null && requiredMonitoringActions.Count > 0)
    {
        foreach (var item in requiredMonitoringActions)
        {
            // Old format has ActionName directly, new format has Action.ActionName
            if (item["ActionName"] != null && item["Action"] == null)
            {
                hasOldFormatData = true;
                break;
            }
        }
    }
    
    if (hasOldFormatData)
    {
        // Migrate old format data to new format
        var newFormatActions = new JArray();
        
        // First, copy any existing new-format data from RequiredMonitoringActionsNew
        if (requiredMonitoringActionsNew != null)
        {
            foreach (var item in requiredMonitoringActionsNew)
            {
                newFormatActions.Add(item);
            }
        }
        
        // Get existing action names to avoid duplicates
        var existingActionNames = new HashSet<string>();
        foreach (var requirement in newFormatActions)
        {
            var actionName = requirement["Action"]?["ActionName"]?.ToString();
            if (!string.IsNullOrEmpty(actionName))
            {
                existingActionNames.Add(actionName);
            }
        }
        
        // Convert old format to new format
        foreach (var monitoringAction in requiredMonitoringActions)
        {
            var actionName = monitoringAction["ActionName"]?.ToString();
            var recurrence = monitoringAction["Recurrence"];
            
            if (!string.IsNullOrEmpty(actionName) && !existingActionNames.Contains(actionName))
            {
                newFormatActions.Add(new JObject
                {
                    ["Action"] = new JObject
                    {
                        ["ActionName"] = actionName,
                        ["IsRequired"] = true
                    },
                    ["Recurrence"] = recurrence
                });
            }
        }
        
        // Replace RequiredMonitoringActions with new format data
        variant["RequiredMonitoringActions"] = newFormatActions;
        
        // Remove the temporary field if it exists
        if (requiredMonitoringActionsNew != null)
        {
            ((JObject)variant).Remove("RequiredMonitoringActionsNew");
        }
        
        changesCount++;
    }
    else if (requiredMonitoringActionsNew != null && requiredMonitoringActionsNew.Count > 0)
    {
        // No old format data, just move RequiredMonitoringActionsNew to RequiredMonitoringActions
        if (requiredMonitoringActions == null || requiredMonitoringActions.Count == 0)
        {
            variant["RequiredMonitoringActions"] = requiredMonitoringActionsNew;
            ((JObject)variant).Remove("RequiredMonitoringActionsNew");
            changesCount++;
        }
    }
    
    // Migrate RequiredCloseoutActionNames to RequiredCloseoutActions
    var requiredCloseoutActionNames = variant["RequiredCloseoutActionNames"] as JArray;
    var requiredCloseoutActions = variant["RequiredCloseoutActions"] as JArray;
    
    if (requiredCloseoutActionNames != null && requiredCloseoutActionNames.Count > 0)
    {
        // Initialize RequiredCloseoutActions if it doesn't exist
        if (requiredCloseoutActions == null)
        {
            requiredCloseoutActions = new JArray();
            variant["RequiredCloseoutActions"] = requiredCloseoutActions;
        }
        
        // Get existing action names to avoid duplicates
        var existingActionNames = new HashSet<string>();
        foreach (var requirement in requiredCloseoutActions)
        {
            var actionName = requirement["ActionName"]?.ToString();
            if (!string.IsNullOrEmpty(actionName))
            {
                existingActionNames.Add(actionName);
            }
        }
        
        // Add new requirements from RequiredCloseoutActionNames
        int addedCount = 0;
        foreach (var actionName in requiredCloseoutActionNames)
        {
            var actionNameStr = actionName.ToString();
            if (!existingActionNames.Contains(actionNameStr))
            {
                requiredCloseoutActions.Add(new JObject
                {
                    ["ActionName"] = actionNameStr,
                    ["IsRequired"] = true
                });
                addedCount++;
            }
        }
        
        if (addedCount > 0)
        {
            changesCount++;
        }
        
        // Clear RequiredCloseoutActionNames since they've been migrated
        variant["RequiredCloseoutActionNames"] = new JArray();
    }
    
    return changesCount;
}

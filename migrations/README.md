# Data Migration Scripts

This folder contains C# scripts for migrating data in the CareTogether CMS blob storage.

## Prerequisites

1. Install dotnet-script globally:
   ```bash
   dotnet tool install -g dotnet-script
   ```

## Running Migrations

### Intake Requirements Migration

This migration converts the old `RequiredIntakeActionNames` structure to the new `IntakeRequirements` structure that supports optional requirements.

**What it does:**
- Migrates `RequiredIntakeActionNames` arrays to `IntakeRequirements` arrays with `RequirementDefinition` objects
- Migrates `RequiredSetupActionNames` to `RequiredSetupActions` in arrangement policies
- Migrates `RequiredCloseoutActionNames` to `RequiredCloseoutActions` in arrangement policies  
- Migrates `RequiredMonitoringActions` to `RequiredMonitoringActionsNew` in arrangement policies
- Applies the same migrations to arrangement function variants

**To run:**

For local development (Azurite):
```bash
dotnet script IntakeRequirementsMigration.cs
```

For Azure production (update connection string in script first):
```bash
# Edit the script to use your Azure connection string instead of "UseDevelopmentStorage=true;"
dotnet script IntakeRequirementsMigration.cs
```

### Timeline Migration (TimeZoneInfo to IANA)

This migration converts `TimeZoneInfo` objects to simple IANA timezone strings.

**To run:**
```bash
dotnet script TimeZoneMigration.cs
```

## Important Notes

- **Always backup your data before running migrations**
- **Test migrations on development/staging environments first**
- The migrations are designed to be idempotent - you can run them multiple times safely
- The old fields are preserved for backward compatibility during the transition period
- The application code uses `*_PRE_MIGRATION` computed properties to handle both old and new data formats

## Connection Strings

The scripts default to using `UseDevelopmentStorage=true;` for local Azurite testing.

For Azure environments, update the `connectionString` variable in each script to use your Azure Storage connection string:
```csharp
var connectionString = "DefaultEndpointsProtocol=https;AccountName=youraccount;AccountKey=yourkey;EndpointSuffix=core.windows.net";
```

## Troubleshooting

If you get "command not found" errors for `dotnet script`, make sure you have dotnet-script installed:
```bash
dotnet tool list -g
dotnet tool install -g dotnet-script
```

If the scripts fail to compile, make sure you're using a recent version of .NET:
```bash
dotnet --version
```

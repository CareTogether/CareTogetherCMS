Never edit swagger.json and src/caretogether-pwa/src/GeneratedClient.ts, they are auto generated on build time.
When backend API/client contracts change, always run dotnet build to regenerate swagger.json and src/caretogether-pwa/src/GeneratedClient.ts instead of creating manual frontend shims, duplicated enum values, or temporary compatibility types.
When possible, use functional programming approach and "object calisthenics" (like early returns) for better readability and safeness.

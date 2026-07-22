Never edit swagger.json and src/caretogether-pwa/src/GeneratedClient.ts, they are auto generated on build time.
When backend API/client contracts change, always run dotnet build to regenerate swagger.json and src/caretogether-pwa/src/GeneratedClient.ts instead of creating manual frontend shims, duplicated enum values, or temporary compatibility types.
When possible, use functional programming approach and "object calisthenics" (like early returns) for better readability and safeness.
Use the `ph-unmask` class only for text that is safe to send to PostHog. Any text without a `ph-unmask` ancestor should be treated as sensitive and masked from analytics capture. Place `ph-unmask` as close as possible to the component or element that renders the actual safe text, instead of applying it high in the tree, so unrelated sensitive content is not accidentally unmasked.
When working with PostHog early access feature switches, follow docs/early-access-features.md.

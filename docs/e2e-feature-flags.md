# E2E Feature Flags

Development and production evaluate feature flags through PostHog. Developers
can use the PostHog toolbar to override flags locally.

Playwright tests instead declare deterministic overrides through the shared
fixture:

```ts
import { test } from "./support/fixtures";
import { FAMILY_SCREEN_V2_EARLY_ACCESS_FEATURE_FLAG } from "../src/featureFlags";

test.use({
    featureFlags: {
        [FAMILY_SCREEN_V2_EARLY_ACCESS_FEATURE_FLAG]: false,
    },
});
```

The fixture installs the map before the application loads. In development
builds, `main.tsx` bootstraps PostHog with those values, disables its remote
flags/config endpoint with `advanced_disable_flags`, and opts out of event
capture. Production builds ignore the injected map.

Add new keys to `src/featureFlags.ts`. Put suite-wide E2E defaults in
`playwright_test/support/fixtures.ts`; use `test.use` for scenario-specific
overrides. Feature flags control UI rollout only and must not grant
authorization.

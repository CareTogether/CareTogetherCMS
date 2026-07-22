# Early Access Features

CareTogether uses PostHog early access features when a feature should support
both default rollout and user-controlled opt-in or opt-out.

## Preferred Flag Model

Use one PostHog feature flag as the source of truth for each early access
feature.

For example, Family Screen V2 uses:

```text
family-screen-v2-ea
```

Do not create a separate frontend rollout flag plus a separate early access
flag for the same UI. Put default-access release conditions and early access
enrollment on the same PostHog flag instead.

## PostHog Setup

For a feature that should be available by default to selected users and
toggleable by users:

1. Create or choose one PostHog feature flag.
2. Add release conditions on that flag for users, cohorts, organizations, or
   locations that should receive the feature by default.
3. Create the PostHog early access feature and link it to the same flag.
4. Let the frontend read only that linked flag when choosing which UI to render.

With this setup, PostHog can apply this effective behavior:

```text
explicit opt-out -> disabled
explicit opt-in -> enabled
no explicit choice + matches release condition -> enabled
no explicit choice + does not match release condition -> disabled
```

## Frontend Rules

Render feature-gated UI from the evaluated PostHog flag, not from raw enrollment
person properties.

Use:

```ts
useFeatureFlagEnabled('feature-flag-key')
```

Avoid reading `$stored_person_properties` to decide whether the feature should
render. That value is browser-local PostHog SDK state used for flag evaluation
overrides, and it can differ between normal and private browser sessions.

For early access dialogs, the switch should represent effective access to the
feature. Use labels such as `Enabled`, not `Enrolled`, when the switch can be on
because of either explicit enrollment or a default release condition.

## Troubleshooting

If a user sees different behavior between a regular browser profile and a
private window, inspect the regular profile for a local opt-out:

```js
posthog.get_property('$stored_person_properties')
posthog.isFeatureEnabled('feature-flag-key', { send_event: false })
posthog.get_distinct_id()
posthog.getGroups()
```

If `posthog` is not global in the Vite dev app, import the module-loaded
instance from the browser console:

```js
const posthogModule = await import('/node_modules/.vite/deps/posthog-js.js')
const posthog = posthogModule.default
```

A value such as this means the user explicitly opted out in that browser:

```json
{
  "$feature_enrollment/family-screen-v2-ea": false
}
```

For local testing only, clear browser-local person-property overrides with:

```js
posthog.resetPersonPropertiesForFlags()
posthog.reloadFeatureFlags()
location.reload()
```

Do not use this as application logic. It is only a debugging aid.

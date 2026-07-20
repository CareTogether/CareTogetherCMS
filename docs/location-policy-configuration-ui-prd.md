# Location Policy Configuration UI PRD

## Problem Statement

Organization administrators need a location-scoped screen for configuring every current policy and configuration concept represented by the policy resource, without editing generated files, migration-era duplicate fields, or raw serialized structures. Today, location settings only expose a small subset of configuration and policy editing is mostly unavailable or placeholder-only.

## Solution

Add organization-admin-only location settings tabs for the current policy surface. The UI uses backend-aligned model section names where those names are valid, but uses the domain-correct `CasePolicy` label for the legacy `ReferralPolicy` backend property. The first implementation is a mocked/staged UI: every major policy area is visible, policy sections can be edited in an in-memory draft, and persistence/API shape is deferred.

## User Stories

1. As an organization administrator, I want to edit policy from a location settings screen, so that I configure the rules for the location I am managing.
2. As an organization administrator, I want top-level tabs for `ActionDefinitions`, `CustomFamilyFields`, `CasePolicy`, `V1ReferralPolicy`, and `VolunteerPolicy`, so that I can navigate the policy model directly.
3. As an organization administrator, I want `CasePolicy` to be distinct from `V1ReferralPolicy`, so that I do not confuse cases with referrals.
4. As an organization administrator, I want `CasePolicy` nested sections for intake requirements, custom fields, arrangement policies, function policies, and function assignment policies, so that each child model is manageable.
5. As an organization administrator, I want `VolunteerPolicy` nested sections for individual volunteer roles, family volunteer roles, and volunteer custom fields, so that role scopes remain clear.
6. As an organization administrator, I want action names to come from `ActionDefinitions`, so that requirements cannot reference orphan actions.
7. As an organization administrator, I want referenced actions protected from deletion, so that policy requirements do not silently break.
8. As an organization administrator, I want rename flows to list impacted references and default to updating them, so that string-based references remain consistent.
9. As an organization administrator, I want all recurrence policy types represented, so that every supported monitoring rule can be configured.
10. As an organization administrator, I want duration recurrence validation, so that invalid unlimited-stage ordering cannot be saved.
11. As an organization administrator, I want person eligibility selected through person search rather than raw GUID entry, so that eligibility can be configured safely.
12. As an organization administrator, I want role references restricted to existing roles, so that typos do not create broken eligibility rules.
13. As an organization administrator, I want custom field valid values for string and string-array fields, so that selectable and suggested values can be configured.
14. As an organization administrator, I want superseded policy versions to remain editable with safeguards, so that old definitions can be corrected intentionally.
15. As an organization administrator, I want the UI to show current versus superseded status, so that I know when I am editing a historical policy version.
16. As an organization administrator, I want policy sections to show internal usage, so that I can understand the impact of edits and deletes.
17. As an organization administrator, I want a shared draft with cross-tab validation, so that references across tabs remain consistent before saving.
18. As an organization administrator, I want manual ordering for policy lists, so that display order remains under admin control.
19. As an organization administrator, I want copy/duplicate actions for complex policy objects, so that large requirement sets do not need to be rebuilt manually.
20. As an organization administrator, I want copy-from-location at the section level, so that policy rollout across locations can be controlled.
21. As an organization administrator, I want `SmsSourcePhoneNumbers` and `timeZone` surfaced as location configuration, so that communications and local effective dates are configurable.

## Implementation Decisions

- The policy UI is location-scoped under existing location settings.
- Organization-wide configuration remains outside the location policy editor.
- Secrets are excluded from this UI.
- `CommunityRoles` and `ReferralCloseReasons` are excluded from location policy tabs because they are organization-level configuration.
- The UI shows canonical/current policy concepts and hides migration-era duplicate fields as editable concepts.
- `ReferralPolicy` is labeled `CasePolicy` because Referral and Case are distinct domain concepts and the backend property is legacy-named.
- Top-level policy members become peer location settings tabs.
- `CasePolicy` and `VolunteerPolicy` use nested sections because their child models are too large for a single flat editor.
- Superseded policy versions are editable with explicit safeguards rather than locked or auto-versioned.
- `ActionDefinitions` is the authoritative catalog for requirement action names.
- `RequirementDefinition.IsRequired` is surfaced as a real field.
- `ArrangementFunction` eligibility preserves the `null` inheritance behavior with an explicit inherited/override mode.
- Other editable nullable lists are normalized to empty arrays in UI state unless `null` carries domain behavior.
- Dictionary keys and inner type names are treated as one canonical name in the UI.
- The initial implementation is mocked/staged: visible structured UI first, with in-memory draft editing for policy sections and persistence later.

## Testing Decisions

- Frontend tests should exercise the rendered policy navigation and summaries from loaded policy data rather than internal component state.
- Validation logic should be tested as pure functions once editable draft behavior is added.
- Backend/API tests are deferred until the save contract is decided.
- Existing settings screens and generated client contracts remain the integration seams for the first mocked UI.

## Out of Scope

- Save/API contract for policy edits.
- Manual edits to `swagger.json` or `GeneratedClient.ts`.
- Secret management.
- Organization-level configuration screens for community roles or referral close reasons.
- Draft policy simulation against selected cases, referrals, or volunteer families.
- Record-level impact scans where no endpoint exists.

## Further Notes

The decision to allow editing superseded policy versions is recorded in `docs/adr/0001-editable-superseded-policy-versions.md`.

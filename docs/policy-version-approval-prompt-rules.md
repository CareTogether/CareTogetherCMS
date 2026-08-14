# Policy Version Approval Prompt Rules

Volunteer roles and volunteer family roles can have multiple policy versions. Each version has its
own approval status timeline, while the role also exposes one effective status across all versions.
These values serve different purposes and must not be used interchangeably.

## Terminology

- An **active version** has no `SupersededAtUtc` value, or its supersedence date is in the future.
- A **superseded version** has a `SupersededAtUtc` value in the past.
- A **version status** is the current approval status calculated from one policy version's
  requirements.
- The **effective status** is the current status produced by combining all version timelines,
  including superseded versions.
- A **prompt** is an available application or a missing approval/onboarding requirement shown to a
  user.

## Effective Status

Superseded policy versions continue to contribute valid historical approvals to the effective
status. At a given point in time, statuses use this precedence:

1. Denied
2. Inactive
3. Onboarded
4. Approved
5. Expired
6. Prospective

For example, an Onboarded status from a superseded version remains the effective status while its
requirements remain valid, even when an active version is only Prospective.

## Selecting Versions That Can Prompt

Prompt selection follows these rules in order:

1. If the effective status is Onboarded, no version can prompt. A valid onboarding carries across
   policy versions until it expires.
2. Superseded versions never prompt. They can affect the effective status, but users cannot continue
   an approval workflow under a superseded policy.
3. Among active versions, only the version or versions with the most advanced current version
   status can prompt.
4. A version with no status is less advanced than any version with a status.
5. If every active version has no status, all active versions can prompt their application
   requirements.
6. Active versions tied at the same most advanced status can all prompt.
7. If there are no active versions, there are no prompts.

This keeps one active approval stage visible without allowing a more advanced superseded workflow
to hide an active workflow, except while the effective onboarding remains valid.

## Requirements Shown By Version Status

After promptable versions are selected, each version exposes requirements for its own current stage:

| Version status | Prompts |
| --- | --- |
| No status | Unmet Application requirements |
| Prospective | Unmet Approval requirements |
| Approved | Unmet Onboarding requirements |
| Expired | Unmet Application, Approval, and Onboarding requirements |
| Onboarded | None |
| Inactive | None |
| Denied | None |

Completing an active version's application moves that version from no status to Prospective, which
replaces its application prompt with its missing approval requirements.

## Examples

### Prospective Superseded Version

- Superseded `pre2026`: Prospective
- Active `v1`: no status
- Effective status: Prospective

The active v1 application is shown. After it is completed, v1 becomes Prospective and its approval
requirements are shown. Missing requirements from `pre2026` are never shown.

### Onboarded Superseded Version

- Superseded `pre2026`: Onboarded
- Active `v1`: Prospective
- Effective status: Onboarded

No prompts are shown. When the inherited onboarding expires and the effective status becomes
Expired, the active v1 workflow can prompt again.

### Multiple Active Versions

- Active `v1`: Prospective
- Active `v2`: Approved

Only v2 can prompt because Approved is more advanced than Prospective. If both versions are
Approved, both can contribute missing onboarding requirements.

## Implementation

The shared selection logic is implemented by `PolicyEvaluationHelpers.SelectPromptableVersions` and
is used for family applications, individual applications, family requirements, and individual
requirements. Any new approval output must use the same helper so prompt behavior remains
consistent.

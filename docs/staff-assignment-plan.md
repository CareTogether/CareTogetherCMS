# Staff Assignment Feature Plan

## PR 1: Backend Contracts, Domain, Authorization, Tests

- Add shared `StaffAssignment(PersonId, AssignmentRole, AssignedAtUtc, AssignedByUserId)` resource contract.
- Add active `StaffAssignments` to `V1Referral`, `V1CaseEntry`, and manager-level `V1Case`.
- Add `V1ReferralInfo` in `Managers/SharedContracts.cs` with disclosed referral data and per-referral `UserPermissions`.
- Add policy contracts:
  - `EffectiveLocationPolicy.V1ReferralPolicy`
  - `V1ReferralPolicy.StaffAssignmentPolicies`
  - `V1CasePolicy.StaffAssignmentPolicies`
  - `StaffAssignmentPolicy(AssignmentRole, Eligibility)`
  - `StaffAssignmentEligibility(EligibleLocationRoles, EligibleIndividualVolunteerRoles, EligibleVolunteerFamilyRoles, EligiblePeople)`
- Add commands:
  - `AssignStaffToV1Referral`
  - `UnassignStaffFromV1Referral`
  - `AssignStaffToV1Case`
  - `UnassignStaffFromV1Case`
- Add dedicated permissions:
  - `ViewV1ReferralStaffAssignments`
  - `EditV1ReferralStaffAssignments`
  - `ViewV1CaseStaffAssignments`
  - `EditV1CaseStaffAssignments`
- Add authorization contexts:
  - `V1ReferralAuthorizationContext(referralId)`
  - `AssignedStaffInV1ReferralPermissionContext(WhenReferralIsOpen, WhenAssignmentRoleIsIn)`
  - `AssignedStaffInV1CasePermissionContext(WhenCaseIsOpen, WhenAssignmentRoleIsIn)`
- Keep case assignment permissions flowing through existing `FamilyAuthorizationContext`.
- Change referral listing from global all-or-nothing to per-referral `ViewV1Referral`.
- Keep family/case listing minimum-effort with existing "any meaningful non-screen permission" behavior.
- Validate staff assignment eligibility in `RecordsManager` before resource execution.
- Keep unassign permissive: no current policy/eligibility validation needed, only edit permission.
- Copy active referral assignments to case during accept/link:
  - only roles configured in case staff assignment policy
  - no person eligibility revalidation
  - copied as normal case assignment events
  - assigned timestamp and assigned-by user come from accept/link operation
- Add staff assignment activities/history in backend, filtered from disclosure unless user has relevant view staff assignment permission.
- Add focused tests:
  - resource assign/unassign/idempotency/current-state
  - authorization contexts, role filters, open/closed filters
  - referral listing/disclosure with `V1ReferralInfo`
  - case/family access through assigned-case context
- Add minimal test data/config examples.
- Run `dotnet build` to regenerate `swagger.json` and `src/caretogether-pwa/src/GeneratedClient.ts`; do not edit them manually.
- Include only minimal frontend compile fixes if generated client changes require them.

## PR 2: Frontend Operational UI

- Shared staff assignment component for referrals and cases.
- Role-grouped display.
- Policy-order sorting, then person name; unconfigured roles last.
- Assign one person at a time.
- Add/remove exact assignment only; no edit command.
- Candidate picker computed from visible data and policy.
- Deduplicate candidates by `PersonId`.
- Eligibility paths are OR'd:
  - location roles
  - approved/onboarded individual volunteer roles
  - approved/onboarded volunteer family roles, where any person in that family can qualify
  - explicit people
- Referral assignment UI gated by `ViewV1ReferralStaffAssignments` / `EditV1ReferralStaffAssignments`.
- Case assignment UI gated by `ViewV1CaseStaffAssignments` / `EditV1CaseStaffAssignments`.
- Add Settings role-editor support for the two new assigned-staff permission contexts and `WhenAssignmentRoleIsIn`.

## Known Follow-Ups

- Referral document valet authorization remains global/broad in PR 1.
- Referral note command authorization remains global/broad in PR 1.
- Settings UI for editing `StaffAssignmentPolicies` is deferred.
- Existing arrangement assignment backend eligibility validation remains unchanged.
- Timeline rendering for staff assignment activities is only included if low-effort; backend history should still be correct.

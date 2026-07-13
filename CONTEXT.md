# CareTogether

CareTogether manages the operating rules, relationships, and records used by organizations that coordinate care through locations.

## Language

**Current Policy**:
The active set of rules used by a location to determine requirements, approvals, eligibility, and available workflow options.
_Avoid_: Legacy policy, migration policy

**Policy Version**:
A dated form of a policy that may remain available after being superseded.
_Avoid_: Immutable policy snapshot

**Location**:
A subdivision of an organization that can operate with its own policy and configuration.
_Avoid_: Chapter, site

**Referral**:
A request for help that can be opened, accepted, closed, and linked to a case.
_Avoid_: Case

**Case**:
An active or historical care coordination record for a partnering family.
_Avoid_: Referral

**Person**:
An individual represented in a location's directory and used for family membership, volunteer eligibility, assignments, and access.
_Avoid_: User account

**Action Definition**:
A named requirement template that describes what evidence or notes may be needed when completing work.
_Avoid_: Task definition, form definition

**Case Policy**:
The location policy governing case intake, arrangements, functions, monitoring, and closeout.
_Avoid_: Referral Policy

**Volunteer Policy**:
The location policy governing volunteer role approval requirements and custom volunteer information.
_Avoid_: Approval policy

**Inherited Eligibility**:
Eligibility for an arrangement function that comes from the case policy's function-level eligibility instead of being specified on that arrangement function.
_Avoid_: Empty eligibility

# ADR 0002: Tenant-defined Organization categories

## Status

Accepted

## Context

CareTogether uses **Tenant** for a customer organization and **Organization** for the domain concept previously presented as a Community. Tenants need to define their own classification vocabulary and assign any number of those categories to Organizations across their locations.

Category names may change after assignments have been made. Category removal must not silently change Organization data or leave assignments pointing at an unknown definition.

## Decision

- Store category definitions in the tenant's `OrganizationConfiguration`.
- Give each category a tenant-scoped, stable UUID and a tenant-unique name. Name comparisons are case-insensitive and ignore surrounding whitespace.
- Store assigned category UUIDs on the event-sourced Organization record.
- Allow an Organization to have zero or more categories.
- Require assignment commands to reference categories currently configured for the Tenant.
- Allow category renames without changing Organization assignments.
- Reject deletion while the category is assigned to any Organization in any Tenant location.
- Restrict category definition management to Tenant administrators. Use the existing `EditOrganization` permission for assignments.

## Compatibility

`OrganizationCategories` and `CategoryIds` are additive properties with empty-list defaults. Existing tenant configuration documents and existing Organization event streams therefore render with no categories. Existing Community command and event discriminator names remain unchanged; the new assignment command is additive.

## Consequences

- Renames are safe and do not generate assignment events.
- Deleting a category requires users to remove all assignments first.
- The delete operation must inspect Organizations across every configured Tenant location.
- Category IDs, rather than category names, are the durable reference in Organization history.

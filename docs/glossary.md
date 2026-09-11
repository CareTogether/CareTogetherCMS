# Domain glossary

## Tenant

A CareTogether customer organization. A Tenant owns configuration shared across its locations, including Organization category definitions. Some existing API and storage contracts use `organizationId` for this concept; those names remain for backward compatibility.

## Organization

A group of families and people within a Tenant location. This concept was previously called Community in the product. Existing persisted Community commands, events, and permission-context discriminators retain their historical names for backward compatibility.

## Organization category

A Tenant-defined classification that can be assigned to zero or more Organizations. A category has a stable UUID and a Tenant-unique name. An Organization can have multiple categories.

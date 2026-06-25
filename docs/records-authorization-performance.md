# Records Authorization Performance

## Background

The `/Records` endpoint was profiled with
`/home/pablo/github/CareTogether/tfg-optimization/app_perf.speedscope.json`.
The profile showed that records listing spent most of its CPU time repeatedly
recalculating authorization and rebuilding filtered immutable collections.

The biggest hotspots were:

- `UserAccessCalculation.AuthorizeUserAccessAsync`
- repeated `ImmutableList.CreateRange` calls inside authorization
- repeated `ApprovalsResource.TryGetVolunteerFamilyAsync` calls
- repeated `CombinedFamilyInfoFormatter.RenderCombinedFamilyInfoAsync` calls
- repeated family disclosure authorization from `AuthorizationEngine.DiscloseFamilyAsync`

The main issue was not one expensive permission rule. It was the request shape:
`RecordsManager.ListVisibleAggregatesAsync` authorized every family, referral,
and community independently, and family rendering then authorized the same family
again during disclosure.

## What Changed

### Request-Scoped Authorization Snapshot

`UserAccessCalculation` now supports a `UserAccessCalculationSnapshot`.

The snapshot preloads the tenant and user data needed by authorization once per
records-list request:

- current user family
- V1 cases grouped by partnering family id
- V1 cases grouped by assigned volunteer family id
- referrals by referral id
- volunteer family ids
- communities
- community ids by family id
- current user's community role assignments
- permission sets applicable to the user's configured roles

`RecordsManager.ListVisibleAggregatesAsync` creates this snapshot once and then
uses synchronous snapshot evaluation for family, referral, and community
visibility checks.

### Reused Family Permissions During Disclosure

`AuthorizationEngine.DiscloseFamilyAsync` now has an overload that accepts
precomputed family permissions.

`CombinedFamilyInfoFormatter.RenderCombinedFamilyInfoAsync` accepts optional
precomputed permissions and passes them into disclosure when available.

`RecordsManager.ListVisibleAggregatesAsync` now carries the permissions from the
family visibility check into family rendering. This avoids recalculating family
authorization during disclosure for records-list rendering.

## Expected Impact

The change reduces repeated work in the `/Records` request path:

- fewer full-tenant V1 case scans during authorization
- fewer repeated approval lookups for the same family ids
- fewer repeated community membership scans
- fewer immutable list materializations inside authorization
- one family authorization pass for records visibility and disclosure instead of two

This does not yet optimize every hotspot from the profile. In particular,
family rendering still performs repeated resource-level filtering for notes,
V1 cases, and referrals. Those are good follow-up candidates for model-level
secondary indexes or a batch rendering context.

## Verification

The change was verified with:

```bash
dotnet test test/CareTogether.Core.Test/CareTogether.Core.Test.csproj --no-restore -nologo /nodeReuse:false /maxcpucount:1
dotnet build CareTogetherCMS.sln --no-restore -nologo /nodeReuse:false /maxcpucount:1
```

Both commands passed. The solution build regenerated API/client artifacts through
NSwag and reported no generated file changes.

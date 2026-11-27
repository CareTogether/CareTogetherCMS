import {
  Permission,
  type CombinedFamilyInfo,
  type CompletedRequirementInfo,
  type ExemptedRequirementInfo,
} from '../GeneratedClient.ts';
import {
  buildAppliedRoleNames,
  filterAppliedRoles,
  shouldIncludeRoleRelatedRow,
  type ApprovalLedgerRow,
} from '../Approvals/approvalLedgerViewModel.ts';
import { familyApprovalLedgerInput } from '../Approvals/familyApprovalLedgerInput.ts';
import type { LocationScope } from '../Model/LocationScope';
import type { ApprovalExpirationWorkItem } from './approvalExpirationWorkQueue';

type RequirementTarget = ApprovalExpirationWorkItem['target'];

export type ExpiringRequirementRole = {
  scope: RequirementTarget['kind'];
  roleName: string;
};

/**
 * An approval requirement whose latest completion or exemption expires (or
 * recently expired), taken from the same approval ledger the family and
 * organization screens show.
 */
export type ExpiringRequirementWorkItem = {
  key: string;
  snoozeToken: string;
  scope: LocationScope;
  target: RequirementTarget;
  actionName: string;
  /** First day the requirement no longer counts, like an approval's expiration date. */
  expirationDate: string;
  affectedRoles: readonly ExpiringRequirementRole[];
};

export type OrganizationLedger = {
  communityId: string;
  rows: readonly ApprovalLedgerRow[];
};

/** Items further than this from today are never shown, whatever the window. */
export const expiringRequirementHorizonDays = 90;

const millisecondsPerDay = 86_400_000;

function hasIdentity(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function dateOnly(date: Date | undefined) {
  return date instanceof Date && Number.isFinite(date.getTime())
    ? date.toISOString().slice(0, 10)
    : undefined;
}

function nextDay(date: string) {
  return new Date(Date.parse(date) + millisecondsPerDay)
    .toISOString()
    .slice(0, 10);
}

function horizon(evaluationTime: Date) {
  const today = Date.UTC(
    evaluationTime.getUTCFullYear(),
    evaluationTime.getUTCMonth(),
    evaluationTime.getUTCDate()
  );
  const offset = expiringRequirementHorizonDays * millisecondsPerDay;
  return {
    from: new Date(today - offset).toISOString().slice(0, 10),
    to: new Date(today + offset).toISOString().slice(0, 10),
    fromTime: today - offset,
    toTime: today + offset,
  };
}

/** Whether a requirement valid through `validUntil` lapses inside the horizon. */
function withinHorizon(validUntil: number, window: ReturnType<typeof horizon>) {
  const lapsesAt = validUntil + millisecondsPerDay;
  return (
    lapsesAt >= window.fromTime && lapsesAt < window.toTime + millisecondsPerDay
  );
}

type Expiring = {
  expiresAtUtc?: Date;
  exemptionExpiresAtUtc?: Date;
};

function anyExpiryWithin(
  requirements: readonly Expiring[] | undefined,
  window: ReturnType<typeof horizon>
) {
  return (requirements ?? []).some((requirement) => {
    const time = (
      requirement.expiresAtUtc ?? requirement.exemptionExpiresAtUtc
    )?.getTime();
    return time !== undefined && withinHorizon(time, window);
  });
}

/**
 * Cheap scan of the raw requirement lists, so the full scan only runs for
 * families that can contribute an item. Most families in a large location
 * have nothing expiring near today.
 */
export function familyHasExpiryNear(
  family: CombinedFamilyInfo,
  evaluationTime: Date
) {
  const window = horizon(evaluationTime);
  const info = family.volunteerFamilyInfo;
  const sources: (
    | readonly CompletedRequirementInfo[]
    | readonly ExemptedRequirementInfo[]
    | undefined
  )[] = [
    info?.completedRequirements,
    info?.exemptedRequirements,
    ...Object.values(info?.individualVolunteers ?? {}).flatMap((volunteer) => [
      volunteer.completedRequirements,
      volunteer.exemptedRequirements,
    ]),
  ];
  return sources.some((requirements) => anyExpiryWithin(requirements, window));
}

function targetFor(
  subject: ApprovalLedgerRow['appliesTo'][number] | undefined,
  owner: { familyId: string } | { communityId: string }
): RequirementTarget | undefined {
  if (!subject || !hasIdentity(subject.id)) return;
  if ('communityId' in owner)
    return subject.scope === 'organization'
      ? { kind: 'organization', communityId: owner.communityId }
      : undefined;
  if (subject.scope === 'family')
    return { kind: 'family', familyId: owner.familyId };
  if (subject.scope === 'person')
    return {
      kind: 'individual',
      familyId: owner.familyId,
      familyMemberId: subject.id,
    };
}

const coverageStatuses = new Set<ApprovalLedgerRow['status']>([
  'completed',
  'exempted',
  'expiring',
  'expired',
]);

function itemsFromLedger(
  scope: LocationScope,
  rows: readonly ApprovalLedgerRow[],
  owner: { familyId: string } | { communityId: string },
  window: ReturnType<typeof horizon>
): ExpiringRequirementWorkItem[] {
  const latest = new Map<
    string,
    { target: RequirementTarget; actionName: string; rows: ApprovalLedgerRow[] }
  >();
  const neverExpires = new Set<string>();

  for (const row of rows) {
    if (!coverageStatuses.has(row.status) || !hasIdentity(row.requirementName))
      continue;
    const target = targetFor(row.appliesTo[0], owner);
    if (!target) continue;
    const key = requirementKey(scope, target, row.requirementName);
    if (!dateOnly(row.validUntil)) {
      neverExpires.add(key);
      continue;
    }
    const current = latest.get(key);
    const currentDate = dateOnly(current?.rows[0].validUntil);
    const rowDate = dateOnly(row.validUntil)!;
    if (!current || !currentDate || rowDate > currentDate)
      latest.set(key, { target, actionName: row.requirementName, rows: [row] });
    else if (rowDate === currentDate) current.rows.push(row);
  }

  return [...latest].flatMap(([key, { target, actionName, rows }]) => {
    // validUntil is the last day the completion counts; the requirement lapses
    // the next day, which is also when an approval that depends on it expires.
    const expirationDate = nextDay(dateOnly(rows[0].validUntil)!);
    if (
      neverExpires.has(key) ||
      expirationDate < window.from ||
      expirationDate > window.to
    )
      return [];
    const roleNames = [...new Set(rows.flatMap((row) => row.neededForRoles))];
    return [
      {
        key,
        snoozeToken: JSON.stringify([key, expirationDate]),
        scope,
        target,
        actionName,
        expirationDate,
        affectedRoles: roleNames.map((roleName) => ({
          scope: target.kind,
          roleName,
        })),
      },
    ];
  });
}

function requirementKey(
  scope: LocationScope,
  target: RequirementTarget,
  actionName: string
) {
  return JSON.stringify([
    'expiring-requirement',
    1,
    scope.organizationId,
    scope.locationId,
    target.kind,
    target.kind === 'organization' ? target.communityId : target.familyId,
    target.kind === 'individual' ? target.familyMemberId : null,
    actionName,
  ]);
}

type Coverage = {
  roleNames?: string[];
  expiresAt?: Date;
};

/**
 * Reads a family's completions and exemptions directly, applying the same
 * subject and role rules as the approval ledger, without building every
 * ledger row. This keeps the dashboard fast for locations with thousands of
 * volunteer families.
 */
function itemsForFamily(
  scope: LocationScope,
  family: CombinedFamilyInfo,
  familyId: string,
  window: ReturnType<typeof horizon>
): ExpiringRequirementWorkItem[] {
  const input = familyApprovalLedgerInput(family, familyId);
  const appliedRoleNames = buildAppliedRoleNames(input);
  const familyRoleNames = new Set([
    ...Object.keys(input.family.familyRoleApprovals),
    ...input.family.roleRemovals.map(({ roleName }) => roleName),
  ]);
  const coverage = (
    completed: readonly CompletedRequirementInfo[] = [],
    exempted: readonly ExemptedRequirementInfo[] = []
  ): (Coverage & { name?: string })[] => [
    ...completed.map((requirement) => ({
      name: requirement.requirementName,
      roleNames: requirement.roleNames,
      expiresAt: requirement.expiresAtUtc,
    })),
    ...exempted.map((requirement) => ({
      name: requirement.requirementName,
      roleNames: requirement.roleNames,
      expiresAt: requirement.exemptionExpiresAtUtc,
    })),
  ];
  const sources: {
    target: RequirementTarget;
    entries: ReturnType<typeof coverage>;
  }[] = [
    {
      target: { kind: 'family', familyId },
      entries: coverage(
        input.family.completedRequirements,
        input.family.exemptedRequirements
      ),
    },
    ...input.individuals.map((individual) => ({
      target: {
        kind: 'individual' as const,
        familyId,
        familyMemberId: individual.id,
      },
      entries: coverage(
        individual.completedRequirements,
        individual.exemptedRequirements
      ),
    })),
  ];

  return sources.flatMap(({ target, entries }) => {
    const latest = new Map<
      string,
      { time: number; roles: Set<string> } | 'never'
    >();
    for (const { name, roleNames, expiresAt } of entries) {
      if (!hasIdentity(name)) continue;
      const originalRoles = (roleNames ?? []).filter(hasIdentity);
      const roles = filterAppliedRoles(originalRoles, appliedRoleNames);
      if (!shouldIncludeRoleRelatedRow(originalRoles, roles)) continue;
      const current = latest.get(name);
      if (current === 'never') continue;
      const time = expiresAt?.getTime();
      if (time === undefined || !Number.isFinite(time)) {
        latest.set(name, 'never');
      } else if (!current || time > current.time) {
        latest.set(name, { time, roles: new Set(roles) });
      } else if (time === current.time) {
        roles.forEach((role) => current.roles.add(role));
      }
    }
    return [...latest].flatMap(([actionName, value]) => {
      if (value === 'never' || !withinHorizon(value.time, window)) return [];
      const expirationDate = nextDay(dateOnly(new Date(value.time))!);
      const key = requirementKey(scope, target, actionName);
      return [
        {
          key,
          snoozeToken: JSON.stringify([key, expirationDate]),
          scope,
          target,
          actionName,
          expirationDate,
          affectedRoles: [...value.roles].sort().map((roleName) => ({
            scope: familyRoleNames.has(roleName) ? 'family' : target.kind,
            roleName,
          })),
        },
      ];
    });
  });
}

export function buildExpiringRequirementWorkQueue(
  scope: LocationScope,
  families: readonly CombinedFamilyInfo[],
  organizations: readonly OrganizationLedger[],
  evaluationTime: Date
): ExpiringRequirementWorkItem[] {
  if (!hasIdentity(scope.organizationId) || !hasIdentity(scope.locationId))
    return [];
  const window = horizon(evaluationTime);

  const familyItems = families.flatMap((family) => {
    const familyId = family.family?.id;
    if (
      !hasIdentity(familyId) ||
      !family.volunteerFamilyInfo ||
      !family.userPermissions?.includes(Permission.ViewApprovalStatus) ||
      !family.userPermissions.includes(Permission.ViewApprovalProgress) ||
      !familyHasExpiryNear(family, evaluationTime)
    )
      return [];
    return itemsForFamily(scope, family, familyId, window);
  });

  const organizationItems = organizations.flatMap(({ communityId, rows }) =>
    hasIdentity(communityId)
      ? itemsFromLedger(scope, rows, { communityId }, window)
      : []
  );

  return [...familyItems, ...organizationItems].sort(
    (left, right) =>
      left.expirationDate.localeCompare(right.expirationDate) ||
      (left.key === right.key ? 0 : left.key < right.key ? -1 : 1)
  );
}

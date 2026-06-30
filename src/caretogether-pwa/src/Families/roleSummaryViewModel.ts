import type {
  CompletedRequirementInfo,
  DateOnlyTimelineOfRoleApprovalStatus,
  ExemptedRequirementInfo,
  FamilyRoleApprovalStatus,
  IndividualRoleApprovalStatus,
  RoleRemoval,
  ValueTupleOfStringAndValueTuple_2Of,
} from '../GeneratedClient';
import { RoleApprovalStatus } from '../GeneratedClient';
import type {
  IndividualVolunteerContext,
  RequirementContext,
} from '../Requirements/RequirementContext';
import type {
  ApprovalLedgerOccurrence,
  ApprovalLedgerRow,
  ApprovalLedgerStatus,
} from './approvalLedgerViewModel';

export type RoleSummarySubject = {
  scope: 'family' | 'person';
  id: string;
  label: string;
};

export type RoleSummaryRequirementCounts = {
  missingCount: number;
  expiredCount: number;
  expiringCount: number;
  completedCount: number;
  exemptedCount: number;
  availableApplicationCount: number;
  totalRequirementCount: number;
  completionPercentage: number;
};

export type RoleSummaryRequirement = {
  id: string;
  status: ApprovalLedgerStatus;
  requirementName: string;
  completedOrExemptedOn?: Date;
  validUntil?: Date;
  ledgerRow: ApprovalLedgerRow;
  occurrences: ApprovalLedgerOccurrence[];
};

export type RoleSummaryCard = RoleSummaryRequirementCounts & {
  id: string;
  subject: RoleSummarySubject;
  roleName: string;
  status: RoleApprovalStatus;
  effectiveStatus?: DateOnlyTimelineOfRoleApprovalStatus;
  effectiveDate?: Date;
  roleApproval: FamilyRoleApprovalStatus | IndividualRoleApprovalStatus;
  roleRemoval?: RoleRemoval;
  context: RequirementContext;
  requirements: RoleSummaryRequirement[];
};

export type RemovedRoleSummary = {
  id: string;
  subject: RoleSummarySubject;
  roleName: string;
  roleRemoval: RoleRemoval;
  context: RequirementContext;
};

type ApprovalRequirementSource = {
  context: RequirementContext;
  completedRequirements?: CompletedRequirementInfo[];
  exemptedRequirements?: ExemptedRequirementInfo[];
  missingRequirements?: ValueTupleOfStringAndValueTuple_2Of[];
  availableApplications?: string[];
};

export type RoleSummaryFamilySource = ApprovalRequirementSource & {
  subject?: RoleSummarySubject;
  familyRoleApprovals?: Record<string, FamilyRoleApprovalStatus>;
  roleRemovals?: RoleRemoval[];
};

export type RoleSummaryIndividualSource = ApprovalRequirementSource & {
  subject: RoleSummarySubject;
  context: IndividualVolunteerContext;
  approvalStatusByRole?: Record<string, IndividualRoleApprovalStatus>;
  roleRemovals?: RoleRemoval[];
};

export type BuildRoleSummaryCardsInput = {
  family: RoleSummaryFamilySource;
  individuals?: RoleSummaryIndividualSource[];
  approvalLedgerRows?: ApprovalLedgerRow[];
};

const EXPIRING_APPROVAL_DAYS = 30;

const qualifyingStatuses = new Set<RoleApprovalStatus>([
  RoleApprovalStatus.Approved,
  RoleApprovalStatus.Onboarded,
  RoleApprovalStatus.Prospective,
]);

const DEFAULT_FAMILY_SUBJECT: RoleSummarySubject = {
  scope: 'family',
  id: 'family',
  label: 'Family',
};

function normalizeRoleName(role: string) {
  return role.trim().replace(/\s+/g, ' ');
}

function roleKey(role: string) {
  return normalizeRoleName(role).toLocaleLowerCase();
}

function isActiveRoleRemoval(
  roleRemovals: RoleRemoval[] | undefined,
  role: string
) {
  const normalizedRole = roleKey(role);

  return roleRemovals?.some(
    (removal) =>
      roleKey(removal.roleName ?? '') === normalizedRole &&
      (!removal.effectiveUntil || removal.effectiveUntil > new Date())
  );
}

function matchingRoleRemoval(
  roleRemovals: RoleRemoval[] | undefined,
  role: string
) {
  const normalizedRole = roleKey(role);

  return roleRemovals?.find(
    (removal) => roleKey(removal.roleName ?? '') === normalizedRole
  );
}

function roleExistsInApprovalMap(
  roleApprovals:
    | Record<string, FamilyRoleApprovalStatus | IndividualRoleApprovalStatus>
    | undefined,
  role: string
) {
  const normalizedRole = roleKey(role);

  return Object.keys(roleApprovals ?? {}).some(
    (roleName) => roleKey(roleName) === normalizedRole
  );
}

function roleNamesFromMissingRequirement(
  requirement: ValueTupleOfStringAndValueTuple_2Of
) {
  return requirement.item2?.map((version) => version.item2 ?? '') ?? [];
}

function requirementAppliesToRole(roles: string[] | undefined, role: string) {
  const normalizedRole = roleKey(role);

  return roles?.some((candidate) => roleKey(candidate) === normalizedRole) ?? false;
}

function isExpired(date?: Date, now = new Date()) {
  return date !== undefined && date <= now;
}

function isExpiring(date?: Date, now = new Date()) {
  if (!date || isExpired(date, now)) {
    return false;
  }

  const cutoff = new Date(now);
  cutoff.setDate(cutoff.getDate() + EXPIRING_APPROVAL_DAYS);

  return date <= cutoff;
}

function effectiveDate(status?: DateOnlyTimelineOfRoleApprovalStatus) {
  const now = new Date();
  const currentStatusRange = status?.ranges?.find(
    (range) => range.start && range.start <= now && (!range.end || range.end >= now)
  );

  return currentStatusRange?.start;
}

function requirementCountsForRole(
  source: ApprovalRequirementSource,
  roleName: string,
  roleAvailableApplications: string[] | undefined
): RoleSummaryRequirementCounts {
  const missingCount =
    source.missingRequirements?.filter((requirement) =>
      requirementAppliesToRole(roleNamesFromMissingRequirement(requirement), roleName)
    ).length ?? 0;
  const roleCompletedRequirements =
    source.completedRequirements?.filter((requirement) =>
      requirementAppliesToRole(requirement.roleNames, roleName)
    ) ?? [];
  const roleExemptedRequirements =
    source.exemptedRequirements?.filter((requirement) =>
      requirementAppliesToRole(requirement.roleNames, roleName)
    ) ?? [];
  const expiredCompletedCount = roleCompletedRequirements.filter((requirement) =>
    isExpired(requirement.expiresAtUtc)
  ).length;
  const expiringCompletedCount = roleCompletedRequirements.filter((requirement) =>
    isExpiring(requirement.expiresAtUtc)
  ).length;
  const expiredExemptedCount = roleExemptedRequirements.filter((requirement) =>
    isExpired(requirement.exemptionExpiresAtUtc)
  ).length;
  const expiringExemptedCount = roleExemptedRequirements.filter((requirement) =>
    isExpiring(requirement.exemptionExpiresAtUtc)
  ).length;
  const completedCount = roleCompletedRequirements.length;
  const exemptedCount = roleExemptedRequirements.length;
  const availableApplicationCount = roleAvailableApplications?.length ?? 0;
  const expiredCount = expiredCompletedCount + expiredExemptedCount;
  const expiringCount = expiringCompletedCount + expiringExemptedCount;
  const totalRequirementCount =
    missingCount + completedCount + exemptedCount + availableApplicationCount;
  const completionPercentage =
    totalRequirementCount === 0
      ? 0
      : Math.round(((completedCount + exemptedCount) / totalRequirementCount) * 100);

  return {
    missingCount,
    expiredCount,
    expiringCount,
    completedCount,
    exemptedCount,
    availableApplicationCount,
    totalRequirementCount,
    completionPercentage,
  };
}

function roleSummaryId(subject: RoleSummarySubject, roleName: string) {
  return [subject.scope, subject.id, normalizeRoleName(roleName)].join('|');
}

function removedRoleSummaryId(
  subject: RoleSummarySubject,
  roleName: string,
  roleRemoval: RoleRemoval
) {
  return [
    'removed',
    subject.scope,
    subject.id,
    normalizeRoleName(roleName),
    roleRemoval.effectiveSince?.toISOString() ?? '',
  ].join('|');
}

function subjectMatches(
  subject: RoleSummarySubject,
  rowSubject: ApprovalLedgerRow['appliesTo'][number] | undefined
) {
  return (
    rowSubject !== undefined &&
    subject.scope === rowSubject.scope &&
    subject.id === rowSubject.id
  );
}

function requirementStatusPriority(status: ApprovalLedgerStatus) {
  const priority: ApprovalLedgerStatus[] = [
    'missing',
    'expired',
    'expiring',
    'completed',
    'exempted',
    'availableApplication',
  ];

  return priority.indexOf(status);
}

function roleSummaryRequirements({
  approvalLedgerRows,
  roleAvailableApplications,
  roleName,
  subject,
}: {
  approvalLedgerRows: ApprovalLedgerRow[] | undefined;
  roleAvailableApplications: string[] | undefined;
  roleName: string;
  subject: RoleSummarySubject;
}) {
  const availableApplications = new Set(roleAvailableApplications ?? []);

  return (
    approvalLedgerRows
      ?.filter((row) => subjectMatches(subject, row.appliesTo[0]))
      .filter(
        (row) =>
          requirementAppliesToRole(row.neededForRoles, roleName) ||
          (row.status === 'availableApplication' &&
            availableApplications.has(row.requirementName))
      )
      .map(
        (row): RoleSummaryRequirement => ({
          id: row.id,
          status: row.status,
          requirementName: row.requirementName,
          completedOrExemptedOn: row.completedOrExemptedOn,
          validUntil: row.validUntil,
          ledgerRow: row,
          occurrences: row.occurrences,
        })
      )
      .sort((a, b) => {
        const statusOrder =
          requirementStatusPriority(a.status) - requirementStatusPriority(b.status);

        if (statusOrder !== 0) {
          return statusOrder;
        }

        return a.requirementName.localeCompare(b.requirementName);
      }) ?? []
  );
}

function qualifyingRoleEntries<T extends FamilyRoleApprovalStatus | IndividualRoleApprovalStatus>(
  roleApprovals: Record<string, T> | undefined,
  roleRemovals: RoleRemoval[] | undefined
) {
  const entries = new Map<string, [string, T]>();

  Object.entries(roleApprovals ?? {})
    .filter(
      ([roleName, approval]) =>
        approval.currentStatus !== undefined &&
        qualifyingStatuses.has(approval.currentStatus) &&
        !isActiveRoleRemoval(roleRemovals, roleName)
    )
    .sort(([a], [b]) => normalizeRoleName(a).localeCompare(normalizeRoleName(b)))
    .forEach(([roleName, approval]) => {
      const key = roleKey(roleName);

      if (entries.has(key)) {
        return;
      }

      entries.set(key, [normalizeRoleName(roleName), approval]);
    });

  return [...entries.values()];
}

function buildCardsForSubject<T extends FamilyRoleApprovalStatus | IndividualRoleApprovalStatus>({
  source,
  subject,
  roleApprovals,
  roleRemovals,
  availableApplicationsForRole,
  approvalLedgerRows,
}: {
  source: ApprovalRequirementSource;
  subject: RoleSummarySubject;
  roleApprovals: Record<string, T> | undefined;
  roleRemovals: RoleRemoval[] | undefined;
  availableApplicationsForRole: (roleApproval: T) => string[] | undefined;
  approvalLedgerRows: ApprovalLedgerRow[] | undefined;
}) {
  return qualifyingRoleEntries(roleApprovals, roleRemovals).map(([
    roleName,
    roleApproval,
  ]): RoleSummaryCard => {
    const roleAvailableApplications = availableApplicationsForRole(roleApproval);

    return {
      id: roleSummaryId(subject, roleName),
      subject,
      roleName,
      status: roleApproval.currentStatus!,
      effectiveStatus: roleApproval.effectiveRoleApprovalStatus,
      effectiveDate: effectiveDate(roleApproval.effectiveRoleApprovalStatus),
      roleApproval,
      roleRemoval: matchingRoleRemoval(roleRemovals, roleName),
      context: source.context,
      ...requirementCountsForRole(
        source,
        roleName,
        roleAvailableApplications
      ),
      requirements: roleSummaryRequirements({
        approvalLedgerRows,
        roleAvailableApplications,
        roleName,
        subject,
      }),
    };
  });
}

function buildRemovedRolesForSubject({
  context,
  includeRoleRemoval,
  roleRemovals,
  subject,
}: {
  context: RequirementContext;
  includeRoleRemoval?: (roleRemoval: RoleRemoval) => boolean;
  roleRemovals: RoleRemoval[] | undefined;
  subject: RoleSummarySubject;
}) {
  return (
    roleRemovals
      ?.filter(
        (roleRemoval) =>
          roleRemoval.roleName &&
          !roleRemoval.effectiveUntil &&
          (includeRoleRemoval?.(roleRemoval) ?? true)
      )
      .map(
        (roleRemoval): RemovedRoleSummary => ({
          id: removedRoleSummaryId(subject, roleRemoval.roleName!, roleRemoval),
          subject,
          roleName: normalizeRoleName(roleRemoval.roleName!),
          roleRemoval,
          context,
        })
      )
      .sort((a, b) => {
        const dateOrder =
          (b.roleRemoval.effectiveSince?.getTime() ?? 0) -
          (a.roleRemoval.effectiveSince?.getTime() ?? 0);

        if (dateOrder !== 0) {
          return dateOrder;
        }

        return a.roleName.localeCompare(b.roleName);
      }) ?? []
  );
}

export function buildRoleSummaryCards(input: BuildRoleSummaryCardsInput) {
  const familySubject = input.family.subject ?? DEFAULT_FAMILY_SUBJECT;
  const familyCards = buildCardsForSubject({
    source: input.family,
    subject: familySubject,
    roleApprovals: input.family.familyRoleApprovals,
    roleRemovals: input.family.roleRemovals,
    availableApplicationsForRole: (roleApproval) =>
      roleApproval.currentAvailableFamilyApplications,
    approvalLedgerRows: input.approvalLedgerRows,
  });
  const individualCards =
    input.individuals?.flatMap((individual) =>
      buildCardsForSubject({
        source: individual,
        subject: individual.subject,
        roleApprovals: individual.approvalStatusByRole,
        roleRemovals: individual.roleRemovals,
        availableApplicationsForRole: (roleApproval) =>
          roleApproval.currentAvailableApplications,
        approvalLedgerRows: input.approvalLedgerRows,
      })
    ) ?? [];

  return [...familyCards, ...individualCards].sort((a, b) => {
    const subjectOrder = a.subject.label.localeCompare(b.subject.label);

    if (subjectOrder !== 0) {
      return subjectOrder;
    }

    return a.roleName.localeCompare(b.roleName);
  });
}

export function buildRemovedRoleSummaries(input: BuildRoleSummaryCardsInput) {
  const familySubject = input.family.subject ?? DEFAULT_FAMILY_SUBJECT;
  const familyRemovedRoles = buildRemovedRolesForSubject({
    context: input.family.context,
    roleRemovals: input.family.roleRemovals,
    subject: familySubject,
  });
  const individualRemovedRoles =
    input.individuals?.flatMap((individual) =>
      buildRemovedRolesForSubject({
        context: individual.context,
        includeRoleRemoval: (roleRemoval) =>
          roleExistsInApprovalMap(
            individual.approvalStatusByRole,
            roleRemoval.roleName ?? ''
          ),
        roleRemovals: individual.roleRemovals,
        subject: individual.subject,
      })
    ) ?? [];

  return [...familyRemovedRoles, ...individualRemovedRoles].sort((a, b) => {
    const dateOrder =
      (b.roleRemoval.effectiveSince?.getTime() ?? 0) -
      (a.roleRemoval.effectiveSince?.getTime() ?? 0);

    if (dateOrder !== 0) {
      return dateOrder;
    }

    return a.subject.label.localeCompare(b.subject.label);
  });
}

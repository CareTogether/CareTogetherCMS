import { useMemo } from 'react';
import {
  CommunityInfo,
  CompletedRequirementInfo,
  ExemptedRequirementInfo,
  OrganizationRoleApprovalStatus,
  RoleApprovalStatus,
  RoleRemoval,
} from '../GeneratedClient';
import type {
  ApprovalLedgerOccurrence,
  ApprovalLedgerRow,
  ApprovalLedgerStatus,
} from '../Families/approvalLedgerViewModel';
import { isRoleApprovalStatusVisibleInSummary } from '../Volunteers/roleApprovalStatusPresentation';

export type OrganizationRoleSummaryCard = {
  id: string;
  roleName: string;
  status: RoleApprovalStatus;
  effectiveDate?: Date;
  completionPercentage: number;
  requirements: ApprovalLedgerRow[];
  roleApproval: OrganizationRoleApprovalStatus;
};

export type RemovedOrganizationRoleSummary = {
  id: string;
  roleName: string;
  roleRemoval: RoleRemoval;
};

const EXPIRING_APPROVAL_DAYS = 30;
const STATUS_PRIORITY: ApprovalLedgerStatus[] = [
  'expired',
  'missing',
  'expiring',
  'availableApplication',
  'exempted',
  'completed',
];

function normalizeStrings(values: (string | undefined | null)[]) {
  return [...new Set(values.filter(Boolean) as string[])].sort((a, b) =>
    a.localeCompare(b)
  );
}

function normalizedRoleName(roleName: string | undefined) {
  return (roleName ?? '').trim().replace(/\s+/g, ' ');
}

function roleKey(roleName: string | undefined) {
  return normalizedRoleName(roleName).toLocaleLowerCase();
}

function isExpired(date?: Date, now = new Date()) {
  return date !== undefined && date <= now;
}

function isExpiring(date?: Date, now = new Date()) {
  if (!date || isExpired(date, now)) return false;

  const cutoff = new Date(now);
  cutoff.setDate(cutoff.getDate() + EXPIRING_APPROVAL_DAYS);
  return date <= cutoff;
}

function completedStatus(
  requirement: CompletedRequirementInfo
): ApprovalLedgerStatus {
  if (isExpired(requirement.expiresAtUtc)) return 'expired';
  if (isExpiring(requirement.expiresAtUtc)) return 'expiring';
  return 'completed';
}

function exemptedStatus(
  requirement: ExemptedRequirementInfo
): ApprovalLedgerStatus {
  if (isExpired(requirement.exemptionExpiresAtUtc)) return 'expired';
  if (isExpiring(requirement.exemptionExpiresAtUtc)) return 'expiring';
  return 'exempted';
}

function currentRoleVersions(role: OrganizationRoleApprovalStatus) {
  const now = new Date();
  return role.roleVersionApprovals.filter(
    (version) => !version.supersededAtUtc || version.supersededAtUtc > now
  );
}

function roleDetailsByRequirement(
  approvalStatusByRole: Record<string, OrganizationRoleApprovalStatus>
) {
  const details = new Map<
    string,
    {
      roleNames: string[];
      roleLabels: string[];
      versions: { version: string; roleName: string }[];
    }
  >();

  Object.entries(approvalStatusByRole).forEach(([roleName, role]) => {
    currentRoleVersions(role).forEach((version) => {
      version.requirements.forEach((requirement) => {
        const current = details.get(requirement.actionName) ?? {
          roleNames: [],
          roleLabels: [],
          versions: [],
        };
        const versionLabel = [roleName, version.version]
          .filter(Boolean)
          .join(' ');
        details.set(requirement.actionName, {
          roleNames: normalizeStrings([...current.roleNames, roleName]),
          roleLabels: normalizeStrings([...current.roleLabels, versionLabel]),
          versions: [
            ...current.versions,
            { version: version.version, roleName },
          ],
        });
      });
    });
  });

  return details;
}

function occurrence(
  organizationId: string,
  organizationName: string,
  status: ApprovalLedgerOccurrence['status'],
  requirementName: string,
  requirement: ApprovalLedgerOccurrence['requirement'],
  index: number,
  policyVersions?: { version: string; roleName: string }[]
): ApprovalLedgerOccurrence {
  return {
    id: [organizationId, status, requirementName, index].join('|'),
    status,
    subject: {
      scope: 'organization',
      id: organizationId,
      label: organizationName,
    },
    context: { kind: 'Organization', organizationId },
    requirement,
    policyVersions,
    isAvailableApplication: status === 'availableApplication',
  };
}

function buildOrganizationApprovalLedgerRows(communityInfo?: CommunityInfo) {
  if (!communityInfo) return [];

  const organization = communityInfo.community;
  const approval = communityInfo.approvalInfo;
  if (!approval) return [];

  const subject = {
    scope: 'organization' as const,
    id: organization.id,
    label: organization.name,
  };
  const roleDetails = roleDetailsByRequirement(approval.approvalStatusByRole);
  const roleInfo = (requirementName: string, explicitRoles?: string[]) => {
    const details = roleDetails.get(requirementName);
    const roleNames = normalizeStrings(
      explicitRoles?.length ? explicitRoles : (details?.roleNames ?? [])
    );
    return {
      roleNames,
      roleLabels:
        explicitRoles?.length || !details ? roleNames : details.roleLabels,
      versions: details?.versions,
    };
  };

  const completedRows = approval.completedRequirements.map(
    (requirement, index): ApprovalLedgerRow => {
      const roles = roleInfo(
        requirement.requirementName,
        requirement.roleNames
      );
      return {
        id: [
          'organization',
          'completed',
          requirement.completedRequirementId,
        ].join('|'),
        status: completedStatus(requirement),
        requirementName: requirement.requirementName,
        appliesTo: [subject],
        completedOrExemptedOn: requirement.completedAtUtc,
        validUntil: requirement.expiresAtUtc,
        neededForRoles: roles.roleNames,
        neededForRoleLabels: roles.roleNames,
        linkedDocumentIds: normalizeStrings([requirement.uploadedDocumentId]),
        noteIds: [],
        completedOrExemptedByUserId: requirement.userId,
        notes: [],
        occurrences: [
          occurrence(
            organization.id,
            organization.name,
            'completed',
            requirement.requirementName,
            requirement,
            index,
            roles.versions
          ),
        ],
      };
    }
  );

  const exemptedRows = approval.exemptedRequirements.map(
    (requirement, index): ApprovalLedgerRow => {
      const roles = roleInfo(
        requirement.requirementName,
        requirement.roleNames
      );
      return {
        id: [
          'organization',
          'exempted',
          requirement.requirementName,
          requirement.timestampUtc.toISOString(),
        ].join('|'),
        status: exemptedStatus(requirement),
        requirementName: requirement.requirementName,
        appliesTo: [subject],
        completedOrExemptedOn: requirement.timestampUtc,
        validUntil: requirement.exemptionExpiresAtUtc,
        neededForRoles: roles.roleNames,
        neededForRoleLabels: roles.roleNames,
        linkedDocumentIds: [],
        noteIds: [],
        completedOrExemptedByUserId: requirement.userId,
        notes: normalizeStrings([requirement.additionalComments]),
        occurrences: [
          occurrence(
            organization.id,
            organization.name,
            'exempted',
            requirement.requirementName,
            requirement,
            index,
            roles.versions
          ),
        ],
      };
    }
  );

  const missingRows = approval.missingRequirements.map(
    (requirementName, index): ApprovalLedgerRow => {
      const roles = roleInfo(requirementName);
      return {
        id: ['organization', 'missing', requirementName].join('|'),
        status: 'missing',
        requirementName,
        appliesTo: [subject],
        neededForRoles: roles.roleNames,
        neededForRoleLabels: roles.roleLabels,
        linkedDocumentIds: [],
        noteIds: [],
        notes: [],
        occurrences: [
          occurrence(
            organization.id,
            organization.name,
            'missing',
            requirementName,
            requirementName,
            index,
            roles.versions
          ),
        ],
      };
    }
  );

  const applicationRows = approval.availableApplications.map(
    (requirementName, index): ApprovalLedgerRow => {
      const roles = roleInfo(requirementName);
      return {
        id: ['organization', 'application', requirementName].join('|'),
        status: 'availableApplication',
        requirementName,
        appliesTo: [subject],
        neededForRoles: roles.roleNames,
        neededForRoleLabels: roles.roleNames,
        linkedDocumentIds: [],
        noteIds: [],
        notes: [],
        occurrences: [
          occurrence(
            organization.id,
            organization.name,
            'availableApplication',
            requirementName,
            requirementName,
            index,
            roles.versions
          ),
        ],
      };
    }
  );

  return [
    ...completedRows,
    ...exemptedRows,
    ...missingRows,
    ...applicationRows,
  ].sort((a, b) => {
    const statusOrder =
      STATUS_PRIORITY.indexOf(a.status) - STATUS_PRIORITY.indexOf(b.status);
    return statusOrder || a.requirementName.localeCompare(b.requirementName);
  });
}

function activeRoleRemoval(roleRemovals: RoleRemoval[], roleName: string) {
  const now = new Date();
  const key = roleKey(roleName);
  return roleRemovals.some(
    (removal) =>
      roleKey(removal.roleName) === key &&
      (!removal.effectiveUntil || removal.effectiveUntil > now)
  );
}

function effectiveDate(role: OrganizationRoleApprovalStatus) {
  const now = new Date();
  return role.effectiveRoleApprovalStatus?.ranges.find(
    (range) => range.start <= now && (!range.end || range.end >= now)
  )?.start;
}

function roleCards(
  communityInfo: CommunityInfo | undefined,
  ledgerRows: ApprovalLedgerRow[]
) {
  if (!communityInfo) return [];

  const approval = communityInfo.approvalInfo;
  if (!approval) return [];

  return Object.entries(approval.approvalStatusByRole)
    .filter(
      ([roleName, role]) =>
        role.currentStatus !== undefined &&
        isRoleApprovalStatusVisibleInSummary(role.currentStatus) &&
        !activeRoleRemoval(approval.roleRemovals, roleName)
    )
    .map(([roleName, role]): OrganizationRoleSummaryCard => {
      const requirements = ledgerRows.filter((row) =>
        row.neededForRoles.some(
          (candidate) => roleKey(candidate) === roleKey(roleName)
        )
      );
      const completedCount = requirements.filter((row) =>
        ['completed', 'exempted', 'expiring'].includes(row.status)
      ).length;
      const completionPercentage =
        requirements.length === 0
          ? 0
          : Math.round((completedCount / requirements.length) * 100);

      return {
        id: ['organization', communityInfo.community.id, roleName].join('|'),
        roleName,
        status: role.currentStatus!,
        effectiveDate: effectiveDate(role),
        completionPercentage,
        requirements,
        roleApproval: role,
      };
    })
    .sort((a, b) => a.roleName.localeCompare(b.roleName));
}

function removedRoleCards(communityInfo?: CommunityInfo) {
  if (!communityInfo) return [];

  const removals = communityInfo.approvalInfo?.roleRemovals ?? [];
  return removals
    .filter((removal) => removal.roleName && !removal.effectiveUntil)
    .map(
      (removal): RemovedOrganizationRoleSummary => ({
        id: [
          'removed',
          communityInfo.community.id,
          removal.roleName,
          removal.effectiveSince?.toISOString() ?? '',
        ].join('|'),
        roleName: normalizedRoleName(removal.roleName),
        roleRemoval: removal,
      })
    )
    .sort(
      (a, b) =>
        (b.roleRemoval.effectiveSince?.getTime() ?? 0) -
          (a.roleRemoval.effectiveSince?.getTime() ?? 0) ||
        a.roleName.localeCompare(b.roleName)
    );
}

export function useOrganizationApprovalViewModel(
  communityInfo?: CommunityInfo
) {
  const approvalLedgerRows = useMemo(
    () => buildOrganizationApprovalLedgerRows(communityInfo),
    [communityInfo]
  );
  const roleSummaryCards = useMemo(
    () => roleCards(communityInfo, approvalLedgerRows),
    [approvalLedgerRows, communityInfo]
  );
  const removedRoleSummaries = useMemo(
    () => removedRoleCards(communityInfo),
    [communityInfo]
  );
  const approvalAttentionCounts = useMemo(
    () =>
      approvalLedgerRows.reduce(
        (counts, row) => {
          if (row.status === 'missing') {
            return { ...counts, missing: counts.missing + 1 };
          }
          if (row.status === 'expired') {
            return { ...counts, expired: counts.expired + 1 };
          }
          return counts;
        },
        { missing: 0, expired: 0 }
      ),
    [approvalLedgerRows]
  );

  return {
    approvalAttentionCounts,
    approvalLedgerRows,
    removedRoleSummaries,
    roleSummaryCards,
  };
}

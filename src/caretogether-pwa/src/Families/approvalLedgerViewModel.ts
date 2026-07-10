import type {
  CompletedRequirementInfo,
  ExemptedRequirementInfo,
  FamilyRoleApprovalStatus,
  IndividualRoleApprovalStatus,
  RequirementDefinition,
  RoleRemoval,
  ValueTupleOfStringAndValueTuple_2Of,
} from '../GeneratedClient';
import type { RequirementContext } from '../Requirements/RequirementContext';

export type ApprovalLedgerStatus =
  | 'missing'
  | 'completed'
  | 'exempted'
  | 'expiring'
  | 'expired'
  | 'availableApplication';

export type ApprovalLedgerSubject = {
  scope: 'family' | 'person';
  id: string;
  label: string;
};

export type ApprovalLedgerOccurrenceStatus =
  | 'missing'
  | 'completed'
  | 'exempted'
  | 'availableApplication';

export type ApprovalLedgerOccurrence = {
  id: string;
  status: ApprovalLedgerOccurrenceStatus;
  subject: ApprovalLedgerSubject;
  context: RequirementContext;
  requirement:
    | string
    | RequirementDefinition
    | CompletedRequirementInfo
    | ExemptedRequirementInfo;
  policyVersions?: { version: string; roleName: string }[];
  isAvailableApplication?: boolean;
  v1CaseId?: string;
};

export type ApprovalLedgerRow = {
  id: string;
  status: ApprovalLedgerStatus;
  requirementName: string;
  appliesTo: ApprovalLedgerSubject[];
  completedOrExemptedOn?: Date;
  validUntil?: Date;
  neededForRoles: string[];
  neededForRoleLabels: string[];
  linkedDocumentIds: string[];
  noteIds: string[];
  completedOrExemptedByUserId?: string;
  notes: string[];
  occurrences: ApprovalLedgerOccurrence[];
};

type ApprovalRequirementSource = {
  context: RequirementContext;
  completedRequirements?: CompletedRequirementInfo[];
  exemptedRequirements?: ExemptedRequirementInfo[];
  missingRequirements?: ValueTupleOfStringAndValueTuple_2Of[];
  availableApplications?: string[];
};

export type ApprovalLedgerFamilySource = ApprovalRequirementSource & {
  subject?: ApprovalLedgerSubject;
  familyRoleApprovals?: Record<string, FamilyRoleApprovalStatus>;
  roleRemovals?: RoleRemoval[];
};

export type ApprovalLedgerIndividualSource = ApprovalRequirementSource & {
  subject: ApprovalLedgerSubject;
  approvalStatusByRole?: Record<string, IndividualRoleApprovalStatus>;
  roleRemovals?: RoleRemoval[];
};

export type BuildApprovalLedgerRowsInput = {
  family: ApprovalLedgerFamilySource;
  individuals?: ApprovalLedgerIndividualSource[];
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

const DEFAULT_FAMILY_SUBJECT: ApprovalLedgerSubject = {
  scope: 'family',
  id: 'family',
  label: 'Family',
};

function dateKey(date?: Date) {
  return date?.toISOString() ?? '';
}

function normalizeStrings(values: (string | undefined | null)[]) {
  return [...new Set(values.filter(Boolean) as string[])].sort((a, b) =>
    a.localeCompare(b)
  );
}

function roleNamesFromMissingRequirement(
  requirement: ValueTupleOfStringAndValueTuple_2Of
) {
  return normalizeStrings(requirement.item2?.map((version) => version.item2) ?? []);
}

function policyVersionsFromMissingRequirement(
  requirement: ValueTupleOfStringAndValueTuple_2Of
) {
  return requirement.item2?.map((version) => ({
    version: version.item1 ?? '',
    roleName: version.item2 ?? '',
  }));
}

function roleLabelsFromPolicyVersions(
  policyVersions: { version: string; roleName: string }[] | undefined,
  neededForRoles: string[]
) {
  return normalizeStrings(
    policyVersions
      ?.filter((version) => neededForRoles.includes(version.roleName))
      .map((version) =>
        [version.roleName, version.version].filter(Boolean).join(' ')
      ) ?? []
  );
}

function occurrenceId(
  subject: ApprovalLedgerSubject,
  status: ApprovalLedgerOccurrenceStatus,
  requirementName: string,
  index: number
) {
  return [subject.scope, subject.id, status, requirementName, index].join('|');
}

function filterAppliedRoles(roles: string[], appliedRoleNames: Set<string>) {
  if (roles.length === 0) {
    return [];
  }

  return roles.filter((role) => appliedRoleNames.has(role));
}

function shouldIncludeRoleRelatedRow(originalRoles: string[], roles: string[]) {
  return originalRoles.length === 0 || roles.length > 0;
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

function completedStatus(
  requirement: CompletedRequirementInfo
): ApprovalLedgerStatus {
  if (isExpired(requirement.expiresAtUtc)) {
    return 'expired';
  }

  if (isExpiring(requirement.expiresAtUtc)) {
    return 'expiring';
  }

  return 'completed';
}

function exemptedStatus(
  requirement: ExemptedRequirementInfo
): ApprovalLedgerStatus {
  if (isExpired(requirement.exemptionExpiresAtUtc)) {
    return 'expired';
  }

  if (isExpiring(requirement.exemptionExpiresAtUtc)) {
    return 'expiring';
  }

  return 'exempted';
}

function buildAppliedRoleNames(input: BuildApprovalLedgerRowsInput) {
  const roleNames = new Set<string>();

  Object.keys(input.family.familyRoleApprovals ?? {}).forEach((role) =>
    roleNames.add(role)
  );
  input.family.roleRemovals?.forEach((removal) =>
    roleNames.add(removal.roleName)
  );
  input.individuals?.forEach((individual) => {
    Object.keys(individual.approvalStatusByRole ?? {}).forEach((role) =>
      roleNames.add(role)
    );
    individual.roleRemovals?.forEach((removal) =>
      roleNames.add(removal.roleName)
    );
  });

  return roleNames;
}

function rowKey(row: ApprovalLedgerRow) {
  const subject = row.appliesTo[0];

  return [
    subject?.scope ?? '',
    subject?.id ?? '',
    row.status,
    row.requirementName,
    dateKey(row.completedOrExemptedOn),
    dateKey(row.validUntil),
    row.neededForRoles.join(','),
    row.neededForRoleLabels.join(','),
    row.linkedDocumentIds.join(','),
    row.noteIds.join(','),
    row.notes.join(','),
    row.completedOrExemptedByUserId ?? '',
  ].join('|');
}

function addRow(
  rowsByKey: Map<string, ApprovalLedgerRow>,
  row: Omit<ApprovalLedgerRow, 'id'>
) {
  const rowWithId: ApprovalLedgerRow = {
    ...row,
    id: rowKey({ ...row, id: '' }),
  };
  const key = rowKey(rowWithId);
  const existingRow = rowsByKey.get(key);

  if (existingRow) {
    rowsByKey.set(key, {
      ...existingRow,
      occurrences: [...existingRow.occurrences, ...row.occurrences],
    });
    return;
  }

  rowsByKey.set(key, rowWithId);
}

function addCompletedRows({
  rowsByKey,
  subject,
  context,
  requirements,
  appliedRoleNames,
}: {
  rowsByKey: Map<string, ApprovalLedgerRow>;
  subject: ApprovalLedgerSubject;
  context: RequirementContext;
  requirements: CompletedRequirementInfo[];
  appliedRoleNames: Set<string>;
}) {
  requirements.forEach((requirement, index) => {
    const originalRoles = normalizeStrings(requirement.roleNames ?? []);
    const neededForRoles = filterAppliedRoles(originalRoles, appliedRoleNames);

    if (!shouldIncludeRoleRelatedRow(originalRoles, neededForRoles)) {
      return;
    }

    addRow(rowsByKey, {
      status: completedStatus(requirement),
      requirementName: requirement.requirementName,
      appliesTo: [subject],
      completedOrExemptedOn: requirement.completedAtUtc,
      validUntil: requirement.expiresAtUtc,
      neededForRoles,
      neededForRoleLabels: neededForRoles,
      linkedDocumentIds: normalizeStrings([requirement.uploadedDocumentId]),
      noteIds: normalizeStrings([requirement.noteId]),
      completedOrExemptedByUserId: requirement.userId,
      notes: [],
      occurrences: [
        {
          id: occurrenceId(
            subject,
            'completed',
            requirement.requirementName,
            index
          ),
          status: 'completed',
          subject,
          context,
          requirement,
        },
      ],
    });
  });
}

function addExemptedRows({
  rowsByKey,
  subject,
  context,
  requirements,
  appliedRoleNames,
}: {
  rowsByKey: Map<string, ApprovalLedgerRow>;
  subject: ApprovalLedgerSubject;
  context: RequirementContext;
  requirements: ExemptedRequirementInfo[];
  appliedRoleNames: Set<string>;
}) {
  requirements.forEach((requirement, index) => {
    const originalRoles = normalizeStrings(requirement.roleNames ?? []);
    const neededForRoles = filterAppliedRoles(originalRoles, appliedRoleNames);

    if (!shouldIncludeRoleRelatedRow(originalRoles, neededForRoles)) {
      return;
    }

    addRow(rowsByKey, {
      status: exemptedStatus(requirement),
      requirementName: requirement.requirementName,
      appliesTo: [subject],
      completedOrExemptedOn: requirement.timestampUtc,
      validUntil: requirement.exemptionExpiresAtUtc,
      neededForRoles,
      neededForRoleLabels: neededForRoles,
      linkedDocumentIds: [],
      noteIds: [],
      completedOrExemptedByUserId: requirement.userId,
      notes: normalizeStrings([requirement.additionalComments]),
      occurrences: [
        {
          id: occurrenceId(
            subject,
            'exempted',
            requirement.requirementName,
            index
          ),
          status: 'exempted',
          subject,
          context,
          requirement,
        },
      ],
    });
  });
}

function addMissingRows({
  rowsByKey,
  subject,
  context,
  requirements,
  appliedRoleNames,
}: {
  rowsByKey: Map<string, ApprovalLedgerRow>;
  subject: ApprovalLedgerSubject;
  context: RequirementContext;
  requirements: ValueTupleOfStringAndValueTuple_2Of[];
  appliedRoleNames: Set<string>;
}) {
  requirements.forEach((requirement, index) => {
    if (!requirement.item1) {
      return;
    }

    const originalRoles = roleNamesFromMissingRequirement(requirement);
    const neededForRoles = filterAppliedRoles(originalRoles, appliedRoleNames);
    const policyVersions = policyVersionsFromMissingRequirement(requirement);

    if (!shouldIncludeRoleRelatedRow(originalRoles, neededForRoles)) {
      return;
    }

    addRow(rowsByKey, {
      status: 'missing',
      requirementName: requirement.item1,
      appliesTo: [subject],
      neededForRoles,
      neededForRoleLabels: roleLabelsFromPolicyVersions(
        policyVersions,
        neededForRoles
      ),
      linkedDocumentIds: [],
      noteIds: [],
      notes: [],
      occurrences: [
        {
          id: occurrenceId(subject, 'missing', requirement.item1, index),
          status: 'missing',
          subject,
          context,
          requirement: requirement.item1,
          policyVersions,
        },
      ],
    });
  });
}

function addAvailableApplicationRows({
  rowsByKey,
  subject,
  context,
  requirements,
}: {
  rowsByKey: Map<string, ApprovalLedgerRow>;
  subject: ApprovalLedgerSubject;
  context: RequirementContext;
  requirements: string[];
}) {
  requirements.forEach((requirementName, index) => {
    addRow(rowsByKey, {
      status: 'availableApplication',
      requirementName,
      appliesTo: [subject],
      neededForRoles: [],
      neededForRoleLabels: [],
      linkedDocumentIds: [],
      noteIds: [],
      notes: [],
      occurrences: [
        {
          id: occurrenceId(
            subject,
            'availableApplication',
            requirementName,
            index
          ),
          status: 'availableApplication',
          subject,
          context,
          requirement: requirementName,
          isAvailableApplication: true,
        },
      ],
    });
  });
}

function addSourceRows({
  rowsByKey,
  subject,
  source,
  appliedRoleNames,
}: {
  rowsByKey: Map<string, ApprovalLedgerRow>;
  subject: ApprovalLedgerSubject;
  source: ApprovalRequirementSource;
  appliedRoleNames: Set<string>;
}) {
  addMissingRows({
    rowsByKey,
    subject,
    context: source.context,
    requirements: source.missingRequirements ?? [],
    appliedRoleNames,
  });
  addCompletedRows({
    rowsByKey,
    subject,
    context: source.context,
    requirements: source.completedRequirements ?? [],
    appliedRoleNames,
  });
  addExemptedRows({
    rowsByKey,
    subject,
    context: source.context,
    requirements: source.exemptedRequirements ?? [],
    appliedRoleNames,
  });
  addAvailableApplicationRows({
    rowsByKey,
    subject,
    context: source.context,
    requirements: source.availableApplications ?? [],
  });
}

export function buildApprovalLedgerRows(input: BuildApprovalLedgerRowsInput) {
  const rowsByKey = new Map<string, ApprovalLedgerRow>();
  const appliedRoleNames = buildAppliedRoleNames(input);

  addSourceRows({
    rowsByKey,
    subject: input.family.subject ?? DEFAULT_FAMILY_SUBJECT,
    source: input.family,
    appliedRoleNames,
  });

  input.individuals?.forEach((individual) =>
    addSourceRows({
      rowsByKey,
      subject: individual.subject,
      source: individual,
      appliedRoleNames,
    })
  );

  return [...rowsByKey.values()].sort((a, b) => {
    const statusPriority =
      STATUS_PRIORITY.indexOf(a.status) - STATUS_PRIORITY.indexOf(b.status);

    if (statusPriority !== 0) {
      return statusPriority;
    }

    return a.requirementName.localeCompare(b.requirementName);
  });
}

import {
  CombinedFamilyInfo,
  Person,
  V1Referral,
  V1ReferralStatus,
} from '../GeneratedClient';
import {
  AssignmentFilterSelectionsByRole,
  assignmentNamesForRole,
  matchesAssignmentFilters,
} from '../FunctionAssignments/assignmentRoleColumns';
import { familyNameString } from '../Families/FamilyName';
import { getFamilyCounty } from '../Utilities/getFamilyCounty';
import type { ReferralRowModel } from './referralBrowserTypes';
import type {
  ReferralAssignmentGridFilter,
  ReferralsGridFilterLogicOperator,
} from './referralsGridFilterAdapter';
import type { ReferralStatusFilter } from './referralStatusFilter';

type FamilyLookup = (familyId?: string) => CombinedFamilyInfo | undefined;

type PersonAndFamilyLookup = (personId?: string) => {
  person: Person | undefined;
};

type BuildReferralRowsParameters = {
  assignmentRoles: string[];
  familyLookup: FamilyLookup;
  personAndFamilyLookup: PersonAndFamilyLookup;
  referrals: V1Referral[];
};

type BuildLegacyReferralRowsParameters = BuildReferralRowsParameters & {
  assignmentFilters: AssignmentFilterSelectionsByRole;
  canViewFunctionAssignments: boolean;
};

export type LegacyReferralRowModel = ReferralRowModel & {
  matchesAssignmentFilters: boolean;
};

export function referralStatusToUi(
  status: V1ReferralStatus
): ReferralRowModel['status'] {
  switch (status) {
    case V1ReferralStatus.Open:
      return 'OPEN';
    case V1ReferralStatus.Accepted:
      return 'ACCEPTED';
    case V1ReferralStatus.Closed:
      return 'CLOSED';
  }
}

export function sortReferralsByNewestOpened<T extends ReferralRowModel>(
  rows: T[]
) {
  return [...rows].sort((a, b) => {
    const aTime = a.openedAtUtc?.getTime() ?? 0;
    const bTime = b.openedAtUtc?.getTime() ?? 0;
    return bTime - aTime;
  });
}

export function matchesReferralSearchText(
  row: ReferralRowModel,
  normalizedFilterText: string
) {
  return (
    normalizedFilterText === '' ||
    row.title.toLowerCase().includes(normalizedFilterText) ||
    (row.clientFamilyName?.toLowerCase().includes(normalizedFilterText) ??
      false) ||
    row.comments?.toLowerCase().includes(normalizedFilterText) === true
  );
}

export function matchesReferralStatusFilter(
  row: ReferralRowModel,
  statusFilter: ReferralStatusFilter
) {
  return statusFilter === 'ALL' || row.status === statusFilter;
}

export function matchesReferralCountyFilter(
  row: ReferralRowModel,
  countyFilter: (string | null)[]
) {
  if (countyFilter.length === 0) return true;

  return row.county === null
    ? countyFilter.includes(null)
    : countyFilter.includes(row.county);
}

function normalizedFilterTextValue(value: unknown) {
  return String(value ?? '').trim().toLowerCase();
}

function referralAssignmentDisplayValue(
  row: ReferralRowModel,
  assignmentRole: string
) {
  return row.assignmentNamesByRole[assignmentRole] || '-';
}

function matchesReferralAssignmentGridFilter(
  row: ReferralRowModel,
  assignmentFilter: ReferralAssignmentGridFilter
) {
  const assignmentValue = referralAssignmentDisplayValue(
    row,
    assignmentFilter.assignmentRole
  );
  const filterValue = normalizedFilterTextValue(assignmentFilter.value);
  const normalizedAssignmentValue = assignmentValue.toLowerCase();

  switch (assignmentFilter.operator) {
    case 'contains':
      return (
        filterValue === '' ||
        normalizedAssignmentValue.includes(filterValue)
      );
    case 'doesNotContain':
      return (
        filterValue === '' ||
        !normalizedAssignmentValue.includes(filterValue)
      );
    case 'equals':
      return (
        filterValue === '' ||
        normalizedAssignmentValue.localeCompare(filterValue, undefined, {
          sensitivity: 'base',
        }) === 0
      );
    case 'doesNotEqual':
      return (
        filterValue === '' ||
        normalizedAssignmentValue.localeCompare(filterValue, undefined, {
          sensitivity: 'base',
        }) !== 0
      );
    case 'startsWith':
      return (
        filterValue === '' ||
        normalizedAssignmentValue.startsWith(filterValue)
      );
    case 'endsWith':
      return (
        filterValue === '' ||
        normalizedAssignmentValue.endsWith(filterValue)
      );
    case 'isEmpty':
      return assignmentValue === '';
    case 'isNotEmpty':
      return assignmentValue !== '';
    case 'isAnyOf':
      return (
        !Array.isArray(assignmentFilter.value) ||
        assignmentFilter.value.length === 0 ||
        assignmentFilter.value.some(
          (value) =>
            normalizedAssignmentValue.localeCompare(
              normalizedFilterTextValue(value),
              undefined,
              { sensitivity: 'base' }
            ) === 0
        )
      );
    default:
      return true;
  }
}

function isActiveReferralAssignmentGridFilter(
  assignmentFilter: ReferralAssignmentGridFilter
) {
  switch (assignmentFilter.operator) {
    case 'isEmpty':
    case 'isNotEmpty':
      return true;
    case 'isAnyOf':
      return (
        Array.isArray(assignmentFilter.value) &&
        assignmentFilter.value.length > 0
      );
    default:
      return normalizedFilterTextValue(assignmentFilter.value) !== '';
  }
}

export function matchesReferralAssignmentGridFilters(
  row: ReferralRowModel,
  assignmentFilters: ReferralAssignmentGridFilter[],
  logicOperator: ReferralsGridFilterLogicOperator
) {
  const activeAssignmentFilters = assignmentFilters.filter(
    isActiveReferralAssignmentGridFilter
  );

  if (activeAssignmentFilters.length === 0) return true;

  return logicOperator === 'or'
    ? activeAssignmentFilters.some((assignmentFilter) =>
        matchesReferralAssignmentGridFilter(row, assignmentFilter)
      )
    : activeAssignmentFilters.every((assignmentFilter) =>
        matchesReferralAssignmentGridFilter(row, assignmentFilter)
      );
}

export function familiesForReferrals(
  referrals: V1Referral[],
  familyLookup: FamilyLookup
) {
  return referrals
    .map((referral) =>
      referral.familyId ? familyLookup(referral.familyId) : null
    )
    .filter((family): family is CombinedFamilyInfo => family != null);
}

export function referralAssignmentFilterAssignments(referrals: V1Referral[]) {
  return referrals.flatMap(
    (referral) => referral.assignedIndividualVolunteers ?? []
  );
}

function buildReferralRow(
  referral: V1Referral,
  assignmentRoles: string[],
  familyLookup: FamilyLookup,
  personAndFamilyLookup: PersonAndFamilyLookup
): ReferralRowModel {
  const family = referral.familyId ? familyLookup(referral.familyId) : null;
  const assignments = referral.assignedIndividualVolunteers ?? [];

  return {
    id: referral.referralId,
    title: referral.title,
    status: referralStatusToUi(referral.status),
    openedAtUtc: referral.createdAtUtc,
    acceptedAtUtc: referral.acceptedAtUtc,
    closedAtUtc: referral.closedAtUtc,
    clientFamilyName: family ? familyNameString(family) : null,
    county: family ? getFamilyCounty(family) : null,
    comments: referral.comment ?? '',
    assignmentNamesByRole: Object.fromEntries(
      assignmentRoles.map((assignmentRole) => [
        assignmentRole,
        assignmentNamesForRole(
          assignments,
          assignmentRole,
          (personId) => personAndFamilyLookup(personId).person
        ),
      ])
    ),
  };
}

export function buildReferralRows({
  assignmentRoles,
  familyLookup,
  personAndFamilyLookup,
  referrals,
}: BuildReferralRowsParameters) {
  return sortReferralsByNewestOpened(
    referrals.map((referral) =>
      buildReferralRow(
        referral,
        assignmentRoles,
        familyLookup,
        personAndFamilyLookup
      )
    )
  );
}

export function buildLegacyReferralRows({
  assignmentFilters,
  assignmentRoles,
  canViewFunctionAssignments,
  familyLookup,
  personAndFamilyLookup,
  referrals,
}: BuildLegacyReferralRowsParameters): LegacyReferralRowModel[] {
  return sortReferralsByNewestOpened(
    referrals.map((referral) => ({
      ...buildReferralRow(
        referral,
        assignmentRoles,
        familyLookup,
        personAndFamilyLookup
      ),
      matchesAssignmentFilters:
        !canViewFunctionAssignments ||
        matchesAssignmentFilters(
          referral.assignedIndividualVolunteers ?? [],
          assignmentFilters
        ),
    }))
  );
}

export function filterReferralRows<T extends ReferralRowModel>(
  rows: T[],
  {
    countyFilter,
    normalizedFilterText,
    statusFilter,
  }: {
    countyFilter: (string | null)[];
    normalizedFilterText: string;
    statusFilter: ReferralStatusFilter;
  }
) {
  return rows.filter(
    (row) =>
      matchesReferralSearchText(row, normalizedFilterText) &&
      matchesReferralStatusFilter(row, statusFilter) &&
      matchesReferralCountyFilter(row, countyFilter)
  );
}

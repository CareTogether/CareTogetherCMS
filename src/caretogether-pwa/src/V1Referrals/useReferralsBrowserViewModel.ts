import { useMemo } from 'react';
import { useFeatureFlagEnabled } from 'posthog-js/react';
import {
  assignmentNamesForRole,
  assignmentRolesForColumns,
} from '../FunctionAssignments/assignmentRoleColumns';
import { Permission, V1ReferralStatus } from '../GeneratedClient';
import type {
  CombinedFamilyInfo,
  V1Referral,
} from '../GeneratedClient';
import {
  useFamilyLookup,
  usePersonAndFamilyLookup,
} from '../Model/DirectoryModel';
import { usePolicy } from '../Model/PolicyModel';
import { useVisibleReferrals } from '../Model/Data';
import { useGlobalPermissions } from '../Model/SessionModel';
import { FUNCTION_ASSIGNMENTS_FEATURE_FLAG } from '../featureFlags';
import { familyNameString } from '../Families/FamilyName';
import { getFamilyCounty } from '../Utilities/getFamilyCounty';
import type { ReferralRowModel } from './referralBrowserTypes';
import type {
  ReferralAssignmentGridFilter,
  ReferralsGridFilterLogicOperator,
} from './referralsGridFilterAdapter';
import type { ReferralStatusFilter } from './referralStatusFilter';

type UseReferralsBrowserViewModelParameters = {
  assignmentFilters: ReferralAssignmentGridFilter[];
  assignmentFilterLogicOperator: ReferralsGridFilterLogicOperator;
  countyFilter: (string | null)[];
  filterText: string;
  statusFilter: ReferralStatusFilter;
};

function statusToUi(status: V1ReferralStatus): 'OPEN' | 'ACCEPTED' | 'CLOSED' {
  switch (status) {
    case V1ReferralStatus.Open:
      return 'OPEN';
    case V1ReferralStatus.Accepted:
      return 'ACCEPTED';
    case V1ReferralStatus.Closed:
      return 'CLOSED';
  }
}

function sortReferralsByNewestOpened(
  rows: ReferralRowModel[]
) {
  return [...rows].sort((a, b) => {
    const aTime = a.openedAtUtc?.getTime() ?? 0;
    const bTime = b.openedAtUtc?.getTime() ?? 0;
    return bTime - aTime;
  });
}

function matchesSearchText(
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

function matchesStatusFilter(
  row: ReferralRowModel,
  statusFilter: ReferralStatusFilter
) {
  return statusFilter === 'ALL' || row.status === statusFilter;
}

function matchesCountyFilter(
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

function assignmentDisplayValue(row: ReferralRowModel, assignmentRole: string) {
  return row.assignmentNamesByRole[assignmentRole] || '-';
}

function matchesAssignmentGridFilter(
  row: ReferralRowModel,
  assignmentFilter: ReferralAssignmentGridFilter
) {
  const assignmentValue = assignmentDisplayValue(
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

function isActiveAssignmentGridFilter(
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

function matchesAssignmentGridFilters(
  row: ReferralRowModel,
  assignmentFilters: ReferralAssignmentGridFilter[],
  logicOperator: ReferralsGridFilterLogicOperator
) {
  const activeAssignmentFilters = assignmentFilters.filter(
    isActiveAssignmentGridFilter
  );

  if (activeAssignmentFilters.length === 0) return true;

  return logicOperator === 'or'
    ? activeAssignmentFilters.some((assignmentFilter) =>
        matchesAssignmentGridFilter(row, assignmentFilter)
      )
    : activeAssignmentFilters.every((assignmentFilter) =>
        matchesAssignmentGridFilter(row, assignmentFilter)
      );
}

function familiesForReferrals(
  referrals: V1Referral[],
  familyLookup: ReturnType<typeof useFamilyLookup>
) {
  return referrals
    .map((referral) =>
      referral.familyId ? familyLookup(referral.familyId) : null
    )
    .filter((family): family is CombinedFamilyInfo => family != null);
}

export function useReferralsBrowserViewModel({
  assignmentFilters,
  assignmentFilterLogicOperator,
  countyFilter,
  filterText,
  statusFilter,
}: UseReferralsBrowserViewModelParameters) {
  const referralRecords = useVisibleReferrals();
  const familyLookup = useFamilyLookup();
  const personAndFamilyLookup = usePersonAndFamilyLookup();
  const permissions = useGlobalPermissions();
  const policy = usePolicy();
  const functionAssignmentsEnabled = useFeatureFlagEnabled(
    FUNCTION_ASSIGNMENTS_FEATURE_FLAG
  );

  const referrals = useMemo(
    () => referralRecords.map((referralInfo) => referralInfo.referral),
    [referralRecords]
  );
  const canViewFunctionAssignments =
    functionAssignmentsEnabled === true &&
    permissions(Permission.ViewV1ReferralFunctionAssignments);
  const assignmentFilterAssignments = useMemo(
    () =>
      referrals.flatMap(
        (referral) => referral.assignedIndividualVolunteers ?? []
      ),
    [referrals]
  );
  const assignmentRoles = useMemo(
    () =>
      canViewFunctionAssignments
        ? assignmentRolesForColumns(
            policy.v1ReferralPolicy?.functionAssignmentPolicies?.map(
              (assignmentPolicy) => assignmentPolicy.assignmentRole
            ) ?? [],
            assignmentFilterAssignments
          )
        : [],
    [
      assignmentFilterAssignments,
      canViewFunctionAssignments,
      policy.v1ReferralPolicy?.functionAssignmentPolicies,
    ]
  );
  const rows = useMemo(
    () =>
      sortReferralsByNewestOpened(
        referrals.map((referral) => {
          const family = referral.familyId
            ? familyLookup(referral.familyId)
            : null;
          const assignments = referral.assignedIndividualVolunteers ?? [];

          return {
            id: referral.referralId,
            title: referral.title,
            status: statusToUi(referral.status),
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
        })
      ),
    [
      assignmentRoles,
      familyLookup,
      personAndFamilyLookup,
      referrals,
    ]
  );
  const normalizedFilterText = filterText.trim().toLowerCase();
  const filteredRows = useMemo(
    () =>
      rows.filter(
        (row) =>
          matchesSearchText(row, normalizedFilterText) &&
          matchesStatusFilter(row, statusFilter) &&
          matchesCountyFilter(row, countyFilter) &&
          (!canViewFunctionAssignments ||
            matchesAssignmentGridFilters(
              row,
              assignmentFilters,
              assignmentFilterLogicOperator
            ))
      ),
    [
      assignmentFilterLogicOperator,
      assignmentFilters,
      canViewFunctionAssignments,
      countyFilter,
      normalizedFilterText,
      rows,
      statusFilter,
    ]
  );
  const familiesForCountyFilter = useMemo(
    () => familiesForReferrals(referrals, familyLookup),
    [familyLookup, referrals]
  );
  const tableColumnCount = 4 + assignmentRoles.length;

  return {
    assignmentRoles,
    canViewFunctionAssignments,
    familiesForCountyFilter,
    filteredRows,
    referrals,
    tableColumnCount,
    tableMinWidth: Math.max(700, tableColumnCount * 160),
  };
}

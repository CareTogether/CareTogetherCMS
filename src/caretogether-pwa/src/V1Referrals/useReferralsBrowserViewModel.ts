import { useMemo } from 'react';
import { useRecoilValueLoadable } from 'recoil';
import { useFeatureFlagEnabled } from 'posthog-js/react';
import {
  AssignmentFilterSelectionsByRole,
  assignmentNamesForRole,
  assignmentRolesForColumns,
  matchesAssignmentFilters,
} from '../FunctionAssignments/assignmentRoleColumns';
import { Permission, V1ReferralStatus } from '../GeneratedClient';
import type {
  AssignedIndividualVolunteer,
  CombinedFamilyInfo,
  Person,
  V1Referral,
} from '../GeneratedClient';
import { useLoadable } from '../Hooks/useLoadable';
import {
  useFamilyLookup,
  usePersonAndFamilyLookup,
} from '../Model/DirectoryModel';
import { policyData } from '../Model/ConfigurationModel';
import { visibleReferralsQuery } from '../Model/Data';
import { useGlobalPermissions } from '../Model/SessionModel';
import { FUNCTION_ASSIGNMENTS_FEATURE_FLAG } from '../featureFlags';
import { familyNameString } from '../Families/FamilyName';
import { getFamilyCounty } from '../Utilities/getFamilyCounty';
import type { ReferralRowModel } from './referralBrowserTypes';
import type { ReferralStatusFilter } from './referralStatusFilter';

type UseReferralsBrowserViewModelParameters = {
  assignmentFilters: AssignmentFilterSelectionsByRole;
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
  rows: (ReferralRowModel & { matchesAssignmentFilters: boolean })[]
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
  countyFilter,
  filterText,
  statusFilter,
}: UseReferralsBrowserViewModelParameters) {
  const referralsLoadable = useRecoilValueLoadable(visibleReferralsQuery);
  const familyLookup = useFamilyLookup();
  const personAndFamilyLookup = usePersonAndFamilyLookup();
  const permissions = useGlobalPermissions();
  const policy = useLoadable(policyData);
  const functionAssignmentsEnabled = useFeatureFlagEnabled(
    FUNCTION_ASSIGNMENTS_FEATURE_FLAG
  );

  const referrals = useMemo(
    () =>
      referralsLoadable.state === 'hasValue'
        ? referralsLoadable.contents.map(
            (referralInfo) => referralInfo.referral
          )
        : [],
    [referralsLoadable]
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
            policy?.v1ReferralPolicy?.functionAssignmentPolicies?.map(
              (assignmentPolicy) => assignmentPolicy.assignmentRole
            ) ?? [],
            assignmentFilterAssignments
          )
        : [],
    [
      assignmentFilterAssignments,
      canViewFunctionAssignments,
      policy?.v1ReferralPolicy?.functionAssignmentPolicies,
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
            matchesAssignmentFilters:
              !canViewFunctionAssignments ||
              matchesAssignmentFilters(assignments, assignmentFilters),
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
      assignmentFilters,
      assignmentRoles,
      canViewFunctionAssignments,
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
          row.matchesAssignmentFilters
      ),
    [countyFilter, normalizedFilterText, rows, statusFilter]
  );
  const familiesForCountyFilter = useMemo(
    () => familiesForReferrals(referrals, familyLookup),
    [familyLookup, referrals]
  );
  const tableColumnCount = 4 + assignmentRoles.length;

  return {
    assignmentFilterAssignments: canViewFunctionAssignments
      ? assignmentFilterAssignments
      : ([] as AssignedIndividualVolunteer[]),
    assignmentPersonLookup: (personId: string): Person | undefined =>
      personAndFamilyLookup(personId).person,
    assignmentRoles,
    canViewFunctionAssignments,
    familiesForCountyFilter,
    filteredRows,
    isLoading: referralsLoadable.state === 'loading' || policy === null,
    referrals,
    tableColumnCount,
    tableMinWidth: Math.max(700, tableColumnCount * 160),
  };
}

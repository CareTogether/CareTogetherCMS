import { useMemo } from 'react';
import { useFeatureFlagEnabled } from 'posthog-js/react';
import {
  AssignmentFilterSelectionsByRole,
  assignmentRolesForColumns,
} from '../FunctionAssignments/assignmentRoleColumns';
import { Permission } from '../GeneratedClient';
import {
  useFamilyLookup,
  usePersonAndFamilyLookup,
} from '../Model/DirectoryModel';
import { usePolicy } from '../Model/PolicyModel';
import { useVisibleReferrals } from '../Model/Data';
import { useGlobalPermissions } from '../Model/SessionModel';
import { FUNCTION_ASSIGNMENTS_FEATURE_FLAG } from '../featureFlags';
import type {
  ReferralAssignmentGridFilter,
  ReferralsGridFilterLogicOperator,
} from './referralsGridFilterAdapter';
import type { ReferralStatusFilter } from './referralStatusFilter';
import {
  buildReferralRows,
  buildLegacyReferralRows,
  familiesForReferrals,
  filterReferralRows,
  matchesReferralAssignmentGridFilters,
  referralAssignmentFilterAssignments,
} from './referralBrowserModel';

type UseReferralsBrowserViewModelParameters = {
  assignmentFilters?: ReferralAssignmentGridFilter[];
  assignmentFilterLogicOperator?: ReferralsGridFilterLogicOperator;
  countyFilter: (string | null)[];
  filterText: string;
  legacyAssignmentFilters?: AssignmentFilterSelectionsByRole;
  statusFilter: ReferralStatusFilter;
};

export function useReferralsBrowserViewModel({
  assignmentFilters = [],
  assignmentFilterLogicOperator = 'and',
  countyFilter,
  filterText,
  legacyAssignmentFilters,
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
    () => referralAssignmentFilterAssignments(referrals),
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
    () => {
      if (legacyAssignmentFilters) {
        return buildLegacyReferralRows({
          assignmentFilters: legacyAssignmentFilters,
          assignmentRoles,
          canViewFunctionAssignments,
          familyLookup,
          personAndFamilyLookup,
          referrals,
        });
      }

      return buildReferralRows({
        assignmentRoles,
        familyLookup,
        personAndFamilyLookup,
        referrals,
      });
    },
    [
      assignmentRoles,
      canViewFunctionAssignments,
      familyLookup,
      legacyAssignmentFilters,
      personAndFamilyLookup,
      referrals,
    ]
  );
  const normalizedFilterText = filterText.trim().toLowerCase();
  const filteredRows = useMemo(
    () =>
      filterReferralRows(rows, {
        countyFilter,
        normalizedFilterText,
        statusFilter,
      }).filter(
        (row) =>
          ('matchesAssignmentFilters' in row
            ? row.matchesAssignmentFilters
            : true) &&
          (!canViewFunctionAssignments ||
            matchesReferralAssignmentGridFilters(
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
    assignmentFilterAssignments,
    assignmentPersonLookup: (personId: string) =>
      personAndFamilyLookup(personId).person,
    assignmentRoles,
    canViewFunctionAssignments,
    familiesForCountyFilter,
    filteredRows,
    referrals,
    tableColumnCount,
    tableMinWidth: Math.max(700, tableColumnCount * 160),
  };
}

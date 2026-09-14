import { useMemo } from 'react';
import { useFeatureFlagEnabled } from 'posthog-js/react';
import {
  AssignmentFilterSelectionsByRole,
  assignmentNamesForRole,
  assignmentRolesForColumns,
} from '../FunctionAssignments/assignmentRoleColumns';
import {
  CustomFieldType,
  Permission,
  type CustomField,
  type V1Referral,
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
import { personNameString } from '../Families/PersonName';
import { getFamilyCounty } from '../Utilities/getFamilyCounty';
import type {
  ReferralAssignmentGridFilter,
  ReferralsGridFilterLogicOperator,
} from './referralsGridFilterAdapter';
import type { ReferralStatusFilter } from './referralStatusFilter';
import type {
  ReferralAssignmentRoleV2,
  ReferralBrowserRowV2,
  ReferralCustomFieldValue,
} from './referralBrowserTypes';
import {
  buildLegacyReferralRows,
  buildReferralRows,
  familiesForReferrals,
  filterReferralRows,
  matchesReferralAssignmentGridFilters,
  referralAssignmentFilterAssignments,
  referralStatusToUi,
} from './referralBrowserModel';

type UseReferralsBrowserViewModelParameters = {
  assignmentFilters?: ReferralAssignmentGridFilter[];
  assignmentFilterLogicOperator?: ReferralsGridFilterLogicOperator;
  countyFilter?: (string | null)[];
  filterText?: string;
  legacyAssignmentFilters?: AssignmentFilterSelectionsByRole;
  statusFilter?: ReferralStatusFilter;
};

const emptyAssignmentFilters: ReferralAssignmentGridFilter[] = [];
const emptyCountyFilter: (string | null)[] = [];

function typedCustomFieldValue(
  value: unknown,
  type: CustomFieldType
): ReferralCustomFieldValue {
  if (type === CustomFieldType.Boolean)
    return typeof value === 'boolean' ? value : null;
  if (type === CustomFieldType.StringArray) {
    return Array.isArray(value)
      ? value.filter((item): item is string => typeof item === 'string')
      : null;
  }
  return typeof value === 'string' ? value : null;
}

function referralCustomFieldValues(
  fields: CustomField[],
  completed: V1Referral['completedCustomFields']
) {
  return Object.fromEntries(
    fields.map((field) => [
      field.name,
      typedCustomFieldValue(completed?.[field.name]?.value, field.type),
    ])
  );
}

function sortPremiumReferralRowsByNewestOpened(rows: ReferralBrowserRowV2[]) {
  return [...rows].sort((a, b) => {
    const aTime = a.openedAtUtc?.getTime() ?? 0;
    const bTime = b.openedAtUtc?.getTime() ?? 0;
    return bTime - aTime;
  });
}

export function useReferralsBrowserViewModel({
  assignmentFilters = emptyAssignmentFilters,
  assignmentFilterLogicOperator = 'and',
  countyFilter = emptyCountyFilter,
  filterText = '',
  legacyAssignmentFilters,
  statusFilter = 'ALL',
}: UseReferralsBrowserViewModelParameters = {}) {
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
  const assignmentRoleOptions = useMemo<ReferralAssignmentRoleV2[]>(
    () =>
      assignmentRoles.map((role) => ({
        role,
        options: Array.from(
          new Set(
            assignmentFilterAssignments
              .filter((assignment) => assignment.assignmentRole === role)
              .map((assignment) => assignment.personId)
          )
        )
          .map((value) => ({
            value,
            label: personNameString(personAndFamilyLookup(value).person),
          }))
          .sort(
            (first, second) =>
              first.label.localeCompare(second.label) ||
              first.value.localeCompare(second.value)
          ),
      })),
    [assignmentFilterAssignments, assignmentRoles, personAndFamilyLookup]
  );
  const customFields = useMemo(
    () => policy.referralPolicy?.customFields ?? [],
    [policy.referralPolicy?.customFields]
  );
  const rows = useMemo<ReferralBrowserRowV2[]>(
    () =>
      sortPremiumReferralRowsByNewestOpened(
        referrals.map((referral) => {
          const family = referral.familyId
            ? familyLookup(referral.familyId)
            : null;
          const assignments = referral.assignedIndividualVolunteers ?? [];
          const clientFamilyName = family ? familyNameString(family) : null;
          const comments = referral.comment ?? '';

          return {
            referralCount: 1,
            id: referral.referralId,
            title: referral.title,
            status: referralStatusToUi(referral.status),
            openedAtUtc: referral.createdAtUtc ?? null,
            acceptedAtUtc: referral.acceptedAtUtc ?? null,
            closedAtUtc: referral.closedAtUtc ?? null,
            clientFamilyName,
            county: family ? getFamilyCounty(family) : null,
            comments,
            searchableText: [referral.title, clientFamilyName, comments]
              .filter(Boolean)
              .join('\n'),
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
            assignmentPersonIdsByRole: Object.fromEntries(
              assignmentRoles.map((assignmentRole) => [
                assignmentRole,
                assignments
                  .filter(
                    (assignment) => assignment.assignmentRole === assignmentRole
                  )
                  .map((assignment) => assignment.personId),
              ])
            ),
            customFieldValues: referralCustomFieldValues(
              customFields,
              referral.completedCustomFields
            ),
          };
        })
      ),
    [
      assignmentRoles,
      customFields,
      familyLookup,
      personAndFamilyLookup,
      referrals,
    ]
  );
  const counties = useMemo(
    () =>
      Array.from(
        new Set(
          rows
            .map((row) => row.county)
            .filter((county): county is string => county !== null)
        )
      ).sort((first, second) => first.localeCompare(second)),
    [rows]
  );
  const legacyRows = useMemo(
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
      filterReferralRows(legacyRows, {
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
      legacyRows,
      normalizedFilterText,
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
    assignmentRoleOptions,
    assignmentRoles,
    canViewFunctionAssignments,
    counties,
    customFields,
    familiesForCountyFilter,
    filteredRows,
    referrals,
    rows,
    tableColumnCount,
    tableMinWidth: Math.max(700, tableColumnCount * 160),
  };
}

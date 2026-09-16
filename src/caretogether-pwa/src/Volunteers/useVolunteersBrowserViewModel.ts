import { useMemo } from 'react';
import { CombinedFamilyInfo, CustomField } from '../GeneratedClient';
import { familyNameString } from '../Families/FamilyName';
import { personNameString } from '../Families/PersonName';
import { usePolicy } from '../Model/PolicyModel';
import { useVolunteerFamilies } from '../Model/VolunteersModel';
import {
  buildVolunteerApprovalRolesPresentation,
  type VolunteerApprovalRolesPresentation,
} from './VolunteerApprovalTab/volunteerApprovalRolePresentation';
import type { filterOption } from './VolunteerApprovalTab/filterOption';
import {
  buildVolunteerMissingRequirementGroups,
  completeRequirementFilterValue,
  missingRequirementFilterValue,
  type VolunteerMissingRequirementGroup,
} from './VolunteerApprovalTab/volunteerMissingRequirementsPresentation';
import {
  notAppliedRoleFilterValue,
  roleFilterValues,
} from './roleFilterValues';
import { roleApprovalStatusFilterOptions } from './roleApprovalStatusPresentation';

export type VolunteerCustomFieldValue = boolean | string | string[] | null;
export type VolunteerBrowserRowV2 = {
  arrangementAssignmentValues: Record<string, 'assigned' | 'unassigned'>;
  family: string;
  familyCustomFieldValues: Record<string, VolunteerCustomFieldValue>;
  familyLastName: string;
  id: string;
  missingRequirementGroups: VolunteerMissingRequirementGroup[];
  primaryContact: string;
  requirementFilterValues: string[];
  roleFilterValues: string[];
  roles: VolunteerApprovalRolesPresentation;
  searchableText: string;
  sourceFamily: CombinedFamilyInfo;
  statusFilterValues: string[];
  statusLabels: string[];
  volunteerFamilyCount: number;
  volunteerCustomFieldValues: Record<string, VolunteerCustomFieldValue>;
};
type VolunteersBrowserViewModel = {
  arrangementTypes: string[];
  familyCustomFields: CustomField[];
  roleNames: string[];
  rows: VolunteerBrowserRowV2[];
  volunteerCustomFields: CustomField[];
};
function primaryContact(family: CombinedFamilyInfo) {
  return family.family?.adults?.find(
    (adult) => adult.item1?.id === family.family?.primaryFamilyContactPersonId
  )?.item1;
}
function valuesByName(
  values: { customFieldName?: string; value?: unknown }[] | undefined
) {
  return Object.fromEntries(
    (values ?? []).flatMap((value) =>
      value.customFieldName
        ? [[value.customFieldName, value.value ?? null]]
        : []
    )
  ) as Record<string, VolunteerCustomFieldValue>;
}
function statusValues(family: CombinedFamilyInfo) {
  return Array.from(
    new Set(
      [
        ...Object.values(family.volunteerFamilyInfo?.familyRoleApprovals ?? {}),
        ...Object.values(
          family.volunteerFamilyInfo?.individualVolunteers ?? {}
        ).flatMap((volunteer) =>
          Object.values(volunteer.approvalStatusByRole ?? {})
        ),
      ].map((approval) =>
        approval.currentStatus == null ? '0' : String(approval.currentStatus)
      )
    )
  );
}
function assignmentValues(
  family: CombinedFamilyInfo,
  arrangementTypes: string[]
) {
  return Object.fromEntries(
    arrangementTypes.map((arrangementType) => [
      arrangementType,
      family.volunteerFamilyInfo?.assignments?.some(
        (assignment) =>
          assignment.arrangementType === arrangementType &&
          !assignment.endedAtUtc &&
          !assignment.cancelledAtUtc
      )
        ? 'assigned'
        : 'unassigned',
    ])
  ) as Record<string, 'assigned' | 'unassigned'>;
}
function searchText(family: CombinedFamilyInfo) {
  return [
    ...(family.family?.adults ?? []).map(
      (adult) =>
        `${adult.item1?.firstName ?? ''} ${adult.item1?.lastName ?? ''}`
    ),
    ...(family.family?.children ?? []).map(
      (child) => `${child?.firstName ?? ''} ${child?.lastName ?? ''}`
    ),
  ].join('\n');
}

function toRow(
  family: CombinedFamilyInfo,
  familyCustomFields: CustomField[],
  volunteerCustomFields: CustomField[],
  arrangementTypes: string[],
  statusLabelsByValue: Map<string, string>,
  roleNamesForPresentation: string[]
): VolunteerBrowserRowV2 {
  const contact = primaryContact(family);
  const roleFilters = roleNamesForPresentation.map(
    (key): filterOption => ({ key, selected: false, value: undefined })
  );
  const missingRequirementGroups = buildVolunteerMissingRequirementGroups(
    family,
    roleFilters
  );
  const requirementNames = missingRequirementGroups.flatMap(
    (group) => group.requirements
  );
  const statuses = statusValues(family);
  const familyValues = valuesByName(family.family?.completedCustomFields);
  const volunteerValues = valuesByName(
    family.volunteerFamilyInfo?.completedCustomFields
  );
  return {
    arrangementAssignmentValues: assignmentValues(family, arrangementTypes),
    family: familyNameString(family),
    familyCustomFieldValues: Object.fromEntries(
      familyCustomFields.map((field) => [
        field.name,
        familyValues[field.name] ?? null,
      ])
    ),
    familyLastName: contact?.lastName ?? '⚠ MISSING PRIMARY CONTACT',
    id: family.family!.id!,
    missingRequirementGroups,
    primaryContact: contact ? personNameString(contact) : '',
    requirementFilterValues: requirementNames.length
      ? Array.from(
          new Set([missingRequirementFilterValue, ...requirementNames])
        )
      : [completeRequirementFilterValue],
    roleFilterValues: roleFilterValues(family),
    roles: buildVolunteerApprovalRolesPresentation(family, roleFilters),
    searchableText: searchText(family),
    sourceFamily: family,
    statusFilterValues: statuses,
    statusLabels: statuses.map(
      (status) => statusLabelsByValue.get(status) ?? status
    ),
    volunteerCustomFieldValues: Object.fromEntries(
      volunteerCustomFields.map((field) => [
        field.name,
        volunteerValues[field.name] ?? null,
      ])
    ),
    volunteerFamilyCount: 1,
  };
}

export function useVolunteersBrowserViewModel(): VolunteersBrowserViewModel {
  const families = useVolunteerFamilies();
  const policy = usePolicy();
  const familyCustomFields = useMemo(
    () => policy.customFamilyFields ?? [],
    [policy.customFamilyFields]
  );
  const volunteerCustomFields = useMemo(
    () => policy.volunteerPolicy?.customFields ?? [],
    [policy.volunteerPolicy?.customFields]
  );
  const arrangementTypes = useMemo(
    () =>
      Array.from(
        new Set(
          (policy.referralPolicy?.arrangementPolicies ?? []).flatMap(
            (policy) => (policy.arrangementType ? [policy.arrangementType] : [])
          )
        )
      ),
    [policy.referralPolicy?.arrangementPolicies]
  );
  const roleNamesForPresentation = useMemo(
    () =>
      Array.from(
        new Set([
          ...Object.keys(policy.volunteerPolicy?.volunteerFamilyRoles ?? {}),
          ...Object.keys(policy.volunteerPolicy?.volunteerRoles ?? {}),
        ])
      ),
    [
      policy.volunteerPolicy?.volunteerFamilyRoles,
      policy.volunteerPolicy?.volunteerRoles,
    ]
  );
  const statusLabelsByValue = useMemo(
    () =>
      new Map(
        roleApprovalStatusFilterOptions(notAppliedRoleFilterValue).map(
          ({ value, label }) => [value, label]
        )
      ),
    []
  );
  const rows = useMemo(
    () =>
      families.map((family) =>
        toRow(
          family,
          familyCustomFields,
          volunteerCustomFields,
          arrangementTypes,
          statusLabelsByValue,
          roleNamesForPresentation
        )
      ),
    [
      arrangementTypes,
      families,
      familyCustomFields,
      roleNamesForPresentation,
      statusLabelsByValue,
      volunteerCustomFields,
    ]
  );
  return {
    arrangementTypes,
    familyCustomFields,
    roleNames: [notAppliedRoleFilterValue, ...roleNamesForPresentation],
    rows,
    volunteerCustomFields,
  };
}

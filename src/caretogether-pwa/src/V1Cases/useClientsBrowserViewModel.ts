import { useMemo } from 'react';
import { format } from 'date-fns';
import {
  ArrangementPhase,
  CombinedFamilyInfo,
  V1Case,
} from '../GeneratedClient';
import type { CustomField } from '../GeneratedClient';
import { filterFamiliesByText } from '../Families/FamilyUtils';
import { familyNameString } from '../Families/FamilyName';
import { personNameString } from '../Families/PersonName';
import {
  useFamilyLookup,
  usePersonAndFamilyLookup,
  usePersonLookup,
} from '../Model/DirectoryModel';
import { useLoadable } from '../Hooks/useLoadable';
import { partneringFamiliesData } from '../Model/V1CasesModel';
import { policyData } from '../Model/ConfigurationModel';
import { visibleReferralsQuery } from '../Model/Data';
import { matchesCustomFieldFilters } from '../Generic/CustomFieldsFilter/matchesCustomFieldFilters';
import { CustomFieldFilterSelectionsByField } from '../Generic/CustomFieldsFilter/types';
import { getFamilyCounty } from '../Utilities/getFamilyCounty';
import {
  AssignmentFilterSelectionsByRole,
  assignmentNamesForRole,
  assignmentRolesForColumns,
  matchesAssignmentFilters,
} from '../FunctionAssignments/assignmentRoleColumns';
import {
  buildArrangementRowsV2,
  ArrangementRowV2,
} from './Arrangements/arrangementViewModel';
import { matchingArrangements } from './PartneringFamilies/arrangementHelpers';
import { ArrangementsFilter } from './PartneringFamilies/types';
import {
  openReferralByFamilyId,
  PartneringFamiliesSortMode,
  sortPartneringFamilies,
} from './PartneringFamilies/sortPartneringFamilies';

export type ClientBrowserRowV2 = {
  arrangementRows: ArrangementRowV2[];
  arrangements: string;
  assignmentRoleValues: Record<string, string>;
  county: string;
  customFieldValues: Record<string, string>;
  family: string;
  familyId: string;
  id: string;
  phoneNumber?: string;
  primaryContactName?: string;
  status: string;
};

type UseClientsBrowserViewModelParameters = {
  arrangementsFilter?: ArrangementsFilter;
  assignmentFilters?: AssignmentFilterSelectionsByRole;
  canViewFunctionAssignments?: boolean;
  countyFilter?: (string | null)[];
  filterText?: string;
  selectedCustomFieldValuesByField?: CustomFieldFilterSelectionsByField;
  sortMode?: PartneringFamiliesSortMode;
};

function isSetupOrActiveArrangementPhase(phase: ArrangementPhase | undefined) {
  return (
    phase === ArrangementPhase.Started ||
    phase === ArrangementPhase.SettingUp ||
    phase === ArrangementPhase.ReadyToStart
  );
}

function caseStatusText(v1Case: V1Case | undefined) {
  if (!v1Case) return 'No case';

  if (v1Case.openedAtUtc && !v1Case.closedAtUtc) {
    return `Open since ${format(v1Case.openedAtUtc, 'MM/dd/yyyy')}`;
  }

  if (v1Case.closedAtUtc) {
    return [`Closed ${format(v1Case.closedAtUtc, 'MM/dd/yyyy')}`, v1Case.closeReason]
      .filter(Boolean)
      .join(' - ');
  }

  return 'Closed';
}

function latestClosedCase(family: CombinedFamilyInfo) {
  const closedCases = family.partneringFamilyInfo?.closedV1Cases ?? [];

  return closedCases.length > 0 ? closedCases[closedCases.length - 1] : undefined;
}

function currentCaseStatusText(family: CombinedFamilyInfo) {
  return caseStatusText(
    family.partneringFamilyInfo?.openV1Case ?? latestClosedCase(family)
  );
}

function primaryContact(family: CombinedFamilyInfo) {
  return family.family?.adults?.find(
    (adult) => adult.item1?.id === family.family?.primaryFamilyContactPersonId
  )?.item1;
}

function arrangementSummary(arrangementRows: ArrangementRowV2[]) {
  if (arrangementRows.length === 0) return '';

  const activeCount = arrangementRows.filter(
    (row) => row.source.phase === ArrangementPhase.Started
  ).length;
  const setupCount = arrangementRows.filter((row) =>
    isSetupOrActiveArrangementPhase(row.source.phase)
  ).length;

  if (activeCount > 0) return `${activeCount} active`;
  if (setupCount > 0) return `${setupCount} setup`;

  return `${arrangementRows.length} total`;
}

function customFieldDisplayValue(value: unknown) {
  if (value === true) return 'Yes';
  if (value === false) return 'No';
  if (value === undefined || value === null) return '';

  return value.toString();
}

function customFieldValues(
  family: CombinedFamilyInfo,
  customFields: CustomField[]
) {
  const completedFields =
    family.partneringFamilyInfo?.openV1Case?.completedCustomFields ?? [];

  return Object.fromEntries(
    customFields.map((field) => {
      const matchingField = completedFields.find(
        (completedField) => completedField.customFieldName === field.name
      );

      return [field.name, customFieldDisplayValue(matchingField?.value)];
    })
  );
}

function hasIntakeStatus(
  family: CombinedFamilyInfo,
  openReferralByFamily: ReturnType<typeof openReferralByFamilyId>
) {
  const familyId = family.family?.id;
  const openCase = family.partneringFamilyInfo?.openV1Case;

  if (!openCase) return !!familyId && openReferralByFamily.has(familyId);

  return (openCase.arrangements ?? []).length === 0;
}

function matchesArrangementsFilter(
  family: CombinedFamilyInfo,
  arrangementsFilter: ArrangementsFilter,
  openReferralByFamily: ReturnType<typeof openReferralByFamilyId>
) {
  const openCase = family.partneringFamilyInfo?.openV1Case;
  const arrangements = openCase?.arrangements ?? [];

  if (arrangementsFilter === 'All') return true;
  if (arrangementsFilter === 'Intake') {
    return hasIntakeStatus(family, openReferralByFamily);
  }
  if (arrangementsFilter === 'Active') {
    return arrangements.some(
      (arrangement) => arrangement.phase === ArrangementPhase.Started
    );
  }
  if (arrangementsFilter === 'Setup') {
    return matchingArrangements(family.partneringFamilyInfo!, 'Setup').length > 0;
  }

  return arrangements.some((arrangement) =>
    isSetupOrActiveArrangementPhase(arrangement.phase)
  );
}

export function useClientsBrowserViewModel({
  arrangementsFilter = 'All',
  assignmentFilters = {},
  canViewFunctionAssignments = false,
  countyFilter = [],
  filterText = '',
  selectedCustomFieldValuesByField = {},
  sortMode = 'lastNameAsc',
}: UseClientsBrowserViewModelParameters = {}) {
  const partneringFamiliesLoadable = useLoadable(partneringFamiliesData);
  const partneringFamilies = useMemo(
    () => partneringFamiliesLoadable ?? [],
    [partneringFamiliesLoadable]
  );
  const visibleReferralsLoadable = useLoadable(visibleReferralsQuery);
  const visibleReferrals = useMemo(
    () =>
      visibleReferralsLoadable?.map((referralInfo) => referralInfo.referral) ??
      [],
    [visibleReferralsLoadable]
  );
  const policy = useLoadable(policyData);
  const personLookup = usePersonLookup();
  const personAndFamilyLookup = usePersonAndFamilyLookup();
  const familyLookup = useFamilyLookup();
  const isLoading =
    partneringFamiliesLoadable === null ||
    visibleReferralsLoadable === null ||
    policy === null;

  const openReferralByFamily = useMemo(
    () => openReferralByFamilyId(visibleReferrals),
    [visibleReferrals]
  );
  const referralCustomFields = useMemo(
    () => policy?.referralPolicy?.customFields ?? [],
    [policy?.referralPolicy?.customFields]
  );
  const assignmentFilterAssignments = useMemo(
    () =>
      partneringFamilies.flatMap(
        (family) =>
          family.partneringFamilyInfo?.openV1Case
            ?.assignedIndividualVolunteers ?? []
      ),
    [partneringFamilies]
  );
  const assignmentFilterOptions = useMemo(
    () =>
      assignmentRolesForColumns(
        policy?.referralPolicy?.functionAssignmentPolicies?.map(
          (assignmentPolicy) => assignmentPolicy.assignmentRole
        ) ?? [],
        assignmentFilterAssignments
      ),
    [
      assignmentFilterAssignments,
      policy?.referralPolicy?.functionAssignmentPolicies,
    ]
  );
  const arrangementRowsByFamily = useMemo(() => {
    return Object.fromEntries(
      partneringFamilies
        .map((family) => {
          const familyId = family.family?.id;
          const openCase = family.partneringFamilyInfo?.openV1Case;

          if (!familyId || !openCase) return undefined;

          return [
            familyId,
            buildArrangementRowsV2({
              arrangements: matchingArrangements(
                family.partneringFamilyInfo!,
                arrangementsFilter
              ).map((entry) => entry.arrangement),
              arrangementPolicies: policy?.referralPolicy?.arrangementPolicies,
              family,
              v1Case: openCase,
              personLabel: (personFamilyId, personId) =>
                personNameString(personLookup(personFamilyId, personId)),
              familyLabel: (arrangementFamilyId) =>
                familyNameString(familyLookup(arrangementFamilyId)),
            }),
          ] as const;
        })
        .filter((entry): entry is readonly [string, ArrangementRowV2[]] =>
          Boolean(entry)
        )
    );
  }, [
    arrangementsFilter,
    familyLookup,
    partneringFamilies,
    personLookup,
    policy?.referralPolicy?.arrangementPolicies,
  ]);
  const filteredFamilies = useMemo(() => {
    return sortPartneringFamilies(
      filterFamiliesByText(partneringFamilies, filterText)
        .filter((family) =>
          matchesCustomFieldFilters({
            item: family,
            customFields: referralCustomFields,
            selectedValuesByField: selectedCustomFieldValuesByField,
            isBlank: (item, fieldName) =>
              item.partneringFamilyInfo?.openV1Case?.missingCustomFields?.includes(
                fieldName
              ) ?? false,
            getValue: (item, fieldName) =>
              item.partneringFamilyInfo?.openV1Case?.completedCustomFields?.find(
                (field) => field.customFieldName === fieldName
              )?.value,
          })
        )
        .filter((family) => {
          if (countyFilter.length === 0) return true;

          const county = getFamilyCounty(family);
          return county === null
            ? countyFilter.includes(null)
            : countyFilter.includes(county);
        })
        .filter((family) => {
          if (!canViewFunctionAssignments) return true;

          return matchesAssignmentFilters(
            family.partneringFamilyInfo?.openV1Case
              ?.assignedIndividualVolunteers ?? [],
            assignmentFilters
          );
        })
        .filter((family) =>
          matchesArrangementsFilter(
            family,
            arrangementsFilter,
            openReferralByFamily
          )
        ),
      sortMode,
      openReferralByFamily
    );
  }, [
    arrangementsFilter,
    assignmentFilters,
    canViewFunctionAssignments,
    countyFilter,
    filterText,
    openReferralByFamily,
    partneringFamilies,
    referralCustomFields,
    selectedCustomFieldValuesByField,
    sortMode,
  ]);
  const rows = useMemo<ClientBrowserRowV2[]>(() => {
    return filteredFamilies.flatMap((family) => {
      const familyId = family.family?.id;

      if (!familyId) return [];

      const arrangementRows = arrangementRowsByFamily[familyId] ?? [];
      const contact = primaryContact(family);
      const assignments =
        family.partneringFamilyInfo?.openV1Case
          ?.assignedIndividualVolunteers ?? [];
      const row: ClientBrowserRowV2 = {
        id: familyId,
        familyId,
        family: familyNameString(family),
        status: currentCaseStatusText(family),
        county: getFamilyCounty(family) ?? '',
        arrangementRows,
        arrangements: arrangementSummary(arrangementRows),
        customFieldValues: customFieldValues(family, referralCustomFields),
        assignmentRoleValues: Object.fromEntries(
          assignmentFilterOptions.map((assignmentRole) => [
            assignmentRole,
            assignmentNamesForRole(
              assignments,
              assignmentRole,
              (personId) => personAndFamilyLookup(personId).person
            ),
          ])
        ),
      };

      return [
        {
          ...row,
          ...(contact ? { primaryContactName: personNameString(contact) } : {}),
          ...(contact?.phoneNumbers?.[0]?.number
            ? { phoneNumber: contact.phoneNumbers[0].number }
            : {}),
        },
      ];
    });
  }, [
    arrangementRowsByFamily,
    assignmentFilterOptions,
    filteredFamilies,
    personAndFamilyLookup,
    referralCustomFields,
  ]);
  const counties = useMemo(
    () =>
      Array.from(
        new Set(
          partneringFamilies
            .map(getFamilyCounty)
            .filter((county): county is string => Boolean(county))
        )
      ).sort((a, b) => a.localeCompare(b)),
    [partneringFamilies]
  );

  return {
    rows,
    arrangementRowsByFamily,
    counties,
    isLoading,
    totalFamilies: partneringFamilies.length,
    activeFamilies: partneringFamilies.filter(
      (family) =>
        family.partneringFamilyInfo &&
        matchingArrangements(family.partneringFamilyInfo, 'Active').length > 0
    ).length,
    intakeFamilies: partneringFamilies.filter((family) =>
      hasIntakeStatus(family, openReferralByFamily)
    ).length,
    setupFamilies: partneringFamilies.filter(
      (family) =>
        family.partneringFamilyInfo &&
        matchingArrangements(family.partneringFamilyInfo, 'Setup').length > 0
    ).length,
    assignmentColumnRoles: canViewFunctionAssignments
      ? assignmentFilterOptions
      : [],
    assignmentFilterAssignments,
    assignmentFilterOptions,
    customFieldDefinitions: referralCustomFields,
  };
}

import { useMemo } from 'react';
import { format } from 'date-fns';
import {
  ArrangementPhase,
  Arrangement,
  CombinedFamilyInfo,
  V1Case,
} from '../GeneratedClient';
import type { CustomField } from '../GeneratedClient';
import { familyNameString } from '../Families/FamilyName';
import { personNameString } from '../Families/PersonName';
import {
  usePersonAndFamilyLookup,
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
import { matchingArrangements } from './PartneringFamilies/arrangementHelpers';
import { ArrangementsFilter } from './PartneringFamilies/types';
import {
  openReferralByFamilyId,
  PartneringFamiliesSortMode,
  sortPartneringFamilies,
} from './PartneringFamilies/sortPartneringFamilies';
import { simplify } from '../Utilities/stringUtils';

export type ClientBrowserRowV2 = {
  arrangementRows: ClientArrangementSummaryItemV2[];
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

export type ClientArrangementSummaryItemV2 = {
  arrangementType: string;
  id: string;
  phase?: ArrangementPhase;
  statusLabel: string;
};

type ClientBrowserPresentationRowV2 = ClientBrowserRowV2 & {
  searchText: string;
  sourceFamily: CombinedFamilyInfo;
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

function clientFamilySearchText(family: CombinedFamilyInfo) {
  return [
    ...(family.family?.adults?.map((adult) =>
      simplify(`${adult.item1?.firstName} ${adult.item1?.lastName}`)
    ) ?? []),
    ...(family.family?.children?.map((child) =>
      simplify(`${child?.firstName} ${child?.lastName}`)
    ) ?? []),
  ].join(' ');
}

function matchesSearchText(row: ClientBrowserPresentationRowV2, inputText: string) {
  return inputText.length === 0 || row.searchText.includes(inputText);
}

function arrangementPhaseLabel(phase?: ArrangementPhase) {
  if (phase === ArrangementPhase.SettingUp) return 'Setting up';
  if (phase === ArrangementPhase.ReadyToStart) return 'Ready to start';
  if (phase === ArrangementPhase.Started) return 'Started';
  if (phase === ArrangementPhase.Ended) return 'Ended';
  if (phase === ArrangementPhase.Cancelled) return 'Cancelled';
  return 'Unknown';
}

function arrangementSummaryRows(
  arrangements: Arrangement[]
): ClientArrangementSummaryItemV2[] {
  return arrangements.map((arrangement) => ({
    arrangementType: arrangement.arrangementType || 'Arrangement',
    id: arrangement.id,
    phase: arrangement.phase,
    statusLabel: arrangementPhaseLabel(arrangement.phase),
  }));
}

function arrangementSummary(arrangementRows: ClientArrangementSummaryItemV2[]) {
  if (arrangementRows.length === 0) return '';

  const activeCount = arrangementRows.filter(
    (row) => row.phase === ArrangementPhase.Started
  ).length;
  const setupCount = arrangementRows.filter((row) =>
    isSetupOrActiveArrangementPhase(row.phase)
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
  const completedFields = family.family?.completedCustomFields ?? [];

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
  const personAndFamilyLookup = usePersonAndFamilyLookup();
  const isLoading =
    partneringFamiliesLoadable === null ||
    visibleReferralsLoadable === null ||
    policy === null;
  const normalizedFilterText = useMemo(() => simplify(filterText), [filterText]);

  const openReferralByFamily = useMemo(
    () => openReferralByFamilyId(visibleReferrals),
    [visibleReferrals]
  );
  const referralCustomFields = useMemo(
    () => policy?.referralPolicy?.customFields ?? [],
    [policy?.referralPolicy?.customFields]
  );
  const clientFamilyCustomFields = useMemo(
    () => policy?.customFamilyFields ?? [],
    [policy?.customFamilyFields]
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
            arrangementSummaryRows(
              matchingArrangements(
                family.partneringFamilyInfo!,
                arrangementsFilter
              ).map((entry) => entry.arrangement)
            ),
          ] as const;
        })
        .filter(
          (entry): entry is readonly [string, ClientArrangementSummaryItemV2[]] =>
            Boolean(entry)
        )
    );
  }, [arrangementsFilter, partneringFamilies]);
  const presentationRows = useMemo<ClientBrowserPresentationRowV2[]>(() => {
    return partneringFamilies.flatMap((family) => {
      const familyId = family.family?.id;

      if (!familyId) return [];

      const arrangementRows = arrangementRowsByFamily[familyId] ?? [];
      const contact = primaryContact(family);
      const assignments =
        family.partneringFamilyInfo?.openV1Case
          ?.assignedIndividualVolunteers ?? [];
      const row: ClientBrowserPresentationRowV2 = {
        id: familyId,
        familyId,
        family: familyNameString(family),
        status: currentCaseStatusText(family),
        county: getFamilyCounty(family) ?? '',
        arrangementRows,
        arrangements: arrangementSummary(arrangementRows),
        customFieldValues: customFieldValues(family, clientFamilyCustomFields),
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
        searchText: clientFamilySearchText(family),
        sourceFamily: family,
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
    clientFamilyCustomFields,
    partneringFamilies,
    personAndFamilyLookup,
  ]);
  const presentationRowByFamilyId = useMemo(
    () => new Map(presentationRows.map((row) => [row.familyId, row])),
    [presentationRows]
  );
  const searchableRows = useMemo<ClientBrowserPresentationRowV2[]>(() => {
    const filteredPresentationRows = presentationRows
      .filter((row) =>
        matchesCustomFieldFilters({
          item: row.sourceFamily,
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
      .filter((row) => {
        if (countyFilter.length === 0) return true;

        const county = getFamilyCounty(row.sourceFamily);
        return county === null
          ? countyFilter.includes(null)
          : countyFilter.includes(county);
      })
      .filter((row) => {
        if (!canViewFunctionAssignments) return true;

        return matchesAssignmentFilters(
          row.sourceFamily.partneringFamilyInfo?.openV1Case
            ?.assignedIndividualVolunteers ?? [],
          assignmentFilters
        );
      })
      .filter((row) =>
        matchesArrangementsFilter(
          row.sourceFamily,
          arrangementsFilter,
          openReferralByFamily
        )
      );
    const sortedFamilies = sortPartneringFamilies(
      filteredPresentationRows.map((row) => row.sourceFamily),
      sortMode,
      openReferralByFamily
    );

    return sortedFamilies.flatMap((family) => {
      const familyId = family.family?.id;
      const row = familyId ? presentationRowByFamilyId.get(familyId) : undefined;

      return row ? [row] : [];
    });
  }, [
    arrangementsFilter,
    assignmentFilters,
    canViewFunctionAssignments,
    countyFilter,
    openReferralByFamily,
    presentationRowByFamilyId,
    presentationRows,
    referralCustomFields,
    selectedCustomFieldValuesByField,
    sortMode,
  ]);
  const rows = useMemo<ClientBrowserRowV2[]>(
    () =>
      searchableRows.filter((row) =>
        matchesSearchText(row, normalizedFilterText)
      ),
    [normalizedFilterText, searchableRows]
  );
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
  const activeFamilies = useMemo(
    () =>
      partneringFamilies.filter(
        (family) =>
          family.partneringFamilyInfo &&
          matchingArrangements(family.partneringFamilyInfo, 'Active').length > 0
      ).length,
    [partneringFamilies]
  );
  const intakeFamilies = useMemo(
    () =>
      partneringFamilies.filter((family) =>
        hasIntakeStatus(family, openReferralByFamily)
      ).length,
    [openReferralByFamily, partneringFamilies]
  );
  const setupFamilies = useMemo(
    () =>
      partneringFamilies.filter(
        (family) =>
          family.partneringFamilyInfo &&
          matchingArrangements(family.partneringFamilyInfo, 'Setup').length > 0
      ).length,
    [partneringFamilies]
  );

  return {
    rows,
    arrangementRowsByFamily,
    counties,
    isLoading,
    totalFamilies: partneringFamilies.length,
    activeFamilies,
    intakeFamilies,
    setupFamilies,
    assignmentColumnRoles: canViewFunctionAssignments
      ? assignmentFilterOptions
      : [],
    assignmentFilterAssignments,
    assignmentFilterOptions,
    customFieldDefinitions: clientFamilyCustomFields,
  };
}

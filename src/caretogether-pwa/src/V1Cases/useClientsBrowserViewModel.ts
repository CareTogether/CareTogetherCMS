import { useMemo } from 'react';
import { format } from 'date-fns';
import { ArrangementPhase } from '../GeneratedClient';
import type {
  Arrangement,
  CombinedFamilyInfo,
  CustomField,
  CompletedCustomFieldInfo,
  V1Case,
} from '../GeneratedClient';
import { familyLastName } from '../Families/FamilyUtils';
import { familyNameString } from '../Families/FamilyName';
import { personNameString } from '../Families/PersonName';
import { usePersonAndFamilyLookup } from '../Model/DirectoryModel';
import { usePartneringFamilies } from '../Model/V1CasesModel';
import { usePolicy } from '../Model/PolicyModel';
import { useVisibleReferrals } from '../Model/Data';
import { getFamilyCounty } from '../Utilities/getFamilyCounty';
import {
  assignmentNamesForRole,
  assignmentRolesForColumns,
} from '../FunctionAssignments/assignmentRoleColumns';
import { matchingArrangements } from './PartneringFamilies/arrangementHelpers';
import { openReferralByFamilyId } from './PartneringFamilies/sortPartneringFamilies';
import { clientsOpenedAtTime } from './clientsGridSorting';
import { clientPersonArrangements } from './clientPersonArrangements';
import {
  customFieldGridValues,
  type CustomFieldGridValue,
} from '../Generic/customFieldValue';

export type ClientCustomFieldValue = CustomFieldGridValue;
export type ClientAssignmentRoleV2 = {
  role: string;
  options: { value: string; label: string }[];
};
export type ClientBrowserRowV2 = {
  reportCount: 1;
  id: string;
  familyId: string;
  rowKind: 'family' | 'adult' | 'child';
  personName: string;
  treePath: string[];
  family: string;
  memberNames: string;
  primaryContactFirstName: string;
  primaryContactLastName: string;
  primaryContactName?: string;
  phoneNumber?: string;
  openedAtTime: number | null;
  status: string;
  caseStatus: 'Open' | 'Closed' | 'No case';
  arrangementStatuses: string[];
  arrangementTypes: string[];
  county: string;
  arrangementRows: ClientArrangementSummaryItemV2[];
  arrangements: string;
  assignmentRoleValues: Record<string, string>;
  assignmentPersonIds: Record<string, string[]>;
  customFieldValues: Record<string, ClientCustomFieldValue>;
  caseCustomFieldValues: Record<string, ClientCustomFieldValue>;
  adultCustomFieldValues: Record<string, ClientCustomFieldValue>;
  childCustomFieldValues: Record<string, ClientCustomFieldValue>;
};
export type ClientArrangementSummaryItemV2 = {
  arrangementType: string;
  id: string;
  phase?: ArrangementPhase;
  statusLabel: string;
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
    return [
      `Closed ${format(v1Case.closedAtUtc, 'MM/dd/yyyy')}`,
      v1Case.closeReason,
    ]
      .filter(Boolean)
      .join(' - ');
  }

  return 'Closed';
}

function latestClosedCase(family: CombinedFamilyInfo) {
  const closedCases = family.partneringFamilyInfo?.closedV1Cases ?? [];

  return closedCases.length > 0
    ? closedCases[closedCases.length - 1]
    : undefined;
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

function arrangementStatusesFor(arrangements: Arrangement[]) {
  return [
    ...(arrangements.some(
      (arrangement) => arrangement.phase === ArrangementPhase.Started
    )
      ? ['Active']
      : []),
    ...(arrangements.some(
      (arrangement) =>
        arrangement.phase === ArrangementPhase.SettingUp ||
        arrangement.phase === ArrangementPhase.ReadyToStart
    )
      ? ['Setup']
      : []),
  ];
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

function customFieldValues(
  fields: CustomField[],
  completed: CompletedCustomFieldInfo[] = [],
  missing: string[] = []
) {
  return customFieldGridValues(fields, (field) =>
    missing.includes(field.name)
      ? null
      : completed.find((value) => value.customFieldName === field.name)?.value
  );
}

export function useClientsBrowserViewModel({
  canViewFunctionAssignments = false,
}: { canViewFunctionAssignments?: boolean } = {}) {
  const families = usePartneringFamilies();
  const referralRecords = useVisibleReferrals();
  const policy = usePolicy();
  const lookup = usePersonAndFamilyLookup();
  const referrals = useMemo(
    () =>
      openReferralByFamilyId(referralRecords.map((record) => record.referral)),
    [referralRecords]
  );
  const familyCustomFields = useMemo(
    () => policy.customFamilyFields ?? [],
    [policy.customFamilyFields]
  );
  const caseCustomFields = useMemo(
    () => policy.referralPolicy?.customFields ?? [],
    [policy.referralPolicy?.customFields]
  );
  const adultCustomFields = useMemo(
    () => policy.customFields?.partneringFamily?.adult ?? [],
    [policy.customFields?.partneringFamily?.adult]
  );
  const childCustomFields = useMemo(
    () => policy.customFields?.partneringFamily?.child ?? [],
    [policy.customFields?.partneringFamily?.child]
  );
  const assignmentRoles = useMemo<ClientAssignmentRoleV2[]>(() => {
    if (!canViewFunctionAssignments) return [];
    const assignments = families.flatMap(
      (family) =>
        family.partneringFamilyInfo?.openV1Case?.assignedIndividualVolunteers ??
        []
    );
    return assignmentRolesForColumns(
      policy.referralPolicy?.functionAssignmentPolicies?.map(
        (p) => p.assignmentRole
      ) ?? [],
      assignments
    ).map((role) => ({
      role,
      options: Array.from(
        new Set(
          assignments
            .filter((a) => a.assignmentRole === role)
            .map((a) => a.personId)
        )
      )
        .map((value) => ({
          value,
          label: personNameString(lookup(value).person),
        }))
        .sort((a, b) => a.label.localeCompare(b.label)),
    }));
  }, [
    canViewFunctionAssignments,
    families,
    lookup,
    policy.referralPolicy?.functionAssignmentPolicies,
  ]);
  const rows = useMemo<ClientBrowserRowV2[]>(
    () =>
      families.flatMap((family) => {
        const familyId = family.family?.id;
        if (!familyId) return [];
        const contact = primaryContact(family);
        const openCase = family.partneringFamilyInfo?.openV1Case;
        const currentCase = openCase ?? latestClosedCase(family);
        const assignments = openCase?.assignedIndividualVolunteers ?? [];
        const arrangements = openCase
          ? matchingArrangements(family.partneringFamilyInfo!, 'All').map(
              (entry) => entry.arrangement
            )
          : [];
        const arrangementRows = arrangementSummaryRows(arrangements);
        const openArrangements = openCase?.arrangements ?? [];
        const arrangementStatuses = [
          ...(hasIntakeStatus(family, referrals) ? ['Intake'] : []),
          ...arrangementStatusesFor(openArrangements),
        ];
        const personArrangementValues = (personId: string) => {
          const personArrangements = clientPersonArrangements(
            arrangements,
            personId
          );
          const personArrangementRows =
            arrangementSummaryRows(personArrangements);
          return {
            arrangementRows: personArrangementRows,
            arrangements: arrangementSummary(personArrangementRows),
            arrangementTypes: Array.from(
              new Set(personArrangementRows.map((row) => row.arrangementType))
            ),
            arrangementStatuses: arrangementStatusesFor(
              clientPersonArrangements(openArrangements, personId)
            ),
          };
        };
        const familyRow: ClientBrowserRowV2 = {
          id: familyId,
          reportCount: 1,
          familyId,
          rowKind: 'family',
          personName: '',
          treePath: [familyId],
          family: familyNameString(family),
          memberNames: [
            ...(family.family?.adults?.map((adult) => adult.item1) ?? []),
            ...(family.family?.children ?? []),
          ]
            .filter((person) => !!person)
            .map((person) => personNameString(person))
            .join(', '),
          primaryContactFirstName:
            contact?.firstName || 'MISSING PRIMARY CONTACT',
          primaryContactLastName: familyLastName(family),
          primaryContactName: contact ? personNameString(contact) : undefined,
          phoneNumber: contact?.phoneNumbers?.[0]?.number,
          openedAtTime: clientsOpenedAtTime(
            openCase?.openedAtUtc,
            referrals.get(familyId)?.createdAtUtc
          ),
          status: currentCaseStatusText(family),
          caseStatus: !currentCase
            ? 'No case'
            : currentCase.openedAtUtc && !currentCase.closedAtUtc
              ? 'Open'
              : 'Closed',
          arrangementStatuses,
          arrangementTypes: Array.from(
            new Set(arrangementRows.map((a) => a.arrangementType))
          ),
          county: getFamilyCounty(family) ?? '',
          arrangementRows,
          arrangements: arrangementSummary(arrangementRows),
          assignmentRoleValues: Object.fromEntries(
            assignmentRoles.map(({ role }) => [
              role,
              assignmentNamesForRole(
                assignments,
                role,
                (id) => lookup(id).person
              ),
            ])
          ),
          assignmentPersonIds: Object.fromEntries(
            assignmentRoles.map(({ role }) => [
              role,
              assignments
                .filter((a) => a.assignmentRole === role)
                .map((a) => a.personId),
            ])
          ),
          customFieldValues: customFieldValues(
            familyCustomFields,
            family.family?.completedCustomFields
          ),
          caseCustomFieldValues: customFieldValues(
            caseCustomFields,
            openCase?.completedCustomFields,
            openCase?.missingCustomFields
          ),
          adultCustomFieldValues: {},
          childCustomFieldValues: {},
        };
        const adults = (family.family?.adults ?? []).flatMap((entry) =>
          entry.item1?.id ? [entry.item1] : []
        );
        const children = (family.family?.children ?? []).filter(
          (person) => !!person?.id
        );
        const memberRows: ClientBrowserRowV2[] = [
          ...adults.map((person) => ({
            ...familyRow,
            id: `${familyId}:adult:${person.id}`,
            rowKind: 'adult' as const,
            personName: personNameString(person),
            treePath: [familyId, `adult:${person.id}`],
            ...personArrangementValues(person.id),
            adultCustomFieldValues: customFieldValues(
              adultCustomFields,
              person.completedCustomFields
            ),
          })),
          ...children.map((person) => ({
            ...familyRow,
            id: `${familyId}:child:${person.id}`,
            rowKind: 'child' as const,
            personName: personNameString(person),
            treePath: [familyId, `child:${person.id}`],
            ...personArrangementValues(person.id),
            childCustomFieldValues: customFieldValues(
              childCustomFields,
              person.completedCustomFields
            ),
          })),
        ];
        return [familyRow, ...memberRows];
      }),
    [
      families,
      referrals,
      assignmentRoles,
      lookup,
      familyCustomFields,
      caseCustomFields,
      adultCustomFields,
      childCustomFields,
    ]
  );
  const counties = useMemo(
    () =>
      Array.from(new Set(rows.map((row) => row.county).filter(Boolean))).sort(
        (a, b) => a.localeCompare(b)
      ),
    [rows]
  );
  return {
    rows,
    counties,
    assignmentRoles,
    familyCustomFields,
    caseCustomFields,
    adultCustomFields,
    childCustomFields,
  };
}

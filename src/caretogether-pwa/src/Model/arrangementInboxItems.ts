import type { CombinedFamilyInfo, Person, V1Case } from '../GeneratedClient.ts';

export interface ArrangementInboxPhases {
  settingUp: number;
  readyToStart: number;
  started: number;
}

export interface ArrangementDueToStart {
  type: 'ArrangementDueToStart';
  family: CombinedFamilyInfo;
  child: Person;
  v1CaseId: string;
  arrangementId: string;
  arrangementType: string;
  plannedStartUtc: Date;
}

export interface ClosedCaseInvalidArrangementStatus {
  type: 'ClosedCaseInvalidArrangementStatus';
  family: CombinedFamilyInfo;
  child: Person;
  v1CaseId: string;
  arrangementId: string;
  arrangementType: string;
}

export type ArrangementInboxItem =
  | ArrangementDueToStart
  | ClosedCaseInvalidArrangementStatus;

function endOfDay(date: Date) {
  return new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
    23,
    59,
    59,
    999
  );
}

function familyCases(family: CombinedFamilyInfo) {
  if (!family.partneringFamilyInfo) return [];

  const openCase = family.partneringFamilyInfo.openV1Case;
  const closedCases = family.partneringFamilyInfo.closedV1Cases ?? [];

  return [
    ...(openCase ? [{ v1Case: openCase, isClosed: false }] : []),
    ...closedCases.map((v1Case) => ({ v1Case, isClosed: true })),
  ];
}

function childForArrangement(
  family: CombinedFamilyInfo,
  partneringFamilyPersonId: string
) {
  return (
    family.family?.children?.find(
      (child) => child.id === partneringFamilyPersonId
    ) ?? ({} as Person)
  );
}

function openCaseDueWarnings(
  family: CombinedFamilyInfo,
  v1Case: V1Case,
  today: Date,
  phases: ArrangementInboxPhases
): ArrangementDueToStart[] {
  return (v1Case.arrangements ?? [])
    .filter(
      (arrangement) =>
        (arrangement.phase === phases.settingUp ||
          arrangement.phase === phases.readyToStart) &&
        arrangement.plannedStartUtc !== undefined &&
        arrangement.plannedStartUtc <= endOfDay(today)
    )
    .map((arrangement) => ({
      type: 'ArrangementDueToStart' as const,
      family,
      child: childForArrangement(family, arrangement.partneringFamilyPersonId),
      v1CaseId: v1Case.id ?? '',
      arrangementId: arrangement.id ?? '',
      arrangementType: arrangement.arrangementType,
      plannedStartUtc: arrangement.plannedStartUtc!,
    }));
}

function closedCaseWarnings(
  family: CombinedFamilyInfo,
  v1Case: V1Case,
  phases: ArrangementInboxPhases
): ClosedCaseInvalidArrangementStatus[] {
  return (v1Case.arrangements ?? [])
    .filter(
      (arrangement) =>
        arrangement.phase === phases.settingUp ||
        arrangement.phase === phases.readyToStart ||
        arrangement.phase === phases.started
    )
    .map((arrangement) => ({
      type: 'ClosedCaseInvalidArrangementStatus' as const,
      family,
      child: childForArrangement(family, arrangement.partneringFamilyPersonId),
      v1CaseId: v1Case.id ?? '',
      arrangementId: arrangement.id ?? '',
      arrangementType: arrangement.arrangementType,
    }));
}

export function arrangementInboxItemsForFamilies(
  families: CombinedFamilyInfo[],
  phases: ArrangementInboxPhases,
  today: Date = new Date()
): ArrangementInboxItem[] {
  const items = families.flatMap<ArrangementInboxItem>((family) =>
    familyCases(family).flatMap<ArrangementInboxItem>(({ v1Case, isClosed }) =>
      isClosed
        ? closedCaseWarnings(family, v1Case, phases)
        : openCaseDueWarnings(family, v1Case, today, phases)
    )
  );

  return items.sort((first, second) => {
    const firstIsDue = first.type === 'ArrangementDueToStart';
    const secondIsDue = second.type === 'ArrangementDueToStart';
    if (firstIsDue !== secondIsDue) return firstIsDue ? -1 : 1;
    if (!firstIsDue || !secondIsDue) return 0;

    return first.plannedStartUtc.getTime() - second.plannedStartUtc.getTime();
  });
}

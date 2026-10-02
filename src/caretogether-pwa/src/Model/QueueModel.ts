import { atom, useAtomValue } from 'jotai';
import {
  CombinedFamilyInfo,
  ExactAge,
  Person,
  RoleApprovalStatus,
} from '../GeneratedClient';
import { mapLoadedValue, visibleFamiliesAtom } from './Data';
import { differenceInYears, endOfDay } from 'date-fns';
import { ChildLocationPlan, ArrangementPhase } from '../GeneratedClient';
import { useJotaiLoadable } from '../State/jotai/useJotaiLoadable';

export type QueueItem =
  | ChildOver18
  | MissingPrimaryContact
  | MissingLastName
  | ChildNotReturned
  | ArrangementDueToStart;

export interface ChildOver18 {
  type: 'ChildOver18';
  family: CombinedFamilyInfo;
  child: Person;
}

export interface MissingPrimaryContact {
  type: 'MissingPrimaryContact';
  family: CombinedFamilyInfo;
}

export interface MissingLastName {
  type: 'MissingLastName';
  family: CombinedFamilyInfo;
  person: Person;
}

export interface ChildNotReturned {
  type: 'ChildNotReturned';
  family: CombinedFamilyInfo;
  child: Person;
  v1CaseId: string;
  arrangementId: string;
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

const childrenOver18Atom = atom((get) => {
  const visibleFamilies = get(visibleFamiliesAtom);

  return mapLoadedValue(visibleFamilies, (families) =>
    families
      ?.filter((family) => family.volunteerFamilyInfo)
      .flatMap((family) => {
        if (
          Object.entries(family.volunteerFamilyInfo!.familyRoleApprovals).every(
            ([, approvalStatus]) =>
              approvalStatus.currentStatus === RoleApprovalStatus.Inactive ||
              approvalStatus.currentStatus === RoleApprovalStatus.Denied
          )
        )
          return [];

        const children = family.family?.children ?? [];
        return children
          .filter(
            (child) =>
              child.age &&
              differenceInYears(
                new Date(),
                (child.age as ExactAge).dateOfBirth!
              ) >= 18
          )
          .map((child) => ({ type: 'ChildOver18' as const, family, child }));
      })
  );
});

const missingPrimaryContactsAtom = atom((get) => {
  const visibleFamilies = get(visibleFamiliesAtom);

  return mapLoadedValue(visibleFamilies, (families) =>
    families
      .filter(
        (family) =>
          !family.family!.adults?.find(
            (adult) =>
              adult.item1!.id === family.family?.primaryFamilyContactPersonId
          )
      )
      .map((family) => ({ type: 'MissingPrimaryContact' as const, family }))
  );
});

const missingLastNamesAtom = atom((get) => {
  const visibleFamilies = get(visibleFamiliesAtom);

  return mapLoadedValue(visibleFamilies, (families) =>
    families.flatMap((family) => {
      const activeAdults = (family.family?.adults ?? [])
        .map((adult) => adult.item1)
        .filter(
          (person): person is Person =>
            !!person?.id && person.active && !person.lastName?.trim()
        );
      const activeChildren = (family.family?.children ?? []).filter(
        (person) => person.id && person.active && !person.lastName?.trim()
      );

      return [...activeAdults, ...activeChildren].map((person) => ({
        type: 'MissingLastName' as const,
        family,
        person,
      }));
    })
  );
});

function partneringFamilyArrangements(families: CombinedFamilyInfo[]) {
  return families.flatMap((family) => {
    if (!family.partneringFamilyInfo) return [];

    const openV1CaseArrangements =
      family.partneringFamilyInfo.openV1Case?.arrangements?.map(
        (arrangement) => ({
          arrangement,
          family,
          v1Case: family.partneringFamilyInfo!.openV1Case!,
        })
      ) || [];

    const closedV1CasesArrangements =
      family.partneringFamilyInfo.closedV1Cases?.flatMap(
        (v1Case) =>
          v1Case.arrangements?.map((arrangement) => ({
            arrangement,
            family,
            v1Case,
          })) || []
      ) || [];

    return [...openV1CaseArrangements, ...closedV1CasesArrangements];
  });
}

const childNotReturnedAtom = atom((get) => {
  const visibleFamilies = get(visibleFamiliesAtom);

  return mapLoadedValue(visibleFamilies, (families) => {
    const allArrangements = partneringFamilyArrangements(families);

    return allArrangements
      .filter(
        ({ arrangement }) =>
          arrangement.phase === ArrangementPhase.Ended &&
          arrangement.childLocationHistory &&
          arrangement.childLocationHistory.length > 0
      )
      .filter(({ arrangement }) => {
        const mostRecentLocation =
          arrangement?.childLocationHistory?.[
            arrangement.childLocationHistory.length - 1
          ];

        return mostRecentLocation?.plan !== ChildLocationPlan.WithParent;
      })
      .map(({ arrangement, family, v1Case }) => {
        const child = family.family?.children?.find(
          (child) => child.id === arrangement.partneringFamilyPersonId
        );

        return {
          type: 'ChildNotReturned' as const,
          family: family,
          child: child ?? ({} as Person),
          v1CaseId: v1Case?.id ?? '',
          arrangementId: arrangement.id ?? '',
        };
      });
  });
});

const arrangementsDueToStartAtom = atom((get) => {
  const visibleFamilies = get(visibleFamiliesAtom);

  return mapLoadedValue(visibleFamilies, (families) => {
    const allArrangements = partneringFamilyArrangements(families);
    const endOfToday = endOfDay(new Date());

    return allArrangements
      .filter(
        ({ arrangement }) =>
          (arrangement.phase === ArrangementPhase.SettingUp ||
            arrangement.phase === ArrangementPhase.ReadyToStart) &&
          arrangement.plannedStartUtc !== undefined &&
          arrangement.plannedStartUtc! <= endOfToday
      )
      .sort(
        ({ arrangement: first }, { arrangement: second }) =>
          first.plannedStartUtc!.getTime() - second.plannedStartUtc!.getTime()
      )
      .map(({ arrangement, family, v1Case }) => {
        const child = family.family?.children?.find(
          (child) => child.id === arrangement.partneringFamilyPersonId
        );

        return {
          type: 'ArrangementDueToStart' as const,
          family: family,
          child: child ?? ({} as Person),
          v1CaseId: v1Case?.id ?? '',
          arrangementId: arrangement.id ?? '',
          arrangementType: arrangement.arrangementType,
          plannedStartUtc: arrangement.plannedStartUtc!,
        };
      });
  });
});

function combineQueueItems(
  childrenOver18: ChildOver18[] | Promise<ChildOver18[]>,
  missingPrimaryContacts:
    | MissingPrimaryContact[]
    | Promise<MissingPrimaryContact[]>,
  missingLastNames: MissingLastName[] | Promise<MissingLastName[]>,
  childNotReturned: ChildNotReturned[] | Promise<ChildNotReturned[]>,
  arrangementsDueToStart:
    | ArrangementDueToStart[]
    | Promise<ArrangementDueToStart[]>
) {
  if (
    childrenOver18 instanceof Promise ||
    missingPrimaryContacts instanceof Promise ||
    missingLastNames instanceof Promise ||
    childNotReturned instanceof Promise ||
    arrangementsDueToStart instanceof Promise
  ) {
    return Promise.all([
      childrenOver18,
      missingPrimaryContacts,
      missingLastNames,
      childNotReturned,
      arrangementsDueToStart,
    ]).then(
      ([
        childrenOver18,
        missingPrimaryContacts,
        missingLastNames,
        childNotReturned,
        arrangementsDueToStart,
      ]) => [
        ...childrenOver18,
        ...missingPrimaryContacts,
        ...missingLastNames,
        ...childNotReturned,
        ...arrangementsDueToStart,
      ]
    );
  }

  return [
    ...childrenOver18,
    ...missingPrimaryContacts,
    ...missingLastNames,
    ...childNotReturned,
    ...arrangementsDueToStart,
  ];
}

const queueItemsAtom = atom((get) => {
  const childrenOver18 = get(childrenOver18Atom);
  const missingPrimaryContacts = get(missingPrimaryContactsAtom);
  const missingLastNames = get(missingLastNamesAtom);
  const childNotReturned = get(childNotReturnedAtom);
  const arrangementsDueToStart = get(arrangementsDueToStartAtom);
  return combineQueueItems(
    childrenOver18,
    missingPrimaryContacts,
    missingLastNames,
    childNotReturned,
    arrangementsDueToStart
  );
});

const queueItemsCountAtom = atom((get) => {
  const queueItems = get(queueItemsAtom);
  return mapLoadedValue(queueItems, (items) => items.length);
});

export function useQueueItems() {
  return useAtomValue(queueItemsAtom);
}

export function useQueueItemsCountLoadable() {
  return useJotaiLoadable(queueItemsCountAtom);
}

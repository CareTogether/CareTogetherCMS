import { atom, useAtomValue } from 'jotai';
import {
  CombinedFamilyInfo,
  ExactAge,
  Person,
  RoleApprovalStatus,
  V1Case,
} from '../GeneratedClient';
import { mapLoadedValue, visibleFamiliesAtom } from './Data';
import { differenceInYears } from 'date-fns';
import {
  Arrangement,
  ChildLocationPlan,
  ArrangementPhase,
} from '../GeneratedClient';
import { useJotaiLoadable } from '../State/jotai/useJotaiLoadable';

export type QueueItem = ChildOver18 | MissingPrimaryContact | ChildNotReturned;

export interface ChildOver18 {
  type: 'ChildOver18';
  family: CombinedFamilyInfo;
  child: Person;
}

export interface MissingPrimaryContact {
  type: 'MissingPrimaryContact';
  family: CombinedFamilyInfo;
}

export interface ChildNotReturned {
  type: 'ChildNotReturned';
  family: CombinedFamilyInfo;
  child: Person;
  v1CaseId: string;
  arrangementId: string;
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

const childNotReturnedAtom = atom((get) => {
  const visibleFamilies = get(visibleFamiliesAtom);

  return mapLoadedValue(visibleFamilies, (families) => {
    const allArrangements: {
      arrangement: Arrangement;
      family: CombinedFamilyInfo;
      v1Case: V1Case;
    }[] = families.flatMap((family) => {
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

function combineQueueItems(
  childrenOver18: ChildOver18[] | Promise<ChildOver18[]>,
  missingPrimaryContacts:
    | MissingPrimaryContact[]
    | Promise<MissingPrimaryContact[]>,
  childNotReturned: ChildNotReturned[] | Promise<ChildNotReturned[]>
) {
  if (
    childrenOver18 instanceof Promise ||
    missingPrimaryContacts instanceof Promise ||
    childNotReturned instanceof Promise
  ) {
    return Promise.all([
      childrenOver18,
      missingPrimaryContacts,
      childNotReturned,
    ]).then(([childrenOver18, missingPrimaryContacts, childNotReturned]) => [
      ...childrenOver18,
      ...missingPrimaryContacts,
      ...childNotReturned,
    ]);
  }

  return [...childrenOver18, ...missingPrimaryContacts, ...childNotReturned];
}

const queueItemsAtom = atom((get) => {
  const childrenOver18 = get(childrenOver18Atom);
  const missingPrimaryContacts = get(missingPrimaryContactsAtom);
  const childNotReturned = get(childNotReturnedAtom);
  return combineQueueItems(
    childrenOver18,
    missingPrimaryContacts,
    childNotReturned
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

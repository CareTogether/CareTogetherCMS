import { atom } from 'jotai';
import {
  CombinedFamilyInfo,
  ExactAge,
  Person,
  RoleApprovalStatus,
  V1Case,
} from '../GeneratedClient';
import { visibleFamiliesAtom } from './Data';
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

const childrenOver18Atom = atom(async (get): Promise<ChildOver18[]> => {
    // Only show these alerts for volunteer families with active family roles.
    const visibleFamilies = await get(visibleFamiliesAtom);
    return visibleFamilies
      ?.filter((family) => family.volunteerFamilyInfo)
      .flatMap((family) => {
        if (Object.entries(family.volunteerFamilyInfo!.familyRoleApprovals).every(([, approvalStatus]) =>
          approvalStatus.currentStatus === RoleApprovalStatus.Inactive ||
          approvalStatus.currentStatus === RoleApprovalStatus.Denied))
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
          .map((child) => ({ type: 'ChildOver18', family, child }));
      });
});

const missingPrimaryContactsAtom = atom(
  async (get): Promise<MissingPrimaryContact[]> => {
    const visibleFamilies = await get(visibleFamiliesAtom);
    return (
      visibleFamilies
        ?.filter(
          (family) =>
            !family.family!.adults?.find(
              (adult) =>
                adult.item1!.id === family.family?.primaryFamilyContactPersonId
            )
        )
        .map((family) => ({ type: 'MissingPrimaryContact', family })) || []
    );
  }
);

const childNotReturnedAtom = atom(async (get): Promise<ChildNotReturned[]> => {
    const visibleFamilies = await get(visibleFamiliesAtom);

    const allArrangements: {
      arrangement: Arrangement;
      family: CombinedFamilyInfo;
      v1Case: V1Case;
    }[] = visibleFamilies?.flatMap((family) => {
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
          type: 'ChildNotReturned',
          family: family,
          child: child ?? ({} as Person),
          v1CaseId: v1Case?.id ?? '',
          arrangementId: arrangement.id ?? '',
        };
      });
});

const queueItemsAtom = atom(async (get): Promise<QueueItem[]> => {
    const childrenOver18 = await get(childrenOver18Atom);
    const missingPrimaryContacts = await get(missingPrimaryContactsAtom);
    const childNotReturned = await get(childNotReturnedAtom);
    return [...childrenOver18, ...missingPrimaryContacts, ...childNotReturned];
});

const queueItemsCountAtom = atom(async (get) => {
    const queueItems = await get(queueItemsAtom);
    return queueItems.length;
});

export function useQueueItems() {
  return useJotaiLoadable(queueItemsAtom);
}

export function useQueueItemsCount() {
  return useJotaiLoadable(queueItemsCountAtom);
}

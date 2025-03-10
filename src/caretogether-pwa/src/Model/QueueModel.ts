import { selector } from 'recoil';
import { CombinedFamilyInfo, ExactAge, Person } from '../GeneratedClient';
import { visibleFamiliesQuery } from './Data';
import { differenceInYears } from 'date-fns';
import {
  Arrangement,
  ChildLocationPlan,
  ArrangementPhase,
} from '../GeneratedClient';
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
  lastKnownLocation: string;
}

const childrenOver18Query = selector<ChildOver18[]>({
  key: 'childrenOver18Query',
  get: ({ get }) => {
    const visibleFamilies = get(visibleFamiliesQuery);
    const childrenOver18 = visibleFamilies?.flatMap(
      (family) =>
        family.family?.children
          ?.filter(
            (child) =>
              child.age &&
              differenceInYears(
                new Date(),
                (child.age as ExactAge).dateOfBirth!
              ) > 18
          )
          .map(
            (child) => ({ type: 'ChildOver18', family, child }) as ChildOver18
          ) || []
    );
    return childrenOver18;
  },
});

const missingPrimaryContactsQuery = selector<MissingPrimaryContact[]>({
  key: 'missingPrimaryContactsQuery',
  get: ({ get }) => {
    const visibleFamilies = get(visibleFamiliesQuery);
    const missingPrimaryContacts =
      visibleFamilies
        ?.filter(
          (family) =>
            !family.family!.adults?.find(
              (adult) =>
                adult.item1!.id === family.family?.primaryFamilyContactPersonId
            )
        )
        .map(
          (family) =>
            ({ type: 'MissingPrimaryContact', family }) as MissingPrimaryContact
        ) || [];
    return missingPrimaryContacts;
  },
});

const childNotReturnedQuery = selector<ChildNotReturned[]>({
  key: 'childNotReturnedQuery',
  get: ({ get }) => {
    const visibleFamilies = get(visibleFamiliesQuery);

    const allArrangements: Arrangement[] =
      visibleFamilies?.flatMap((family) =>
        family.partneringFamilyInfo
          ? [
              ...(family.partneringFamilyInfo.openReferral?.arrangements || []),
              ...(family.partneringFamilyInfo.closedReferrals?.flatMap(
                (referral) => referral.arrangements || []
              ) || []),
            ]
          : []
      ) || [];

    return allArrangements
      .filter((arrangement) => arrangement.phase === ArrangementPhase.Ended)

      .filter((arrangement) => {
        const mostRecentLocation =
          arrangement.childLocationHistory &&
          arrangement.childLocationHistory.length > 0
            ? arrangement.childLocationHistory[
                arrangement.childLocationHistory.length - 1
              ]
            : null;

        return mostRecentLocation
          ? mostRecentLocation.plan !== ChildLocationPlan.WithParent
          : false;
      })
      .map((arrangement) => {
        const family = visibleFamilies.find(
          (f) =>
            f.partneringFamilyInfo?.openReferral?.arrangements?.includes(
              arrangement
            ) ||
            f.partneringFamilyInfo?.closedReferrals?.some((referral) =>
              referral.arrangements?.includes(arrangement)
            )
        )?.family;

        const child = family?.children?.find(
          (child) => child.id === arrangement.partneringFamilyPersonId
        );

        return {
          type: 'ChildNotReturned',
          family: family ?? ({} as CombinedFamilyInfo),
          child: child ?? ({} as Person),
          lastKnownLocation:
            arrangement.childLocationHistory &&
            arrangement.childLocationHistory.length > 0
              ? String(
                  arrangement.childLocationHistory[
                    arrangement.childLocationHistory.length - 1
                  ].plan
                )
              : 'Unknown',
        } as ChildNotReturned;
      });
  },
});

export const queueItemsQuery = selector<QueueItem[]>({
  key: 'queueItemsQuery',
  get: ({ get }) => {
    const childrenOver18 = get(childrenOver18Query);
    const missingPrimaryContacts = get(missingPrimaryContactsQuery);
    const childNotReturned = get(childNotReturnedQuery);
    return (childrenOver18 as QueueItem[])
      .concat(missingPrimaryContacts)
      .concat(childNotReturned);
  },
});

export const queueItemsCountQuery = selector({
  key: 'queueItemsCountQuery',
  get: ({ get }) => {
    const queueItems = get(queueItemsQuery);
    return queueItems.length;
  },
});

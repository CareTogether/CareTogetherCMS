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
  referralId: string;
  arrangementId: string;
}

const childrenOver18Query = selector<ChildOver18[]>({
  key: 'childrenOver18Query',
  get: ({ get }) => {
    const visibleFamilies = get(visibleFamiliesQuery);
    return visibleFamilies?.flatMap(
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
          .map((child) => ({ type: 'ChildOver18', family, child })) || []
    );
  },
});

const missingPrimaryContactsQuery = selector<MissingPrimaryContact[]>({
  key: 'missingPrimaryContactsQuery',
  get: ({ get }) => {
    const visibleFamilies = get(visibleFamiliesQuery);
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
  },
});

const childNotReturnedQuery = selector<ChildNotReturned[]>({
  key: 'childNotReturnedQuery',
  get: ({ get }) => {
    const visibleFamilies = get(visibleFamiliesQuery);

    const allArrangements: {
      arrangement: Arrangement;
      family: CombinedFamilyInfo;
    }[] = visibleFamilies?.flatMap((family) => {
      if (!family.partneringFamilyInfo) return [];

      const mapArrangementAndFamily = (arrangement: Arrangement) => ({
        arrangement,
        family,
      });

      const openReferralArrangements =
        family.partneringFamilyInfo.openReferral?.arrangements?.map(
          mapArrangementAndFamily
        ) || [];

      const closedReferralsArrangements =
        family.partneringFamilyInfo.closedReferrals?.flatMap(
          (referral) =>
            referral.arrangements?.map(mapArrangementAndFamily) || []
        ) || [];

      return [...openReferralArrangements, ...closedReferralsArrangements];
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
      .map(({ arrangement, family }) => {
        const child = family.family?.children?.find(
          (child) => child.id === arrangement.partneringFamilyPersonId
        );

        const referral =
          family.partneringFamilyInfo?.openReferral?.arrangements?.includes(
            arrangement
          )
            ? family.partneringFamilyInfo.openReferral
            : family.partneringFamilyInfo?.closedReferrals?.find((referral) =>
                referral.arrangements?.includes(arrangement)
              );

        return {
          type: 'ChildNotReturned',
          family: family,
          child: child ?? ({} as Person),
          referralId: referral?.id ?? '',
          arrangementId: arrangement.id ?? '',
        };
      });
  },
});

export const queueItemsQuery = selector<QueueItem[]>({
  key: 'queueItemsQuery',
  get: ({ get }) => {
    const childrenOver18 = get(childrenOver18Query);
    const missingPrimaryContacts = get(missingPrimaryContactsQuery);
    const childNotReturned = get(childNotReturnedQuery);
    return [...childrenOver18, ...missingPrimaryContacts, ...childNotReturned];
  },
});

export const queueItemsCountQuery = selector({
  key: 'queueItemsCountQuery',
  get: ({ get }) => {
    const queueItems = get(queueItemsQuery);
    return queueItems.length;
  },
});

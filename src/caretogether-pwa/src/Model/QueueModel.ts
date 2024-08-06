import { selector } from 'recoil';
import { CombinedFamilyInfo, ExactAge, Person } from '../GeneratedClient';
import { visibleFamiliesQuery } from './Data';
import { differenceInYears } from 'date-fns';

export type QueueItem = ChildOver18 | MissingPrimaryContact;

export interface ChildOver18 {
  type: 'ChildOver18';
  family: CombinedFamilyInfo;
  child: Person;
}

export interface MissingPrimaryContact {
  type: 'MissingPrimaryContact';
  family: CombinedFamilyInfo;
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

export const queueItemsQuery = selector<QueueItem[]>({
  key: 'queueItemsQuery',
  get: ({ get }) => {
    const childrenOver18 = get(childrenOver18Query);
    const missingPrimaryContacts = get(missingPrimaryContactsQuery);
    return (childrenOver18 as QueueItem[]).concat(missingPrimaryContacts);
  },
});

export const queueItemsCountQuery = selector({
  key: 'queueItemsCountQuery',
  get: ({ get }) => {
    const queueItems = get(queueItemsQuery);
    return queueItems.length;
  },
});

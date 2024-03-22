import { selector } from "recoil";
import { CombinedFamilyInfo, ExactAge, Person } from "../GeneratedClient";
import { visibleFamiliesQuery } from "./Data";
import { differenceInYears } from "date-fns";

export type QueueItem = ChildOver18;

export interface ChildOver18 {
  type: 'ChildOver18',
  family: CombinedFamilyInfo,
  child: Person
}

const childrenOver18Query = selector<ChildOver18[]>({
  key: 'childrenOver18Query',
  get: ({ get }) => {
    const visibleFamilies = get(visibleFamiliesQuery);
    const childrenOver18 = visibleFamilies?.flatMap(family =>
      family.family?.children?.filter(child =>
        child.age && differenceInYears(new Date(), (child.age as ExactAge).dateOfBirth!) > 18).map(child =>
          ({ type: 'ChildOver18', family, child } as ChildOver18)) || []);
    return childrenOver18;
  }
});

export const queueItemsQuery = selector<QueueItem[]>({
  key: 'queueItemsQuery',
  get: ({ get }) => {
    const childrenOver18 = get(childrenOver18Query);
    return childrenOver18;
  }
});

export const queueItemsCountQuery = selector({
  key: 'queueItemsCountQuery',
  get: ({ get }) => {
    const queueItems = get(queueItemsQuery);
    return queueItems.length;
  }
});

import { atom } from 'jotai';
import type { RecordsAggregate } from '../GeneratedClient';
import { createSnoozeFreshnessTracker } from './recordsSnoozeFreshness.ts';

export type VisibleAggregatesAction =
  | { type: 'refresh' }
  | RecordsAggregate[]
  | ((current: RecordsAggregate[]) => RecordsAggregate[]);

export function createRecordsScopeCache(
  loadRecords: () => Promise<RecordsAggregate[]>
) {
  const admit = createSnoozeFreshnessTracker();
  const visibleAggregatesBaseAtom = atom<
    RecordsAggregate[] | Promise<RecordsAggregate[]>
  >(loadRecords().then(admit));
  let updateQueue: Promise<void> = Promise.resolve();

  function enqueueVisibleAggregatesUpdate(update: () => void | Promise<void>) {
    const queuedUpdate = updateQueue.then(update, update);

    // Keep this scope's queue usable after a failed update while still
    // returning the original rejection to the caller that caused it.
    updateQueue = queuedUpdate.then(
      () => undefined,
      () => undefined
    );

    return queuedUpdate;
  }

  return atom(
    (get) => get(visibleAggregatesBaseAtom),
    async (get, set, action: VisibleAggregatesAction) => {
      if (
        typeof action === 'object' &&
        !Array.isArray(action) &&
        'type' in action &&
        action.type === 'refresh'
      ) {
        await enqueueVisibleAggregatesUpdate(() =>
          set(visibleAggregatesBaseAtom, loadRecords().then(admit))
        );
        return;
      }

      if (typeof action === 'function') {
        await enqueueVisibleAggregatesUpdate(async () => {
          const current = await get(visibleAggregatesBaseAtom);
          set(visibleAggregatesBaseAtom, admit(action(current)));
        });
        return;
      }

      if (Array.isArray(action)) {
        await enqueueVisibleAggregatesUpdate(() =>
          set(visibleAggregatesBaseAtom, admit(action))
        );
      }
    }
  );
}

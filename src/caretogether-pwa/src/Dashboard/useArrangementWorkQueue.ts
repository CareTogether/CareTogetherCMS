import { atom, useAtomValue } from 'jotai';
import { mapLoadedValue, selectedLocationContextState } from '../Model/Data';
import { partneringFamiliesData } from '../Model/V1CasesModel';
import {
  buildArrangementWorkQueue,
  type ArrangementWorkQueueItem,
} from './arrangementWorkQueue';

const emptyWorkQueue: readonly ArrangementWorkQueueItem[] = [];

const arrangementWorkQueueAtom = atom((get) => {
  const scope = get(selectedLocationContextState);
  if (!scope) return emptyWorkQueue;

  return mapLoadedValue(get(partneringFamiliesData), (families) =>
    buildArrangementWorkQueue(scope, families)
  );
});

export function useArrangementWorkQueue() {
  return useAtomValue(arrangementWorkQueueAtom);
}

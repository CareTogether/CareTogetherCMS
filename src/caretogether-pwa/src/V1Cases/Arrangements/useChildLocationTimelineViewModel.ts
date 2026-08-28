import { useMemo } from 'react';
import { Arrangement } from '../../GeneratedClient';
import {
  childLocationPlanDescription,
  childLocationTimelineEntries,
  currentChildLocationTimelineEntry,
  nextPlannedChildLocationTimelineEntry,
} from './childLocationModel';

type UseChildLocationTimelineViewModelParameters = {
  arrangement: Arrangement;
};

export function useChildLocationTimelineViewModel({
  arrangement,
}: UseChildLocationTimelineViewModelParameters) {
  const entries = useMemo(
    () => childLocationTimelineEntries(arrangement),
    [arrangement]
  );
  const currentLocationEntry = useMemo(
    () => currentChildLocationTimelineEntry(entries),
    [entries]
  );
  const nextPlannedChange = useMemo(
    () =>
      nextPlannedChildLocationTimelineEntry(entries, currentLocationEntry),
    [currentLocationEntry, entries]
  );
  const now = new Date();

  const timelineItems = entries.map((entry) => {
    const isHistoryEntry = Boolean(entry.noteId);
    const isPast = entry.timestampUtc! < now;

    return {
      entry,
      isCurrentLocation: entry === currentLocationEntry,
      isHistoryEntry,
      isNextPlannedChangePastDue:
        entry === nextPlannedChange && entry.timestampUtc! < now,
      isPast,
      planDescription: childLocationPlanDescription(entry.plan),
    };
  });

  return {
    currentLocationEntry,
    entries,
    nextPlannedChange,
    timelineItems,
  };
}

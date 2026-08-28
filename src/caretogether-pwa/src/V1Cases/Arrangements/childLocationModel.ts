import {
  Arrangement,
  ArrangementPhase,
  ChildLocationHistoryEntry,
  ChildLocationPlan,
} from '../../GeneratedClient';

export function childLocationAssigneeKey(entry: ChildLocationHistoryEntry) {
  return `${entry.childLocationFamilyId!}|${entry.childLocationReceivingAdultId!}`;
}

export function arrangementHasNotStarted(arrangement: Arrangement) {
  return (
    arrangement.phase === ArrangementPhase.SettingUp ||
    arrangement.phase === ArrangementPhase.ReadyToStart ||
    arrangement.phase === ArrangementPhase.Cancelled
  );
}

export function childLocationTimelineEntries(arrangement: Arrangement) {
  return (arrangement.childLocationHistory || [])
    .concat(arrangement.childLocationPlan || [])
    .sort((a, b) =>
      a.timestampUtc! < b.timestampUtc!
        ? 1
        : a.timestampUtc! > b.timestampUtc!
          ? -1
          : 0
    );
}

export function currentChildLocationTimelineEntry(
  entries: ChildLocationHistoryEntry[]
) {
  const currentLocationEntryIndex = entries.findIndex((entry) => entry.noteId);

  return currentLocationEntryIndex !== -1
    ? entries[currentLocationEntryIndex]
    : undefined;
}

export function nextPlannedChildLocationTimelineEntry(
  entries: ChildLocationHistoryEntry[],
  currentLocationEntry?: ChildLocationHistoryEntry
) {
  const currentLocationEntryIndex = entries.findIndex((entry) => entry.noteId);

  return entries
    .slice(0, currentLocationEntryIndex)
    .reverse()
    .find(
      (entry) =>
        !entry.noteId &&
        entry.childLocationFamilyId !==
          currentLocationEntry?.childLocationFamilyId
    );
}

export function currentChildLocationHistoryEntry(arrangement: Arrangement) {
  return arrangement.childLocationHistory &&
    arrangement.childLocationHistory.length > 0
    ? arrangement.childLocationHistory[arrangement.childLocationHistory.length - 1]
    : undefined;
}

export function nextPlannedChildLocationEntry(arrangement: Arrangement) {
  const currentLocation = currentChildLocationHistoryEntry(arrangement);

  return arrangement.childLocationPlan && arrangement.childLocationPlan.length > 0
    ? arrangement.childLocationPlan.find(
        (entry) =>
          currentLocation == null ||
          (entry.timestampUtc! > currentLocation.timestampUtc! &&
            entry.childLocationFamilyId !== currentLocation.childLocationFamilyId)
      ) ||
        arrangement.childLocationPlan
          .slice()
          .reverse()
          .find(
            (entry) =>
              entry.childLocationFamilyId !== currentLocation?.childLocationFamilyId
          )
    : undefined;
}

export function childLocationPlanLabel(plan?: ChildLocationPlan) {
  if (plan === ChildLocationPlan.DaytimeChildCare) return 'Daytime child care';
  if (plan === ChildLocationPlan.OvernightHousing) return 'Overnight housing';
  if (plan === ChildLocationPlan.WithParent) return 'With parent';
  return '-';
}

export function childLocationPlanDescription(plan?: ChildLocationPlan) {
  if (plan === ChildLocationPlan.DaytimeChildCare) return 'daytime child care';
  if (plan === ChildLocationPlan.OvernightHousing) return 'overnight housing';
  return 'with parent';
}

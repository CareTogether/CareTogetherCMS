import type { ArrangementWorkQueueItem } from './arrangementWorkQueue';
import {
  defaultDashboardPreferences,
  type DashboardPreferences,
} from './dashboardPreferences.ts';

const defaultLocationTimeZone = 'America/New_York';

export function locationCalendarDate(now: Date, timeZone?: string) {
  const format = (zone: string) =>
    new Intl.DateTimeFormat('sv-SE', {
      timeZone: zone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(now);

  try {
    return format(timeZone ?? defaultLocationTimeZone);
  } catch (error) {
    if (!(error instanceof RangeError) || !timeZone) throw error;
    return format(defaultLocationTimeZone);
  }
}

export type RequirementGroup = {
  item: ArrangementWorkQueueItem;
  count: number;
};

function addRequirement(
  groups: Map<string, RequirementGroup>,
  item: ArrangementWorkQueueItem
) {
  const existing = groups.get(item.id);
  if (existing) {
    existing.count += 1;
    return;
  }
  groups.set(item.id, { item, count: 1 });
}

function offsetCalendarDate(today: string, days: number) {
  const date = new Date(today);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

export function selectDashboardRequirements(
  items: readonly ArrangementWorkQueueItem[],
  today: string,
  preferences: Pick<
    DashboardPreferences,
    'upcomingDays' | 'pastDueDays'
  > = defaultDashboardPreferences
) {
  const cutoff = offsetCalendarDate(today, preferences.upcomingDays);
  const oldest =
    preferences.pastDueDays === 'all'
      ? null
      : offsetCalendarDate(today, -preferences.pastDueDays);
  const upcoming = new Map<string, RequirementGroup>();
  const pastDue = new Map<string, RequirementGroup>();
  let olderPastDueCount = 0;

  for (const item of items) {
    if (item.status === 'past-due') {
      if (
        oldest === null ||
        (item.occurrenceDate >= oldest && item.occurrenceDate <= today)
      ) {
        addRequirement(pastDue, item);
      } else if (item.occurrenceDate < oldest) {
        olderPastDueCount += 1;
      }
    } else if (item.occurrenceDate <= cutoff) {
      addRequirement(upcoming, item);
    }
  }

  return {
    upcoming: [...upcoming.values()],
    pastDue: [...pastDue.values()],
    olderPastDueCount,
  };
}

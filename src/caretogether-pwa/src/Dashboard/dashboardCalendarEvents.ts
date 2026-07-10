import { format, isValid, parseISO } from 'date-fns';
import type {
  SchedulerEvent,
  SchedulerEventColor,
} from '@mui/x-scheduler/models';
import { ChildLocationPlan } from '../GeneratedClient';
import type {
  Arrangement,
  CombinedFamilyInfo,
  Person,
  V1Case,
} from '../GeneratedClient';
import { personNameString } from '../Families/PersonName';
import { familyNameString } from '../Families/FamilyName';

const DASHBOARD_CALENDAR_LEGACY_EVENT_COLORS = {
  lightBlue: 'lightblue',
  red: 'red',
  teal: 'teal',
} as const;

export enum CalendarFilters {
  ArrangementPlannedDuration = 'Arrangement - Planned Duration',
  ArrangementActualStartEndDates = 'Arrangement - Actual Start & End Dates',
  ArrangementCompletedRequirements = 'Arrangement - Completed Requirements',
  ArrangementPastDueRequirements = 'Arrangement - Past-Due Requirements',
  ArrangementUpcomingRequirements = 'Arrangement - Upcoming Requirements',
  ArrangementPlannedChildcare = 'Arrangement - Planned Childcare',
  ArrangementActualChildcare = 'Arrangement - Actual Childcare',
}

export interface DashboardCalendarEvent extends SchedulerEvent {
  familyId?: string;
  v1CaseId?: string;
  arrangementId?: string;
}

type LegacyDashboardCalendarEvent = {
  title: string;
  start?: Date | string;
  end?: Date | string;
  date?: Date | string;
  backgroundColor?: string;
  color?: string;
  extendedProps: {
    familyId?: string;
    v1CaseId?: string;
    arrangementId?: string;
  };
};

type CalendarEventGroups = Record<CalendarFilters, DashboardCalendarEvent[]>;

export type DashboardCalendarDateRange = {
  start: Date;
  end: Date;
};

type DashboardCalendarArrangement = {
  arrangement: Arrangement;
  person: Person;
  familyId?: string;
  v1CaseId: string;
};

function getSchedulerEventId(filter: CalendarFilters, index: number) {
  return `${filter}-${index}`.replace(/[^a-zA-Z0-9_-]/g, '-');
}

function isDefined<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined;
}

function toCalendarDate(value: Date | string | undefined) {
  if (!value) {
    return undefined;
  }

  if (value instanceof Date) {
    return value;
  }

  const date = parseISO(value);

  if (isValid(date)) {
    return date;
  }

  return new Date(value);
}

function dateRangeOverlaps(
  startValue: Date | string | undefined,
  endValue: Date | string | undefined,
  range: DashboardCalendarDateRange
) {
  const start = toCalendarDate(startValue);

  if (!start || !isValid(start)) {
    return false;
  }

  const end = toCalendarDate(endValue) || start;

  if (!isValid(end)) {
    return false;
  }

  return start <= range.end && end >= range.start;
}

function familyPerson(
  family: CombinedFamilyInfo,
  personId: string | undefined
) {
  if (!personId) {
    return undefined;
  }

  const familyPeople = (family.family?.adults || [])
    .map((adult) => adult.item1)
    .filter(isDefined)
    .concat(family.family?.children || []);
  return familyPeople.find((person) => person.id === personId);
}

function getDashboardCalendarArrangements(
  family: CombinedFamilyInfo,
  v1Case: V1Case
): DashboardCalendarArrangement[] {
  return (v1Case.arrangements || []).flatMap((arrangement) => {
    const person = familyPerson(family, arrangement.partneringFamilyPersonId);

    if (!person) {
      return [];
    }

    return [
      {
        arrangement,
        person,
        familyId: family.family?.id,
        v1CaseId: v1Case.id,
      },
    ];
  });
}

function toSchedulerDate(value: Date | string | undefined) {
  if (!value) {
    return undefined;
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  return value;
}

function getSchedulerColor(
  event: LegacyDashboardCalendarEvent
): SchedulerEventColor | undefined {
  const color = event.color || event.backgroundColor;

  if (color === DASHBOARD_CALENDAR_LEGACY_EVENT_COLORS.red) {
    return 'red';
  }

  if (color === DASHBOARD_CALENDAR_LEGACY_EVENT_COLORS.lightBlue) {
    return 'blue';
  }

  if (color === DASHBOARD_CALENDAR_LEGACY_EVENT_COLORS.teal) {
    return 'teal';
  }

  return undefined;
}

function getEventClassName(
  event: LegacyDashboardCalendarEvent,
  filter: CalendarFilters,
  index: number
) {
  const color = event.color || event.backgroundColor;
  const colorClass =
    color === DASHBOARD_CALENDAR_LEGACY_EVENT_COLORS.lightBlue
      ? 'dashboard-calendar-event--light-blue'
      : color === DASHBOARD_CALENDAR_LEGACY_EVENT_COLORS.teal
        ? 'dashboard-calendar-event--teal'
        : color === DASHBOARD_CALENDAR_LEGACY_EVENT_COLORS.red
          ? 'dashboard-calendar-event--red'
          : '';

  return [
    'dashboard-calendar-event',
    `dashboard-calendar-event-id-${getSchedulerEventId(filter, index)}`,
    colorClass,
  ]
    .filter(Boolean)
    .join(' ');
}

function toSchedulerEvents(
  events: LegacyDashboardCalendarEvent[],
  filter: CalendarFilters
) {
  return events
    .map((event, index): DashboardCalendarEvent | null => {
      const start = toSchedulerDate(event.start || event.date);

      if (!start) {
        return null;
      }

      return {
        id: getSchedulerEventId(filter, index),
        title: event.title,
        start,
        end: toSchedulerDate(event.end) || start,
        allDay: true,
        readOnly: true,
        draggable: false,
        resizable: false,
        color: getSchedulerColor(event),
        className: getEventClassName(event, filter, index),
        ...event.extendedProps,
      };
    })
    .filter((event): event is DashboardCalendarEvent => event !== null);
}

export function buildDashboardCalendarEventGroups(
  partneringFamilies: CombinedFamilyInfo[] | undefined,
  familyLookup: (familyId: string | undefined) => CombinedFamilyInfo | undefined,
  visibleDateRange: DashboardCalendarDateRange
): CalendarEventGroups {
  const allArrangements = (partneringFamilies || []).flatMap((family) =>
    (family.partneringFamilyInfo?.closedV1Cases || [])
      .concat(family.partneringFamilyInfo?.openV1Case || [])
      .flatMap((v1Case) => getDashboardCalendarArrangements(family, v1Case))
  );

  const arrangementPlannedDurations = allArrangements
    .filter(({ arrangement }) =>
      dateRangeOverlaps(
        arrangement.plannedStartUtc,
        arrangement.plannedEndUtc,
        visibleDateRange
      )
    )
    .map(
      ({
        arrangement,
        person,
        familyId,
        v1CaseId,
      }): LegacyDashboardCalendarEvent => ({
        title: `${personNameString(person)} - ${arrangement.arrangementType}`,
        start:
          arrangement.plannedStartUtc &&
          format(arrangement.plannedStartUtc, 'yyyy-MM-dd'),
        end:
          arrangement.plannedEndUtc &&
          format(arrangement.plannedEndUtc, 'yyyy-MM-dd'),
        backgroundColor: DASHBOARD_CALENDAR_LEGACY_EVENT_COLORS.lightBlue,
        extendedProps: { familyId, v1CaseId, arrangementId: arrangement.id },
      })
    );

  const arrangementActualStarts = allArrangements
    .filter(({ arrangement }) =>
      dateRangeOverlaps(
        arrangement.startedAtUtc,
        undefined,
        visibleDateRange
      )
    )
    .map(
      ({
        arrangement,
        person,
        familyId,
        v1CaseId,
      }): LegacyDashboardCalendarEvent => ({
        title: `▶ ${personNameString(person)} - ${arrangement.arrangementType}`,
        date: arrangement.startedAtUtc,
        backgroundColor: DASHBOARD_CALENDAR_LEGACY_EVENT_COLORS.teal,
        extendedProps: {
          familyId,
          v1CaseId,
          arrangementId: arrangement.id,
        },
      })
    );

  const arrangementActualEnds = allArrangements
    .filter(({ arrangement }) =>
      dateRangeOverlaps(arrangement.endedAtUtc, undefined, visibleDateRange)
    )
    .map(
      ({
        arrangement,
        person,
        familyId,
        v1CaseId,
      }): LegacyDashboardCalendarEvent => ({
        title: `⏹ ${personNameString(person)} - ${arrangement.arrangementType}`,
        date: arrangement.endedAtUtc,
        backgroundColor: DASHBOARD_CALENDAR_LEGACY_EVENT_COLORS.teal,
        extendedProps: {
          familyId,
          v1CaseId,
          arrangementId: arrangement.id,
        },
      })
    );

  const arrangementCompletedRequirements = allArrangements.flatMap(
    ({ arrangement, person, familyId, v1CaseId }) =>
      arrangement.completedRequirements
        ?.filter((completed) =>
          dateRangeOverlaps(
            completed.completedAtUtc,
            undefined,
            visibleDateRange
          )
        )
        .map(
          (completed): LegacyDashboardCalendarEvent => ({
            title: `✅ ${personNameString(person)} - ${completed.requirementName}`,
            date: completed.completedAtUtc,
            backgroundColor: DASHBOARD_CALENDAR_LEGACY_EVENT_COLORS.teal,
            extendedProps: {
              familyId,
              v1CaseId,
              arrangementId: arrangement.id,
            },
          })
        ) || []
  );

  const allArrangementMissingRequirements = allArrangements.flatMap(
    ({ arrangement, person, familyId, v1CaseId }) =>
      (arrangement.missingRequirements || []).map((missing) => ({
        person,
        missing,
        familyId,
        v1CaseId,
        arrangementId: arrangement.id,
      }))
  );

  const arrangementPastDueRequirements = allArrangementMissingRequirements
    .filter(({ missing }) =>
      dateRangeOverlaps(missing.pastDueSince, undefined, visibleDateRange)
    )
    .map(
      ({
        person,
        missing,
        familyId,
        v1CaseId,
        arrangementId,
      }): LegacyDashboardCalendarEvent => ({
        title: `❌ ${personNameString(person)} - ${missing.action?.actionName}`,
        date:
          missing.pastDueSince && format(missing.pastDueSince, 'yyyy-MM-dd'),
        color: DASHBOARD_CALENDAR_LEGACY_EVENT_COLORS.red,
        extendedProps: {
          familyId,
          v1CaseId,
          arrangementId,
        },
      })
    );

  const arrangementUpcomingRequirements = allArrangementMissingRequirements
    .filter(({ missing }) =>
      dateRangeOverlaps(missing.dueBy, undefined, visibleDateRange)
    )
    .map(
      ({
        person,
        missing,
        familyId,
        v1CaseId,
        arrangementId,
      }): LegacyDashboardCalendarEvent => ({
        title: `📅 ${personNameString(person)} - ${missing.action?.actionName}`,
        date: missing.dueBy && format(missing.dueBy, 'yyyy-MM-dd'),
        backgroundColor: DASHBOARD_CALENDAR_LEGACY_EVENT_COLORS.lightBlue,
        extendedProps: {
          familyId,
          v1CaseId,
          arrangementId,
        },
      })
    );

  const arrangementActualChildcare = allArrangements.flatMap(
    ({ arrangement, person, familyId, v1CaseId }) => {
      const durationEntries = (arrangement.childLocationHistory || []).flatMap(
        (entry, index, history) => {
          const nextEntry =
            index < history.length - 1 ? history[index + 1] : null;

          if (
            !dateRangeOverlaps(
              entry.timestampUtc,
              nextEntry?.timestampUtc,
              visibleDateRange
            )
          ) {
            return [];
          }

          const locationFamily = familyLookup(entry.childLocationFamilyId);

          return [
            {
              title: `🤝🏻 ${personNameString(person)} - ${familyNameString(locationFamily)}`,
              start: entry.timestampUtc,
              backgroundColor:
                entry.plan === ChildLocationPlan.WithParent
                  ? undefined
                  : DASHBOARD_CALENDAR_LEGACY_EVENT_COLORS.teal,
              end: nextEntry?.timestampUtc,
              extendedProps: {
                familyId,
                v1CaseId,
                arrangementId: arrangement.id,
              },
            },
          ];
        }
      );
      return durationEntries.filter(
        (entry) =>
          entry.backgroundColor === DASHBOARD_CALENDAR_LEGACY_EVENT_COLORS.teal
      );
    }
  );

  const arrangementPlannedChildcare = allArrangements.flatMap(
    ({ arrangement, person, familyId, v1CaseId }) => {
      const durationEntries = (arrangement.childLocationPlan || []).flatMap(
        (entry, index, plan) => {
          const nextEntry = index < plan.length - 1 ? plan[index + 1] : null;

          if (
            !dateRangeOverlaps(
              entry.timestampUtc,
              nextEntry?.timestampUtc,
              visibleDateRange
            )
          ) {
            return [];
          }

          const locationFamily = familyLookup(entry.childLocationFamilyId);

          return [
            {
              title: `✋🏻 ${personNameString(person)} - ${familyNameString(locationFamily)}`,
              start: entry.timestampUtc,
              backgroundColor:
                entry.plan === ChildLocationPlan.WithParent
                  ? undefined
                  : DASHBOARD_CALENDAR_LEGACY_EVENT_COLORS.lightBlue,
              end: nextEntry?.timestampUtc,
              extendedProps: {
                familyId,
                v1CaseId,
                arrangementId: arrangement.id,
              },
            },
          ];
        }
      );
      return durationEntries.filter(
        (entry) =>
          entry.backgroundColor ===
          DASHBOARD_CALENDAR_LEGACY_EVENT_COLORS.lightBlue
      );
    }
  );

  return {
    [CalendarFilters.ArrangementPlannedDuration]: toSchedulerEvents(
      arrangementPlannedDurations,
      CalendarFilters.ArrangementPlannedDuration
    ),
    [CalendarFilters.ArrangementActualStartEndDates]: toSchedulerEvents(
      arrangementActualStarts.concat(arrangementActualEnds),
      CalendarFilters.ArrangementActualStartEndDates
    ),
    [CalendarFilters.ArrangementCompletedRequirements]: toSchedulerEvents(
      arrangementCompletedRequirements,
      CalendarFilters.ArrangementCompletedRequirements
    ),
    [CalendarFilters.ArrangementPastDueRequirements]: toSchedulerEvents(
      arrangementPastDueRequirements,
      CalendarFilters.ArrangementPastDueRequirements
    ),
    [CalendarFilters.ArrangementUpcomingRequirements]: toSchedulerEvents(
      arrangementUpcomingRequirements,
      CalendarFilters.ArrangementUpcomingRequirements
    ),
    [CalendarFilters.ArrangementPlannedChildcare]: toSchedulerEvents(
      arrangementPlannedChildcare,
      CalendarFilters.ArrangementPlannedChildcare
    ),
    [CalendarFilters.ArrangementActualChildcare]: toSchedulerEvents(
      arrangementActualChildcare,
      CalendarFilters.ArrangementActualChildcare
    ),
  };
}

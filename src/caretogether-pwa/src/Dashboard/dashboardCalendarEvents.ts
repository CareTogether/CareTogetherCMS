import { format } from 'date-fns';
import type {
  SchedulerEvent,
  SchedulerEventColor,
} from '@mui/x-scheduler/models';
import { ChildLocationPlan, CombinedFamilyInfo } from '../GeneratedClient';
import { personNameString } from '../Families/PersonName';
import { familyNameString } from '../Families/FamilyName';

const CHILDCARE_AWAY_FROM_PARENT_COLOR = '#e58a8a';

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

function getSchedulerEventId(filter: CalendarFilters, index: number) {
  return `${filter}-${index}`.replace(/[^a-zA-Z0-9_-]/g, '-');
}

function familyPerson(family: CombinedFamilyInfo, personId: string) {
  const familyPeople = (family.family?.adults || [])
    .map((adult) => adult.item1!)
    .concat(family.family?.children || []);
  return familyPeople.find((person) => person.id === personId)!;
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

  if (color === 'red' || color === CHILDCARE_AWAY_FROM_PARENT_COLOR) {
    return 'red';
  }

  if (color === 'green' || color === 'lightgreen') {
    return 'green';
  }

  if (color === 'lightblue') {
    return 'blue';
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
    color === 'lightblue'
      ? 'dashboard-calendar-event--light-blue'
      : color === CHILDCARE_AWAY_FROM_PARENT_COLOR
        ? 'dashboard-calendar-event--soft-red'
        : color === 'lightgreen'
          ? 'dashboard-calendar-event--light-green'
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
  familyLookup: (familyId: string | undefined) => CombinedFamilyInfo | undefined
): CalendarEventGroups {
  const allArrangements = (partneringFamilies || []).flatMap((family) =>
    (family.partneringFamilyInfo?.closedV1Cases || [])
      .concat(family.partneringFamilyInfo?.openV1Case || [])
      .flatMap((v1Case) =>
        (v1Case.arrangements || []).map((arrangement) => ({
          arrangement,
          person: familyPerson(family, arrangement.partneringFamilyPersonId!),
          familyId: family.family?.id,
          v1CaseId: v1Case.id,
        }))
      )
  );

  const arrangementPlannedDurations = allArrangements.map(
    ({ arrangement, person, familyId, v1CaseId }) =>
      ({
        title: `${personNameString(person)} - ${arrangement.arrangementType}`,
        start:
          arrangement.plannedStartUtc &&
          format(arrangement.plannedStartUtc, 'yyyy-MM-dd'),
        end:
          arrangement.plannedEndUtc &&
          format(arrangement.plannedEndUtc, 'yyyy-MM-dd'),
        backgroundColor: 'lightblue',
        extendedProps: { familyId, v1CaseId, arrangementId: arrangement.id },
      }) as LegacyDashboardCalendarEvent
  );

  const arrangementActualStarts = allArrangements
    .filter(({ arrangement }) => arrangement.startedAtUtc)
    .map(
      ({ arrangement, person, familyId, v1CaseId }) =>
        ({
          title: `▶ ${personNameString(person)} - ${arrangement.arrangementType}`,
          date: arrangement.startedAtUtc,
          extendedProps: {
            familyId,
            v1CaseId,
            arrangementId: arrangement.id,
          },
        }) as LegacyDashboardCalendarEvent
    );

  const arrangementActualEnds = allArrangements
    .filter(({ arrangement }) => arrangement.endedAtUtc)
    .map(
      ({ arrangement, person, familyId, v1CaseId }) =>
        ({
          title: `⏹ ${personNameString(person)} - ${arrangement.arrangementType}`,
          date: arrangement.endedAtUtc,
          extendedProps: {
            familyId,
            v1CaseId,
            arrangementId: arrangement.id,
          },
        }) as LegacyDashboardCalendarEvent
    );

  const arrangementCompletedRequirements = allArrangements.flatMap(
    ({ arrangement, person, familyId, v1CaseId }) =>
      arrangement.completedRequirements?.map(
        (completed) =>
          ({
            title: `✅ ${personNameString(person)} - ${completed.requirementName}`,
            date: completed.completedAtUtc,
            extendedProps: {
              familyId,
              v1CaseId: v1CaseId,
              arrangementId: arrangement.id,
            },
          }) as LegacyDashboardCalendarEvent
      ) || []
  );

  const allArrangementMissingRequirements = allArrangements.flatMap(
    ({ arrangement, person, familyId, v1CaseId: v1CaseId }) =>
      (arrangement.missingRequirements || []).map((missing) => ({
        person,
        missing,
        familyId,
        v1CaseId,
        arrangementId: arrangement.id,
      }))
  );

  const arrangementPastDueRequirements = allArrangementMissingRequirements
    .filter(({ missing }) => missing.pastDueSince)
    .map(
      ({ person, missing, familyId, v1CaseId, arrangementId }) =>
        ({
          title: `❌ ${personNameString(person)} - ${missing.action?.actionName}`,
          date:
            missing.pastDueSince && format(missing.pastDueSince, 'yyyy-MM-dd'),
          color: 'red',
          extendedProps: {
            familyId,
            v1CaseId,
            arrangementId,
          },
        }) as LegacyDashboardCalendarEvent
    );

  const arrangementUpcomingRequirements = allArrangementMissingRequirements
    .filter(({ missing }) => missing.dueBy)
    .map(
      ({ person, missing, familyId, v1CaseId, arrangementId }) =>
        ({
          title: `📅 ${personNameString(person)} - ${missing.action?.actionName}`,
          date: missing.dueBy && format(missing.dueBy, 'yyyy-MM-dd'),
          extendedProps: {
            familyId,
            v1CaseId,
            arrangementId,
          },
        }) as LegacyDashboardCalendarEvent
    );

  const arrangementActualChildcare = allArrangements.flatMap(
    ({ arrangement, person, familyId, v1CaseId }) => {
      const durationEntries = (arrangement.childLocationHistory || []).map(
        (entry, index, history) => {
          const nextEntry =
            index < history.length - 1 ? history[index + 1] : null;
          const locationFamily = familyLookup(entry.childLocationFamilyId);
          return {
            title: `🤝🏻 ${personNameString(person)} - ${familyNameString(locationFamily)}`,
            start: entry.timestampUtc,
            backgroundColor:
              entry.plan === ChildLocationPlan.WithParent
                ? 'green'
                : CHILDCARE_AWAY_FROM_PARENT_COLOR,
            end: nextEntry?.timestampUtc,
            extendedProps: {
              familyId,
              v1CaseId,
              arrangementId: arrangement.id,
            },
          } as LegacyDashboardCalendarEvent;
        }
      );
      return durationEntries.filter(
        (entry) => entry.backgroundColor === CHILDCARE_AWAY_FROM_PARENT_COLOR
      );
    }
  );

  const arrangementPlannedChildcare = allArrangements.flatMap(
    ({ arrangement, person, familyId, v1CaseId }) => {
      const durationEntries = (arrangement.childLocationPlan || []).map(
        (entry, index, plan) => {
          const nextEntry = index < plan.length - 1 ? plan[index + 1] : null;
          const locationFamily = familyLookup(entry.childLocationFamilyId);
          return {
            title: `✋🏻 ${personNameString(person)} - ${familyNameString(locationFamily)}`,
            start: entry.timestampUtc,
            backgroundColor:
              entry.plan === ChildLocationPlan.WithParent
                ? 'lightgreen'
                : CHILDCARE_AWAY_FROM_PARENT_COLOR,
            end: nextEntry?.timestampUtc,
            extendedProps: {
              familyId,
              v1CaseId,
              arrangementId: arrangement.id,
            },
          } as LegacyDashboardCalendarEvent;
        }
      );
      return durationEntries.filter(
        (entry) => entry.backgroundColor === CHILDCARE_AWAY_FROM_PARENT_COLOR
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

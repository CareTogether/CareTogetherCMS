import { MouseEvent, useMemo, useState } from 'react';
import {
  addDays,
  endOfDay,
  endOfMonth,
  endOfWeek,
  startOfDay,
  startOfMonth,
  startOfWeek,
} from 'date-fns';
import Grid from '../Generic/GridLegacyCompat';
import { Box, IconButton, Tooltip, Typography } from '@mui/material';
import { InfoOutlined as InfoOutlinedIcon } from '@mui/icons-material';
import { EventCalendar } from '@mui/x-scheduler/event-calendar';
import type { EventCalendarPreferences } from '@mui/x-scheduler/models';
import { usePartneringFamilies } from '../Model/V1CasesModel';
import { useFamilyLookup } from '../Model/DirectoryModel';
import { useAppNavigate } from '../Hooks/useAppNavigate';
import { useLocalStorage } from '../Hooks/useLocalStorage';
import {
  buildDashboardCalendarEventGroups,
  CalendarFilters,
  DashboardCalendarEvent,
} from './dashboardCalendarEvents';

const DASHBOARD_CALENDAR_VIEW_KEY = 'caretogether:dashboardCalendarView';
const DASHBOARD_CALENDAR_EVENT_TYPE_FILTERS_KEY =
  'caretogether:dashboardCalendarEventTypeFilters';
const DASHBOARD_CALENDAR_AGENDA_DAYS = 12;
const DASHBOARD_CALENDAR_EVENT_COLORS = {
  teal: {
    backgroundColor: '#80cbc4',
    color: '#00473b',
  },
  lightBlue: {
    backgroundColor: '#90caf9',
    color: '#0B3A84',
  },
  red: {
    backgroundColor: '#ffa3a3',
    color: '#770000',
  },
  purple: {
    backgroundColor: '#d1c4e9',
    color: '#311b5b',
  },
} as const;

type CalendarView = 'day' | 'week' | 'month' | 'agenda';
type CalendarEventTypeFilter = {
  key: string;
  filter: CalendarFilters;
  eventColor: {
    backgroundColor: string;
    color: string;
  };
  icon?: string;
  label: string;
  description: string;
};

const calendarEventTypeFilters: CalendarEventTypeFilter[] = [
  {
    key: 'cancelled-arrangement',
    filter: CalendarFilters.ArrangementCancelled,
    eventColor: DASHBOARD_CALENDAR_EVENT_COLORS.purple,
    icon: '✖',
    label: 'Cancelled arrangement',
    description: 'cancelled arrangement across its planned start-to-end range',
  },
  {
    key: 'planned-duration',
    filter: CalendarFilters.ArrangementPlannedDuration,
    eventColor: DASHBOARD_CALENDAR_EVENT_COLORS.lightBlue,
    label: 'Planned duration',
    description: 'planned start-to-end arrangement range',
  },
  {
    key: 'actual-start',
    filter: CalendarFilters.ArrangementActualStartEndDates,
    eventColor: DASHBOARD_CALENDAR_EVENT_COLORS.teal,
    icon: '▶',
    label: 'Actual start',
    description: 'arrangement started on this date',
  },
  {
    key: 'actual-end',
    filter: CalendarFilters.ArrangementActualStartEndDates,
    eventColor: DASHBOARD_CALENDAR_EVENT_COLORS.teal,
    icon: '⏹',
    label: 'Actual end',
    description: 'arrangement ended on this date',
  },
  {
    key: 'completed-requirement',
    filter: CalendarFilters.ArrangementCompletedRequirements,
    eventColor: DASHBOARD_CALENDAR_EVENT_COLORS.teal,
    icon: '✅',
    label: 'Completed requirement',
    description: 'requirement completed on this date',
  },
  {
    key: 'past-due-requirement',
    filter: CalendarFilters.ArrangementPastDueRequirements,
    eventColor: DASHBOARD_CALENDAR_EVENT_COLORS.red,
    icon: '❌',
    label: 'Past-due requirement',
    description: 'requirement has been past due since this date',
  },
  {
    key: 'upcoming-requirement',
    filter: CalendarFilters.ArrangementUpcomingRequirements,
    eventColor: DASHBOARD_CALENDAR_EVENT_COLORS.lightBlue,
    icon: '📅',
    label: 'Upcoming requirement',
    description: 'requirement is due on this date',
  },
  {
    key: 'planned-childcare',
    filter: CalendarFilters.ArrangementPlannedChildcare,
    eventColor: DASHBOARD_CALENDAR_EVENT_COLORS.lightBlue,
    icon: '✋🏻',
    label: 'Planned childcare',
    description:
      'planned child location away from parent with the listed family',
  },
  {
    key: 'actual-childcare',
    filter: CalendarFilters.ArrangementActualChildcare,
    eventColor: DASHBOARD_CALENDAR_EVENT_COLORS.teal,
    icon: '🤝🏻',
    label: 'Actual childcare',
    description:
      'recorded child location away from parent with the listed family',
  },
];

const calendarViews: CalendarView[] = ['month', 'agenda'];
const calendarPreferences: Partial<EventCalendarPreferences> = {
  showWeekends: true,
  showEmptyDaysInAgenda: true,
  isSidePanelOpen: false,
  weekStartsOn: 1,
};

function getSavedInitialView(): CalendarView {
  const savedView = localStorage.getItem(DASHBOARD_CALENDAR_VIEW_KEY);

  if (savedView === 'listWeek') {
    return 'agenda';
  }

  if (savedView === 'month' || savedView === 'agenda') {
    return savedView;
  }

  return 'month';
}

function getVisibleDateRange(view: CalendarView, visibleDate: Date) {
  if (view === 'agenda') {
    return {
      start: startOfDay(visibleDate),
      end: endOfDay(addDays(visibleDate, DASHBOARD_CALENDAR_AGENDA_DAYS - 1)),
    };
  }

  if (view === 'month') {
    return {
      start: startOfWeek(startOfMonth(visibleDate), { weekStartsOn: 1 }),
      end: endOfWeek(endOfMonth(visibleDate), { weekStartsOn: 1 }),
    };
  }

  return {
    start: startOfDay(visibleDate),
    end: endOfDay(visibleDate),
  };
}

function getDashboardCalendarEventId(element: Element | null) {
  const eventElement = element?.closest('.dashboard-calendar-event');
  const eventIdClass = Array.from(eventElement?.classList || []).find((name) =>
    name.startsWith('dashboard-calendar-event-id-')
  );

  return eventIdClass?.replace('dashboard-calendar-event-id-', '');
}

function getDashboardCalendarEventTypeFilterKey(
  filter: CalendarFilters,
  event: DashboardCalendarEvent
) {
  if (filter === CalendarFilters.ArrangementCancelled) {
    return 'cancelled-arrangement';
  }

  if (filter === CalendarFilters.ArrangementPlannedDuration) {
    return 'planned-duration';
  }

  if (filter === CalendarFilters.ArrangementActualStartEndDates) {
    if (event.title.startsWith('⏹')) {
      return 'actual-end';
    }

    return 'actual-start';
  }

  if (filter === CalendarFilters.ArrangementCompletedRequirements) {
    return 'completed-requirement';
  }

  if (filter === CalendarFilters.ArrangementPastDueRequirements) {
    return 'past-due-requirement';
  }

  if (filter === CalendarFilters.ArrangementUpcomingRequirements) {
    return 'upcoming-requirement';
  }

  if (filter === CalendarFilters.ArrangementPlannedChildcare) {
    return 'planned-childcare';
  }

  return 'actual-childcare';
}

export function DashboardCalendar() {
  const familyLookup = useFamilyLookup();
  const partneringFamilies = usePartneringFamilies();
  const appNavigate = useAppNavigate();
  const [view, setView] = useState<CalendarView>(getSavedInitialView);
  const [visibleDate, setVisibleDate] = useState(() => startOfDay(new Date()));
  const [storedEventTypeFilterKeys, setStoredEventTypeFilterKeys] =
    useLocalStorage(
      DASHBOARD_CALENDAR_EVENT_TYPE_FILTERS_KEY,
      calendarEventTypeFilters.map((filter) => filter.key)
    );
  const selectedEventTypeFilterKeys = useMemo(
    () => new Set(storedEventTypeFilterKeys),
    [storedEventTypeFilterKeys]
  );

  const visibleDateRange = useMemo(
    () => getVisibleDateRange(view, visibleDate),
    [view, visibleDate]
  );

  const eventGroups = useMemo(
    () =>
      buildDashboardCalendarEventGroups(
        partneringFamilies,
        familyLookup,
        visibleDateRange
      ),
    [familyLookup, partneringFamilies, visibleDateRange]
  );

  const filteredEvents = useMemo(
    () =>
      Object.values(CalendarFilters).flatMap((filter) =>
        eventGroups[filter].filter((event) =>
          selectedEventTypeFilterKeys.has(
            getDashboardCalendarEventTypeFilterKey(filter, event)
          )
        )
      ),
    [eventGroups, selectedEventTypeFilterKeys]
  );

  const eventsById = useMemo(() => {
    const lookup: Record<string, DashboardCalendarEvent> = {};

    filteredEvents.forEach((event) => {
      lookup[String(event.id)] = event;
    });

    return lookup;
  }, [filteredEvents]);

  function navigateToCalendarEvent(event: DashboardCalendarEvent | undefined) {
    if (!event) {
      return;
    }

    const { familyId, v1CaseId, arrangementId } = event;

    if (familyId && v1CaseId && arrangementId) {
      appNavigate.family(familyId, { v1CaseId, arrangementId });
      return;
    }

    if (familyId) {
      appNavigate.family(familyId);
    }
  }

  function handleCalendarClick(event: MouseEvent<HTMLDivElement>) {
    const calendarEventId = getDashboardCalendarEventId(
      event.target as Element
    );
    navigateToCalendarEvent(
      calendarEventId ? eventsById[calendarEventId] : undefined
    );
  }

  function isEventTypeFilterSelected(eventTypeFilter: CalendarEventTypeFilter) {
    return selectedEventTypeFilterKeys.has(eventTypeFilter.key);
  }

  function handleEventTypeFilterToggle(
    eventTypeFilter: CalendarEventTypeFilter
  ) {
    const nextSelectedKeys = new Set(selectedEventTypeFilterKeys);

    if (nextSelectedKeys.has(eventTypeFilter.key)) {
      nextSelectedKeys.delete(eventTypeFilter.key);
    } else {
      nextSelectedKeys.add(eventTypeFilter.key);
    }

    setStoredEventTypeFilterKeys(
      calendarEventTypeFilters
        .filter((filter) => nextSelectedKeys.has(filter.key))
        .map((filter) => filter.key)
    );
  }

  return (
    <Grid container sx={{ flex: 1, flexDirection: 'column', minHeight: 0 }}>
      <Grid item sx={{ marginBottom: 1 }}>
        <Box
          aria-label="Filter event types"
          sx={{
            maxWidth: '100%',
            paddingY: 1,
            width: 'fit-content',
          }}
        >
          <Typography
            variant="body2"
            sx={{ fontWeight: 600, marginBottom: 0.75 }}
          >
            Filter event types
          </Typography>
          <Box
            sx={{
              alignItems: 'center',
              display: 'flex',
              flexWrap: 'wrap',
              gap: 1,
              maxWidth: '100%',
            }}
          >
            {calendarEventTypeFilters.map((eventTypeFilter) => {
              const selected = isEventTypeFilterSelected(eventTypeFilter);

              return (
                <Box
                  key={eventTypeFilter.key}
                  sx={{
                    alignItems: 'center',
                    display: 'flex',
                    gap: 0.25,
                    minWidth: 0,
                  }}
                >
                  <Box
                    aria-pressed={selected}
                    component="button"
                    onClick={() => handleEventTypeFilterToggle(eventTypeFilter)}
                    type="button"
                    sx={{
                      ...eventTypeFilter.eventColor,
                      alignItems: 'center',
                      border: '1px solid transparent',
                      borderRadius: 0.75,
                      boxShadow: selected
                        ? '0 1px 2px rgba(0, 0, 0, 0.16)'
                        : 'none',
                      boxSizing: 'border-box',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      font: 'inherit',
                      fontSize: '0.76rem',
                      fontWeight: 700,
                      gap: 0.4,
                      height: 24,
                      lineHeight: 1.2,
                      maxWidth: '100%',
                      opacity: selected ? 1 : 0.42,
                      overflow: 'hidden',
                      px: 0.75,
                      textOverflow: 'ellipsis',
                      transition:
                        'opacity 0.2s ease-in-out, box-shadow 0.2s ease-in-out, filter 0.2s ease-in-out',
                      whiteSpace: 'nowrap',
                      '&:hover': {
                        filter: selected ? 'brightness(0.94)' : 'none',
                      },
                      '&:focus-visible': {
                        outline: '2px solid #1976d2',
                        outlineOffset: 2,
                      },
                    }}
                  >
                    {eventTypeFilter.icon && (
                      <Box
                        aria-hidden="true"
                        component="span"
                        sx={{
                          alignItems: 'center',
                          display: 'inline-flex',
                          flex: '0 0 auto',
                          height: '100%',
                          lineHeight: 1,
                        }}
                      >
                        {eventTypeFilter.icon}
                      </Box>
                    )}
                    <Box
                      component="span"
                      sx={{
                        minWidth: 0,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {eventTypeFilter.label}
                    </Box>
                  </Box>
                  <Tooltip
                    arrow
                    enterTouchDelay={0}
                    title={eventTypeFilter.description}
                  >
                    <IconButton
                      aria-label={`${eventTypeFilter.label} details`}
                      size="small"
                      sx={{
                        color: 'text.secondary',
                        flex: '0 0 auto',
                        height: 24,
                        width: 24,
                      }}
                    >
                      <InfoOutlinedIcon fontSize="inherit" />
                    </IconButton>
                  </Tooltip>
                </Box>
              );
            })}
          </Box>
        </Box>
      </Grid>
      <Grid
        item
        onClickCapture={handleCalendarClick}
        sx={{ flex: 1, minHeight: 0 }}
      >
        <EventCalendar
          key={
            view === 'month'
              ? `month-${visibleDate.getFullYear()}-${visibleDate.getMonth()}`
              : view
          }
          events={filteredEvents}
          visibleDate={visibleDate}
          view={view}
          views={calendarViews}
          onVisibleDateChange={(nextVisibleDate) => {
            setVisibleDate(startOfDay(nextVisibleDate));
          }}
          onViewChange={(nextView) => {
            localStorage.setItem(DASHBOARD_CALENDAR_VIEW_KEY, nextView);
            setView(nextView);
          }}
          preferences={calendarPreferences}
          localeText={{
            agenda: 'Agenda',
            month: 'Month',
            today: 'Today',
            allDay: 'All day',
          }}
          preferencesMenuConfig={false}
          readOnly
          areEventsDraggable={false}
          areEventsResizable={false}
          sx={{ height: '100%', minHeight: 520 }}
        />
      </Grid>
    </Grid>
  );
}

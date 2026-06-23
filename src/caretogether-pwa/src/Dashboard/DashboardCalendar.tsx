import { MouseEvent, useMemo, useState } from 'react';
import Grid from '../Generic/GridLegacyCompat';
import { Box, GlobalStyles, Typography } from '@mui/material';
import { EventCalendar } from '@mui/x-scheduler/event-calendar';
import type { EventCalendarPreferences } from '@mui/x-scheduler/models';
import { partneringFamiliesData } from '../Model/V1CasesModel';
import { useLoadable } from '../Hooks/useLoadable';
import { useFamilyLookup } from '../Model/DirectoryModel';
import { useFilterMenu } from '../Generic/useFilterMenu';
import { FilterMenu } from '../Generic/FilterMenu';
import { useAppNavigate } from '../Hooks/useAppNavigate';
import {
  buildDashboardCalendarEventGroups,
  CalendarFilters,
  DashboardCalendarEvent,
} from './dashboardCalendarEvents';

const DASHBOARD_CALENDAR_VIEW_KEY = 'dashboardCalendarView';
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
  softRed: {
    backgroundColor: '#f3aaaa',
    color: '#4d0f0f',
  },
  lightGreen: {
    backgroundColor: '#c9efc9',
    color: '#123f19',
  },
} as const;

type CalendarView = 'day' | 'week' | 'month' | 'agenda';

const calendarViews: CalendarView[] = ['month', 'agenda'];
const calendarPreferences: Partial<EventCalendarPreferences> = {
  showWeekends: true,
  showEmptyDaysInAgenda: false,
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

function getDashboardCalendarEventId(element: Element | null) {
  const eventElement = element?.closest('.dashboard-calendar-event');
  const eventIdClass = Array.from(eventElement?.classList || []).find((name) =>
    name.startsWith('dashboard-calendar-event-id-')
  );

  return eventIdClass?.replace('dashboard-calendar-event-id-', '');
}

export function DashboardCalendar() {
  const familyLookup = useFamilyLookup();
  const partneringFamilies = useLoadable(partneringFamiliesData);
  const appNavigate = useAppNavigate();
  const [view, setView] = useState<CalendarView>(getSavedInitialView);

  const eventGroups = useMemo(
    () =>
      buildDashboardCalendarEventGroups(
        partneringFamilies || undefined,
        familyLookup
      ),
    [familyLookup, partneringFamilies]
  );

  const { filterOptions, handleFilterChange } = useFilterMenu(
    Object.values(CalendarFilters),
    [
      CalendarFilters.ArrangementPlannedDuration,
      CalendarFilters.ArrangementActualStartEndDates,
      CalendarFilters.ArrangementCompletedRequirements,
      CalendarFilters.ArrangementPastDueRequirements,
      CalendarFilters.ArrangementUpcomingRequirements,
      CalendarFilters.ArrangementPlannedChildcare,
      CalendarFilters.ArrangementActualChildcare,
    ]
  );

  function isSelected(option: string) {
    return (
      filterOptions.find((filterOption) => filterOption.key === option)
        ?.selected || false
    );
  }

  const filteredEvents = Object.values(CalendarFilters).flatMap((filter) =>
    isSelected(filter) ? eventGroups[filter] : []
  );

  const calendarLegendItems = [
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
      eventColor: DASHBOARD_CALENDAR_EVENT_COLORS.teal,
      icon: '📅',
      label: 'Upcoming requirement',
      description: 'requirement is due on this date',
    },
    {
      key: 'planned-childcare',
      filter: CalendarFilters.ArrangementPlannedChildcare,
      eventColor: DASHBOARD_CALENDAR_EVENT_COLORS.softRed,
      icon: '✋🏻',
      label: 'Planned childcare',
      description:
        'planned child location away from parent with the listed family',
    },
    {
      key: 'actual-childcare',
      filter: CalendarFilters.ArrangementActualChildcare,
      eventColor: DASHBOARD_CALENDAR_EVENT_COLORS.softRed,
      icon: '🤝🏻',
      label: 'Actual childcare',
      description:
        'recorded child location away from parent with the listed family',
    },
  ].filter((legendItem) => isSelected(legendItem.filter));
  const eventsById = useMemo(
    () =>
      filteredEvents.reduce<Record<string, DashboardCalendarEvent>>(
        (lookup, event) => ({
          ...lookup,
          [String(event.id)]: event,
        }),
        {}
      ),
    [filteredEvents]
  );

  function navigateToCalendarEvent(event: DashboardCalendarEvent | undefined) {
    if (!event) {
      return;
    }

    const { familyId, v1CaseId, arrangementId } = event;

    if (familyId && v1CaseId && arrangementId) {
      appNavigate.family(familyId, v1CaseId, arrangementId);
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

  return (
    <Grid container>
      <Grid item xs={12} sx={{ textAlign: 'right', marginBottom: 1 }}>
        <Typography variant="body1" sx={{ display: 'inline' }}>
          Filter events:{' '}
        </Typography>
        <FilterMenu
          singularLabel={`Event`}
          pluralLabel={`Events`}
          filterOptions={filterOptions}
          handleFilterChange={handleFilterChange}
        />
      </Grid>
      <Grid
        item
        xs={12}
        onClickCapture={handleCalendarClick}
        sx={{
          width: '100%',
          minWidth: 0,
          '.MuiEventCalendar-root': {
            width: '100%',
            minHeight: {
              xs: 520,
              md: 'calc(100vh - 210px)',
            },
          },
          '.MuiEventCalendar-sidePanel, .MuiEventCalendar-sidePanelCollapse, .MuiEventCalendar-sidePanelDivider, .MuiEventCalendar-headerToolbarSidePanelToggle':
            {
              display: 'none',
            },
          '.MuiEventCalendar-mainPanel, .MuiEventCalendar-content': {
            width: '100%',
            maxWidth: '100%',
            minWidth: 0,
          },
          '.MuiEventCalendar-headerToolbar': {
            alignItems: 'center',
            gap: 1,
            px: 0,
            mb: 1.5,
          },
          '.MuiEventCalendar-headerToolbarLabel': {
            fontSize: { xs: '1.1rem', md: '1.35rem' },
            fontWeight: 700,
          },
          '.MuiEventCalendar-viewSwitcherButton, .MuiEventCalendar-headerToolbarTodayButton':
            {
              fontWeight: 700,
              letterSpacing: 0,
            },
          '.MuiEventCalendar-monthView': {
            width: '100%',
          },
          '.MuiEventCalendar-monthViewGrid': {
            minHeight: {
              xs: 480,
              md: 'calc(100vh - 280px)',
            },
          },
          '.MuiEventCalendar-monthViewCell': {
            verticalAlign: 'top',
          },
          '.MuiEventCalendar-monthViewCellEvents': {
            px: 0,
            pb: 0.75,
            gap: 0.65,
          },
          '.MuiEventCalendar-dayGridEvent': {
            justifySelf: 'stretch',
            alignSelf: 'stretch',
            boxSizing: 'border-box',
            minWidth: 0,
          },
          '.MuiEventCalendar-dayGridEventCardWrapper': {
            width: '100%',
            maxWidth: '100%',
            minWidth: 0,
            gap: 0.5,
          },
          '.MuiEventCalendar-dayGridEventCardContent': {
            width: '100%',
            minWidth: 0,
            height: 'auto',
            lineHeight: 1.2,
          },
          '.MuiEventCalendar-dayGridEventCardContent, .MuiEventCalendar-eventItemCardContent':
            {
              alignItems: 'flex-start',
              px: 0,
              py: 0,
              minHeight: 0,
            },
          '.MuiEventCalendar-dayGridEventTitle, .MuiEventCalendar-eventItemTitle':
            {
              fontSize: '0.76rem',
              fontWeight: 700,
              lineHeight: 1.2,
              letterSpacing: 0,
            },
          '.MuiEventCalendar-dayGridEventLinesClamp': {
            display: 'block',
            width: '100%',
            minWidth: 0,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            wordBreak: 'normal',
            overflowWrap: 'normal',
          },
          '.MuiEventCalendar-eventColorIndicator': {
            display: 'none',
          },
          '.MuiEventCalendar-agendaView': {
            width: '100%',
            borderRadius: 1,
          },
          '.MuiEventCalendar-agendaViewRow': {
            minHeight: 54,
          },
          '.MuiEventCalendar-agendaViewDayHeaderCell': {
            width: { xs: 96, md: 160 },
          },
          '.MuiEventCalendar-agendaViewEventsList': {
            py: 0.75,
            gap: 0.75,
          },
          '.MuiEventCalendar-agendaViewEventListItem': {
            maxWidth: '100%',
          },
          '.MuiEventCalendar-eventItemCardWrapper': {
            width: '100%',
            maxWidth: { xs: '100%', md: 760 },
          },
          '.MuiEventCalendar-eventItemLinesClamp': {
            WebkitLineClamp: 3,
            WebkitBoxOrient: 'vertical',
            whiteSpace: 'normal',
            overflow: 'hidden',
          },
          '.dashboard-calendar-event': {
            cursor: 'pointer',
            borderRadius: 0.75,
            boxShadow: '0 1px 2px rgba(0, 0, 0, 0.16)',
            minHeight: 24,
            px: 0.75,
            py: 0.25,
            transition:
              'background-color 0.2s ease-in-out, box-shadow 0.2s ease-in-out, transform 0.2s ease-in-out',
          },
          '.dashboard-calendar-event:hover': {
            filter: 'brightness(0.94)',
            boxShadow: '0 2px 6px rgba(0, 0, 0, 0.22)',
            transform: 'translateY(-1px)',
          },
          '.dashboard-calendar-event--light-blue': {
            ...DASHBOARD_CALENDAR_EVENT_COLORS.lightBlue,
          },
          '.dashboard-calendar-event--soft-red': {
            ...DASHBOARD_CALENDAR_EVENT_COLORS.softRed,
          },
          '.dashboard-calendar-event--light-green': {
            ...DASHBOARD_CALENDAR_EVENT_COLORS.lightGreen,
          },
        }}
      >
        <GlobalStyles
          styles={{
            '.MuiEventCalendar-eventDialog': {
              display: 'none',
            },
          }}
        />
        <EventCalendar<DashboardCalendarEvent, object>
          events={filteredEvents}
          view={view}
          views={calendarViews}
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
        />
      </Grid>
      {calendarLegendItems.length > 0 && (
        <Grid item xs={12} sx={{ marginTop: 1 }}>
          <Box
            aria-label="Calendar legend"
            sx={{
              paddingY: 1,
            }}
          >
            <Typography
              variant="body2"
              sx={{ fontWeight: 600, marginBottom: 0.75 }}
            >
              Legend
            </Typography>
            <Box
              sx={{
                display: 'grid',
                gap: 1,
                gridTemplateColumns: {
                  xs: '1fr',
                  sm: 'repeat(2, minmax(0, 1fr))',
                  lg: 'repeat(4, minmax(0, 1fr))',
                },
              }}
            >
              {calendarLegendItems.map((legendItem) => (
                <Box
                  key={legendItem.key}
                  sx={{
                    minWidth: 0,
                  }}
                >
                  <Box
                    component="span"
                    sx={{
                      ...legendItem.eventColor,
                      border: '1px solid transparent',
                      borderRadius: 0.75,
                      boxShadow: '0 1px 2px rgba(0, 0, 0, 0.16)',
                      alignItems: 'center',
                      boxSizing: 'border-box',
                      display: 'inline-flex',
                      fontSize: '0.76rem',
                      fontWeight: 700,
                      gap: 0.4,
                      height: 24,
                      lineHeight: 1.2,
                      maxWidth: '100%',
                      overflow: 'hidden',
                      px: 0.75,
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {legendItem.icon && (
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
                        {legendItem.icon}
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
                      {legendItem.label}
                    </Box>
                  </Box>
                  <Box sx={{ minWidth: 0 }}>
                    <Typography
                      color="text.secondary"
                      component="span"
                      variant="body2"
                      sx={{ display: 'block', marginTop: 0.5 }}
                    >
                      {legendItem.description}
                    </Typography>
                  </Box>
                </Box>
              ))}
            </Box>
          </Box>
        </Grid>
      )}
    </Grid>
  );
}

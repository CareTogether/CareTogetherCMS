import Grid from '@mui/material/GridLegacy';
import { Box, Typography } from '@mui/material';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import listPlugin from '@fullcalendar/list';
import { format } from 'date-fns';
import { EventInput, EventSourceInput } from '@fullcalendar/core/index.js';
import { partneringFamiliesData } from '../Model/V1CasesModel';
import { useLoadable } from '../Hooks/useLoadable';
import { ChildLocationPlan, CombinedFamilyInfo } from '../GeneratedClient';
import { personNameString } from '../Families/PersonName';
import { useFamilyLookup } from '../Model/DirectoryModel';
import { familyNameString } from '../Families/FamilyName';
import { useFilterMenu } from '../Generic/useFilterMenu';
import { FilterMenu } from '../Generic/FilterMenu';
import { useAppNavigate } from '../Hooks/useAppNavigate';

// function renderEventContent(eventInfo: any) {
//   return (
//     <>
//       <b>{eventInfo.timeText}</b>
//       <i>{eventInfo.event.title}</i>
//     </>
//   )
// }

const DASHBOARD_CALENDAR_VIEW_KEY = 'dashboardCalendarView';
const DEFAULT_EVENT_COLOR = '#3788d8';
const PLANNED_DURATION_COLOR = 'lightblue';
const PAST_DUE_REQUIREMENT_COLOR = 'red';
const ACTUAL_CHILDCARE_AWAY_FROM_PARENT_COLOR = '#a52a2a';
const PLANNED_CHILDCARE_AWAY_FROM_PARENT_COLOR = '#e58a8a';

function familyPerson(family: CombinedFamilyInfo, personId: string) {
  const familyPeople = (family.family?.adults || [])
    .map((adult) => adult.item1!)
    .concat(family.family?.children || []);
  return familyPeople.find((person) => person.id === personId)!;
}

export function DashboardCalendar() {
  const familyLookup = useFamilyLookup();
  const partneringFamilies = useLoadable(partneringFamiliesData);
  const savedInitialView =
    localStorage.getItem(DASHBOARD_CALENDAR_VIEW_KEY) || 'dayGridMonth';

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
        backgroundColor: PLANNED_DURATION_COLOR,
        extendedProps: { familyId, v1CaseId, arrangementId: arrangement.id },
      }) as EventInput
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
        }) as EventInput
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
        }) as EventInput
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
          }) as EventInput
      )
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
          color: PAST_DUE_REQUIREMENT_COLOR,
          extendedProps: {
            familyId,
            v1CaseId,
            arrangementId,
          },
        }) as EventInput
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
        }) as EventInput
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
                : ACTUAL_CHILDCARE_AWAY_FROM_PARENT_COLOR,
            end: nextEntry?.timestampUtc,
            extendedProps: {
              familyId,
              v1CaseId,
              arrangementId: arrangement.id,
            },
          } as EventInput;
        }
      );
      return durationEntries.filter(
        (entry) =>
          entry.backgroundColor === ACTUAL_CHILDCARE_AWAY_FROM_PARENT_COLOR
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
                : PLANNED_CHILDCARE_AWAY_FROM_PARENT_COLOR,
            end: nextEntry?.timestampUtc,
            extendedProps: {
              familyId,
              v1CaseId,
              arrangementId: arrangement.id,
            },
          } as EventInput;
        }
      );
      return durationEntries.filter(
        (entry) =>
          entry.backgroundColor === PLANNED_CHILDCARE_AWAY_FROM_PARENT_COLOR
      );
    }
  );

  enum CalendarFilters {
    ArrangementPlannedDuration = 'Arrangement - Planned Duration',
    ArrangementActualStartEndDates = 'Arrangement - Actual Start & End Dates',
    ArrangementCompletedRequirements = 'Arrangement - Completed Requirements',
    ArrangementPastDueRequirements = 'Arrangement - Past-Due Requirements',
    ArrangementUpcomingRequirements = 'Arrangement - Upcoming Requirements',
    ArrangementPlannedChildcare = 'Arrangement - Planned Childcare',
    ArrangementActualChildcare = 'Arrangement - Actual Childcare',
  }

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

  const appNavigate = useAppNavigate();

  function isSelected(option: string) {
    return (
      filterOptions.find((filterOption) => filterOption.key === option)
        ?.selected || false
    );
  }

  const filteredEvents: EventSourceInput = ([] as EventInput[]).concat(
    isSelected(CalendarFilters.ArrangementPlannedDuration)
      ? arrangementPlannedDurations
      : [],
    isSelected(CalendarFilters.ArrangementActualStartEndDates)
      ? arrangementActualStarts.concat(arrangementActualEnds)
      : [],
    isSelected(CalendarFilters.ArrangementCompletedRequirements)
      ? arrangementCompletedRequirements
      : [],
    isSelected(CalendarFilters.ArrangementPastDueRequirements)
      ? arrangementPastDueRequirements
      : [],
    isSelected(CalendarFilters.ArrangementUpcomingRequirements)
      ? arrangementUpcomingRequirements
      : [],
    isSelected(CalendarFilters.ArrangementActualChildcare)
      ? arrangementActualChildcare
      : [],
    isSelected(CalendarFilters.ArrangementPlannedChildcare)
      ? arrangementPlannedChildcare
      : []
  );

  const calendarLegendItems = [
    {
      key: 'planned-duration',
      filter: CalendarFilters.ArrangementPlannedDuration,
      color: PLANNED_DURATION_COLOR,
      markerLabel: 'Light blue',
      label: 'Planned duration',
      description: 'planned start-to-end arrangement range',
    },
    {
      key: 'actual-start',
      filter: CalendarFilters.ArrangementActualStartEndDates,
      color: DEFAULT_EVENT_COLOR,
      markerLabel: 'Blue + ▶',
      label: 'Actual start',
      description: 'arrangement started on this date',
    },
    {
      key: 'actual-end',
      filter: CalendarFilters.ArrangementActualStartEndDates,
      color: DEFAULT_EVENT_COLOR,
      markerLabel: 'Blue + ⏹',
      label: 'Actual end',
      description: 'arrangement ended on this date',
    },
    {
      key: 'completed-requirement',
      filter: CalendarFilters.ArrangementCompletedRequirements,
      color: DEFAULT_EVENT_COLOR,
      markerLabel: 'Blue + ✅',
      label: 'Completed requirement',
      description: 'requirement completed on this date',
    },
    {
      key: 'past-due-requirement',
      filter: CalendarFilters.ArrangementPastDueRequirements,
      color: PAST_DUE_REQUIREMENT_COLOR,
      markerLabel: 'Red + ❌',
      label: 'Past-due requirement',
      description: 'requirement has been past due since this date',
    },
    {
      key: 'upcoming-requirement',
      filter: CalendarFilters.ArrangementUpcomingRequirements,
      color: DEFAULT_EVENT_COLOR,
      markerLabel: 'Blue + 📅',
      label: 'Upcoming requirement',
      description: 'requirement is due on this date',
    },
    {
      key: 'planned-childcare',
      filter: CalendarFilters.ArrangementPlannedChildcare,
      color: PLANNED_CHILDCARE_AWAY_FROM_PARENT_COLOR,
      markerLabel: 'Rose + ✋🏻',
      label: 'Planned childcare',
      description:
        'planned child location away from parent with the listed family',
    },
    {
      key: 'actual-childcare',
      filter: CalendarFilters.ArrangementActualChildcare,
      color: ACTUAL_CHILDCARE_AWAY_FROM_PARENT_COLOR,
      markerLabel: 'Brown + 🤝🏻',
      label: 'Actual childcare',
      description:
        'recorded child location away from parent with the listed family',
    },
  ].filter((legendItem) => isSelected(legendItem.filter));

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
      {calendarLegendItems.length > 0 && (
        <Grid item xs={12} sx={{ marginBottom: 1 }}>
          <Box
            aria-label="Calendar legend"
            sx={{
              borderColor: 'divider',
              borderTop: 1,
              borderBottom: 1,
              paddingY: 1,
            }}
          >
            <Typography
              variant="body2"
              sx={{ fontWeight: 600, marginBottom: 0.75 }}
            >
              Legend:
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
                    alignItems: 'flex-start',
                    display: 'flex',
                    gap: 0.75,
                    minWidth: 0,
                  }}
                >
                  <Box
                    aria-hidden="true"
                    component="span"
                    sx={{
                      backgroundColor: legendItem.color,
                      border:
                        legendItem.color === PLANNED_DURATION_COLOR
                          ? '1px solid #7aa8b8'
                          : '1px solid transparent',
                      borderRadius: '2px',
                      display: 'inline-block',
                      flex: '0 0 auto',
                      height: 12,
                      marginTop: 0.5,
                      width: 12,
                    }}
                  />
                  <Box sx={{ minWidth: 0 }}>
                    <Typography
                      component="span"
                      variant="body2"
                      sx={{ display: 'block', fontWeight: 600 }}
                    >
                      {legendItem.markerLabel}: {legendItem.label}
                    </Typography>
                    <Typography
                      color="text.secondary"
                      component="span"
                      variant="body2"
                      sx={{ display: 'block' }}
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
      <Grid
        item
        xs={12}
        sx={{
          '.calendar-event': {
            cursor: 'pointer',
            transition: 'background-color 0.2s ease-in-out',
            '&:hover': { backgroundColor: 'rgba(0, 0, 0, 0.1) !important' },
          },
        }}
      >
        <FullCalendar /* https://fullcalendar.io/docs/react */
          plugins={[dayGridPlugin, listPlugin]}
          initialView={savedInitialView}
          headerToolbar={{
            left: 'prevYear,prev,today,next,nextYear',
            center: 'title',
            right: 'dayGridMonth,listWeek',
          }}
          weekends={true}
          //expandRows={true}
          events={filteredEvents}
          //eventContent={renderEventContent}
          eventClassNames={() => 'calendar-event'}
          datesSet={(arg) => {
            localStorage.setItem(DASHBOARD_CALENDAR_VIEW_KEY, arg.view.type);
          }}
          eventClick={(info) => {
            const { familyId, v1CaseId, arrangementId } =
              info.event.extendedProps;
            if (familyId && v1CaseId && arrangementId) {
              appNavigate.family(familyId, v1CaseId, arrangementId);
            } else if (familyId) {
              appNavigate.family(familyId);
            }
          }}
        />
      </Grid>
    </Grid>
  );
}

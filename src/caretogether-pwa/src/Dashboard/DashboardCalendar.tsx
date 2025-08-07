import { Grid, Typography } from '@mui/material';
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

function familyPerson(family: CombinedFamilyInfo, personId: string) {
  const familyPeople = (family.family?.adults || [])
    .map((adult) => adult.item1!)
    .concat(family.family?.children || []);
  return familyPeople.find((person) => person.id === personId)!;
}

export function DashboardCalendar() {
  const familyLookup = useFamilyLookup();
  const partneringFamilies = useLoadable(partneringFamiliesData);

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
          title: `❌ ${personNameString(person)} - ${missing.actionName}`,
          date:
            missing.pastDueSince && format(missing.pastDueSince, 'yyyy-MM-dd'),
          color: 'red',
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
          title: `📅 ${personNameString(person)} - ${missing.actionName}`,
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
              entry.plan === ChildLocationPlan.WithParent ? 'green' : '#a52a2a',
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
        (entry) => entry.backgroundColor === '#a52a2a'
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
                : '#e58a8a',
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
        (entry) => entry.backgroundColor === '#e58a8a'
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
          initialView="dayGridMonth"
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

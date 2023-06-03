import { Container, Grid, Stack, Typography } from '@mui/material';
import { useRecoilValueLoadable } from 'recoil';
import { locationConfigurationQuery, organizationConfigurationQuery } from '../Model/ConfigurationModel';
import useScreenTitle from '../Shell/ShellScreenTitle';
import { useDataLoaded } from '../Model/Data';
import { ProgressBackdrop } from '../Shell/ProgressBackdrop';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import listPlugin from '@fullcalendar/list';
import { format } from 'date-fns';
import { EventInput, EventSourceInput } from '@fullcalendar/core/index.js';
import { partneringFamiliesData } from '../Model/ReferralsModel';
import { useLoadable } from '../Hooks/useLoadable';
import { ChildLocationPlan, CombinedFamilyInfo } from '../GeneratedClient';
import { personNameString } from '../Families/PersonName';
import { useFamilyLookup } from '../Model/DirectoryModel';
import { familyNameString } from '../Families/FamilyName';

// function renderEventContent(eventInfo: any) {
//   return (
//     <>
//       <b>{eventInfo.timeText}</b>
//       <i>{eventInfo.event.title}</i>
//     </>
//   )
// }

function familyPerson(family: CombinedFamilyInfo, personId: string) {
  const familyPeople = (family.family?.adults || []).map(adult => adult.item1!).concat(family.family?.children || []);
  return familyPeople.find(person => person.id === personId)!;
}

function Dashboard() {
  const organizationConfiguration = useRecoilValueLoadable(organizationConfigurationQuery);
  const locationConfiguration = useRecoilValueLoadable(locationConfigurationQuery);
  const partneringFamilies = useLoadable(partneringFamiliesData);

  const dataLoaded = useDataLoaded();

  const familyLookup = useFamilyLookup();

  useScreenTitle("Dashboard");

  const allArrangements = (partneringFamilies || []).flatMap(family =>
    (family.partneringFamilyInfo?.closedReferrals || []).concat(family.partneringFamilyInfo?.openReferral || []).flatMap(referral =>
      referral.arrangements || []).map(arrangement => ({ arrangement, person: familyPerson(family, arrangement.partneringFamilyPersonId!) })));
  
  const allArrangementPlanEvents = allArrangements.map(({ arrangement, person }) => ({
    title: `${personNameString(person)} - ${arrangement.arrangementType}`,
    start: arrangement.plannedStartUtc && format(arrangement.plannedStartUtc, "yyyy-MM-dd"),
    end: arrangement.plannedEndUtc && format(arrangement.plannedEndUtc, "yyyy-MM-dd"),
    backgroundColor: 'lightblue'
  } as EventInput))
  
  const allArrangementStarts = allArrangements.filter(({arrangement}) => arrangement.startedAtUtc).map(({ arrangement, person }) => ({
    title: `▶ ${personNameString(person)} - ${arrangement.arrangementType}`,
    date: arrangement.startedAtUtc
  } as EventInput));
  
  const allArrangementEnds = allArrangements.filter(({arrangement}) => arrangement.endedAtUtc).map(({ arrangement, person }) => ({
    title: `⏹ ${personNameString(person)} - ${arrangement.arrangementType}`,
    date: arrangement.endedAtUtc
  } as EventInput));
  
  const allArrangementCompletedRequirements = allArrangements.flatMap(({arrangement, person}) => arrangement.completedRequirements?.map(completed => ({
    title: `✅ ${personNameString(person)} - ${completed.requirementName}`,
    date: completed.completedAtUtc
  } as EventInput)));
  
  const allArrangementMissingRequirements = allArrangements.flatMap(({arrangement, person}) =>
    (arrangement.missingRequirements || []).map(missing => ({ person, missing })));
  
  const allArrangementMissedRequirements = allArrangementMissingRequirements.filter(({missing}) => missing.pastDueSince).map(({missing, person}) => ({
    title: `❌ ${personNameString(person)} - ${missing.actionName}`,
    date: missing.pastDueSince && format(missing.pastDueSince, "yyyy-MM-dd"),
    color: 'red'
  } as EventInput));
  
  const allArrangementUpcomingRequirements = allArrangementMissingRequirements.filter(({missing}) => missing.dueBy).map(({missing, person}) => ({
    title: `📅 ${personNameString(person)} - ${missing.actionName}`,
    date: missing.dueBy && format(missing.dueBy, "yyyy-MM-dd")
  } as EventInput));
  
  const allChildcareHistory = allArrangements.flatMap(({arrangement, person}) => {
    const durationEntries = (arrangement.childLocationHistory || []).map((entry, index, history) => {
      const nextEntry = index < history.length - 1 ? history[index + 1] : null;
      const locationFamily = familyLookup(entry.childLocationFamilyId);
      return {
        title: `🤝🏻 ${personNameString(person)} - ${familyNameString(locationFamily)}`,
        start: entry.timestampUtc,
        backgroundColor: entry.plan === ChildLocationPlan.WithParent ? 'green' : 'brown',
        end: nextEntry?.timestampUtc
      } as EventInput;
    });
    return durationEntries.filter(entry => entry.backgroundColor === 'brown');
  });

  const allChildcarePlans = allArrangements.flatMap(({arrangement, person}) => {
    const durationEntries = (arrangement.childLocationPlan || []).map((entry, index, plan) => {
      const nextEntry = index < plan.length - 1 ? plan[index + 1] : null;
      const locationFamily = familyLookup(entry.childLocationFamilyId);
      return {
        title: `✋🏻 ${personNameString(person)} - ${familyNameString(locationFamily)}`,
        start: entry.timestampUtc,
        backgroundColor: entry.plan === ChildLocationPlan.WithParent ? 'lightgreen' : 'lightbrown',
        end: nextEntry?.timestampUtc
      } as EventInput;
    });
    return durationEntries.filter(entry => entry.backgroundColor === 'lightbrown');
  });

  //TODO: Childcare *plans*

  const events: EventSourceInput = allArrangementPlanEvents.concat(
    allArrangementStarts,
    allArrangementEnds,
    allArrangementCompletedRequirements,
    allArrangementMissedRequirements,
    allArrangementUpcomingRequirements,
    allChildcareHistory,
    allChildcarePlans);

  return ((!dataLoaded || locationConfiguration.state !== 'hasValue' && organizationConfiguration.state !== 'hasValue')
    ? <ProgressBackdrop>
        <p>Loading dashboard...</p>
      </ProgressBackdrop>
    : <Container maxWidth={false} sx={{ paddingLeft: '12px' }}>
        <Stack direction='column'>
          <Typography variant='h5' sx={{ marginTop: 3 }}>
            <strong>{locationConfiguration.contents?.name}</strong> ({organizationConfiguration.contents?.organizationName})
          </Typography>
          <br />
          <Grid container>
            <Grid item xs={12}>
              <FullCalendar /* https://fullcalendar.io/docs/react */
                plugins={[ dayGridPlugin, listPlugin ]}
                initialView='dayGridMonth'
                headerToolbar={{
                  left: 'prevYear,prev,today,next,nextYear',
                  center: 'title',
                  right: 'dayGridMonth,listWeek'
                }}
                weekends={true}
                //expandRows={true}
                events={events}
                //eventContent={renderEventContent}
                eventClassNames={'wrap-event'}
              />
            </Grid>
          </Grid>
        </Stack>
      </Container>
  );
}

export { Dashboard };

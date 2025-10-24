import {
  Timeline,
  TimelineItem,
  TimelineOppositeContent,
  TimelineSeparator,
  TimelineDot,
  TimelineConnector,
  TimelineContent,
} from '@mui/lab';
import { format } from 'date-fns';
import {
  Activity,
  ArrangementRequirementCompleted,
  ChildLocationChanged,
  ChildLocationPlan,
  CombinedFamilyInfo,
  Note,
  ReferralOpened as V1CaseOpened,
  ReferralRequirementCompleted as V1CaseRequirementCompleted,
} from '../GeneratedClient';
import PersonPinCircleIcon from '@mui/icons-material/PersonPinCircle';
import EditIcon from '@mui/icons-material/Edit';
import { usePersonLookup, useUserLookup } from '../Model/DirectoryModel';
import { PersonName } from '../Families/PersonName';
import { Box, Stack, Typography, Link } from '@mui/material';
import { NoteCard } from '../Notes/NoteCard';
import { useAccessLevelDialog } from '../Notes/AccessLevelDialog/useAccessLevelDialog';
import { FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import { useState } from 'react';

type ActivityTimelineProps = {
  family: CombinedFamilyInfo;
  printContentRef: React.RefObject<HTMLDivElement>;
};

type ActivitySorting = 'activity' | 'created' | 'edited' | 'approved';

const composeNoteType = (activity: Activity): string | null => {
  if (activity instanceof V1CaseRequirementCompleted) {
    return 'Case requirement completed';
  }

  if (activity instanceof ArrangementRequirementCompleted) {
    return 'Arrangement requirement completed';
  }

  if (activity instanceof ChildLocationChanged) {
    return 'Child location changed';
  }

  if (activity instanceof V1CaseOpened) {
    return 'Case opened';
  }

  return null;
};

function embedNotesInActivities(notes: Note[], activities: Activity[]) {
  // We only want to show each note once, on the most recent activity entry that is
  // linked to that particular note. The following stateful code works by pulling from the
  // set of all the family's notes, so that each time this component renders, each note will
  // be "found" at most once. Since activities render in order from most recent to oldest,
  // the result is that each note is shown only on the most recent matching activity entry.
  // This is a simplistic fix; at some point it would be better to support actual matching of
  // related activity entries and showing those as a single "grouped" activity.
  const unlinkedNotes = notes.slice() || [];
  function noteLookup(noteId?: string) {
    const noteIndex = unlinkedNotes.findIndex((n) => n.id === noteId);
    if (noteIndex === -1) return undefined;
    const note = unlinkedNotes.splice(noteIndex, 1)[0];
    return note;
  }

  return activities.map((activity) => {
    return {
      activity,
      note: noteLookup(activity.noteId),
    };
  });
}

export function ActivityTimeline({
  family,
  printContentRef,
}: ActivityTimelineProps) {
  const userLookup = useUserLookup();
  const personLookup = usePersonLookup();

  const activities = (
    family.partneringFamilyInfo?.history?.slice() || []
  ).concat(family.volunteerFamilyInfo?.history?.slice() || []);

  const unmatchedNotesAsActivities =
    family.notes
      ?.filter((note) => activities?.every((a) => a.noteId !== note.id))
      ?.map(
        (note) =>
          ({
            userId: note.authorId,
            activityTimestampUtc:
              note.backdatedTimestampUtc ??
              note.createdTimestampUtc ??
              note.lastEditTimestampUtc,
            auditTimestampUtc:
              note.createdTimestampUtc ?? note.lastEditTimestampUtc,
            noteId: note.id,
          }) as Activity
      ) || [];

  const allActivitiesSorted = activities
    ?.concat(unmatchedNotesAsActivities)
    ?.sort((a, b) =>
      a.activityTimestampUtc! < b.activityTimestampUtc!
        ? 1
        : a.activityTimestampUtc! > b.activityTimestampUtc!
          ? -1
          : 0
    );

  function arrangementPartneringPerson(arrangementId?: string) {
    const allArrangements = (
      family.partneringFamilyInfo?.openV1Case?.arrangements || []
    ).concat(
      family.partneringFamilyInfo?.closedV1Cases?.flatMap(
        (r) => r.arrangements || []
      ) || []
    );
    const arrangement = allArrangements.find((a) => a.id === arrangementId);
    const partneringPerson = personLookup(
      family.family!.id!,
      arrangement?.partneringFamilyPersonId
    );
    return partneringPerson;
  }

  function documentLookup(uploadedDocumentId?: string) {
    const document = family.uploadedDocuments?.find(
      (d) => d.uploadedDocumentId === uploadedDocumentId
    );
    return document;
  }

  const { noteAccessLevelDialog, open } = useAccessLevelDialog({
    familyId: family.family.id,
  });

  const [sortBy, setSortBy] = useState<ActivitySorting>('activity');

  const getDateValue = (value?: string | Date | null): number => {
    if (!value) return 0;
    if (value instanceof Date) return value.getTime();
    return new Date(value).getTime();
  };

  const activitiesWithEmbeddedNotes = embedNotesInActivities(
    family.notes || [],
    allActivitiesSorted
  );

  type ActivityWithNote = {
    activity: Activity;
    note: Note | undefined;
  };

  const sortStrategies: Record<
    ActivitySorting,
    (a: ActivityWithNote, b: ActivityWithNote) => number
  > = {
    created: (a, b) =>
      getDateValue(
        b.note?.createdTimestampUtc ?? b.activity.activityTimestampUtc
      ) -
      getDateValue(
        a.note?.createdTimestampUtc ?? a.activity.activityTimestampUtc
      ),
    edited: (a, b) =>
      getDateValue(
        b.note?.lastEditTimestampUtc ?? b.activity.activityTimestampUtc
      ) -
      getDateValue(
        a.note?.lastEditTimestampUtc ?? a.activity.activityTimestampUtc
      ),
    approved: (a, b) =>
      getDateValue(
        b.note?.approvedTimestampUtc ?? b.activity.activityTimestampUtc
      ) -
      getDateValue(
        a.note?.approvedTimestampUtc ?? a.activity.activityTimestampUtc
      ),
    activity: (a, b) =>
      getDateValue(b.activity.activityTimestampUtc) -
      getDateValue(a.activity.activityTimestampUtc),
  };

  const sortedActivitiesWithNotes = activitiesWithEmbeddedNotes.sort(
    sortStrategies[sortBy]
  );

  const onlyActivitiesWithNotes = sortedActivitiesWithNotes.filter((item) =>
    Boolean(item.note)
  );

  return (
    <>
      <div ref={printContentRef}>
        <style>
          {`
            @page {
              margin: 60px 40px !important;
              size: auto;
              font-size: 12pt;
            }
          `}
        </style>
        <Stack
          className="print-container"
          spacing={2}
          sx={{
            display: 'none',
            '@media print': {
              display: 'block',
            },
          }}
        >
          {onlyActivitiesWithNotes.map(({ activity, note }) => {
            const arrangementId =
              'arrangementId' in activity &&
              typeof activity.arrangementId === 'string'
                ? activity.arrangementId
                : null;

            const requirementName =
              activity instanceof V1CaseRequirementCompleted ||
              activity instanceof ArrangementRequirementCompleted
                ? activity.requirementName
                : null;

            const activityType = composeNoteType(activity);

            return (
              <Box
                key={activity.activityTimestampUtc?.toString()}
                p={2}
                border={1}
                borderRadius={2}
                sx={{ breakInside: 'avoid' }}
              >
                {note && (
                  <>
                    <Typography gutterBottom>
                      <strong>Author: </strong>
                      <PersonName person={userLookup(note.authorId)} /> at{' '}
                      {note.createdTimestampUtc
                        ? format(note.createdTimestampUtc, 'M/d/yy h:mm a')
                        : null}
                    </Typography>

                    <Typography gutterBottom>
                      <strong>Approver: </strong>
                      {note.approverId ? (
                        <>
                          <PersonName person={userLookup(note.approverId)} /> at{' '}
                          {note.approvedTimestampUtc
                            ? format(note.approvedTimestampUtc, 'M/d/yy h:mm a')
                            : null}
                        </>
                      ) : (
                        'N/A'
                      )}
                    </Typography>

                    {activityType && (
                      <Typography gutterBottom>
                        <strong>Activity type: </strong>

                        {activityType}
                      </Typography>
                    )}

                    {arrangementId && (
                      <Typography gutterBottom>
                        <strong>Partnering person: </strong>

                        <PersonName
                          person={arrangementPartneringPerson(arrangementId)}
                        />
                      </Typography>
                    )}

                    {requirementName && (
                      <Typography gutterBottom>
                        <strong>Requirement name: </strong> {requirementName}
                      </Typography>
                    )}

                    {activity instanceof ChildLocationChanged && (
                      <Typography gutterBottom>
                        <strong>Location changed to: </strong>
                        <PersonName
                          person={personLookup(
                            activity.childLocationFamilyId,
                            activity.childLocationReceivingAdultId
                          )}
                        />{' '}
                        (
                        {activity.plan === ChildLocationPlan.DaytimeChildCare
                          ? 'daytime'
                          : activity.plan === ChildLocationPlan.OvernightHousing
                            ? 'overnight'
                            : 'parent'}
                        )
                      </Typography>
                    )}

                    {activity.uploadedDocumentId && (
                      <Typography gutterBottom>
                        <strong>Document: </strong>
                        {
                          documentLookup(activity.uploadedDocumentId)
                            ?.uploadedFileName
                        }
                      </Typography>
                    )}

                    <Typography gutterBottom>
                      <strong>Note: </strong>
                      <em>{note.contents}</em>
                    </Typography>
                  </>
                )}
              </Box>
            );
          })}
        </Stack>
      </div>

      <Timeline position="right" sx={{ padding: 0 }}>
        <Box sx={{ display: 'flex', justifyContent: 'flex-start', mb: 1 }}>
          <FormControl size="small" sx={{ minWidth: 160 }}>
            <InputLabel>Sort by</InputLabel>
            <Select
              value={sortBy}
              label="Sort by"
              onChange={(e) => setSortBy(e.target.value as ActivitySorting)}
            >
              <MenuItem value="activity">Activity date (default)</MenuItem>
              <MenuItem value="created">Note created date</MenuItem>
              <MenuItem value="edited">Note last edited date</MenuItem>
              <MenuItem value="approved">Note approved date</MenuItem>
            </Select>
          </FormControl>
        </Box>

        {sortedActivitiesWithNotes?.map(({ activity, note }, i) => (
          <TimelineItem key={i}>
            <TimelineOppositeContent sx={{ display: 'none' }} />
            <TimelineSeparator>
              <TimelineDot
                sx={{
                  width: 36,
                  height: 36,
                  textAlign: 'center',
                  display: 'block',
                }}
              >
                {activity instanceof V1CaseRequirementCompleted ||
                activity instanceof ArrangementRequirementCompleted ? (
                  '✔'
                ) : activity instanceof ChildLocationChanged ? (
                  <PersonPinCircleIcon fontSize="medium" />
                ) : (
                  <EditIcon fontSize="small" />
                )}
              </TimelineDot>
              {i < allActivitiesSorted.length - 1 && <TimelineConnector />}
            </TimelineSeparator>
            <TimelineContent
              style={{
                width: 200,
                wordWrap: 'break-word',
                whiteSpace: 'pre-wrap',
              }}
            >
              <Box sx={{ color: 'text.disabled', margin: 0, padding: 0 }}>
                <span className="ph-unmask" style={{ marginRight: 16 }}>
                  {activity.activityTimestampUtc
                    ? format(activity.activityTimestampUtc, 'M/d/yy h:mm a')
                    : null}
                </span>
                <PersonName person={userLookup(activity.userId)} />
              </Box>
              {activity instanceof V1CaseRequirementCompleted ||
              activity instanceof ArrangementRequirementCompleted ? (
                activity.requirementName
              ) : activity instanceof ChildLocationChanged ? (
                <>
                  <PersonName
                    person={arrangementPartneringPerson(activity.arrangementId)}
                  />
                  <span> &rarr; </span>
                  <PersonName
                    person={personLookup(
                      activity.childLocationFamilyId,
                      activity.childLocationReceivingAdultId
                    )}
                  />
                  <span> </span>(
                  {activity.plan === ChildLocationPlan.DaytimeChildCare
                    ? 'daytime'
                    : activity.plan === ChildLocationPlan.OvernightHousing
                      ? 'overnight'
                      : 'parent'}
                  )
                </>
              ) : activity instanceof V1CaseOpened ? (
                'Case opened'
              ) : null}
              {activity.uploadedDocumentId && (
                <Box sx={{ margin: 0, padding: 0 }}>
                  📃{' '}
                  {
                    documentLookup(activity.uploadedDocumentId)
                      ?.uploadedFileName
                  }
                </Box>
              )}

              <Typography>
                Visible to{' '}
                {note ? (
                  <Link
                    component="button"
                    type="button"
                    underline="hover"
                    onClick={() => {
                      open(note);
                    }}
                  >
                    {note.accessLevel ?? 'Everyone'}
                  </Link>
                ) : (
                  'Everyone'
                )}
              </Typography>
              {note && <NoteCard familyId={family.family!.id!} note={note} />}
            </TimelineContent>
          </TimelineItem>
        ))}

        {noteAccessLevelDialog}
      </Timeline>
    </>
  );
}

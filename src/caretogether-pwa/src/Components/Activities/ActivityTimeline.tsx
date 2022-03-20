import { Timeline, TimelineItem, TimelineOppositeContent, TimelineSeparator, TimelineDot, TimelineConnector, TimelineContent } from "@mui/lab";
import { format } from "date-fns";
import { Activity, ArrangementRequirementCompleted, ChildLocationChanged, ChildLocationPlan, CombinedFamilyInfo, ReferralOpened, ReferralRequirementCompleted } from "../../GeneratedClient";
import PersonPinCircleIcon from '@mui/icons-material/PersonPinCircle';
import EditIcon from '@mui/icons-material/Edit';
import { usePersonLookup, useUserLookup } from "../../Model/DirectoryModel";
import { PersonName } from "../Families/PersonName";
import { Box } from "@mui/material";
import { NoteCard } from "../Families/NoteCard";

type ActivityTimelineProps = {
  family: CombinedFamilyInfo
}

export function ActivityTimeline({ family }: ActivityTimelineProps) {
  const userLookup = useUserLookup();
  const personLookup = usePersonLookup();

  const activities = family.partneringFamilyInfo?.history?.slice();
  const unmatchedNotesAsActivities = family.notes?.filter(note =>
    activities?.every(a => a.noteId !== note.id))?.map(note =>
    ({
      userId: note.authorId,
      timestampUtc: note.timestampUtc,
      noteId: note.id
    } as Activity)) || [];
  const allActivitiesSorted = activities?.concat(unmatchedNotesAsActivities)?.sort((a, b) =>
    a.timestampUtc! < b.timestampUtc! ? 1 : a.timestampUtc! > b.timestampUtc! ? -1 : 0);

  function arrangementPartneringPerson(arrangementId?: string) {
    const allArrangements = (family.partneringFamilyInfo?.openReferral?.arrangements || []).concat(
      family.partneringFamilyInfo?.closedReferrals?.flatMap(r => r.arrangements || []) || []);
    const arrangement = allArrangements.find(a => a.id === arrangementId);
    const partneringPerson = personLookup(family.family!.id!, arrangement?.partneringFamilyPersonId);
    return partneringPerson;
  }

  function noteLookup(noteId?: string) {
    const note = family.notes?.find(n => n.id === noteId);
    return note;
  }

  function documentLookup(uploadedDocumentId?: string) {
    const document = family.uploadedDocuments?.find(d => d.uploadedDocumentId === uploadedDocumentId);
    return document;
  }

  return (
    <Timeline position="right"
      sx={{ padding: 0 }}>
      {allActivitiesSorted?.map((activity, i) =>
        <TimelineItem key={i}>
          <TimelineOppositeContent sx={{display: "none"}} />
          <TimelineSeparator>
            <TimelineDot sx={{width:36, height:36, textAlign:'center', display:'block'}}>
              {activity instanceof ReferralRequirementCompleted || activity instanceof ArrangementRequirementCompleted
                ? "✔"
                : activity instanceof ChildLocationChanged
                ? <PersonPinCircleIcon fontSize="medium" />
                : <EditIcon fontSize="small" />}
            </TimelineDot>
            {i < allActivitiesSorted.length - 1 && <TimelineConnector />}
          </TimelineSeparator>
          <TimelineContent style={{width:200,wordWrap:'break-word',whiteSpace:'pre-wrap'}}>
            <Box sx={{color: 'text.disabled', margin: 0, padding: 0}}>
              <span style={{marginRight: 16}}>{format(activity.timestampUtc!, "M/d/yy h:mm a")}</span>
              <PersonName person={userLookup(activity.userId)} />
            </Box>
            {activity instanceof ReferralRequirementCompleted || activity instanceof ArrangementRequirementCompleted
              ? activity.requirementName
              : activity instanceof ChildLocationChanged
              ? <>
                  <PersonName person={arrangementPartneringPerson(activity.arrangementId)} />
                  <span> &rarr; </span><PersonName
                    person={personLookup(activity.childLocationFamilyId, activity.childLocationReceivingAdultId)} />
                  <span> </span>({activity.plan === ChildLocationPlan.DaytimeChildCare
                    ? "daytime"
                    : activity.plan === ChildLocationPlan.OvernightHousing
                    ? "overnight"
                    : "parent"})
                  
                </>
              : activity instanceof ReferralOpened
              ? "Referral opened"
              : null}
            {activity.uploadedDocumentId &&
              <Box sx={{margin: 0, padding: 0}}>
                📃 {documentLookup(activity.uploadedDocumentId)?.uploadedFileName}
              </Box>}
            {activity.noteId && <NoteCard familyId={family.family!.id!} note={noteLookup(activity.noteId)!} />}
          </TimelineContent>
        </TimelineItem>
      )}
    </Timeline>
  );
}

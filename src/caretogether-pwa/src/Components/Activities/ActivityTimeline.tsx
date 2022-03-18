import { Timeline, TimelineItem, TimelineOppositeContent, TimelineSeparator, TimelineDot, TimelineConnector, TimelineContent } from "@mui/lab";
import { format } from "date-fns";
import { Activity, ArrangementRequirementCompleted, ChildLocationChanged, ChildLocationPlan, CombinedFamilyInfo, ReferralOpened, ReferralRequirementCompleted } from "../../GeneratedClient";
import PersonPinCircleIcon from '@mui/icons-material/PersonPinCircle';
import PersonIcon from '@mui/icons-material/Person';
import { useFamilyLookup, usePersonLookup, useUserLookup } from "../../Model/DirectoryModel";
import { PersonName } from "../Families/PersonName";
import { FamilyName } from "../Families/FamilyName";
import { Tooltip } from "@mui/material";
import { NoteCard } from "../Families/NoteCard";

type ActivityTimelineProps = {
  family: CombinedFamilyInfo
  activities?: Activity[]
}

export function ActivityTimeline({ family, activities }: ActivityTimelineProps) {
  const userLookup = useUserLookup();
  const familyLookup = useFamilyLookup();
  const personLookup = usePersonLookup();

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

  return (
    <Timeline position="right"
      sx={{ padding: 0 }}>
      {activities?.map((activity, i) =>
        <TimelineItem key={i}>
          <TimelineOppositeContent sx={{display: "none"}} />
          {/* <TimelineOppositeContent sx={{flex:0.3, paddingLeft: 0}}>
            {format(activity.timestampUtc!, "M/d/yy")}
            <br />
            {format(activity.timestampUtc!, "h:mm a")}
          </TimelineOppositeContent> */}
          <TimelineSeparator>
            <TimelineDot sx={{width:36, height:36, textAlign:'center', display:'block'}}>
              {activity instanceof ReferralRequirementCompleted || activity instanceof ArrangementRequirementCompleted
                ? "✔"
                : activity instanceof ChildLocationChanged
                ? <PersonPinCircleIcon fontSize="medium" />
                : null}
            </TimelineDot>
            <TimelineConnector />
          </TimelineSeparator>
          <TimelineContent style={{width:200,wordWrap:'break-word'}}>
            {format(activity.timestampUtc!, "M/d/yy h:mm a")}
            <Tooltip key={i} title={<PersonName person={userLookup(activity.userId)} />}>
              <PersonIcon fontSize="small" color="disabled" sx={{verticalAlign:"middle", marginLeft: 1}} />
            </Tooltip>
            <br />
            {activity instanceof ReferralRequirementCompleted || activity instanceof ArrangementRequirementCompleted
              ? activity.requirementName
              : activity instanceof ChildLocationChanged
              ? <>
                  <PersonName person={arrangementPartneringPerson(activity.arrangementId)} />
                  <span> &rarr; </span><FamilyName family={familyLookup(activity.childLocationFamilyId)} />
                  <span> </span>({activity.plan === ChildLocationPlan.DaytimeChildCare
                    ? "daytime"
                    : activity.plan === ChildLocationPlan.OvernightHousing
                    ? "overnight"
                    : "parent"})
                  
                </>
              : activity instanceof ReferralOpened
              ? "Referral opened"
              : JSON.stringify(typeof activity)}
            <br />
            {activity.noteId && <NoteCard familyId={family.family!.id!} note={noteLookup(activity.noteId)!} />}
          </TimelineContent>
        </TimelineItem>
      )}
    </Timeline>
  );
}

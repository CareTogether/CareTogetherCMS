import { Card, CardHeader, IconButton, CardContent, Typography, Chip, CardActions, Button, makeStyles, Divider, ListItemText, Menu, MenuItem } from "@material-ui/core";
import { format } from 'date-fns';
import { useState } from "react";
import { ActionRequirement, ActivityRequirement, FormUploadRequirement, Gender, Person, RoleApprovalStatus, VolunteerFamily } from "../GeneratedClient";
import { AgeText } from "./AgeText";
import MoreVertIcon from '@material-ui/icons/MoreVert';
import AssignmentTurnedInIcon from '@material-ui/icons/AssignmentTurnedIn';
import { useRecoilValue } from "recoil";
import { volunteerFamiliesData } from "../Model/VolunteerFamiliesModel";
import { RecordVolunteerAdultStepDialog } from "./RecordVolunteerAdultStepDialog";
import { adultDocumentTypesData, adultActivityTypesData } from "../Model/ConfigurationModel";

const useStyles = makeStyles((theme) => ({
  sectionChips: {
    '& > div:first-child': {
      marginLeft: 0
    },
    '& > *': {
      margin: theme.spacing(0.5),
    }
  },
  card: {
    minWidth: 275,
  },
  cardHeader: {
    paddingBottom: 0
  },
  cardContent: {
    paddingTop: 8,
    paddingBottom: 8
  },
  cardList: {
    padding: 0,
    margin: 0,
    marginTop: 8,
    listStyle: 'none',
    '& > li': {
      marginTop: 4
    }
  },
  rightCardAction: {
    marginLeft: 'auto !important'
  }
}));

type VolunteerAdultCardProps = {
  volunteerFamilyId: string,
  personId: string
}

export function VolunteerAdultCard({volunteerFamilyId, personId}: VolunteerAdultCardProps) {
  const classes = useStyles();

  const volunteerFamilies = useRecoilValue(volunteerFamiliesData);
  const adultDocumentTypes = useRecoilValue(adultDocumentTypesData);
  const adultActivityTypes = useRecoilValue(adultActivityTypesData);

  const volunteerFamily = volunteerFamilies.find(x => x.family?.id === volunteerFamilyId) as VolunteerFamily;
  const adult = volunteerFamily.family?.adults?.find(x => x.item1?.id === personId);

  const [adultRecordMenuAnchor, setAdultRecordMenuAnchor] = useState<{anchor: Element, adult: Person} | null>(null);
  const [recordAdultStepParameter, setRecordAdultStepParameter] = useState<{requirement: ActionRequirement, adult: Person} | null>(null);
  function selectRecordAdultStep(requirement: FormUploadRequirement | ActivityRequirement, adult: Person) {
    setAdultRecordMenuAnchor(null);
    setRecordAdultStepParameter({requirement, adult});
  }

  const [adultMoreMenuAnchor, setAdultMoreMenuAnchor] = useState<{anchor: Element, adult: Person} | null>(null);
  function selectChangeName(adult: Person) {
    setAdultMoreMenuAnchor(null);
    //TODO: Rename...
  }

  return (<>{adult?.item1 && adult.item1.id && adult.item2 &&
    <Card className={classes.card}>
      <CardHeader className={classes.cardHeader}
        title={adult.item1.firstName + " " + adult.item1.lastName}
        subheader={<>
          Adult, <AgeText age={adult.item1.age} />, {typeof(adult.item1.gender) === 'undefined' ? "" : Gender[adult.item1.gender] + ","} {adult.item1.ethnicity}
        </>}
        action={
          <IconButton
            onClick={(event) => setAdultMoreMenuAnchor({anchor: event.currentTarget, adult: adult.item1 as Person})}>
            <MoreVertIcon />
          </IconButton>} />
      <CardContent className={classes.cardContent}>
        <Typography color="textSecondary" className={classes.sectionChips} component="div">
          {Object.entries(volunteerFamily.individualVolunteers?.[adult.item1.id].individualRoleApprovals || {}).map(([role, approvalStatus]) => (
            <Chip key={role} size="small" color={approvalStatus === RoleApprovalStatus.Onboarded ? "primary" : "secondary"}
              label={RoleApprovalStatus[approvalStatus] + " " + role} />
          ))}
          {(adult.item2.relationshipToFamily && <Chip size="small" label={adult.item2.relationshipToFamily} />) || null}
          {adult.item2.isInHousehold && <Chip size="small" label="In Household" />}
        </Typography>
        <Typography variant="body2" component="div">
          {adult.item1.concerns && <><strong>⚠&nbsp;&nbsp;&nbsp;{adult.item1.concerns}</strong></>}
          {adult.item1.concerns && adult.item1.notes && <br />}
          {adult.item1.notes && <>📝&nbsp;{adult.item1.notes}</>}
        </Typography>
        <Typography variant="body2" component="div">
          <ul className={classes.cardList}>
            {volunteerFamily.individualVolunteers?.[adult.item1.id].approvalFormUploads?.map((upload, i) => (
              <li key={i}>
                ▸{upload.formName}&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                {upload.completedAtUtc && <span style={{float:'right'}}>{format(upload.completedAtUtc, "MM/dd/yyyy hh:mm aa")}</span>}
              </li>
            ))}
            {volunteerFamily.individualVolunteers?.[adult.item1.id].approvalActivitiesPerformed?.map((activity, i) => (
              <li key={i}>
                ▸{activity.activityName}&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                {activity.performedAtUtc && <span style={{float:'right'}}>{format(activity.performedAtUtc, "MM/dd/yyyy hh:mm aa")}</span>}
              </li>
            ))}
          </ul>
        </Typography>
      </CardContent>
      <CardActions>
        <Button size="small">Contact Info...</Button>
        <IconButton size="small" className={classes.rightCardAction}
          onClick={(event) => setAdultRecordMenuAnchor({anchor: event.currentTarget, adult: adult.item1 as Person})}>
          <AssignmentTurnedInIcon />
        </IconButton>
      </CardActions>
      <Menu id="adult-record-menu"
        anchorEl={adultRecordMenuAnchor?.anchor}
        keepMounted
        open={Boolean(adultRecordMenuAnchor)}
        onClose={() => setAdultRecordMenuAnchor(null)}>
        {adultDocumentTypes.map(documentType => (
          <MenuItem key={documentType.formName} onClick={() =>
            adultRecordMenuAnchor?.adult && selectRecordAdultStep(documentType, adultRecordMenuAnchor.adult)}>
            <ListItemText primary={documentType.formName} />
          </MenuItem>
        ))}
        <Divider />
        {adultActivityTypes.map(activityType => (
          <MenuItem key={activityType.activityName} onClick={() =>
            adultRecordMenuAnchor?.adult && selectRecordAdultStep(activityType, adultRecordMenuAnchor.adult)}>
            <ListItemText primary={activityType.activityName} />
          </MenuItem>
        ))}
      </Menu>
      {(recordAdultStepParameter && <RecordVolunteerAdultStepDialog volunteerFamily={volunteerFamily} adult={recordAdultStepParameter.adult}
        stepActionRequirement={recordAdultStepParameter.requirement} onClose={() => setRecordAdultStepParameter(null)} />) || null}
      <Menu id="adult-more-menu"
        anchorEl={adultMoreMenuAnchor?.anchor}
        keepMounted
        open={Boolean(adultMoreMenuAnchor)}
        onClose={() => setAdultMoreMenuAnchor(null)}>
        <MenuItem onClick={() => adultMoreMenuAnchor?.adult && selectChangeName(adultMoreMenuAnchor.adult)}>
          <ListItemText primary="Change name" />
        </MenuItem>
      </Menu>
    </Card>}</>);
}

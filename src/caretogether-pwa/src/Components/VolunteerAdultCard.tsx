import { Card, CardHeader, IconButton, CardContent, Typography, Chip, CardActions, makeStyles, Divider, ListItemText, Menu, MenuItem, MenuList, useMediaQuery, useTheme } from "@material-ui/core";
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
import { RenamePersonDialog } from "./RenamePersonDialog";
import { ContactDisplay } from "./ContactDisplay";
import { CardInfoRow } from "./CardInfoRow";

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
    paddingBottom: 8,
    maxWidth: 500
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
  const contactInfo = volunteerFamily.contactInfo?.[personId];

  const [adultRecordMenuAnchor, setAdultRecordMenuAnchor] = useState<{anchor: Element, adult: Person} | null>(null);
  const [recordAdultStepParameter, setRecordAdultStepParameter] = useState<{requirement: ActionRequirement, adult: Person} | null>(null);
  function selectRecordAdultStep(requirement: FormUploadRequirement | ActivityRequirement, adult: Person) {
    setAdultRecordMenuAnchor(null);
    setRecordAdultStepParameter({requirement, adult});
  }

  const [adultMoreMenuAnchor, setAdultMoreMenuAnchor] = useState<{anchor: Element, adult: Person} | null>(null);
  const [renamePersonParameter, setRenamePersonParameter] = useState<{volunteerFamilyId: string, person: Person} | null>(null);
  function selectChangeName(adult: Person) {
    setAdultMoreMenuAnchor(null);
    setRenamePersonParameter({volunteerFamilyId, person: adult});
  }
  
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.up('sm'));

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
          {adult.item1.concerns && <CardInfoRow icon='⚠'><strong>{adult.item1.concerns}</strong></CardInfoRow>}
          {adult.item1.notes && <CardInfoRow icon='📝'>{adult.item1.notes}</CardInfoRow>}
        </Typography>
        <Divider />
        <Typography variant="body2" component="div">
          <ul className={classes.cardList}>
            {volunteerFamily.individualVolunteers?.[adult.item1.id].approvalFormUploads?.map((upload, i) => (
              <li key={i}>
                <CardInfoRow icon='▸'>
                  {upload.formName}&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                  {upload.completedAtUtc && <span style={{float:'right'}}>{format(upload.completedAtUtc, "MM/dd/yyyy hh:mm aa")}</span>}
                </CardInfoRow>
              </li>
            ))}
            {volunteerFamily.individualVolunteers?.[adult.item1.id].approvalActivitiesPerformed?.map((activity, i) => (
              <li key={i}>
                <CardInfoRow icon='▸'>
                  {activity.activityName}&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                  {activity.performedAtUtc && <span style={{float:'right'}}>{format(activity.performedAtUtc, "MM/dd/yyyy hh:mm aa")}</span>}
                </CardInfoRow>
              </li>
            ))}
          </ul>
        </Typography>
        {contactInfo && (
          <>
            <Divider />
            <Typography variant="body2" component="div">
              <ContactDisplay contact={contactInfo} />
            </Typography>
          </>
        )}
      </CardContent>
      <CardActions>
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
        <MenuList dense={isMobile}>
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
        </MenuList>
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
      {(renamePersonParameter && <RenamePersonDialog volunteerFamilyId={volunteerFamilyId} person={renamePersonParameter.person}
        onClose={() => setRenamePersonParameter(null)} />) || null}
    </Card>}</>);
}

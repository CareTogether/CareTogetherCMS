import { Card, CardHeader, IconButton, CardContent, Typography, Chip, CardActions, makeStyles, Divider, ListItemText, Menu, MenuItem, MenuList, useMediaQuery, useTheme } from "@material-ui/core";
import { format } from 'date-fns';
import { useState } from "react";
import { ActionRequirement, Gender, Person, VolunteerFamily } from "../GeneratedClient";
import { AgeText } from "./AgeText";
import MoreVertIcon from '@material-ui/icons/MoreVert';
import AssignmentTurnedInIcon from '@material-ui/icons/AssignmentTurnedIn';
import { useRecoilValue } from "recoil";
import { volunteerFamiliesData } from "../Model/VolunteerFamiliesModel";
import { RecordVolunteerAdultStepDialog } from "./RecordVolunteerAdultStepDialog";
import { policyData } from '../Model/ConfigurationModel';
import { RenamePersonDialog } from "./RenamePersonDialog";
import { UpdateConcernsDialog } from "./UpdateConcernsDialog";
import { UpdateNotesDialog } from "./UpdateNotesDialog";
import { ContactDisplay } from "./ContactDisplay";
import { CardInfoRow } from "./CardInfoRow";
import { VolunteerRoleApprovalStatusChip } from "./VolunteerRoleApprovalStatusChipProps";
import { UpdatePhoneDialog } from "./UpdatePhoneDialog";
import { UpdateEmailDialog } from "./UpdateEmailDialog";
import { UpdateAddressDialog } from "./UpdateAddressDialog";

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
  const policy = useRecoilValue(policyData);

  const volunteerFamily = volunteerFamilies.find(x => x.family?.id === volunteerFamilyId) as VolunteerFamily;
  const adult = volunteerFamily.family?.adults?.find(x => x.item1?.id === personId);

  const [adultRecordMenuAnchor, setAdultRecordMenuAnchor] = useState<{anchor: Element, adult: Person} | null>(null);
  const [recordAdultStepParameter, setRecordAdultStepParameter] = useState<{requirementName: string, requirementInfo: ActionRequirement, adult: Person} | null>(null);
  function selectRecordAdultStep(requirementName: string, adult: Person) {
    setAdultRecordMenuAnchor(null);
    const requirementInfo = policy.actionDefinitions![requirementName];
    setRecordAdultStepParameter({requirementName, requirementInfo, adult});
  }

  const [adultMoreMenuAnchor, setAdultMoreMenuAnchor] = useState<{anchor: Element, adult: Person} | null>(null);
  const [renamePersonParameter, setRenamePersonParameter] = useState<{volunteerFamilyId: string, person: Person} | null>(null);
  function selectChangeName(adult: Person) {
    setAdultMoreMenuAnchor(null);
    setRenamePersonParameter({volunteerFamilyId, person: adult});
  }
  const [updateConcernsParameter, setUpdateConcernsParameter] = useState<{volunteerFamilyId: string, person: Person} | null>(null);
  function selectUpdateConcerns(adult: Person) {
    setAdultMoreMenuAnchor(null);
    setUpdateConcernsParameter({volunteerFamilyId, person: adult});
  }
  const [updateNotesParameter, setUpdateNotesParameter] = useState<{volunteerFamilyId: string, person: Person} | null>(null);
  function selectUpdateNotes(adult: Person) {
    setAdultMoreMenuAnchor(null);
    setUpdateNotesParameter({volunteerFamilyId, person: adult});
  }
  const [updatePhoneParameter, setUpdatePhoneParameter] = useState<{volunteerFamilyId: string, person: Person} | null>(null);
  function selectUpdatePhone(adult: Person) {
    setAdultMoreMenuAnchor(null);
    setUpdatePhoneParameter({volunteerFamilyId, person: adult});
  }
  const [updateEmailParameter, setUpdateEmailParameter] = useState<{volunteerFamilyId: string, person: Person} | null>(null);
  function selectUpdateEmail(adult: Person) {
    setAdultMoreMenuAnchor(null);
    setUpdateEmailParameter({volunteerFamilyId, person: adult});
  }
  const [updateAddressParameter, setUpdateAddressParameter] = useState<{volunteerFamilyId: string, person: Person} | null>(null);
  function selectUpdateAddress(adult: Person) {
    setAdultMoreMenuAnchor(null);
    setUpdateAddressParameter({volunteerFamilyId, person: adult});
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
          {Object.entries(volunteerFamily.individualVolunteers?.[adult.item1.id].individualRoleApprovals || {}).map(([role, roleVersionApprovals]) =>
            <VolunteerRoleApprovalStatusChip key={role} roleName={role} roleVersionApprovals={roleVersionApprovals} />)}
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
            {volunteerFamily.individualVolunteers?.[adult.item1.id].completedRequirements?.map((completed, i) => (
              <li key={i}>
                <CardInfoRow icon='✅'>
                  {completed.requirementName}&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                  {completed.completedAtUtc && <span style={{float:'right'}}>{format(completed.completedAtUtc, "MM/dd/yyyy hh:mm aa")}</span>}
                </CardInfoRow>
              </li>
            ))}
          </ul>
          <ul className={classes.cardList}>
            {volunteerFamily.individualVolunteers?.[adult.item1.id].missingRequirements?.map((missingRequirementName, i) => (
              <li key={i}>
              <CardInfoRow icon='❌'>
                {missingRequirementName}
              </CardInfoRow>
            </li>
            ))}
          </ul>
        </Typography>
        <Divider />
        <Typography variant="body2" component="div">
          <ContactDisplay person={adult.item1} />
        </Typography>
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
          {volunteerFamily.individualVolunteers?.[adult.item1.id].missingRequirements?.map(missingRequirementName =>
            <MenuItem key={missingRequirementName} onClick={() =>
              adultRecordMenuAnchor?.adult && selectRecordAdultStep(missingRequirementName, adultRecordMenuAnchor.adult)}>
              <ListItemText primary={missingRequirementName} />
            </MenuItem>
          )}
          <Divider />
          {volunteerFamily.individualVolunteers?.[adult.item1.id].availableApplications?.map(requirementName =>
            <MenuItem key={requirementName} onClick={() =>
              adultRecordMenuAnchor?.adult && selectRecordAdultStep(requirementName, adultRecordMenuAnchor.adult)}>
              <ListItemText primary={requirementName} />
            </MenuItem>
          )}
        </MenuList>
      </Menu>
      {(recordAdultStepParameter && <RecordVolunteerAdultStepDialog volunteerFamily={volunteerFamily} adult={recordAdultStepParameter.adult}
        requirementName={recordAdultStepParameter.requirementName} stepActionRequirement={recordAdultStepParameter.requirementInfo}
        onClose={() => setRecordAdultStepParameter(null)} />) || null}
      <Menu id="adult-more-menu"
        anchorEl={adultMoreMenuAnchor?.anchor}
        keepMounted
        open={Boolean(adultMoreMenuAnchor)}
        onClose={() => setAdultMoreMenuAnchor(null)}>
        <MenuItem onClick={() => adultMoreMenuAnchor?.adult && selectChangeName(adultMoreMenuAnchor.adult)}>
          <ListItemText primary="Change name" />
        </MenuItem>
        <MenuItem onClick={() => adultMoreMenuAnchor?.adult && selectUpdateConcerns(adultMoreMenuAnchor.adult)}>
          <ListItemText primary="Update concerns" />
        </MenuItem>
        <MenuItem onClick={() => adultMoreMenuAnchor?.adult && selectUpdateNotes(adultMoreMenuAnchor.adult)}>
          <ListItemText primary="Update notes" />
        </MenuItem>
        <MenuItem onClick={() => adultMoreMenuAnchor?.adult && selectUpdatePhone(adultMoreMenuAnchor.adult)}>
          <ListItemText primary="Update phone" />
        </MenuItem>
        <MenuItem onClick={() => adultMoreMenuAnchor?.adult && selectUpdateEmail(adultMoreMenuAnchor.adult)}>
          <ListItemText primary="Update email" />
        </MenuItem>
        <MenuItem onClick={() => adultMoreMenuAnchor?.adult && selectUpdateAddress(adultMoreMenuAnchor.adult)}>
          <ListItemText primary="Update address" />
        </MenuItem>
      </Menu>
      {(renamePersonParameter && <RenamePersonDialog volunteerFamilyId={volunteerFamilyId} person={renamePersonParameter.person}
        onClose={() => setRenamePersonParameter(null)} />) || null}
      {(updateConcernsParameter && <UpdateConcernsDialog volunteerFamilyId={volunteerFamilyId} person={updateConcernsParameter.person}
        onClose={() => setUpdateConcernsParameter(null)} />) || null}
      {(updateNotesParameter && <UpdateNotesDialog volunteerFamilyId={volunteerFamilyId} person={updateNotesParameter.person}
        onClose={() => setUpdateNotesParameter(null)} />) || null}
      {(updatePhoneParameter && <UpdatePhoneDialog volunteerFamilyId={volunteerFamilyId} person={updatePhoneParameter.person}
        onClose={() => setUpdatePhoneParameter(null)} />) || null}
      {(updateEmailParameter && <UpdateEmailDialog volunteerFamilyId={volunteerFamilyId} person={updateEmailParameter.person}
        onClose={() => setUpdateEmailParameter(null)} />) || null}
      {(updateAddressParameter && <UpdateAddressDialog volunteerFamilyId={volunteerFamilyId} person={updateAddressParameter.person}
        onClose={() => setUpdateAddressParameter(null)} />) || null}
    </Card>}</>);
}

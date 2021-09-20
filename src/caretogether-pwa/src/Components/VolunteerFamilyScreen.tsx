import React, { useState } from 'react';
import { makeStyles } from '@material-ui/core/styles';
import { Container, Toolbar, Chip, Button, Menu, MenuItem, Divider, Card, CardActions, CardContent, Typography, Grid, CardHeader, IconButton, ListItemText } from '@material-ui/core';
import { VolunteerFamily, FormUploadRequirement, ActionRequirement, ActivityRequirement, Person, Gender, CustodialRelationshipType } from '../GeneratedClient';
import { useRecoilValue } from 'recoil';
import { adultActivityTypesData, adultDocumentTypesData, familyActivityTypesData, familyDocumentTypesData } from '../Model/ConfigurationModel';
import { RoleApprovalStatus } from '../GeneratedClient';
import AddCircleIcon from '@material-ui/icons/AddCircle';
import MoreVertIcon from '@material-ui/icons/MoreVert';
import AssignmentTurnedInIcon from '@material-ui/icons/AssignmentTurnedIn';
import { AgeText } from './AgeText';
import { RecordVolunteerFamilyStepDialog } from './RecordVolunteerFamilyStepDialog';
import { volunteerFamiliesData } from '../Model/VolunteerFamiliesModel';
import { RecordVolunteerAdultStepDialog } from './RecordVolunteerAdultStepDialog';
import { AddAdultDialog } from './AddAdultDialog';
import { format } from 'date-fns';
import { AddChildDialog } from './AddChildDialog';
import { useParams } from 'react-router';

const useStyles = makeStyles((theme) => ({
  sectionHeading: {
  },
  sectionChips: {
    '& > div:first-child': {
      marginLeft: 0
    },
    '& > *': {
      margin: theme.spacing(0.5),
    }
  },
  button: {
    margin: theme.spacing(1),
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

export function VolunteerFamilyScreen() {
  const classes = useStyles();
  const { volunteerFamilyId } = useParams<{ volunteerFamilyId: string }>();

  const volunteerFamilies = useRecoilValue(volunteerFamiliesData);
  const familyDocumentTypes = useRecoilValue(familyDocumentTypesData);
  const familyActivityTypes = useRecoilValue(familyActivityTypesData);
  const adultDocumentTypes = useRecoilValue(adultDocumentTypesData);
  const adultActivityTypes = useRecoilValue(adultActivityTypesData);

  const volunteerFamily = volunteerFamilies.find(x => x.family?.id === volunteerFamilyId) as VolunteerFamily;
  
  const [familyRecordMenuAnchor, setFamilyRecordMenuAnchor] = useState<Element | null>(null);
  const [recordFamilyStepParameter, setRecordFamilyStepParameter] = useState<ActionRequirement | null>(null);
  function selectRecordFamilyStep(requirement: FormUploadRequirement | ActivityRequirement) {
    setFamilyRecordMenuAnchor(null);
    setRecordFamilyStepParameter(requirement);
  }
  
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

  const [addAdultDialogOpen, setAddAdultDialogOpen] = useState(false);
  const [addChildDialogOpen, setAddChildDialogOpen] = useState(false);

  return (
  <Container>
    <Toolbar variant="dense" disableGutters={true}>
      <span>Primary Contact: {volunteerFamily.family?.adults?.filter(adult => adult.item1?.id === volunteerFamily.family?.primaryFamilyContactPersonId)[0]?.item1?.firstName}</span>
      <Button aria-controls="family-record-menu" aria-haspopup="true"
        variant="contained" color="default" size="small" className={classes.button}
        startIcon={<AssignmentTurnedInIcon />}
        onClick={(event) => setFamilyRecordMenuAnchor(event.currentTarget)}>
        Complete…
      </Button>
      <Button
        onClick={() => setAddAdultDialogOpen(true)}
        variant="contained" color="default" size="small" className={classes.button}
        startIcon={<AddCircleIcon />}>
        Add Adult
      </Button>
      <Menu id="family-record-menu"
        anchorEl={familyRecordMenuAnchor}
        keepMounted
        open={Boolean(familyRecordMenuAnchor)}
        onClose={() => setFamilyRecordMenuAnchor(null)}>
        {familyDocumentTypes.map(documentType => (
          <MenuItem key={documentType.formName} onClick={() => selectRecordFamilyStep(documentType)}>{documentType.formName}</MenuItem>
        ))}
        <Divider />
        {familyActivityTypes.map(activityType => (
          <MenuItem key={activityType.activityName} onClick={() => selectRecordFamilyStep(activityType)}>{activityType.activityName}</MenuItem>
        ))}
      </Menu>
      <RecordVolunteerFamilyStepDialog volunteerFamily={volunteerFamily} stepActionRequirement={recordFamilyStepParameter} onClose={() => setRecordFamilyStepParameter(null)} />
      {addAdultDialogOpen && <AddAdultDialog onClose={() => setAddAdultDialogOpen(false)} />}
    </Toolbar>
    <div className={classes.sectionChips}>
      {Object.entries(volunteerFamily.familyRoleApprovals || {}).map(([role, approvalStatus]) => (
        <Chip key={role} size="small" color={approvalStatus === RoleApprovalStatus.Onboarded ? "primary" : "secondary"}
          label={RoleApprovalStatus[approvalStatus] + " " + role} />
      ))}
    </div>
    <ul>
      {volunteerFamily.approvalFormUploads?.map((upload, i) => (
        <li key={i}>{upload.formName} {upload.completedAtUtc && format(upload.completedAtUtc, "MM/dd/yyyy hh:mm aa")}</li>
      ))}
      {volunteerFamily.approvalActivitiesPerformed?.map((activity, i) => (
        <li key={i}>{activity.activityName} {activity.performedAtUtc && format(activity.performedAtUtc, "MM/dd/yyyy hh:mm aa")}</li>
      ))}
    </ul>
    <Grid container spacing={2}>
      {volunteerFamily.family?.adults?.map(adult => adult.item1 && adult.item1.id && adult.item2 && (
        <Grid item key={adult.item1.id}>
          <Card className={classes.card}>
            <CardHeader className={classes.cardHeader}
              title={adult.item1.firstName + " " + adult.item1.lastName}
              subheader={<>
                Adult, <AgeText age={adult.item1.age} />, {typeof(adult.item1.gender) === 'undefined' ? "" : Gender[adult.item1.gender] + ","} {adult.item1.ethnicity}
              </>}
              action={
                <IconButton
                  onClick={(event) => setAdultMoreMenuAnchor({anchor: event.currentTarget, adult: adult.item1 as Person})}
                  aria-controls="adult-more-menu" aria-haspopup="true">
                  <MoreVertIcon />
                </IconButton>} />
            <CardContent className={classes.cardContent}>
              <Typography color="textSecondary" className={classes.sectionChips}>
                {Object.entries(volunteerFamily.individualVolunteers?.[adult.item1.id].individualRoleApprovals || {}).map(([role, approvalStatus]) => (
                  <Chip key={role} size="small" color={approvalStatus === RoleApprovalStatus.Onboarded ? "primary" : "secondary"}
                    label={RoleApprovalStatus[approvalStatus] + " " + role} />
                ))}
                {(adult.item2.relationshipToFamily && <Chip size="small" label={adult.item2.relationshipToFamily} />) || null}
                {adult.item2.isInHousehold && <Chip size="small" label="In Household" />}
              </Typography>
              <Typography variant="body2" component="p">
                {adult.item1.concerns && <><strong>⚠&nbsp;&nbsp;&nbsp;{adult.item1.concerns}</strong></>}
                {adult.item1.concerns && adult.item1.notes && <br />}
                {adult.item1.notes && <>📝&nbsp;{adult.item1.notes}</>}
              </Typography>
              <Typography variant="body2" component="p">
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
                onClick={(event) => setAdultRecordMenuAnchor({anchor: event.currentTarget, adult: adult.item1 as Person})}
                aria-controls="adult-record-menu" aria-haspopup="true">
                <AssignmentTurnedInIcon />
              </IconButton>
            </CardActions>
          </Card>
        </Grid>
      ))}
    </Grid>
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
    <Toolbar variant="dense" disableGutters={true}>
      <h3 className={classes.sectionHeading}>Children</h3>
      &nbsp;
      <Button
        onClick={() => setAddChildDialogOpen(true)}
        variant="contained" color="default" size="small" className={classes.button}
        startIcon={<AddCircleIcon />}>
        Add Child
      </Button>
    </Toolbar>
    {addChildDialogOpen && <AddChildDialog onClose={() => setAddChildDialogOpen(false)} />}
    {volunteerFamily.family?.children?.map(child => (
      <React.Fragment key={child.id}>
        <h4 className={classes.sectionHeading}>{child.firstName} {child.lastName} (<AgeText age={child.age} /> {typeof(child.gender) === 'undefined' ? "" : Gender[child.gender]} {child.ethnicity})</h4>
        <Container>
          <ul>
            {volunteerFamily.family?.custodialRelationships?.filter(relationship => relationship.childId === child.id)?.map(relationship => (
              <li key={relationship.personId}>{volunteerFamily.family?.adults?.filter(x => x.item1?.id === relationship.personId)[0].item1?.firstName}:&nbsp;
                {relationship.type === CustodialRelationshipType.LegalGuardian
                  ? "legal guardian"
                  : relationship.type === CustodialRelationshipType.ParentWithCustody
                  ? "parent (with joint custody)"
                  : relationship.type === CustodialRelationshipType.ParentWithCourtAppointedCustody
                  ? "parent with court-appointed sole custody"
                  : null}
              </li>
            ))}
          </ul>
          <dl>
            {child.concerns && <><dt><strong>⚠ Concerns</strong></dt><dd>{child.concerns}</dd></>}
            {child.notes && <><dt>📝 Notes</dt><dd>{child.notes}</dd></>}
          </dl>
        </Container>
      </React.Fragment>
    ))}
  </Container>);
}

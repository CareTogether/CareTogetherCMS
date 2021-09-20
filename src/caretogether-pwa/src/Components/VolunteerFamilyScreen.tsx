import React, { useState } from 'react';
import { makeStyles } from '@material-ui/core/styles';
import { Container, Toolbar, Chip, Button, Menu, MenuItem, Divider, Grid } from '@material-ui/core';
import { VolunteerFamily, FormUploadRequirement, ActionRequirement, ActivityRequirement } from '../GeneratedClient';
import { useRecoilValue } from 'recoil';
import { familyActivityTypesData, familyDocumentTypesData } from '../Model/ConfigurationModel';
import { RoleApprovalStatus } from '../GeneratedClient';
import AddCircleIcon from '@material-ui/icons/AddCircle';
import AssignmentTurnedInIcon from '@material-ui/icons/AssignmentTurnedIn';
import { RecordVolunteerFamilyStepDialog } from './RecordVolunteerFamilyStepDialog';
import { volunteerFamiliesData } from '../Model/VolunteerFamiliesModel';
import { AddAdultDialog } from './AddAdultDialog';
import { format } from 'date-fns';
import { AddChildDialog } from './AddChildDialog';
import { useParams } from 'react-router';
import { VolunteerAdultCard } from './VolunteerAdultCard';
import { VolunteerChildCard } from './VolunteerChildCard';

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

  const volunteerFamily = volunteerFamilies.find(x => x.family?.id === volunteerFamilyId) as VolunteerFamily;
  
  const [familyRecordMenuAnchor, setFamilyRecordMenuAnchor] = useState<Element | null>(null);
  const [recordFamilyStepParameter, setRecordFamilyStepParameter] = useState<ActionRequirement | null>(null);
  function selectRecordFamilyStep(requirement: FormUploadRequirement | ActivityRequirement) {
    setFamilyRecordMenuAnchor(null);
    setRecordFamilyStepParameter(requirement);
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
        Adult
      </Button>
      <Button
        onClick={() => setAddChildDialogOpen(true)}
        variant="contained" color="default" size="small" className={classes.button}
        startIcon={<AddCircleIcon />}>
        Child
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
      {addChildDialogOpen && <AddChildDialog onClose={() => setAddChildDialogOpen(false)} />}
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
          <VolunteerAdultCard volunteerFamilyId={volunteerFamilyId} personId={adult.item1.id} />
        </Grid>
      ))}
      {volunteerFamily.family?.children?.map(child => (
        <Grid item key={child.id!}>
          <VolunteerChildCard volunteerFamilyId={volunteerFamilyId} personId={child.id!} />
        </Grid>
      ))}
    </Grid>
  </Container>);
}

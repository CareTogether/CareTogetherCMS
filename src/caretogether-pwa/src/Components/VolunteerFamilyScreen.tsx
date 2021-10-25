import React, { useState } from 'react';
import { makeStyles } from '@material-ui/core/styles';
import { Container, Toolbar, Button, Menu, MenuItem, Grid, useMediaQuery, useTheme, MenuList, Divider } from '@material-ui/core';
import { VolunteerFamily, ActionRequirement } from '../GeneratedClient';
import { useRecoilValue } from 'recoil';
import { policyData } from '../Model/ConfigurationModel';
import AddCircleIcon from '@material-ui/icons/AddCircle';
import AssignmentTurnedInIcon from '@material-ui/icons/AssignmentTurnedIn';
import CloudUploadIcon from '@material-ui/icons/CloudUpload';
import { RecordVolunteerFamilyStepDialog } from './RecordVolunteerFamilyStepDialog';
import { volunteerFamiliesData } from '../Model/VolunteersModel';
import { AddAdultDialog } from './AddAdultDialog';
import { format } from 'date-fns';
import { AddChildDialog } from './AddChildDialog';
import { useParams } from 'react-router';
import { VolunteerAdultCard } from './VolunteerAdultCard';
import { VolunteerChildCard } from './VolunteerChildCard';
import { UploadVolunteerFamilyDocumentDialog } from './UploadVolunteerFamilyDocumentDialog';
import { downloadFile } from '../Model/FilesModel';
import { currentOrganizationState, currentLocationState } from '../Model/SessionModel';
import { VolunteerRoleApprovalStatusChip } from './VolunteerRoleApprovalStatusChipProps';

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
  familyRequirementsList: {
    listStyle: 'none',
    paddingLeft: 22,
    textIndent: -22
  },
  familyDocumentsList: {
    listStyle: 'none',
    paddingLeft: 22,
    textIndent: -22
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
  const policy = useRecoilValue(policyData);
  const organizationId = useRecoilValue(currentOrganizationState);
  const locationId = useRecoilValue(currentLocationState);

  const volunteerFamily = volunteerFamilies.find(x => x.family?.id === volunteerFamilyId) as VolunteerFamily;
  
  const [familyRecordMenuAnchor, setFamilyRecordMenuAnchor] = useState<Element | null>(null);
  const [recordFamilyStepParameter, setRecordFamilyStepParameter] = useState<{requirementName: string, requirementInfo: ActionRequirement} | null>(null);
  function selectRecordFamilyStep(requirementName: string) {
    setFamilyRecordMenuAnchor(null);
    const requirementInfo = policy.actionDefinitions![requirementName];
    setRecordFamilyStepParameter({requirementName, requirementInfo});
  }
  
  const [uploadDocumentDialogOpen, setUploadDocumentDialogOpen] = useState(false);
  const [addAdultDialogOpen, setAddAdultDialogOpen] = useState(false);
  const [addChildDialogOpen, setAddChildDialogOpen] = useState(false);
  
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.up('sm'));

  return (
  <Container>
    <Toolbar variant="dense" disableGutters={true}>
      <Button aria-controls="family-record-menu" aria-haspopup="true"
        variant="contained" color="default" size="small" className={classes.button}
        startIcon={<AssignmentTurnedInIcon />}
        onClick={(event) => setFamilyRecordMenuAnchor(event.currentTarget)}>
        Complete…
      </Button>
      <Button
        onClick={() => setUploadDocumentDialogOpen(true)}
        variant="contained" color="default" size="small" className={classes.button}
        startIcon={<CloudUploadIcon />}>
        Upload
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
        <MenuList dense={isMobile}>
          {volunteerFamily.missingRequirements?.map(requirementName => (
            <MenuItem key={requirementName} onClick={() => selectRecordFamilyStep(requirementName)}>{requirementName}</MenuItem>
          ))}
          <Divider />
          {volunteerFamily.availableApplications?.map(requirementName => (
            <MenuItem key={requirementName} onClick={() => selectRecordFamilyStep(requirementName)}>{requirementName}</MenuItem>
          ))}
        </MenuList>
      </Menu>
      {recordFamilyStepParameter && <RecordVolunteerFamilyStepDialog volunteerFamily={volunteerFamily}
        requirementName={recordFamilyStepParameter.requirementName} stepActionRequirement={recordFamilyStepParameter.requirementInfo}
        onClose={() => setRecordFamilyStepParameter(null)} />}
      {uploadDocumentDialogOpen && <UploadVolunteerFamilyDocumentDialog volunteerFamily={volunteerFamily}
        onClose={() => setUploadDocumentDialogOpen(false)} />}
      {addAdultDialogOpen && <AddAdultDialog onClose={() => setAddAdultDialogOpen(false)} />}
      {addChildDialogOpen && <AddChildDialog onClose={() => setAddChildDialogOpen(false)} />}
    </Toolbar>
    <Grid container spacing={0}>
      <Grid item xs={12}>
        <span>Primary Contact: {volunteerFamily.family?.adults?.filter(adult => adult.item1?.id === volunteerFamily.family?.primaryFamilyContactPersonId)[0]?.item1?.firstName}</span>
      </Grid>
      <Grid item xs={12}>
        <div className={classes.sectionChips}>
          {Object.entries(volunteerFamily.familyRoleApprovals || {}).flatMap(([role, roleVersionApprovals]) =>
            <VolunteerRoleApprovalStatusChip key={role} roleName={role} roleVersionApprovals={roleVersionApprovals} />)}
        </div>
      </Grid>
      <Grid item xs={12} sm={6} md={4}>
        <h3>Incomplete</h3>
        <ul className={classes.familyRequirementsList}>
          {volunteerFamily.missingRequirements?.map((missingRequirementName, i) => (
            <li key={i}>
              ❌ {missingRequirementName}
            </li>
          ))}
        </ul>
      </Grid>
      <Grid item xs={12} sm={6} md={4}>
        <h3>Completed</h3>
        <ul className={classes.familyRequirementsList}>
          {volunteerFamily.completedRequirements?.map((completed, i) => (
            <li key={i}>
              ✅ {completed.requirementName}&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
              {completed.completedAtUtc && <span style={{float:'right',marginRight:20}}>{format(completed.completedAtUtc, "MM/dd/yyyy hh:mm aa")}</span>}
            </li>
          ))}
        </ul>
      </Grid>
      <Grid item xs={12} sm={6} md={4}>
        <h3>Documents</h3>
        <ul className={classes.familyDocumentsList}>
          {volunteerFamily.uploadedDocuments?.map((uploaded, i) => (
            <li key={i}
              onClick={() => downloadFile(organizationId, locationId, uploaded.uploadedDocumentId!)}>
              📃 {uploaded.uploadedFileName}&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
              {uploaded.timestampUtc && <span style={{float:'right',marginRight:20}}>{format(uploaded.timestampUtc, "MM/dd/yyyy hh:mm aa")}</span>}
            </li>
          ))}
        </ul>
      </Grid>
    </Grid>
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

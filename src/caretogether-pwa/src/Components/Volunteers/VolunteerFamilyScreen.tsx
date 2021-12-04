import React, { useState } from 'react';
import { makeStyles } from '@material-ui/core/styles';
import { Container, Toolbar, Button, Menu, MenuItem, Grid, useMediaQuery, useTheme, MenuList, Divider, IconButton, ListItemText, Chip } from '@material-ui/core';
import { CombinedFamilyInfo, ActionRequirement, RoleRemovalReason } from '../../GeneratedClient';
import { useRecoilValue } from 'recoil';
import { policyData } from '../../Model/ConfigurationModel';
import AddCircleIcon from '@material-ui/icons/AddCircle';
import MoreVertIcon from '@material-ui/icons/MoreVert';
import AssignmentTurnedInIcon from '@material-ui/icons/AssignmentTurnedIn';
import CloudUploadIcon from '@material-ui/icons/CloudUpload';
import { RecordVolunteerFamilyStepDialog } from './RecordVolunteerFamilyStepDialog';
import { volunteerFamiliesData } from '../../Model/VolunteersModel';
import { AddAdultDialog } from '../Families/AddAdultDialog';
import { format } from 'date-fns';
import { AddChildDialog } from '../Families/AddChildDialog';
import { useParams } from 'react-router';
import { VolunteerAdultCard } from './VolunteerAdultCard';
import { VolunteerChildCard } from './VolunteerChildCard';
import { UploadFamilyDocumentDialog } from '../Families/UploadFamilyDocumentDialog';
import { downloadFile } from '../../Model/FilesModel';
import { currentOrganizationState, currentLocationState } from '../../Model/SessionModel';
import { VolunteerRoleApprovalStatusChip } from './VolunteerRoleApprovalStatusChip';
import { RemoveFamilyRoleDialog } from './RemoveFamilyRoleDialog';
import { ResetFamilyRoleDialog } from './ResetFamilyRoleDialog';
import { PersonName } from '../Families/PersonName';

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
  const { familyId } = useParams<{ familyId: string }>();

  const volunteerFamilies = useRecoilValue(volunteerFamiliesData);
  const policy = useRecoilValue(policyData);
  const organizationId = useRecoilValue(currentOrganizationState);
  const locationId = useRecoilValue(currentLocationState);

  const volunteerFamily = volunteerFamilies.find(x => x.family?.id === familyId) as CombinedFamilyInfo;
  
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

  const [familyMoreMenuAnchor, setFamilyMoreMenuAnchor] = useState<Element | null>(null);

  const [removeRoleParameter, setRemoveRoleParameter] = useState<{volunteerFamilyId: string, role: string} | null>(null);
  function selectRemoveRole(role: string) {
    setFamilyMoreMenuAnchor(null);
    setRemoveRoleParameter({volunteerFamilyId: familyId, role: role});
  }
  const [resetRoleParameter, setResetRoleParameter] = useState<{volunteerFamilyId: string, role: string, removalReason: RoleRemovalReason, removalAdditionalComments: string} | null>(null);
  function selectResetRole(role: string, removalReason: RoleRemovalReason, removalAdditionalComments: string) {
    setFamilyMoreMenuAnchor(null);
    setResetRoleParameter({volunteerFamilyId: familyId, role: role, removalReason: removalReason, removalAdditionalComments: removalAdditionalComments});
  }
  
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
      <IconButton
        onClick={(event) => setFamilyMoreMenuAnchor(event.currentTarget)}>
        <MoreVertIcon />
      </IconButton>
      <Menu id="family-record-menu"
        anchorEl={familyRecordMenuAnchor}
        keepMounted
        open={Boolean(familyRecordMenuAnchor)}
        onClose={() => setFamilyRecordMenuAnchor(null)}>
        <MenuList dense={isMobile}>
          {volunteerFamily.volunteerFamilyInfo?.missingRequirements?.map(requirementName => (
            <MenuItem key={requirementName} onClick={() => selectRecordFamilyStep(requirementName)}>{requirementName}</MenuItem>
          ))}
          <Divider />
          {volunteerFamily.volunteerFamilyInfo?.availableApplications?.map(requirementName => (
            <MenuItem key={requirementName} onClick={() => selectRecordFamilyStep(requirementName)}>{requirementName}</MenuItem>
          ))}
        </MenuList>
      </Menu>
      <Menu id="family-more-menu"
        anchorEl={familyMoreMenuAnchor}
        keepMounted
        open={Boolean(familyMoreMenuAnchor)}
        onClose={() => setFamilyMoreMenuAnchor(null)}>
        <MenuList dense={isMobile}>
          {Object.entries(volunteerFamily.volunteerFamilyInfo?.familyRoleApprovals || {}).filter(([role, ]) =>
            !volunteerFamily.volunteerFamilyInfo?.removedRoles?.find(x => x.roleName === role)).flatMap(([role, ]) => (
            <MenuItem key={role} onClick={() => selectRemoveRole(role)}>
              <ListItemText primary={`Remove from ${role} role`} />
            </MenuItem>
          ))}
          {(volunteerFamily.volunteerFamilyInfo?.removedRoles || []).map(removedRole => (
            <MenuItem key={removedRole.roleName}
              onClick={() => selectResetRole(removedRole.roleName!, removedRole.reason!, removedRole.additionalComments!)}>
              <ListItemText primary={`Reset ${removedRole.roleName} participation`} />
            </MenuItem>
          ))}
        </MenuList>
      </Menu>
      {recordFamilyStepParameter && <RecordVolunteerFamilyStepDialog volunteerFamily={volunteerFamily}
        requirementName={recordFamilyStepParameter.requirementName} stepActionRequirement={recordFamilyStepParameter.requirementInfo}
        onClose={() => setRecordFamilyStepParameter(null)} />}
      {uploadDocumentDialogOpen && <UploadFamilyDocumentDialog family={volunteerFamily}
        onClose={() => setUploadDocumentDialogOpen(false)} />}
      {addAdultDialogOpen && <AddAdultDialog onClose={() => setAddAdultDialogOpen(false)} />}
      {addChildDialogOpen && <AddChildDialog onClose={() => setAddChildDialogOpen(false)} />}
      {(removeRoleParameter && <RemoveFamilyRoleDialog volunteerFamilyId={familyId} role={removeRoleParameter.role}
        onClose={() => setRemoveRoleParameter(null)} />) || null}
      {(resetRoleParameter && <ResetFamilyRoleDialog volunteerFamilyId={familyId} role={resetRoleParameter.role}
        removalReason={resetRoleParameter.removalReason} removalAdditionalComments={resetRoleParameter.removalAdditionalComments}
        onClose={() => setResetRoleParameter(null)} />) || null}
    </Toolbar>
    <Grid container spacing={0}>
      <Grid item xs={12}>
        <span>Primary Contact: <PersonName person={volunteerFamily.family?.adults?.find(adult => adult.item1?.id === volunteerFamily.family?.primaryFamilyContactPersonId)?.item1} /></span>
      </Grid>
      <Grid item xs={12}>
        <div className={classes.sectionChips}>
          {Object.entries(volunteerFamily.volunteerFamilyInfo?.familyRoleApprovals || {}).flatMap(([role, roleVersionApprovals]) =>
            <VolunteerRoleApprovalStatusChip key={role} roleName={role} roleVersionApprovals={roleVersionApprovals} />)}
          {(volunteerFamily.volunteerFamilyInfo?.removedRoles || []).map(removedRole =>
            <Chip key={removedRole.roleName} size="small" label={`${removedRole.roleName} - ${RoleRemovalReason[removedRole.reason!]} - ${removedRole.additionalComments}`} />)}
        </div>
      </Grid>
      <Grid item xs={12} sm={6} md={4}>
        <h3>Incomplete</h3>
        <ul className={classes.familyRequirementsList}>
          {volunteerFamily.volunteerFamilyInfo?.missingRequirements?.map((missingRequirementName, i) => (
            <li key={i}>
              ❌ {missingRequirementName}
            </li>
          ))}
        </ul>
      </Grid>
      <Grid item xs={12} sm={6} md={4}>
        <h3>Completed</h3>
        <ul className={classes.familyRequirementsList}>
          {volunteerFamily.volunteerFamilyInfo?.completedRequirements?.map((completed, i) => (
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
      {volunteerFamily.family?.adults?.map(adult => adult.item1 && adult.item1.id && adult.item1.active && adult.item2 && (
        <Grid item key={adult.item1.id}>
          <VolunteerAdultCard volunteerFamilyId={familyId} personId={adult.item1.id} />
        </Grid>
      ))}
      {volunteerFamily.family?.children?.map(child => child.active && (
        <Grid item key={child.id!}>
          <VolunteerChildCard volunteerFamilyId={familyId} personId={child.id!} />
        </Grid>
      ))}
    </Grid>
  </Container>);
}

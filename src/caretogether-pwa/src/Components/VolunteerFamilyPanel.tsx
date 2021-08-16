import React, { useState } from 'react';
import { makeStyles } from '@material-ui/core/styles';
import { Container, Toolbar, Chip, Button, Menu, MenuItem, Divider, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, Link } from '@material-ui/core';
import { VolunteerFamily, FamilyAdultRelationshipType, CustodialRelationshipType, FormUploadRequirement, ActionRequirement, ActivityRequirement, Person } from '../GeneratedClient';
import { useRecoilValue } from 'recoil';
import { adultActivityTypesData, adultDocumentTypesData, familyActivityTypesData, familyDocumentTypesData } from '../Model/ConfigurationModel';
import { RoleApprovalStatus } from '../GeneratedClient';
import AddCircleIcon from '@material-ui/icons/AddCircle';
import AssignmentTurnedInIcon from '@material-ui/icons/AssignmentTurnedIn';
import { AgeText } from './AgeText';
import { DateTimePicker } from '@material-ui/pickers';

const useStyles = makeStyles((theme) => ({
  sectionHeading: {
    marginTop: 0,
    marginBottom: 0
  },
  sectionChips: {
    marginTop: 0,
    marginBottom: -10,
    '& > *': {
      margin: theme.spacing(0.5),
    }
  },
  button: {
    margin: theme.spacing(1),
  }
}));

interface RecordFamilyStepDialogProps {
  stepActionRequirement: ActionRequirement | null,
  volunteerFamily: VolunteerFamily,
  onClose: () => void
}

function RecordFamilyStepDialog({stepActionRequirement, volunteerFamily, onClose}: RecordFamilyStepDialogProps) {
  const [performedAtLocal, setPerformedAtLocal] = useState(new Date());

  function recordUploadFormStep() {
    //TODO: Actually do this :) and update the client-side model with the result.
    onClose();
  }

  function recordPerformActivityStep() {
    //TODO: Actually do this :) and update the client-side model with the result.
    onClose();
  }

  return (
    <Dialog open={Boolean(stepActionRequirement)} onClose={onClose} aria-labelledby="record-family-step-title">
      {(stepActionRequirement && stepActionRequirement instanceof FormUploadRequirement)
        ? (
          <>
            <DialogTitle id="record-family-step-title">Family Form: {stepActionRequirement.formName}</DialogTitle>
            <DialogContent>
              <DialogContentText>
                Do you want to upload this form for this family?
              </DialogContentText>
              <DialogContentText>
                Template: <Link href={stepActionRequirement.templateLink} target="_blank" rel="noreferrer">
                  {stepActionRequirement.formVersion} {stepActionRequirement.formName}
                </Link>
              </DialogContentText>
              <DialogContentText>{stepActionRequirement.instructions}</DialogContentText>
            </DialogContent>
            <DialogActions>
              <Button onClick={onClose} color="secondary">
                Cancel
              </Button>
              <Button onClick={recordUploadFormStep} color="primary">
                Upload
              </Button>
            </DialogActions>
          </>
        ) : (stepActionRequirement && stepActionRequirement instanceof ActivityRequirement)
        ? (
          <>
            <DialogTitle id="record-family-step-title">Family Activity: {stepActionRequirement.activityName}</DialogTitle>
            <DialogContent>
              <DialogContentText>Do you want to record that this activity has been completed?</DialogContentText>
              <DateTimePicker
                label="When did this occur?"
                value={performedAtLocal}
                disableFuture
                onChange={(date) => date && setPerformedAtLocal(date)}
                showTodayButton />
            </DialogContent>
            <DialogActions>
              <Button onClick={onClose} color="secondary">
                Cancel
              </Button>
              <Button onClick={recordPerformActivityStep} color="primary">
                Mark Complete
              </Button>
            </DialogActions>
          </>
        ) : null}
    </Dialog>
  );
}

interface VolunteerFamilyPanelProps {
  volunteerFamily: VolunteerFamily
}

export function VolunteerFamilyPanel({volunteerFamily}: VolunteerFamilyPanelProps) {
  const classes = useStyles();

  const familyDocumentTypes = useRecoilValue(familyDocumentTypesData);
  const familyActivityTypes = useRecoilValue(familyActivityTypesData);
  const adultDocumentTypes = useRecoilValue(adultDocumentTypesData);
  const adultActivityTypes = useRecoilValue(adultActivityTypesData);

  const [familyRecordMenuAnchor, setFamilyRecordMenuAnchor] = useState<Element | null>(null);
  const [recordFamilyStepParameter, setRecordFamilyStepParameter] = useState<ActionRequirement | null>(null);
  function selectRecordFamilyStep(requirement: FormUploadRequirement | ActivityRequirement) {
    setFamilyRecordMenuAnchor(null);
    setRecordFamilyStepParameter(requirement);
  }
  
  const [adultRecordMenuAnchor, setAdultRecordMenuAnchor] = useState<Element | null>(null);
  const [/*recordAdultStepParameter*/, setRecordAdultStepParameter] = useState<[ActionRequirement, Person] | null>(null);
  function selectRecordAdultStep(requirement: FormUploadRequirement | ActivityRequirement, adult: Person) {
    setAdultRecordMenuAnchor(null);
    setRecordAdultStepParameter([requirement, adult]);
  }

  return (
  <Container>
    <Toolbar variant="dense" disableGutters={true}>
      <h3 className={classes.sectionHeading}>Family</h3>
      &nbsp;
      <Button aria-controls="family-record-menu" aria-haspopup="true"
        variant="contained" color="default" size="small" className={classes.button}
        startIcon={<AssignmentTurnedInIcon />}
        onClick={(event) => setFamilyRecordMenuAnchor(event.currentTarget)}>
        Record Step
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
      <RecordFamilyStepDialog volunteerFamily={volunteerFamily} stepActionRequirement={recordFamilyStepParameter} onClose={() => setRecordFamilyStepParameter(null)} />
    </Toolbar>
    <div className={classes.sectionChips}>
      {Object.entries(volunteerFamily.familyRoleApprovals || {}).map(([role, approvalStatus]) => (
        <Chip key={role} size="small" color={approvalStatus === RoleApprovalStatus.Approved ? "primary" : "secondary"}
          label={RoleApprovalStatus[approvalStatus] + " " + role} />
      ))}
    </div>
    <ul>
      {volunteerFamily.approvalFormUploads?.map((upload, i) => (
        <li key={i}>{upload.formName} @ {upload.timestampUtc?.toDateString()}</li>
      ))}
      {volunteerFamily.approvalActivitiesPerformed?.map((activity, i) => (
        <li key={i}>{activity.activityName} @ {activity.timestampUtc?.toDateString()}</li>
      ))}
    </ul>
    <Divider />
    <Toolbar variant="dense" disableGutters={true}>
      <h3 className={classes.sectionHeading}>Adults</h3>
      &nbsp;
      <Button
        variant="contained" color="default" size="small" className={classes.button}
        startIcon={<AddCircleIcon />}>
        Add Adult
      </Button>
    </Toolbar>
    {volunteerFamily.family?.adults?.map(adult => adult.item1 && adult.item1.id && adult.item2 && (
      <React.Fragment key={adult.item1.id}>
        <h4 className={classes.sectionHeading}>
          {adult.item1.firstName} {adult.item1.lastName} (<AgeText age={adult.item1.age} />)
          <Button aria-controls="adult-record-menu" aria-haspopup="true"
            variant="contained" color="default" size="small" className={classes.button}
            startIcon={<AssignmentTurnedInIcon />}
            onClick={(event) => setAdultRecordMenuAnchor(event.currentTarget)}>
            Record Step
          </Button>
          <Menu id="adult-record-menu"
            anchorEl={adultRecordMenuAnchor}
            keepMounted
            open={Boolean(adultRecordMenuAnchor)}
            onClose={() => setAdultRecordMenuAnchor(null)}>
            {adultDocumentTypes.map(documentType => (
              <MenuItem key={documentType.formName} onClick={() => adult.item1 && selectRecordAdultStep(documentType, adult.item1)}>{documentType.formName}</MenuItem>
            ))}
            <Divider />
            {adultActivityTypes.map(activityType => (
              <MenuItem key={activityType.activityName} onClick={() => adult.item1 && selectRecordAdultStep(activityType, adult.item1)}>{activityType.activityName}</MenuItem>
            ))}
          </Menu>
        </h4>
        <Container>
          <div className={classes.sectionChips}>
            {Object.entries(volunteerFamily.individualVolunteers?.[adult.item1.id].individualRoleApprovals || {}).map(([role, approvalStatus]) => (
              <Chip key={role} size="small" color={approvalStatus === RoleApprovalStatus.Approved ? "primary" : "secondary"}
                label={RoleApprovalStatus[approvalStatus] + " " + role} />
            ))}
            {(adult.item2.relationshipToFamily && <Chip size="small" label={FamilyAdultRelationshipType[adult.item2.relationshipToFamily]} />) || null}
            {adult.item2.isInHousehold && <Chip size="small" label="In Household" />}
            {adult.item2.isPrimaryFamilyContact && <Chip size="small" label="Primary Family Contact" />}
          </div>
          <dl>
            {adult.item2.safetyRiskNotes && <><dt><strong>⚠ Safety Risk</strong></dt><dd>{adult.item2.safetyRiskNotes}</dd></>}
            {adult.item2.familyRelationshipNotes && <><dt>📝 Family Relationship Notes</dt><dd>{adult.item2.familyRelationshipNotes}</dd></>}
          </dl>
          <ul>
            {volunteerFamily.individualVolunteers?.[adult.item1.id].approvalFormUploads?.map((upload, i) => (
              <li key={i}>{upload.formName} @ {upload.timestampUtc?.toDateString()}</li>
            ))}
            {volunteerFamily.individualVolunteers?.[adult.item1.id].approvalActivitiesPerformed?.map((activity, i) => (
              <li key={i}>{activity.activityName} @ {activity.timestampUtc?.toDateString()}</li>
            ))}
          </ul>
        </Container>
      </React.Fragment>
    ))}
    <Divider />
    <Toolbar variant="dense" disableGutters={true}>
      <h3 className={classes.sectionHeading}>Children</h3>
      &nbsp;
      <Button
        variant="contained" color="default" size="small" className={classes.button}
        startIcon={<AddCircleIcon />}>
        Add Child
      </Button>
    </Toolbar>
    {volunteerFamily.family?.children?.map(child => (
      <React.Fragment key={child.id}>
        <h4 className={classes.sectionHeading}>{child.firstName} {child.lastName} (<AgeText age={child.age} />)</h4>
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
        </Container>
      </React.Fragment>
    ))}
  </Container>);
}

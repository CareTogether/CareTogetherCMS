import React, { useState } from 'react';
import { makeStyles } from '@material-ui/core/styles';
import { Container, Toolbar, Chip, Button, Menu, MenuItem, Divider } from '@material-ui/core';
import { VolunteerFamily, FamilyAdultRelationshipType, CustodialRelationshipType, FormUploadRequirement, ActionRequirement, ActivityRequirement, Person } from '../GeneratedClient';
import { useRecoilValue } from 'recoil';
import { adultActivityTypesData, adultDocumentTypesData, familyActivityTypesData, familyDocumentTypesData } from '../Model/ConfigurationModel';
import { RoleApprovalStatus } from '../GeneratedClient';
import AddCircleIcon from '@material-ui/icons/AddCircle';
import AssignmentTurnedInIcon from '@material-ui/icons/AssignmentTurnedIn';
import { AgeText } from './AgeText';
import { RecordVolunteerFamilyStepDialog } from './RecordVolunteerFamilyStepDialog';
import { volunteerFamiliesData } from '../Model/VolunteerFamiliesModel';
import { RecordVolunteerAdultStepDialog } from './RecordVolunteerAdultStepDialog';

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

interface VolunteerFamilyPanelProps {
  volunteerFamilyId: string
}

export function VolunteerFamilyPanel({volunteerFamilyId}: VolunteerFamilyPanelProps) {
  const classes = useStyles();

  const volunteerFamilies = useRecoilValue(volunteerFamiliesData); // Add as a dependency, rather than passing the selected family state in as props, to enable refresh
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
      <RecordVolunteerFamilyStepDialog volunteerFamily={volunteerFamily} stepActionRequirement={recordFamilyStepParameter} onClose={() => setRecordFamilyStepParameter(null)} />
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
            onClick={(event) => setAdultRecordMenuAnchor({anchor: event.currentTarget, adult: adult.item1 as Person})}>
            Record Step
          </Button>
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
    <Menu id="adult-record-menu"
      anchorEl={adultRecordMenuAnchor?.anchor}
      keepMounted
      open={Boolean(adultRecordMenuAnchor)}
      onClose={() => setAdultRecordMenuAnchor(null)}>
      {adultDocumentTypes.map(documentType => (
        <MenuItem key={documentType.formName} onClick={() =>
          adultRecordMenuAnchor?.adult && selectRecordAdultStep(documentType, adultRecordMenuAnchor.adult)}>{documentType.formName}</MenuItem>
      ))}
      <Divider />
      {adultActivityTypes.map(activityType => (
        <MenuItem key={activityType.activityName} onClick={() =>
          adultRecordMenuAnchor?.adult && selectRecordAdultStep(activityType, adultRecordMenuAnchor.adult)}>{activityType.activityName}</MenuItem>
      ))}
    </Menu>
    {(recordAdultStepParameter && <RecordVolunteerAdultStepDialog volunteerFamily={volunteerFamily} adult={recordAdultStepParameter.adult}
      stepActionRequirement={recordAdultStepParameter.requirement} onClose={() => setRecordAdultStepParameter(null)} />) || null}
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

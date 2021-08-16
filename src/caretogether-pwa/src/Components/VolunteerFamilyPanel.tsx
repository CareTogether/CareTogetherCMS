import React, { useState } from 'react';
import { makeStyles } from '@material-ui/core/styles';
import { Container, Toolbar, Chip, Button, Menu, MenuItem, Divider } from '@material-ui/core';
import { VolunteerFamily, FamilyAdultRelationshipType, CustodialRelationshipType } from '../GeneratedClient';
import { useRecoilValue } from 'recoil';
import { familyActivityTypesData, familyDocumentTypesData } from '../Model/ConfigurationModel';
import { RoleApprovalStatus } from '../GeneratedClient';
import AddCircleIcon from '@material-ui/icons/AddCircle';
import { AgeText } from './AgeText';

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
  }
}));

interface VolunteerFamilyPanelProps {
  volunteerFamily: VolunteerFamily
}

export function VolunteerFamilyPanel({volunteerFamily}: VolunteerFamilyPanelProps) {
  const classes = useStyles();

  const familyDocumentTypes = useRecoilValue(familyDocumentTypesData);
  const familyActivityTypes = useRecoilValue(familyActivityTypesData);

  const [familyAddMenuAnchor, setFamilyAddMenuAnchor] = useState<Element | null>(null);

  return (
  <Container>
    <Toolbar variant="dense" disableGutters={true}>
      <h3 className={classes.sectionHeading}>Family</h3>
      &nbsp;
      <Button aria-controls="family-add-menu" aria-haspopup="true"
        onClick={(event) => setFamilyAddMenuAnchor(event.currentTarget)}>
        <AddCircleIcon />
      </Button>
      <Menu id="family-add-menu"
        anchorEl={familyAddMenuAnchor}
        keepMounted
        open={Boolean(familyAddMenuAnchor)}
        onClose={() => setFamilyAddMenuAnchor(null)}>
        {familyDocumentTypes.map(familyDocumentType => (
          <MenuItem key={familyDocumentType.formName}>{familyDocumentType.formName}</MenuItem>
        ))}
        <Divider />
        {familyActivityTypes.map(familyActivityType => (
          <MenuItem key={familyActivityType.activityName}>{familyActivityType.activityName}</MenuItem>
        ))}
      </Menu>
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
      🏗
    </Toolbar>
    {volunteerFamily.family?.adults?.map(adult => adult.item1 && adult.item1.id && adult.item2 && (
      <React.Fragment key={adult.item1.id}>
        <h4 className={classes.sectionHeading}>
          {adult.item1.firstName} {adult.item1.lastName} (<AgeText age={adult.item1.age} />)
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
      🏗
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

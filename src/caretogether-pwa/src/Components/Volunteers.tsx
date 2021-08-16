import { makeStyles } from '@material-ui/core/styles';
import { Grid, Paper, Table, TableContainer, TableBody, TableCell, TableHead, TableRow, Drawer, Container, Toolbar, Chip, Button, Menu, MenuItem, Divider } from '@material-ui/core';
import { ExactAge, AgeInYears, VolunteerFamily, FormUploadRequirement, ActivityRequirement, VolunteerFamilyRequirementScope, FamilyAdultRelationshipType, CustodialRelationshipType } from '../GeneratedClient';
import { differenceInYears } from 'date-fns';
import { useRecoilValue } from 'recoil';
import { volunteerFamiliesData } from '../Model/VolunteerFamiliesModel';
import { policyData } from '../Model/ConfigurationModel';
import { RoleApprovalStatus } from '../GeneratedClient';
import AddCircleIcon from '@material-ui/icons/AddCircle';
import React, { useState } from 'react';
import clsx from 'clsx';
import { AgeText } from './AgeText';

const useStyles = makeStyles((theme) => ({
  paper: {
    padding: theme.spacing(2),
    display: 'flex',
    overflow: 'auto',
    flexDirection: 'column',
  },
  fixedHeight: {
    height: 240,
  },
  table: {
    minWidth: 700,
  },
  familyRow: {
    backgroundColor: '#eef'
  },
  adultRow: {
  },
  childRow: {
    color: 'ddd',
    fontStyle: 'italic'
  },
  drawerPaper: {
    width: 800
  },
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

function approvalStatus(value: number | undefined) {
  return (value !== undefined && RoleApprovalStatus[value]) || "-";
}

function Volunteers() {
  const classes = useStyles();
  const volunteerFamilies = useRecoilValue(volunteerFamiliesData);
  const policy = useRecoilValue(policyData);

  const volunteerFamilyRoleNames =
    (policy.volunteerPolicy?.volunteerFamilyRoles &&
    Object.entries(policy.volunteerPolicy?.volunteerFamilyRoles).map(([key]) => key))
    || [];
  const volunteerRoleNames =
    (policy.volunteerPolicy?.volunteerRoles &&
    Object.entries(policy.volunteerPolicy?.volunteerRoles).map(([key]) => key))
    || [];

  const [selectedVolunteerFamily, setSelectedVolunteerFamily] = useState<VolunteerFamily | null>(null);

  const [familyAddMenuAnchor, setFamilyAddMenuAnchor] = React.useState<Element | null>(null);

  const familyDocumentTypes = (policy.volunteerPolicy?.volunteerFamilyRoles &&
    Object.entries(policy.volunteerPolicy.volunteerFamilyRoles)
      .reduce((previous, [, familyRolePolicy]) => {
        const formUploads = familyRolePolicy.approvalRequirements
          ?.filter(requirement => requirement.actionRequirement instanceof FormUploadRequirement && requirement.scope === VolunteerFamilyRequirementScope.OncePerFamily)
          ?.map(requirement => requirement.actionRequirement as FormUploadRequirement) || [];
        return previous.concat(formUploads);
      }, [] as FormUploadRequirement[])
      .reduce((previous, familyFormUploadRequirement) => {
        return previous.filter(x => x.formName === familyFormUploadRequirement.formName).length > 0
          ? previous
          : previous.concat(familyFormUploadRequirement);
      }, [] as FormUploadRequirement[])) || [];
      
  const familyActivityTypes = (policy.volunteerPolicy?.volunteerFamilyRoles &&
  Object.entries(policy.volunteerPolicy.volunteerFamilyRoles)
    .reduce((previous, [, familyRolePolicy]) => {
      const activities = familyRolePolicy.approvalRequirements
        ?.filter(requirement => requirement.actionRequirement instanceof ActivityRequirement && requirement.scope === VolunteerFamilyRequirementScope.OncePerFamily)
        ?.map(requirement => requirement.actionRequirement as ActivityRequirement) || [];
      return previous.concat(activities);
    }, [] as ActivityRequirement[])
    .reduce((previous, familyActivityRequirement) => {
      return previous.filter(x => x.activityName === familyActivityRequirement.activityName).length > 0
        ? previous
        : previous.concat(familyActivityRequirement);
    }, [] as ActivityRequirement[])) || [];

  return (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <TableContainer component={Paper}>
          <Table className={classes.table} size="small">
            <TableHead>
              <TableRow>
                <TableCell>First Name</TableCell>
                <TableCell>Last Name</TableCell>
                <TableCell>Age</TableCell>
                { volunteerFamilyRoleNames.map(roleName =>
                  (<TableCell key={roleName}>{roleName}</TableCell>))}
                { volunteerRoleNames.map(roleName =>
                  (<TableCell key={roleName}>{roleName}</TableCell>))}
              </TableRow>
            </TableHead>
            <TableBody>
              {volunteerFamilies.map((volunteerFamily) => (
                <React.Fragment key={volunteerFamily.family?.id}>
                  <TableRow className={classes.familyRow} onClick={() => setSelectedVolunteerFamily(volunteerFamily)}>
                    <TableCell key="1" colSpan={3}>{
                      volunteerFamily.family?.adults
                        ?.filter(adult => adult.item2?.isPrimaryFamilyContact)
                        [0]?.item1?.lastName + " Family"
                    }</TableCell>
                    { volunteerFamilyRoleNames.map(roleName =>
                      (<TableCell key={roleName}>{
                        approvalStatus(volunteerFamily.familyRoleApprovals?.[roleName])
                      }</TableCell>))}
                    <TableCell colSpan={volunteerRoleNames.length} />
                  </TableRow>
                  {volunteerFamily.family?.adults?.map(adult => adult.item1 && (
                    <TableRow key={volunteerFamily.family?.id + ":" + adult.item1.id}
                      onClick={() => setSelectedVolunteerFamily(volunteerFamily)}
                      className={classes.adultRow}>
                      <TableCell>{adult.item1.firstName}</TableCell>
                      <TableCell>{adult.item1.lastName}</TableCell>
                      <TableCell align="right">
                        { adult.item1.age instanceof ExactAge
                          ? adult.item1.age.dateOfBirth && differenceInYears(new Date(), adult.item1.age.dateOfBirth)
                          : adult.item1.age instanceof AgeInYears
                          ? adult.item1.age.years && adult.item1?.age.asOf && (adult.item1.age.years + differenceInYears(new Date(), adult.item1.age.asOf))
                          : "⚠" }
                      </TableCell>
                      <TableCell colSpan={volunteerFamilyRoleNames.length} />
                      { volunteerRoleNames.map(roleName =>
                        (<TableCell key={roleName}>{
                          approvalStatus(volunteerFamily.individualVolunteers?.[adult.item1?.id || '']?.individualRoleApprovals?.[roleName])
                        }</TableCell>))}
                    </TableRow>
                  ))}
                  {volunteerFamily.family?.children?.map(child => (
                    <TableRow key={volunteerFamily.family?.id + ":" + child.id}
                      onClick={() => setSelectedVolunteerFamily(volunteerFamily)}
                      className={classes.childRow}>
                      <TableCell>{child.firstName}</TableCell>
                      <TableCell>{child.lastName}</TableCell>
                      <TableCell align="right">
                        { child.age instanceof ExactAge
                          ? child.age.dateOfBirth && differenceInYears(new Date(), child.age.dateOfBirth)
                          : child.age instanceof AgeInYears
                          ? child.age.years && child.age.asOf && (child.age.years + differenceInYears(new Date(), child.age.asOf))
                          : "⚠" }
                      </TableCell>
                      <TableCell colSpan={
                        volunteerFamilyRoleNames.length +
                        volunteerRoleNames.length } />
                    </TableRow>
                  ))}
                </React.Fragment>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        <Drawer anchor={'right'} classes={{
            paper: clsx(classes.drawerPaper),
          }} open={selectedVolunteerFamily !== null} onClose={() => setSelectedVolunteerFamily(null)}>
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
            <ul>
              {selectedVolunteerFamily?.approvalFormUploads?.map((upload, i) => (
                <li key={i}>{upload.formName} @ {upload.timestampUtc?.toDateString()}</li>
              ))}
              {selectedVolunteerFamily?.approvalActivitiesPerformed?.map((activity, i) => (
                <li key={i}>{activity.activityName} @ {activity.timestampUtc?.toDateString()}</li>
              ))}
            </ul>
            <Divider />
            <Toolbar variant="dense" disableGutters={true}>
              <h3 className={classes.sectionHeading}>Adults</h3>
              &nbsp;
              🏗
            </Toolbar>
            {selectedVolunteerFamily?.family?.adults?.map(adult => adult.item1 && adult.item1.id && adult.item2 && (
              <React.Fragment key={adult.item1.id}>
                <h4 className={classes.sectionHeading}>
                  {adult.item1.firstName} {adult.item1.lastName} (<AgeText age={adult.item1.age} />)
                </h4>
                <Container>
                  <p className={classes.sectionChips}>
                    {Object.entries(selectedVolunteerFamily.individualVolunteers?.[adult.item1.id].individualRoleApprovals || {}).map(([role, approvalStatus]) => (
                      <Chip key={role} size="small" color={approvalStatus === RoleApprovalStatus.Approved ? "primary" : "secondary"}
                        label={RoleApprovalStatus[approvalStatus] + " " + role} />
                    ))}
                    {(adult.item2.relationshipToFamily && <Chip size="small" label={FamilyAdultRelationshipType[adult.item2.relationshipToFamily]} />) || null}
                    {adult.item2.isInHousehold && <Chip size="small" label="In Household" />}
                    {adult.item2.isPrimaryFamilyContact && <Chip size="small" label="Primary Family Contact" />}
                  </p>
                  <dl>
                    {adult.item2.safetyRiskNotes && <><dt><strong>⚠ Safety Risk</strong></dt><dd>{adult.item2.safetyRiskNotes}</dd></>}
                    {adult.item2.familyRelationshipNotes && <><dt>📝 Family Relationship Notes</dt><dd>{adult.item2.familyRelationshipNotes}</dd></>}
                  </dl>
                  <ul>
                    {selectedVolunteerFamily.individualVolunteers?.[adult.item1.id].approvalFormUploads?.map((upload, i) => (
                      <li key={i}>{upload.formName} @ {upload.timestampUtc?.toDateString()}</li>
                    ))}
                    {selectedVolunteerFamily.individualVolunteers?.[adult.item1.id].approvalActivitiesPerformed?.map((activity, i) => (
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
            {selectedVolunteerFamily?.family?.children?.map(child => (
              <React.Fragment key={child.id}>
                <h4 className={classes.sectionHeading}>{child.firstName} {child.lastName} (<AgeText age={child.age} />)</h4>
                <Container>
                  <ul>
                    {selectedVolunteerFamily.family?.custodialRelationships?.filter(relationship => relationship.childId === child.id)?.map(relationship => (
                      <li key={relationship.personId}>{selectedVolunteerFamily.family?.adults?.filter(x => x.item1?.id === relationship.personId)[0].item1?.firstName}:&nbsp;
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
          </Container>
        </Drawer>
      </Grid>
    </Grid>
  );
}

export { Volunteers };

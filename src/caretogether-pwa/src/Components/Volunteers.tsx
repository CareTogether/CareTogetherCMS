import { makeStyles } from '@material-ui/core/styles';
import { Grid, Paper, Table, TableContainer, TableBody, TableCell, TableHead, TableRow, Drawer, Container, Toolbar, Button, Menu, MenuItem, Divider } from '@material-ui/core';
import { ExactAge, AgeInYears, VolunteerFamily, FormUploadRequirement, ActivityRequirement, VolunteerFamilyRequirementScope } from '../GeneratedClient';
import { differenceInYears } from 'date-fns';
import { useRecoilValue } from 'recoil';
import { volunteerFamiliesData } from '../Model/VolunteerFamiliesModel';
import { policyData } from '../Model/ConfigurationModel';
import { RoleApprovalStatus } from '../GeneratedClient';
import AddCircleIcon from '@material-ui/icons/AddCircle';
import React, { useState } from 'react';
import clsx from 'clsx';

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
    //position: 'relative',
    //whiteSpace: 'nowrap',
    width: 800,
    // transition: theme.transitions.create('width', {
    //   easing: theme.transitions.easing.sharp,
    //   duration: theme.transitions.duration.enteringScreen,
    // }),
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
              <h3>Family</h3>
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
            </ul>
            <Toolbar variant="dense" disableGutters={true}>
              <h3>Adults</h3>
              &nbsp;
              🏗
            </Toolbar>
            {selectedVolunteerFamily?.family?.adults?.map(adult => (
              <h4 key={adult.item1?.id}>{adult.item1?.firstName} {adult.item1?.lastName}</h4>
            ))}
            <Toolbar variant="dense" disableGutters={true}>
              <h3>Children</h3>
              &nbsp;
              🏗
            </Toolbar>
            {selectedVolunteerFamily?.family?.children?.map(child => (
              <h4 key={child.id}>{child.firstName} {child.lastName}</h4>
            ))}
            <hr />
            <p>{JSON.stringify(selectedVolunteerFamily)}</p>
          </Container>
        </Drawer>
      </Grid>
    </Grid>
  );
}

export { Volunteers };

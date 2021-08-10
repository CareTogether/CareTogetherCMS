import clsx from 'clsx';
import { makeStyles } from '@material-ui/core/styles';
import { Grid, Paper, Table, TableContainer, TableBody, TableCell, TableHead, TableRow } from '@material-ui/core';
import { ExactAge, AgeInYears, FormUploadRequirement, VolunteerApprovalRequirement, VolunteerFamilyApprovalRequirement, ActivityRequirement } from '../GeneratedClient';
import { differenceInYears } from 'date-fns';
import { useRecoilValue } from 'recoil';
import { volunteerFamiliesData, useRefreshVolunteerFamilies } from '../Model/VolunteerFamiliesModel';
import { policyData } from '../Model/ConfigurationModel';
import { RoleApprovalStatus, VolunteerFamilyRequirementScope } from '../GeneratedClient';
import React from 'react';

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
  }
}));

function approvalStatus(value: number | undefined) {
  return value !== undefined && RoleApprovalStatus[value] || "-";
}

function Volunteers() {
  const classes = useStyles();
  const volunteerFamilies = useRecoilValue(volunteerFamiliesData);
  const policy = useRecoilValue(policyData);
  //const refreshVolunteerFamilies = useRefreshVolunteerFamilies();

  const volunteerFamilyRoleNames =
    policy.volunteerPolicy?.volunteerFamilyRoles &&
    Object.entries(policy.volunteerPolicy?.volunteerFamilyRoles).map(([key, value]) => key)
    || [];
  const volunteerRoleNames =
    policy.volunteerPolicy?.volunteerRoles &&
    Object.entries(policy.volunteerPolicy?.volunteerRoles).map(([key, value]) => key)
    || [];

  const allFamilyRequirements =
    policy.volunteerPolicy?.volunteerFamilyRoles
    ? Object.entries(policy.volunteerPolicy.volunteerFamilyRoles)
      .reduce((previous, [key, value]) =>
        previous.concat(value.approvalRequirements || []),
        [] as VolunteerFamilyApprovalRequirement[])
        : ([] as VolunteerFamilyApprovalRequirement[]);

  const allFamilyJointRequirements =
    allFamilyRequirements.filter(requirement =>
      requirement.scope === VolunteerFamilyRequirementScope.OncePerFamily);
  const familyJointDocumentRequirements = allFamilyJointRequirements
    .reduce((previous, requirement) =>
      requirement.actionRequirement instanceof FormUploadRequirement
      ? previous.concat(requirement.actionRequirement)
      : previous, [] as FormUploadRequirement[])
    .reduce((previous, requirement) =>
      previous.filter(x => x.formName === requirement.formName).length === 0
      ? previous.concat(requirement)
      : previous, [] as FormUploadRequirement[]);
  const familyJointActivityRequirements = allFamilyJointRequirements
    .reduce((previous, requirement) =>
      requirement.actionRequirement instanceof ActivityRequirement
      ? previous.concat(requirement.actionRequirement)
      : previous, [] as ActivityRequirement[])
    .reduce((previous, requirement) =>
      previous.filter(x => x.activityName === requirement.activityName).length === 0
      ? previous.concat(requirement)
      : previous, [] as ActivityRequirement[]);

  const allFamilyPerAdultRequirements =
    allFamilyRequirements.filter(requirement =>
      requirement.scope === VolunteerFamilyRequirementScope.AllAdultsInTheFamily);
  const allFamilyPerAdultDocumentRequirements = allFamilyPerAdultRequirements
    .reduce((previous, requirement) =>
      requirement.actionRequirement instanceof FormUploadRequirement
      ? previous.concat(requirement.actionRequirement)
      : previous, [] as FormUploadRequirement[]);
  const allFamilyPerAdultActivityRequirements = allFamilyPerAdultRequirements
    .reduce((previous, requirement) =>
      requirement.actionRequirement instanceof ActivityRequirement
      ? previous.concat(requirement.actionRequirement)
      : previous, [] as ActivityRequirement[]);

  const allIndividualRequirements =
    policy.volunteerPolicy?.volunteerRoles
    ? Object.entries(policy.volunteerPolicy.volunteerRoles)
      .reduce((previous, [key, value]) =>
        previous.concat(value.approvalRequirements || []),
        [] as VolunteerApprovalRequirement[])
        : ([] as VolunteerApprovalRequirement[]);
  const allIndividualDocumentRequirements = allIndividualRequirements
    .reduce((previous, requirement) =>
      requirement.actionRequirement instanceof FormUploadRequirement
      ? previous.concat(requirement.actionRequirement)
      : previous, [] as FormUploadRequirement[]);
  const allIndividualActivityRequirements = allIndividualRequirements
    .reduce((previous, requirement) =>
      requirement.actionRequirement instanceof ActivityRequirement
      ? previous.concat(requirement.actionRequirement)
      : previous, [] as ActivityRequirement[]);

  const individualDocumentRequirements =
    allFamilyPerAdultDocumentRequirements.concat(allIndividualDocumentRequirements)
    .reduce((previous, requirement) =>
      previous.filter(x => x.formName === requirement.formName).length === 0
      ? previous.concat(requirement)
      : previous, [] as FormUploadRequirement[]);
  const individualActivityRequirements =
    allFamilyPerAdultActivityRequirements.concat(allIndividualActivityRequirements)
    .reduce((previous, requirement) =>
      previous.filter(x => x.activityName === requirement.activityName).length === 0
      ? previous.concat(requirement)
      : previous, [] as ActivityRequirement[]);
  
  return (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <TableContainer component={Paper}>
          <Table className={classes.table} size="small">
            <TableHead>
              {/* <TableRow>
                <TableCell align="center" colSpan={3}>
                  Volunteer Families ({volunteerFamilies.length})
                </TableCell>
              </TableRow> */}
              <TableRow>
                <TableCell>First Name</TableCell>
                <TableCell>Last Name</TableCell>
                <TableCell>Age</TableCell>
                {/* NOTE: There are many other potential ways to arrange all of this information. */}
                { volunteerFamilyRoleNames.map(roleName =>
                  (<TableCell key={roleName}>{roleName}</TableCell>))}
                { volunteerRoleNames.map(roleName =>
                  (<TableCell key={roleName}>{roleName}</TableCell>))}
                {/* Notes */}
              </TableRow>
            </TableHead>
            <TableBody>
              {volunteerFamilies.map((volunteerFamily) => (
                <React.Fragment key={volunteerFamily.family?.id}>
                  <TableRow className={classes.familyRow}>
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
      </Grid>
    </Grid>
  );
}

export { Volunteers };

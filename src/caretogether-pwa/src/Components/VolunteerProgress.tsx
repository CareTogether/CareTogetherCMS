import { makeStyles } from '@material-ui/core/styles';
import { Grid, Paper, Table, TableContainer, TableBody, TableCell, TableHead, TableRow } from '@material-ui/core';
import { FormUploadRequirement, VolunteerApprovalRequirement, VolunteerFamilyApprovalRequirement, ActivityRequirement } from '../GeneratedClient';
import { useRecoilValue } from 'recoil';
import { volunteerFamiliesData } from '../Model/VolunteerFamiliesModel';
import { policyData } from '../Model/ConfigurationModel';
import { VolunteerFamilyRequirementScope } from '../GeneratedClient';
import { format } from 'date-fns';
import React from 'react';
import { stringify } from 'querystring';

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

function VolunteerProgress() {
  const classes = useStyles();
  const volunteerFamilies = useRecoilValue(volunteerFamiliesData);
  const policy = useRecoilValue(policyData);

  /* What we are modeling here:
  
  For each (non-application) requirement:
    What roles is it applicable to? Track those along with each requirement.
    For family role requirements, also track whether they are applicable to families or to individuals.
  For each family/individual:
    We know what roles they are prospective or approved for.
    For each requirement (applicable to a family/individual):
      Is the family/individual either prospective or approved for any roles that the requirement applies to?
        If so, has the family/individual met that requirement?
        If not, leave blank as not-applicable.
  */

  enum RequirementType { Document, Activity };
  const allRequirementRoles: { Type: RequirementType, Name: string, Role: string }[] = [];
  function append(type: RequirementType, name: string, roleName: string) {
    allRequirementRoles.push({Type: type, Name: name, Role: roleName});
  }

  policy.volunteerPolicy?.volunteerFamilyRoles &&
    Object.entries(policy.volunteerPolicy.volunteerFamilyRoles)
    .forEach(([roleName, rolePolicy]) => {
      rolePolicy.approvalRequirements?.forEach(requirement => {
        if (requirement.requiredToBeProspective) return;
        if (requirement.actionRequirement instanceof FormUploadRequirement && requirement.actionRequirement.formName) {
          append(RequirementType.Document, requirement.actionRequirement.formName, roleName);
        } else if (requirement.actionRequirement instanceof ActivityRequirement && requirement.actionRequirement.activityName) {
          append(RequirementType.Activity, requirement.actionRequirement.activityName, roleName);
        }
      });
    });
    
  policy.volunteerPolicy?.volunteerRoles &&
    Object.entries(policy.volunteerPolicy.volunteerRoles)
    .forEach(([roleName, rolePolicy]) => {
      rolePolicy.approvalRequirements?.forEach(requirement => {
        if (requirement.requiredToBeProspective) return;
        if (requirement.actionRequirement instanceof FormUploadRequirement && requirement.actionRequirement.formName) {
          append(RequirementType.Document, requirement.actionRequirement.formName, roleName);
        } else if (requirement.actionRequirement instanceof ActivityRequirement && requirement.actionRequirement.activityName) {
          append(RequirementType.Activity, requirement.actionRequirement.activityName, roleName);
        }
      });
    });

  // Credit: https://stackoverflow.com/a/62765924/287610
  const groupBy = <T, K extends keyof any, V>(list: T[],
    getKey: (item: T) => K, getValue: (item: T) => V) =>
    list.reduce((previous, currentItem) => {
      const group = getKey(currentItem);
      if (!previous[group]) previous[group] = [] as V[];
      previous[group].push(getValue(currentItem));
      return previous;
    }, {} as Record<K, V[]>);

  const requirementRoles = groupBy(allRequirementRoles, x => x.Type.toString()+'|'+x.Name, x => x.Role);
  
  const volunteerFamilyProgress = volunteerFamilies.map(volunteerFamily => {
    const progress: Array<string | 'needed' | null> = [];
    Object.entries(requirementRoles).forEach(([requirement, roleNames]) => {
      const [Type, Name] = requirement.split('|');
      // If the family is in progress or approved for any role that a requirement applies to,
      // then record whether the family has met that requirement or still needs to.
      if (roleNames.filter(roleForRequirement =>
        volunteerFamily?.familyRoleApprovals?.[roleForRequirement] !== undefined).length > 0) {
        if (Type === RequirementType.Document.toString()) {
          const submissions = volunteerFamily.approvalFormUploads?.filter(x => x.formName === Name);
          progress.push(submissions && submissions.length > 0
            ? format(submissions[0].timestampUtc as Date, 'M/d/yy')
            : 'needed');
            return;
        } else if (Type === RequirementType.Activity.toString()) {
          const submissions = volunteerFamily.approvalActivitiesPerformed?.filter(x => x.activityName === Name);
          progress.push(submissions && submissions.length > 0
            ? format(submissions[0].timestampUtc as Date, 'M/d/yy')
            : 'needed');
            return;
        }
      }
      progress.push(null);
    });
    return {
      family: volunteerFamily,
      progress: progress
    };
  });

  const requirementColumns = [] as { Type: string, Name: string }[];
  Object.entries(requirementRoles).forEach(([TypeAndName, roles]) => {
    const [Type, Name] = TypeAndName.split('|');
    requirementColumns.push({Type: Type, Name: Name});
  })

  // const allFamilyRequirements =
  //   policy.volunteerPolicy?.volunteerFamilyRoles
  //   ? Object.entries(policy.volunteerPolicy.volunteerFamilyRoles)
  //     .reduce((previous, [, value]) =>
  //       previous.concat(value.approvalRequirements || []),
  //       [] as VolunteerFamilyApprovalRequirement[])
  //       : ([] as VolunteerFamilyApprovalRequirement[]);

  // const allFamilyJointRequirements =
  //   allFamilyRequirements.filter(requirement =>
  //     requirement.scope === VolunteerFamilyRequirementScope.OncePerFamily &&
  //     !requirement.requiredToBeProspective);
  
/*
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
*/
  // const allFamilyPerAdultRequirements =
  //   allFamilyRequirements.filter(requirement =>
  //     requirement.scope === VolunteerFamilyRequirementScope.AllAdultsInTheFamily &&
  //     !requirement.requiredToBeProspective);

  /*
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
*/

  // const allIndividualRequirements =
  //   policy.volunteerPolicy?.volunteerRoles
  //   ? Object.entries(policy.volunteerPolicy.volunteerRoles)
  //     .reduce((previous, [, value]) =>
  //       previous.concat(value.approvalRequirements || []),
  //       [] as VolunteerApprovalRequirement[])
  //       : ([] as VolunteerApprovalRequirement[]);
  
  /*
  const allIndividualDocumentRequirements = allIndividualRequirements
    .reduce((previous, requirement) =>
      requirement.actionRequirement instanceof FormUploadRequirement &&
      !requirement.requiredToBeProspective
      ? previous.concat(requirement.actionRequirement)
      : previous, [] as FormUploadRequirement[]);
  const allIndividualActivityRequirements = allIndividualRequirements
    .reduce((previous, requirement) =>
      requirement.actionRequirement instanceof ActivityRequirement &&
      !requirement.requiredToBeProspective
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
*/
  
  return (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <TableContainer component={Paper}>
          <Table className={classes.table} size="small">
            <TableHead>
              <TableRow>
                <TableCell>First Name</TableCell>
                <TableCell>Last Name</TableCell>
                {requirementColumns.map(({ Type, Name }) =>
                  (<TableCell key={Type.toString() + Name}>{Name}</TableCell>))}
              </TableRow>
            </TableHead>
            <TableBody>
              {volunteerFamilyProgress.map((volunteerFamilyProgress) => (
                <React.Fragment key={volunteerFamilyProgress.family.family?.id}>
                  <TableRow className={classes.familyRow}>
                    <TableCell key="1" colSpan={2}>{
                      volunteerFamilyProgress.family.family?.adults
                        ?.filter(adult => adult.item2?.isPrimaryFamilyContact)
                        [0]?.item1?.lastName + " Family"
                    }</TableCell>
                    {volunteerFamilyProgress.progress.map((value, i) =>
                      (<TableCell key={i}>{value}</TableCell>))}
                    {/* {familyJointDocumentRequirements.map(requirement =>
                      (<TableCell key={requirement.formName}>{
                        'TODO'
                      }</TableCell>))}
                    {familyJointActivityRequirements.map(requirement =>
                      (<TableCell key={requirement.activityName}>***</TableCell>))}
                    <TableCell colSpan={
                      individualDocumentRequirements.length +
                      individualActivityRequirements.length
                    } /> */}
                  </TableRow>
                  {/* {volunteerFamily.family?.adults?.map(adult => adult.item1 && (
                    <TableRow key={volunteerFamily.family?.id + ":" + adult.item1.id}
                      className={classes.adultRow}>
                      <TableCell>{adult.item1.firstName}</TableCell>
                      <TableCell>{adult.item1.lastName}</TableCell>
                      <TableCell colSpan={
                        familyJointDocumentRequirements.length +
                        familyJointActivityRequirements.length
                      } />
                      {individualDocumentRequirements.map(requirement =>
                        (<TableCell key={requirement.formName}>...</TableCell>))}
                      {individualActivityRequirements.map(requirement =>
                        (<TableCell key={requirement.activityName}>***</TableCell>))}
                    </TableRow>
                  ))} */}
                </React.Fragment>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Grid>
    </Grid>
  );
}

export { VolunteerProgress };
